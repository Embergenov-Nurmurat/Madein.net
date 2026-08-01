/**
 * payments.js — O'zbekiston to'lov tizimlari (Payme va Click) integratsiyasi.
 *
 * Ikkala tizim ham buyurtma summasini MADEIN.NET platforma hisobiga
 * (bitta merchant akkauntga) o'tkazadi — chunki Payme/Click savdo
 * maydonchalarida bitta buyurtma ichidagi turli sotuvchilarga to'g'ridan
 * to'g'ri pul bo'lish funksiyasini standart tarzda taqdim etmaydi. Pul
 * platformaga tushadi, so'ng admin/moderatsiya orqali sotuvchilarga
 * (offline yoki keyingi bosqichda alohida payout tizimi bilan) o'tkaziladi.
 * Bu — kichik hunarmandchilik bozorlari uchun odatiy yondashuv.
 *
 * Ikkala provider ham .env orqali sozlanadi; sozlanmagan bo'lsa, mos
 * checkout tugmasi frontendda ko'rsatilmaydi va faqat "qo'lda to'lov"
 * (manual/offline) varianti taklif etiladi — sayt baribir to'liq ishlaydi.
 */

const crypto = require('crypto');

const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '';
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY || ''; // Test yoki jonli kalit
const PAYME_TEST_MODE = String(process.env.PAYME_TEST_MODE || 'true') === 'true';
const PAYME_CHECKOUT_BASE = PAYME_TEST_MODE
  ? 'https://checkout.test.paycom.uz'
  : 'https://checkout.paycom.uz';

const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || '';
const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || '';
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || '';
const CLICK_MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID || '';
const CLICK_CHECKOUT_BASE = 'https://my.click.uz/services/pay';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

const PAYME_ENABLED = !!(PAYME_MERCHANT_ID && PAYME_SECRET_KEY);
const CLICK_ENABLED = !!(CLICK_SERVICE_ID && CLICK_MERCHANT_ID && CLICK_SECRET_KEY);

function availableGateways() {
  const list = [];
  if (PAYME_ENABLED) list.push('payme');
  if (CLICK_ENABLED) list.push('click');
  list.push('manual'); // qo'lda/offline to'lov har doim mavjud (zaxira variant)
  return list;
}

/* Faqat UZS uchun ishlaydi — boshqa valyutadagi buyurtmalar avtomatik
   ravishda "manual" to'lovga tushadi (checkout API darajasida). */
function isUZSOrder(order) {
  const currencies = Object.keys(order.totalsByCurrency || {});
  return currencies.length === 1 && currencies[0] === 'UZS';
}

/* ===================== PAYME ===================== */

/* Checkout.paycom.uz'ga yo'naltirish uchun havola yaratadi. Summa
   tiyin (so'mning 1/100) da yuboriladi. */
function paymeCheckoutUrl(order) {
  const amountTiyin = Math.round((order.totalsByCurrency.UZS || 0) * 100);
  const params = [
    `m=${PAYME_MERCHANT_ID}`,
    `ac.order_id=${order.id}`,
    `a=${amountTiyin}`,
    `c=${encodeURIComponent(SITE_URL + '/?order=' + order.id)}`
  ].join(';');
  const encoded = Buffer.from(params, 'utf8').toString('base64');
  return `${PAYME_CHECKOUT_BASE}/${encoded}`;
}

const PaymeErrors = {
  INVALID_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31050,
  ORDER_ALREADY_PAID: -31051,
  ORDER_NOT_PAYABLE: -31052,
  CANT_CANCEL: -31007,
  TRANSACTION_NOT_FOUND: -31003,
  METHOD_NOT_FOUND: -32601
};

/* Paycom so'rovlari HTTP Basic Auth orqali keladi: login "Paycom",
   parol — PAYME_SECRET_KEY. */
function verifyPaymeAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const pass = idx >= 0 ? decoded.slice(idx + 1) : '';
    return pass === PAYME_SECRET_KEY;
  } catch (e) {
    return false;
  }
}

/* JSON-RPC so'rovini qayta ishlaydi. `findOrder`/`saveOrder`/`onPaid`/`onCancelled`
   — server.js'dan uzatiladigan callback'lar (baza bilan bog'lash uchun). */
