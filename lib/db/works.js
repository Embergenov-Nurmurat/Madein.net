/**
 * lib/db/works.js — asarlar (works) bilan ishlash uchun SQL qatlami.
 *
 * ENG MUHIM QISM: `queryFeed()`. Eski usulda (server.js, /api/feed)
 * HAR SO'ROVDA barcha foydalanuvchilarning BARCHA asarlari xotiraga
 * to'liq yuklanib, keyin JS'da filtrlanar/sortlanar edi:
 *
 *     for (const uname of Object.keys(db.works)) { ... }   // O(barcha asar)
 *
 * Bu yerda esa filtrlash, qidirish va sahifalash (pagination) TO'G'RIDAN
 * TO'G'RI SQL'da — WHERE/LIKE/LIMIT/OFFSET orqali, mos indekslar bilan
 * (idx_works_status, idx_works_owner, idx_works_created) bajariladi.
 * Natijada faqat KERAKLI qatorlar xotiraga o'qiladi.
 */

function hydrateWork(db, row) {
  const images = db.prepare('SELECT image_path, thumb_path FROM work_images WHERE work_id = ? ORDER BY position')
    .all(row.id);
  const tags = db.prepare('SELECT tag FROM work_tags WHERE work_id = ?').all(row.id).map(r => r.tag);
  const likes = db.prepare('SELECT username FROM likes WHERE work_id = ?').all(row.id).map(r => r.username);

  return {
    id: row.id,
    owner: row.owner,
    title: row.title,
    type: row.type,
    typeCustom: row.type_custom,
    status: row.status,
    price: row.price,
    currency: row.currency,
    stockMode: row.stock_mode,
    stockQty: row.stock_qty,
    desc: row.description,
    mediaType: row.media_type,
    video: row.video,
    poster: row.poster,
    views: row.views,
    createdAt: row.created_at,
    images: images.map(i => i.image_path),
    thumbs: images.map(i => i.thumb_path || i.image_path),
    tags,
    likes
    // comments/reviews qasddan bu yerga qo'shilmagan — ular potentsial
    // katta bo'lishi mumkin (ko'p komment), shuning uchun alohida
    // getComments(workId)/getReviews(workId) orqali, faqat kerak bo'lganda
    // o'qiladi (masalan asar sahifasi ochilganda, lentada emas).
  };
}

function getWork(db, id) {
  const row = db.prepare('SELECT * FROM works WHERE id = ?').get(id);
  if (!row) return null;
  return hydrateWork(db, row);
}

function createWork(db, work) {
  db.prepare(`INSERT INTO works (
    id, owner, title, type, type_custom, status, price, currency,
    stock_mode, stock_qty, description, media_type, video, poster, views, created_at
  ) VALUES (@id, @owner, @title, @type, @type_custom, @status, @price, @currency,
    @stock_mode, @stock_qty, @description, @media_type, @video, @poster, @views, @created_at)`).run({
    id: work.id, owner: work.owner, title: work.title,
    type: work.type || 'boshqa', type_custom: work.typeCustom ?? null,
    status: work.status === 'sale' ? 'sale' : 'expo',
    price: Number(work.price) || 0, currency: work.currency || 'UZS',
    stock_mode: work.stockMode ?? null, stock_qty: work.stockQty ?? null,
    description: work.desc || '', media_type: work.mediaType === 'video' ? 'video' : 'image',
    video: work.video ?? null, poster: work.poster ?? null, views: 0,
    created_at: work.createdAt || new Date().toISOString()
  });

  const insImg = db.prepare('INSERT INTO work_images (work_id, position, image_path, thumb_path) VALUES (?, ?, ?, ?)');
  const images = work.images || [];
  const thumbs = work.thumbs || [];
  images.forEach((img, i) => insImg.run(work.id, i, img, thumbs[i] || null));

  const insTag = db.prepare('INSERT OR IGNORE INTO work_tags (work_id, tag) VALUES (?, ?)');
  for (const tag of (work.tags || [])) insTag.run(work.id, tag);

  return getWork(db, work.id);
}

function deleteWork(db, id) {
  db.prepare('DELETE FROM works WHERE id = ?').run(id); // ON DELETE CASCADE qolganini tozalaydi
}

/* "Holatni o'zgartirish" tezkor oynasi orqali: sotuv/ko'rgazma, narx,
   valyuta, zaxira rejimi/miqdori. Rasmlar/teglar bu yerda o'zgarmaydi. */
function updateWorkStatus(db, id, { status, price, currency, stockMode, stockQty }) {
  db.prepare(`UPDATE works SET status = ?, price = ?, currency = ?, stock_mode = ?, stock_qty = ? WHERE id = ?`)
    .run(status === 'sale' ? 'sale' : 'expo', Number(price) || 0, currency || 'UZS',
      stockMode ?? null, stockQty ?? null, id);
}

/* Xarid qilinganda "belgilangan miqdor" (fixed) zaxirasini kamaytiradi. */
function setStockQty(db, id, stockQty) {
  db.prepare('UPDATE works SET stock_qty = ? WHERE id = ?').run(stockQty, id);
}

function incrementViews(db, id) {
  db.prepare('UPDATE works SET views = views + 1 WHERE id = ?').run(id);
}

/* ---------- Layklar ---------- */

function toggleLike(db, workId, username) {
  const exists = db.prepare('SELECT 1 FROM likes WHERE work_id = ? AND username = ?').get(workId, username);
  if (exists) {
    db.prepare('DELETE FROM likes WHERE work_id = ? AND username = ?').run(workId, username);
    return false;
  }
  db.prepare('INSERT INTO likes (work_id, username, created_at) VALUES (?, ?, ?)')
    .run(workId, username, new Date().toISOString());
  return true;
}

