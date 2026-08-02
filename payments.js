/**
 * payments.js - Payme va Click integratsiyasi (XAVFSIZLIK TUZATISHLARI BILAN).
 *
 * Nima o'zgardi (original faylga nisbatan):
 *  1. Payme Basic Auth endi login ("Paycom") ni ham tekshiradi va parolni
 *     `crypto.timingSafeEqual` orqali doimiy vaqtda solishtiradi (timing attack).
 *  2. Click `sign_string` tekshiruvi ham doimiy vaqtli solishtiruvga o'tkazildi.
 *  3. Har bir buyurtma uchun MUTEX (qulf) qo'shildi - Payme/Click webhook'lari
 *     parallel yoki takroran kelsa ham `onPaid` faqat BIR MARTA ishlaydi
 *     (idempotentlik). Bu "ikki marta pul o'tkazildi" xatosini yopadi.
 *  4. Barcha holat o'zgarishlari qulf ichida o'qib-yozadi (read-modify-write race yo'q).
 *  5. Summani solishtirishda float xatosi yo'qotildi (tiyinda butun son).
 */

const crypto = require('crypto');

const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '';
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY || '';
const PAYME_LOGIN = process.env.PAYME_LOGIN || 'Paycom';
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

/* ============ Yordamchi: doimiy vaqtli solishtiruv ============
   Uzunliklari har xil satrlar `timingSafeEqual`da xato beradi, shuning uchun
   avval ikkalasini sha256 bilan bir xil uzunlikka keltiramiz. */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a == null ? '' : a)).digest();
  const hb = crypto.createHash('sha256').update(String(b == null ? '' : b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/* ============ Yordamchi: buyurtma bo'yicha navbat (mutex) ============
   Bir xil `key` bilan kelgan chaqiruvlar ketma-ket bajariladi. Shu sabab
   webhook takroran kelsa ham holat tekshiruvi va yozuv atomar bo'ladi. */
const locks = new Map();
function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const run = prev.then(() => fn(), () => fn());
  const cleanup = run.then(() => {}, () => {}).then(() => {
    if (locks.get(key) === cleanup) locks.delete(key);
  });
  locks.set(key, cleanup);
  return run;
}

function availableGateways() {
  const list = [];
  if (PAYME_ENABLED) list.push('payme');
  if (CLICK_ENABLED) list.push('click');
  list.push('manual');
  return list;
}

function isUZSOrder(order) {
  const currencies = Object.keys((order && order.totalsByCurrency) || {});
  return currencies.length === 1 && currencies[0] === 'UZS';
}

/* Buyurtma summasi tiyinda, butun son sifatida (float yaxlitlash xatosisiz). */
function expectedTiyin(order) {
  return Math.round(Number((order.totalsByCurrency || {}).UZS || 0) * 100);
}

/* ===================== PAYME ===================== */

function paymeCheckoutUrl(order) {
  const params = [
    `m=${PAYME_MERCHANT_ID}`,
    `ac.order_id=${order.id}`,
    `a=${expectedTiyin(order)}`,
    `c=${encodeURIComponent(SITE_URL + '/?order=' + order.id)}`
  ].join(';');
  return `${PAYME_CHECKOUT_BASE}/${Buffer.from(params, 'utf8').toString('base64')}`;
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

/* TUZATILDI: login ham tekshiriladi + doimiy vaqtli solishtiruv.
   Kalit sozlanmagan bo'lsa - hamma so'rov rad etiladi (ochiq webhook qolmaydi). */
function verifyPaymeAuth(req) {
  if (!PAYME_SECRET_KEY) return false;
  const header = (req && req.headers && req.headers.authorization) || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch (e) {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const login = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  const okLogin = safeEqual(login, PAYME_LOGIN);
  const okPass = safeEqual(pass, PAYME_SECRET_KEY);
  return okLogin && okPass; // ikkalasi ham har doim hisoblanadi (early return yo'q)
}

async function handlePaymeRequest(body, ctx) {
  const { method, params, id } = body || {};
  const rpcId = id !== undefined ? id : null;
  const ok = (result) => ({ jsonrpc: '2.0', id: rpcId, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id: rpcId, error: { code, message } });

  const E = {
    notFound: { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' },
    paid: { uz: "Buyurtma allaqachon to'langan", ru: 'Заказ уже оплачен', en: 'Already paid' },
    amount: { uz: "Summa noto'g'ri", ru: 'Неверная сумма', en: 'Invalid amount' },
    state: { uz: "Tranzaksiya holati noto'g'ri", ru: 'Неверное состояние транзакции', en: 'Invalid transaction state' },
    tx: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' },
    method: { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' }
  };

  const accountOrderId = () => params && params.account && params.account.order_id;

  switch (method) {
    case 'CheckPerformTransaction': {
      const order = ctx.findOrder(accountOrderId());
      if (!order) return err(PaymeErrors.ORDER_NOT_FOUND, E.notFound);
      if (order.paymentStatus === 'paid') return err(PaymeErrors.ORDER_ALREADY_PAID, E.paid);
      if (Number(params.amount) !== expectedTiyin(order)) return err(PaymeErrors.INVALID_AMOUNT, E.amount);
      return ok({ allow: true });
    }

    case 'CreateTransaction': {
      const orderId = accountOrderId();
      if (!orderId) return err(PaymeErrors.ORDER_NOT_FOUND, E.notFound);
      return withLock(`order:${orderId}`, async () => {
        const order = ctx.findOrder(orderId);
        if (!order) return err(PaymeErrors.ORDER_NOT_FOUND, E.notFound);
        order.payme = order.payme || { transactions: {} };
        const existing = order.payme.transactions[params.id];
        if (existing) {
          if (existing.state !== 1) return err(PaymeErrors.CANT_CANCEL, E.state);
          return ok({ create_time: existing.create_time, transaction: existing.id, state: existing.state });
        }
        if (order.paymentStatus === 'paid') return err(PaymeErrors.ORDER_ALREADY_PAID, E.paid);
        if (Number(params.amount) !== expectedTiyin(order)) return err(PaymeErrors.INVALID_AMOUNT, E.amount);
        const now = Date.now();
        order.payme.transactions[params.id] = { id: params.id, state: 1, create_time: now, amount: params.amount };
        order.paymentStatus = 'pending';
        order.paymentMethod = 'payme';
        await ctx.saveOrder(order);
        return ok({ create_time: now, transaction: params.id, state: 1 });
      });
    }

    case 'PerformTransaction': {
      const found = ctx.findOrderByTransaction('payme', params.id);
      if (!found) return err(PaymeErrors.TRANSACTION_NOT_FOUND, E.tx);
      return withLock(`order:${found.id}`, async () => {
        // Qulf ichida QAYTA o'qiymiz - kutish paytida holat o'zgargan bo'lishi mumkin.
        const order = ctx.findOrderByTransaction('payme', params.id);
        if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, E.tx);
        const tx = order.payme.transactions[params.id];
        if (tx.state === 2) {
          // Idempotent: takroriy so'rovda onPaid QAYTA chaqirilmaydi.
          return ok({ transaction: tx.id, perform_time: tx.perform_time, state: 2 });
        }
        if (tx.state !== 1) return err(PaymeErrors.CANT_CANCEL, E.state);
        tx.state = 2;
        tx.perform_time = Date.now();
        order.paymentStatus = 'paid';
        order.status = order.status === 'placed' ? 'confirmed' : order.status;
        order.paidAt = new Date().toISOString();
        order.paidNotified = order.paidNotified || false;
        await ctx.saveOrder(order);
        if (ctx.onPaid && !order.paidNotified) {
          order.paidNotified = true;
          await ctx.saveOrder(order);
          await ctx.onPaid(order);
        }
        return ok({ transaction: tx.id, perform_time: tx.perform_time, state: 2 });
      });
    }

    case 'CancelTransaction': {
      const found = ctx.findOrderByTransaction('payme', params.id);
      if (!found) return err(PaymeErrors.TRANSACTION_NOT_FOUND, E.tx);
      return withLock(`order:${found.id}`, async () => {
        const order = ctx.findOrderByTransaction('payme', params.id);
        if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, E.tx);
        const tx = order.payme.transactions[params.id];
        if (tx.state === -1 || tx.state === -2) {
          return ok({ transaction: tx.id, cancel_time: tx.cancel_time, state: tx.state });
        }
        tx.state = tx.state === 2 ? -2 : -1;
        tx.cancel_time = Date.now();
        tx.reason = params.reason;
        if (order.paymentStatus !== 'paid' || tx.state === -2) {
          order.paymentStatus = 'failed';
          order.status = 'cancelled';
        }
        await ctx.saveOrder(order);
        if (ctx.onCancelled) await ctx.onCancelled(order);
        return ok({ transaction: tx.id, cancel_time: tx.cancel_time, state: tx.state });
      });
    }

    case 'CheckTransaction': {
      const order = ctx.findOrderByTransaction('payme', params.id);
      if (!order) return err(PaymeErrors.TRANSACTION_NOT_FOUND, E.tx);
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
      return err(PaymeErrors.METHOD_NOT_FOUND, E.method);
  }
}

/* ===================== CLICK ===================== */

function clickCheckoutUrl(order) {
  const amount = (Number((order.totalsByCurrency || {}).UZS || 0)).toFixed(2);
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

async function handleClickRequest(body, action, ctx) {
  const {
    click_trans_id, service_id, merchant_trans_id, amount,
    sign_time, sign_string, merchant_prepare_id, error
  } = body || {};

  const base = {
    click_trans_id, merchant_trans_id,
    merchant_confirm_id: merchant_prepare_id || undefined
  };

  if (!CLICK_SECRET_KEY) return { ...base, error: -1, error_note: 'SIGN CHECK FAILED!' };

  const expectedSign = action === 0
    ? md5(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`)
    : md5(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`);

  // TUZATILDI: doimiy vaqtli solishtiruv (oldin oddiy !== edi).
  if (!safeEqual(sign_string, expectedSign)) {
    return { ...base, error: -1, error_note: 'SIGN CHECK FAILED!' };
  }
  // Service ID ham tekshiriladi - boshqa kassaning so'rovi qabul qilinmasin.
  if (CLICK_SERVICE_ID && String(service_id) !== String(CLICK_SERVICE_ID)) {
    return { ...base, error: -1, error_note: 'SIGN CHECK FAILED!' };
  }

  if (!merchant_trans_id) return { ...base, error: -5, error_note: 'Order not found' };

  // TUZATILDI: butun blok buyurtma qulfi ichida - parallel Complete'lar xavfsiz.
  return withLock(`order:${merchant_trans_id}`, async () => {
    const order = ctx.findOrder(merchant_trans_id);
    if (!order) return { ...base, error: -5, error_note: 'Order not found' };

    const expectedAmount = Number((order.totalsByCurrency || {}).UZS || 0);
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
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await ctx.saveOrder(order);
      }
      return { ...base, error: Number(error), error_note: 'Failed on payer side' };
    }
    if (order.paymentStatus === 'paid') {
      // Idempotent: onPaid qayta chaqirilmaydi.
      return { click_trans_id, merchant_trans_id, merchant_confirm_id: click_trans_id, error: 0, error_note: 'Already confirmed' };
    }
    order.paymentStatus = 'paid';
    order.status = order.status === 'placed' ? 'confirmed' : order.status;
    order.paidAt = new Date().toISOString();
    await ctx.saveOrder(order);
    if (ctx.onPaid && !order.paidNotified) {
      order.paidNotified = true;
      await ctx.saveOrder(order);
      await ctx.onPaid(order);
    }
    return { click_trans_id, merchant_trans_id, merchant_confirm_id: click_trans_id, error: 0, error_note: 'Success' };
  });
}

module.exports = {
  PAYME_ENABLED,
  CLICK_ENABLED,
  CLICK_MERCHANT_USER_ID,
  availableGateways,
  isUZSOrder,
  paymeCheckoutUrl,
  verifyPaymeAuth,
  handlePaymeRequest,
  clickCheckoutUrl,
  handleClickRequest,
  // sinov va boshqa modullar uchun
  safeEqual,
  withLock
};
