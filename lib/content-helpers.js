/**
 * lib/content-helpers.js — asar (work), suhbat va buyurtma ma'lumotlarini
 * qayta shakllantiruvchi TOZA funksiyalar (server.js'dan ajratildi).
 *
 * Hech biri `db`ga to'g'ridan-to'g'ri murojaat qilmaydi — faqat argument
 * sifatida berilgan obyekt (work/conv/order) bilan ishlaydi.
 */

function workImages(w) {
  if (Array.isArray(w.images) && w.images.length) return w.images;
  return w.image ? [w.image] : [];
}

/* Eski (thumb'siz) asarlar uchun: agar thumbs bo'lmasa, to'liq rasmni ishlatamiz */
function workThumbs(w) {
  if (Array.isArray(w.thumbs) && w.thumbs.length === workImages(w).length) return w.thumbs;
  return workImages(w);
}

function unreadCountFor(conv, me) {
  const readUpto = (conv.readUpto && conv.readUpto[me]) || null;
  return conv.messages.filter(m => m.from !== me && (!readUpto || new Date(m.createdAt) > new Date(readUpto))).length;
}

/* Suhbatlar ro'yxatidagi so'nggi xabar önizlemesi. MUHIM: bu yerda matnni
   tayyor holda (masalan "🎙️ Ovozli xabar") qaytarib bo'lmaydi — u har doim
   o'zbekcha bo'lib qolib, foydalanuvchi boshqa til tanlagan bo'lsa ham
   tarjima qilinmay ko'rinaverardi. Shu sabab faqat TUR (type) qaytariladi;
   emoji+matnni frontend joriy sayt tiliga qarab o'zi hosil qiladi. */
function lastMessagePreviewFor(last) {
  if (!last || last.type === 'call') return { type: null, text: '' };
  switch (last.type) {
    case 'photo': return { type: 'photo', text: '' };
    case 'video': return { type: 'video', text: '' };
    case 'circle': return { type: 'circle', text: '' };
    case 'voice': return { type: 'voice', text: '' };
    case 'file': return { type: 'file', text: '', fileName: last.fileName || '' };
    case 'order': return { type: 'order', text: '' };
    default: return { type: 'text', text: last.text || '' };
  }
}

function orderHasCompletedItem(order, buyer, workId) {
  return order.buyer === buyer && order.status === 'completed' &&
    Array.isArray(order.items) && order.items.some(it => it.workId === workId);
}

module.exports = { workImages, workThumbs, unreadCountFor, lastMessagePreviewFor, orderHasCompletedItem };