/* ---------- Kommentlar / sharhlar (asar sahifasida, alohida o'qiladi) ---------- */

function getComments(db, workId) {
  return db.prepare('SELECT * FROM comments WHERE work_id = ? ORDER BY created_at').all(workId)
    .map(c => ({ id: c.id, username: c.username, text: c.text, createdAt: c.created_at }));
}

function commentsCount(db, workId) {
  return db.prepare('SELECT COUNT(*) AS n FROM comments WHERE work_id = ?').get(workId).n;
}

function addComment(db, workId, comment) {
  db.prepare('INSERT INTO comments (id, work_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(comment.id, workId, comment.username, comment.text, comment.createdAt || new Date().toISOString());
}

function deleteComment(db, commentId) {
  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
}

function getReviews(db, workId) {
  return db.prepare('SELECT * FROM reviews WHERE work_id = ? ORDER BY created_at').all(workId)
    .map(r => ({ id: r.id, username: r.username, rating: r.rating, text: r.text, createdAt: r.created_at }));
}

function addReview(db, workId, review) {
  db.prepare('INSERT INTO reviews (id, work_id, username, rating, text, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(review.id, workId, review.username, review.rating, review.text || '', review.createdAt || new Date().toISOString());
}

function averageRating(db, workId) {
  const row = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE work_id = ?').get(workId);
  return { average: row.avg || 0, count: row.n };
}

/* ---------------------------------------------------------------------- */
/* LENTA — filtrlash/qidirish/sahifalash TO'G'RIDAN TO'G'RI SQL'da        */
/* ---------------------------------------------------------------------- */

/**
 * @param {object} opts
 * @param {string} [opts.status]     'sale' | 'expo' — bo'sh bo'lsa ikkalasi ham
 * @param {string} [opts.owner]      faqat shu foydalanuvchining asarlari
 * @param {string[]} [opts.ownerIn]  faqat shu ro'yxatdagi foydalanuvchilar (masalan "faqat kuzatilganlar")
 * @param {string} [opts.type]       asar turi (rasm/hunar/... yoki 'boshqa')
 * @param {string} [opts.search]     sarlavha/tavsif/sotuvchi ismi/username/teglar bo'yicha qidiruv
 * @param {string} [opts.tag]        aniq teg bo'yicha filtr
 * @param {number} [opts.minPrice]   faqat 'sale' holatidagi asarlarga qo'llanadi (eskisiga mos)
 * @param {number} [opts.maxPrice]
 * @param {string} [opts.sort]       'new' (standart) | 'popular' (layklar soni)
 * @param {number} [opts.limit=20]
 * @param {number} [opts.offset=0]
 * @returns {{items: object[], total: number}}
 */
function queryFeed(db, opts = {}) {
  const { status, owner, ownerIn, type, search, tag, minPrice, maxPrice, sort = 'new', limit = 20, offset = 0 } = opts;

  const where = [];
  const params = {};

  if (status) { where.push('w.status = @status'); params.status = status; }
  if (owner) { where.push('w.owner = @owner'); params.owner = owner; }
  if (Array.isArray(ownerIn)) {
    if (!ownerIn.length) { where.push('0'); } // bo'sh ro'yxat — hech narsa mos kelmaydi
    else {
      const placeholders = ownerIn.map((_, i) => `@ownerIn${i}`).join(',');
      where.push(`w.owner IN (${placeholders})`);
      ownerIn.forEach((o, i) => { params[`ownerIn${i}`] = o; });
    }
  }
  if (type && type !== 'all') { where.push('w.type = @type'); params.type = type; }
  if (search) {
    // Eski /api/feed'dagi bilan bir xil "haystack": sarlavha + tavsif +
    // sotuvchi to'liq ismi + username + teglar (LIKE orqali, JOIN'siz —
    // teglar uchun alohida EXISTS shart yetarli, chunki OR bilan qo'shiladi).
    where.push(`(
      w.title LIKE @search OR w.description LIKE @search OR w.owner LIKE @search
      OR EXISTS (SELECT 1 FROM users u2 WHERE u2.username = w.owner AND u2.fullname LIKE @search)
      OR EXISTS (SELECT 1 FROM work_tags wt2 WHERE wt2.work_id = w.id AND wt2.tag LIKE @search)
    )`);
    params.search = `%${search}%`;
  }
  if (tag) {
    where.push('EXISTS (SELECT 1 FROM work_tags wt WHERE wt.work_id = w.id AND wt.tag = @tag)');
    params.tag = tag;
  }
  if (minPrice != null || maxPrice != null) {
    // Eskisiga mos: narx filtri faqat "sotuvda" turgan asarlarga tegishli
    where.push("w.status = 'sale'");
    if (minPrice != null && !Number.isNaN(minPrice)) { where.push('w.price >= @minPrice'); params.minPrice = minPrice; }
    if (maxPrice != null && !Number.isNaN(maxPrice)) { where.push('w.price <= @maxPrice'); params.maxPrice = maxPrice; }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const orderSql = sort === 'popular'
    ? `ORDER BY (SELECT COUNT(*) FROM likes l WHERE l.work_id = w.id) DESC, w.created_at DESC`
    : `ORDER BY w.created_at DESC`;

  const total = db.prepare(`SELECT COUNT(*) AS n FROM works w ${whereSql}`).get(params).n;

  const rows = db.prepare(`SELECT w.* FROM works w ${whereSql} ${orderSql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  return { items: rows.map(r => hydrateWork(db, r)), total };
}

module.exports = {
  getWork, hydrateWork, createWork, deleteWork, updateWorkStatus, setStockQty, incrementViews,
  toggleLike, getComments, commentsCount, addComment, deleteComment, getReviews, addReview, averageRating,
  queryFeed
};
