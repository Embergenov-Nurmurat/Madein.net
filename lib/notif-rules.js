/**
 * lib/notif-rules.js — bildirishnoma yuborish MUMKIN-EMASLIGINI aniqlovchi
 * TOZA qoidalar (server.js'dan ajratildi).
 *
 * Haqiqiy yuborish (addNotification, sendPush, sendMail) hamon server.js'da
 * qoladi, chunki ular `db`ga yozadi va tarmoqqa chiqadi — bu yerdagilar esa
 * faqat "ruxsat bormi?" degan savolga javob beradi.
 */

const { categoryForNotifType } = require('./utils');
const { ensureModerationFields } = require('./user-defaults');

/* Foydalanuvchi shu KATEGORIYADAGI bildirishnomani olishga rozimi
   (notifPrefs orqali sozlanadi) */
function isNotifCategoryAllowed(u, category) {
  ensureModerationFields(u);
  if (!u.notifPrefs.enabled) return false;
  if (category && u.notifPrefs[category] === false) return false;
  return true;
}

function isNotifAllowed(u, type) {
  return isNotifCategoryAllowed(u, categoryForNotifType(type));
}

/* Email — faqat MUHIM (tranzaksion) bildirishnomalar uchun yuboriladi,
   ijtimoiy bildirishnomalar (layk/komment) bilan pochta qutisi to'ldirilmaydi */
function isEmailWorthyType(type) {
  return ['order-received', 'order-placed', 'order-status', 'ban', 'unban', 'mute', 'unmute'].includes(type);
}

module.exports = { isNotifCategoryAllowed, isNotifAllowed, isEmailWorthyType };
