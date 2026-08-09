/**
 * lib/db/orders.js — buyurtmalar bilan ishlash uchun SQL qatlami.
 *
 * ESLATMA (qamrov chegarasi): bu modul hozircha faqat buyurtmaning ASOSIY
 * hayotiy siklini qamrab oladi — yaratish va sotuvchi tomonidan holat
 * (status/tracking) yangilanishi. Payme/Click TO'LOV WEBHOOK'lari
 * (order.paymentStatus, order.paidAt, order.payme/.click tranzaksiya
 * bo'g'inlari) ATAYLAB bu yerga kiritilmagan — ular pul bilan bog'liq,
 * ko'proq ehtiyot talab qiladigan alohida bosqich sifatida rejalashtirilgan.
 */

function hydrateOrder(db, row) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id).map(it => ({
    workId: it.work_id, title: it.title, qty: it.qty, price: it.price,
    currency: it.currency, sellerUsername: it.seller_username
  }));
  return {
    id: row.id,
    buyer: row.buyer,
    items,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    checkoutUrl: row.checkout_url,
    paidAt: row.paid_at,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getOrder(db, id) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  return hydrateOrder(db, row);
}

function createOrder(db, order) {
  const totalsByCurrency = {};
  for (const it of order.items) totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + it.price * it.qty;

  db.prepare(`INSERT INTO orders (
    id, buyer, status, payment_method, payment_status, checkout_url, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    order.id, order.buyer, order.status || 'placed',
    order.paymentMethod || 'manual', order.paymentStatus || 'unpaid',
    order.checkoutUrl ?? null, order.createdAt || new Date().toISOString()
  );

  const insItem = db.prepare(`INSERT INTO order_items (
    order_id, work_id, title, qty, price, currency, seller_username
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const it of order.items) {
    insItem.run(order.id, it.workId, it.title, it.qty, it.price, it.currency, it.sellerUsername);
  }

  return getOrder(db, order.id);
}

/* Sotuvchi tomonidan: buyurtma holati (placed -> confirmed -> shipped ->
   completed va h.k.) va yetkazib berish ma'lumotlari. */
function updateOrderStatus(db, id, { status, trackingNumber, carrier }) {
  const sets = ['status = ?', 'updated_at = ?'];
  const values = [status, new Date().toISOString()];
  if (typeof trackingNumber === 'string') { sets.push('tracking_number = ?'); values.push(trackingNumber); }
  if (typeof carrier === 'string') { sets.push('carrier = ?'); values.push(carrier); }
  values.push(id);
  db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

function ordersForBuyer(db, buyer) {
  return db.prepare('SELECT * FROM orders WHERE buyer = ? ORDER BY created_at DESC').all(buyer).map(r => hydrateOrder(db, r));
}

function ordersForSeller(db, seller) {
  const rows = db.prepare(`
    SELECT DISTINCT o.* FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.seller_username = ?
    ORDER BY o.created_at DESC
  `).all(seller);
  return rows.map(r => hydrateOrder(db, r));
}

/* Payme/Click WEBHOOK'laridan keyin chaqiriladi — order.paymentStatus,
   order.status, order.paidAt va provayderga xos (order.payme/order.click)
   ma'lumotlarni bittada sinxronlaydi. `payme`/`click` obyektlari
   `payment_meta` JSON ustuniga yig'iladi (yuqoridagi sxema izohiga qarang:
   bu haqiqiy relyatsion ma'lumot emas, webhook hisob-kitobi). */
function syncPaymentState(db, order) {
  const meta = {};
  if (order.payme) meta.payme = order.payme;
  if (order.click) meta.click = order.click;

  db.prepare(`UPDATE orders SET
    status = ?, payment_status = ?, paid_at = ?, payment_meta = ?, updated_at = ?
    WHERE id = ?`).run(
    order.status || 'placed', order.paymentStatus || 'unpaid', order.paidAt ?? null,
    Object.keys(meta).length ? JSON.stringify(meta) : null,
    new Date().toISOString(), order.id
  );
}

module.exports = { getOrder, hydrateOrder, createOrder, updateOrderStatus, syncPaymentState, ordersForBuyer, ordersForSeller };
