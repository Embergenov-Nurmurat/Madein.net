/**
 * routes/commerce.js — savat, buyurtma berish va buyurtma holati rout'lari
 * (server.js'dan ajratildi).
 *
 * Pattern routes/admin.js bilan bir xil: barcha bog'liqliklar `deps`
 * obyekti orqali aniq uzatiladi.
 */

const express = require('express');
const crypto = require('crypto');

function createCommerceRouter(deps) {
  const {
    requireAuth,
    db, saveDB,
    ensureModerationFields, findWork, stockLimitFor, cartItemView,
    mirrorToRelationalDb, relDb, relUsers, relWorks, relOrders,
    addNotification, createOrderChatMessage,
    payments, isUZSOnlyTotals
  } = deps;

  const router = express.Router();

  const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'completed', 'cancelled'];
  const PAYMENT_METHODS = ['payme', 'click', 'manual'];

  /* Buyurtma yaratilganda to'lov usuliga qarab boshlang'ich to'lov
     maydonlarini (paymentMethod/paymentStatus/checkoutUrl) hisoblaydi. */
  function initialPaymentFields(requestedMethod, totalsByCurrency, orderId) {
    const method = PAYMENT_METHODS.includes(requestedMethod) ? requestedMethod : 'manual';
    const uzsOnly = isUZSOnlyTotals(totalsByCurrency);
    if (method === 'payme' && payments.PAYME_ENABLED && uzsOnly) {
      return { paymentMethod: 'payme', paymentStatus: 'unpaid', checkoutUrl: payments.paymeCheckoutUrl({ id: orderId, totalsByCurrency }) };
    }
    if (method === 'click' && payments.CLICK_ENABLED && uzsOnly) {
      return { paymentMethod: 'click', paymentStatus: 'unpaid', checkoutUrl: payments.clickCheckoutUrl({ id: orderId, totalsByCurrency }) };
    }
    return { paymentMethod: 'manual', paymentStatus: 'unpaid', checkoutUrl: null };
  }

  router.post('/api/works/:id/cart-toggle', requireAuth, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work, owner } = found;
    const me = req.session.username;
    if (owner === me) return res.status(400).json({ error: "O'z asaringizni savatga qo'sha olmaysiz", code: 'cannotCartOwnWork' });
    if (work.status !== 'sale') return res.status(400).json({ error: 'Bu asar sotuvda emas', code: 'workNotForSale' });
    const limit = stockLimitFor(work);
    if (limit <= 0) return res.status(400).json({ error: 'Bu asar tugagan', code: 'workOutOfStock' });
    const u = db.users[me];
    ensureModerationFields(u);
    let inCart;
    if (u.cart[req.params.id]) { delete u.cart[req.params.id]; inCart = false; }
    else { u.cart[req.params.id] = 1; inCart = true; }
    await saveDB();
    mirrorToRelationalDb(() => relUsers.setCartQty(relDb, me, req.params.id, inCart ? 1 : 0));
    res.json({ inCart, qty: inCart ? 1 : 0, cartCount: Object.keys(u.cart).length });
  });

  router.put('/api/cart/:id', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const found = findWork(req.params.id);
    if (!found || !u.cart[req.params.id]) return res.status(404).json({ error: 'Bu asar savatda topilmadi', code: 'workNotInCart' });
    let qty = Math.floor(Number(req.body && req.body.qty));
    if (!Number.isFinite(qty)) return res.status(400).json({ error: "Noto'g'ri miqdor", code: 'invalidQuantity' });
    if (qty <= 0) { delete u.cart[req.params.id]; }
    else {
      const limit = stockLimitFor(found.work);
      if (qty > limit) return res.status(400).json({ error: `Faqat ${limit} dona mavjud`, code: 'notEnoughStock', params: { n: limit } });
      u.cart[req.params.id] = qty;
    }
    await saveDB();
    mirrorToRelationalDb(() => relUsers.setCartQty(relDb, req.session.username, req.params.id, u.cart[req.params.id] || 0));
    res.json({ ok: true, qty: u.cart[req.params.id] || 0 });
  });

  router.delete('/api/cart/:id', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    delete u.cart[req.params.id];
    await saveDB();
    mirrorToRelationalDb(() => relUsers.removeFromCart(relDb, req.session.username, req.params.id));
    res.json({ ok: true });
  });

  router.get('/api/cart', requireAuth, (req, res) => {
    const me = req.session.username;
    const u = db.users[me];
    ensureModerationFields(u);

    const relUser = relUsers.getUser(relDb, me);
    const relCart = relUser ? relUser.cart : {};
    const cartIds = [...new Set([...Object.keys(relCart), ...Object.keys(u.cart)])];

    const items = [];
    let changed = false;
    for (const id of cartIds) {
      const qty = (u.cart[id] != null) ? u.cart[id] : relCart[id];

      let work = relWorks.getWork(relDb, id);
      let owner = work ? work.owner : null;
      let ownerUser = owner ? (relUsers.getUser(relDb, owner) || db.users[owner]) : null;
      if (!work || !ownerUser) {
        const found = findWork(id);
        work = found ? found.work : null;
        owner = found ? found.owner : null;
        ownerUser = owner ? db.users[owner] : null;
      }

      if (!work || work.status !== 'sale' || !ownerUser) {
        delete u.cart[id]; changed = true;
        mirrorToRelationalDb(() => relUsers.removeFromCart(relDb, me, id));
        continue;
      }
      const limit = stockLimitFor(work);
      let effQty = qty;
      if (limit <= 0) {
        delete u.cart[id]; changed = true;
        mirrorToRelationalDb(() => relUsers.removeFromCart(relDb, me, id));
        continue;
      }
      if (effQty > limit) {
        effQty = limit; u.cart[id] = effQty; changed = true;
        mirrorToRelationalDb(() => relUsers.setCartQty(relDb, me, id, effQty));
      }
      items.push(cartItemView(work, owner, ownerUser, effQty));
    }
    if (changed) saveDB().catch(() => {});
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalsByCurrency = {};
    for (const it of items) {
      totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + it.lineTotal;
    }
    res.json({ items, totalsByCurrency, count: items.length });
  });

  router.post('/api/cart/checkout', requireAuth, async (req, res) => {
    const me = req.session.username;
    const u = db.users[me];
    ensureModerationFields(u);
    const ids = Object.keys(u.cart);
    if (!ids.length) return res.status(400).json({ error: "Savat bo'sh", code: 'cartEmpty' });

    const orderItems = [];
    for (const id of ids) {
      const found = findWork(id);
      if (!found || found.work.status !== 'sale') { delete u.cart[id]; continue; }
      const { work, owner } = found;
      const limit = stockLimitFor(work);
      if (limit <= 0) { delete u.cart[id]; continue; }
      const qty = Math.min(u.cart[id], limit);
      orderItems.push({
        workId: work.id,
        title: work.title,
        qty,
        price: Number(work.price) || 0,
        currency: work.currency || 'UZS',
        sellerUsername: owner
      });
      if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
        work.stockQty = Math.max(0, work.stockQty - qty);
        mirrorToRelationalDb(() => relWorks.setStockQty(relDb, work.id, work.stockQty));
      }
    }
    if (!orderItems.length) { await saveDB(); return res.status(400).json({ error: "Savat bo'sh", code: 'cartEmpty' }); }

    const totalsByCurrency = {};
    for (const it of orderItems) {
      totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + it.price * it.qty;
    }

    const requestedMethod = String((req.body && req.body.paymentMethod) || 'manual').trim();
    const orderId = 'ord' + Date.now() + crypto.randomBytes(4).toString('hex');
    const order = {
      id: orderId,
      buyer: me,
      items: orderItems,
      totalsByCurrency,
      status: 'placed',
      createdAt: new Date().toISOString(),
      ...initialPaymentFields(requestedMethod, totalsByCurrency, orderId)
    };
    db.orders.push(order);
    mirrorToRelationalDb(() => relOrders.createOrder(relDb, order));

    const sellers = [...new Set(orderItems.map(it => it.sellerUsername))];
    for (const seller of sellers) {
      const sellerItems = orderItems.filter(it => it.sellerUsername === seller);
      addNotification(seller, {
        type: 'order-received',
        from: me,
        orderId: order.id,
        itemsCount: sellerItems.length
      });
      createOrderChatMessage(me, seller, order, sellerItems);
    }
    addNotification(me, { type: 'order-placed', orderId: order.id });

    u.cart = {};
    await saveDB();
    mirrorToRelationalDb(() => relUsers.clearCart(relDb, me));
    res.json({ ok: true, orderId: order.id, totalsByCurrency, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, checkoutUrl: order.checkoutUrl || null });
  });

  router.post('/api/works/:id/buy-now', requireAuth, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work, owner } = found;
    const me = req.session.username;
    if (owner === me) return res.status(400).json({ error: "O'z asaringizni sotib ola olmaysiz", code: 'cannotBuyOwnWork' });
    if (work.status !== 'sale') return res.status(400).json({ error: 'Bu asar sotuvda emas', code: 'workNotForSale' });
    const limit = stockLimitFor(work);
    if (limit <= 0) return res.status(400).json({ error: 'Bu asar tugagan', code: 'workOutOfStock' });

    const u = db.users[me];
    ensureModerationFields(u);

    const qty = 1;
    const price = Number(work.price) || 0;
    const currency = work.currency || 'UZS';
    const totalsByCurrency = { [currency]: price * qty };
    const requestedMethod = String((req.body && req.body.paymentMethod) || 'manual').trim();
    const orderId = 'ord' + Date.now() + crypto.randomBytes(4).toString('hex');
    const order = {
      id: orderId,
      buyer: me,
      items: [{ workId: work.id, title: work.title, qty, price, currency, sellerUsername: owner }],
      totalsByCurrency,
      status: 'placed',
      createdAt: new Date().toISOString(),
      ...initialPaymentFields(requestedMethod, totalsByCurrency, orderId)
    };
    db.orders.push(order);
    mirrorToRelationalDb(() => relOrders.createOrder(relDb, order));

    if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
      work.stockQty = Math.max(0, work.stockQty - qty);
      mirrorToRelationalDb(() => relWorks.setStockQty(relDb, work.id, work.stockQty));
    }
    delete u.cart[work.id];
    mirrorToRelationalDb(() => relUsers.removeFromCart(relDb, me, work.id));

    addNotification(owner, { type: 'order-received', from: me, orderId: order.id, itemsCount: 1 });
    addNotification(me, { type: 'order-placed', orderId: order.id });
    createOrderChatMessage(me, owner, order, order.items);

    await saveDB();
    res.json({ ok: true, orderId: order.id, totalsByCurrency: order.totalsByCurrency, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, checkoutUrl: order.checkoutUrl || null });
  });

  router.get('/api/orders/mine', requireAuth, (req, res) => {
    const me = req.session.username;
    const asBuyer = db.orders.filter(o => o.buyer === me);
    const asSeller = db.orders.filter(o => Array.isArray(o.items) && o.items.some(it => it.sellerUsername === me));
    res.json({ asBuyer, asSeller });
  });

  router.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi', code: 'orderNotFound' });
    const me = req.session.username;
    const isSeller = Array.isArray(order.items) && order.items.some(it => it.sellerUsername === me);
    if (!isSeller) return res.status(403).json({ error: "Bu buyurtmani o'zgartirishga ruxsatingiz yo'q", code: 'orderStatusForbidden' });

    const status = String((req.body && req.body.status) || '').trim();
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri holat", code: 'invalidOrderStatus' });
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    const { trackingNumber, carrier } = req.body || {};
    if (typeof trackingNumber === 'string') order.trackingNumber = trackingNumber.trim().slice(0, 80);
    if (typeof carrier === 'string') order.carrier = carrier.trim().slice(0, 80);
    addNotification(order.buyer, { type: 'order-status', orderId: order.id, status });
    await saveDB();
    mirrorToRelationalDb(() => relOrders.updateOrderStatus(relDb, order.id, {
      status: order.status, trackingNumber: order.trackingNumber, carrier: order.carrier
    }));
    res.json({ ok: true, order });
  });

  return router;
}

module.exports = createCommerceRouter;