async function handlePaymeRequest(body, ctx) {
  const { method, params, id } = body || {};
  const rpcId = id !== undefined ? id : null;
  const ok = (result) => ({ jsonrpc: '2.0', id: rpcId, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id: rpcId, error: { code, message } });

  const orderIdFromAccount = () => params && params.account && params.account.order_id;

  switch (method) {
    case 'CheckPerformTransaction': {
      const order = ctx.findOrder(orderIdFromAccount());
      if (!order) return err(PaymeErrors.ORDER_NOT_FOUND, { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' });
      if (order.paymentStatus === 'paid') return err(PaymeErrors.ORDER_ALREADY_PAID, { uz: "Buyurtma allaqachon to'langan", ru: 'Заказ уже оплачен', en: 'Already paid' });
      const expected = Math.round((order.totalsByCurrency.UZS || 0) * 100);
      if (Number(params.amount) !== expected) return err(PaymeErrors.INVALID_AMOUNT, { uz: "Summa noto'g'ri", ru: 'Неверная сумма', en: 'Invalid amount' });
      return ok({ allow: true });
    }
    case 'CreateTransaction': {
      const order = ctx.findOrder(orderIdFromAccount());
      if (!order) return err(PaymeErrors.ORDER_NOT_FOUND, { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' });
      order.payme = order.payme || { transactions: {} };
      const existing = order.payme.transactions[params.id];
      if (existing) {
        if (existing.state !== 1) return err(PaymeErrors.CANT_CANCEL, { uz: "Tranzaksiya holati noto'g'ri", ru: 'Неверное состояние транзакции', en: 'Invalid transaction state' });
        return ok({ create_time: existing.create_time, transaction: existing.id, state: existing.state });
      }
      if (order.paymentStatus === 'paid') return err(PaymeErrors.ORDER_ALREADY_PAID, { uz: "Buyurtma allaqachon to'langan", ru: 'Заказ уже оплачен', en: 'Already paid' });
      const expected = Math.round((order.totalsByCurrency.UZS || 0) * 100);
      if (Number(params.amount) !== expected) return err(PaymeErrors.INVALID_AMOUNT, { uz: "Summa noto'g'ri", ru: 'Неверная сумма', en: 'Invalid amount' });
      const now = Date.now();
      order.payme.transactions[params.id] = { id: params.id, state: 1, create_time: now, amount: params.amount };
      order.paymentStatus = 'pending';
      order.paymentMethod = 'payme';
      await ctx.saveOrder(order);
      return ok({ create_time: now, transaction: params.id, state: 1 });
    }
    case 'PerformTransaction': {
      const order = ctx.findOrderByTransaction('payme', params.id);
      if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' });
      const tx = order.payme.transactions[params.id];
      if (tx.state === 2) return ok({ transaction: tx.id, perform_time: tx.perform_time, state: 2 });
      if (tx.state !== 1) return err(PaymeErrors.CANT_CANCEL, { uz: "Tranzaksiya holati noto'g'ri", ru: 'Неверное состояние транзакции', en: 'Invalid transaction state' });
      tx.state = 2;
      tx.perform_time = Date.now();
      order.paymentStatus = 'paid';
      order.status = order.status === 'placed' ? 'confirmed' : order.status;
      order.paidAt = new Date().toISOString();
      await ctx.saveOrder(order);
      if (ctx.onPaid) await ctx.onPaid(order);
      return ok({ transaction: tx.id, perform_time: tx.perform_time, state: 2 });
    }
    case 'CancelTransaction': {
      const order = ctx.findOrderByTransaction('payme', params.id);
      if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' });
      const tx = order.payme.transactions[params.id];
      if (tx.state === 2) tx.state = -2; else tx.state = -1;
      tx.cancel_time = Date.now();
      tx.reason = params.reason;
      if (order.paymentStatus !== 'paid' || tx.state === -2) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
      }
      await ctx.saveOrder(order);
      if (ctx.onCancelled) await ctx.onCancelled(order);
      return ok({ transaction: tx.id, cancel_time: tx.cancel_time, state: tx.state });
    }
    case 'CheckTransaction': {
      const order = ctx.findOrderByTransaction('payme', params.id);
      if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' });
      const tx = order.payme.transactions[params.id];
      return ok({
        create_time: tx.create_time || 0,
        perform_time: tx.perform_time || 0,
        cancel_time: tx.cancel_time || 0,
        transaction: tx.id,
        state: tx.state,
        reason: tx.reason || null
      });
    }
    case 'GetStatement': {
      const orders = ctx.listOrdersInRange(params.from, params.to, 'payme');
      const transactions = [];
      for (const order of orders) {
        for (const tx of Object.values((order.payme && order.payme.transactions) || {})) {
          transactions.push({
            id: tx.id,
            time: tx.create_time,
            amount: tx.amount,
            account: { order_id: order.id },
            create_time: tx.create_time || 0,
            perform_time: tx.perform_time || 0,
            cancel_time: tx.cancel_time || 0,
            transaction: tx.id,
            state: tx.state,
            reason: tx.reason || null
          });
        }
      }
      return ok({ transactions });
    }
    default:
      return err(PaymeErrors.METHOD_NOT_FOUND, { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' });
  }
}

/* ===================== CLICK ===================== */

function clickCheckoutUrl(order) {
  const amount = (order.totalsByCurrency.UZS || 0).toFixed(2);
  const p = new URLSearchParams({
    service_id: CLICK_SERVICE_ID,
    merchant_id: CLICK_MERCHANT_ID,
    amount,
    transaction_param: order.id,
    return_url: SITE_URL + '/?order=' + order.id
  });
  return `${CLICK_CHECKOUT_BASE}?${p.toString()}`;
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/* Click "Prepare" (action=0) va "Complete" (action=1) so'rovlarini
   qayta ishlaydi. To'liq hujjat: docs.click.uz — Merchant API. */
async function handleClickRequest(body, action, ctx) {
  const {
    click_trans_id, service_id, merchant_trans_id, amount,
    sign_time, sign_string, merchant_prepare_id, error
  } = body || {};

  const expectedSign = action === 0
    ? md5(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`)
    : md5(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`);

  const base = {
    click_trans_id, merchant_trans_id,
    merchant_confirm_id: merchant_prepare_id || undefined
  };

  if (sign_string !== expectedSign) {
    return { ...base, error: -1, error_note: 'SIGN CHECK FAILED!' };
  }
  const order = ctx.findOrder(merchant_trans_id);
  if (!order) return { ...base, error: -5, error_note: 'Order not found' };

  const expectedAmount = Number(order.totalsByCurrency.UZS || 0);
  if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
    return { ...base, error: -2, error_note: 'Incorrect amount' };
  }

  if (action === 0) { // Prepare
    if (order.paymentStatus === 'paid') return { ...base, error: -4, error_note: 'Already paid' };
    order.click = order.click || {};
    order.click.prepareId = String(click_trans_id);
    order.paymentStatus = 'pending';
    order.paymentMethod = 'click';
    await ctx.saveOrder(order);
    return { click_trans_id, merchant_trans_id, merchant_prepare_id: click_trans_id, error: 0, error_note: 'Success' };
  }

  // Complete (action === 1)
  if (Number(error) < 0) {
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await ctx.saveOrder(order);
    return { ...base, error: Number(error), error_note: 'Failed on payer side' };
  }
  if (order.paymentStatus === 'paid') {
    return { click_trans_id, merchant_trans_id, merchant_confirm_id: click_trans_id, error: 0, error_note: 'Already confirmed' };
  }
  order.paymentStatus = 'paid';
  order.status = order.status === 'placed' ? 'confirmed' : order.status;
  order.paidAt = new Date().toISOString();
  await ctx.saveOrder(order);
  if (ctx.onPaid) await ctx.onPaid(order);
  return { click_trans_id, merchant_trans_id, merchant_confirm_id: click_trans_id, error: 0, error_note: 'Success' };
}

module.exports = {
  PAYME_ENABLED,
  CLICK_ENABLED,
  availableGateways,
  isUZSOrder,
  paymeCheckoutUrl,
  verifyPaymeAuth,
  handlePaymeRequest,
  clickCheckoutUrl,
  handleClickRequest
};
