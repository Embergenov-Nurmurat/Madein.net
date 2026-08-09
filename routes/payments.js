/**
 * routes/payments.js — to'lov (Payme/Click) rout'lari (server.js'dan ajratildi).
 */

const express = require('express');

function createPaymentsRouter(deps) {
  const {
    requireAuth,
    db, saveDB,
    mirrorToRelationalDb, relDb, relOrders,
    addNotification,
    payments
  } = deps;

  const router = express.Router();

  router.get('/api/payments/gateways', (req, res) => {
    res.json({ gateways: payments.availableGateways() });
  });

  router.get('/api/payments/:orderId/status', requireAuth, (req, res) => {
    const order = db.orders.find(o => o.id === req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi', code: 'orderNotFound' });
    const me = req.session.username;
    const isBuyer = order.buyer === me;
    const isSeller = Array.isArray(order.items) && order.items.some(it => it.sellerUsername === me);
    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'Ruxsat yo\'q', code: 'forbidden' });
    res.json({
      orderId: order.id,
      paymentMethod: order.paymentMethod || 'manual',
      paymentStatus: order.paymentStatus || 'unpaid',
      checkoutUrl: order.checkoutUrl || null,
      status: order.status
    });
  });

  router.post('/api/payments/payme', async (req, res) => {
    if (!payments.PAYME_ENABLED) return res.status(503).json({ error: { code: -32601, message: 'Payme is not configured' } });
    if (!payments.verifyPaymeAuth(req)) {
      return res.status(200).json({ jsonrpc: '2.0', id: (req.body && req.body.id) || null, error: { code: -32504, message: 'Insufficient privilege' } });
    }
    const ctx = {
      saveOrder: async (order) => {
        await saveDB();
        mirrorToRelationalDb(() => relOrders.syncPaymentState(relDb, order));
      },
      findOrder: (orderId) => db.orders.find(o => o.id === orderId),
      findOrderByTransaction: (provider, txId) => db.orders.find(o => o[provider] && o[provider].transactions && o[provider].transactions[txId]),
      listOrdersInRange: (from, to) => db.orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return o.paymentMethod === 'payme' && t >= from && t <= to;
      }),
      onPaid: async (order) => {
        addNotification(order.buyer, { type: 'order-status', orderId: order.id, status: 'paid' });
        const sellers = [...new Set(order.items.map(it => it.sellerUsername))];
        for (const seller of sellers) addNotification(seller, { type: 'order-paid', orderId: order.id, from: order.buyer });
      }
    };
    const result = await payments.handlePaymeRequest(req.body, ctx);
    res.json(result);
  });

  function clickCtx() {
    return {
      findOrder: (orderId) => db.orders.find(o => o.id === orderId),
      saveOrder: async (order) => {
        await saveDB();
        mirrorToRelationalDb(() => relOrders.syncPaymentState(relDb, order));
      },
      onPaid: async (order) => {
        addNotification(order.buyer, { type: 'order-status', orderId: order.id, status: 'paid' });
        const sellers = [...new Set(order.items.map(it => it.sellerUsername))];
        for (const seller of sellers) addNotification(seller, { type: 'order-paid', orderId: order.id, from: order.buyer });
      }
    };
  }

  router.post('/api/payments/click/prepare', async (req, res) => {
    if (!payments.CLICK_ENABLED) return res.status(503).json({ error: -1, error_note: 'Click is not configured' });
    const result = await payments.handleClickRequest(req.body, 0, clickCtx());
    res.json(result);
  });
  router.post('/api/payments/click/complete', async (req, res) => {
    if (!payments.CLICK_ENABLED) return res.status(503).json({ error: -1, error_note: 'Click is not configured' });
    const result = await payments.handleClickRequest(req.body, 1, clickCtx());
    res.json(result);
  });

  return router;
}

module.exports = createPaymentsRouter;
