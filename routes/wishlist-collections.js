/**
 * routes/wishlist-collections.js — "Saqlanganlar" (wishlist) va "To'plamlar"
 * (collections) rout'lari (server.js'dan ajratildi).
 *
 * Pattern routes/admin.js bilan bir xil: barcha bog'liqliklar `deps`
 * obyekti orqali aniq uzatiladi.
 */

const express = require('express');
const crypto = require('crypto');

function createWishlistCollectionsRouter(deps) {
  const {
    requireAuth,
    db, saveDB,
    ensureModerationFields, findWork,
    workImages, workThumbs,
    mirrorToRelationalDb, relDb, relUsers, relWorks
  } = deps;

  const router = express.Router();

  /* ===================== TO'PLAMLAR (COLLECTIONS) ===================== */

  router.get('/api/collections/:username', (req, res) => {
    const uname = String(req.params.username || '').trim().toLowerCase();

    const relUser = relUsers.getUser(relDb, uname);
    const u = db.users[uname];
    if (!relUser && !u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (u) ensureModerationFields(u);

    const oldCollections = u ? u.collections : [];
    const relCollections = relUser ? relUser.collections : [];
    const byId = new Map();
    for (const c of oldCollections) byId.set(c.id, c);
    for (const c of relCollections) if (!byId.has(c.id)) byId.set(c.id, c);

    const works = db.works[uname] || [];
    const items = [...byId.values()].map(c => {
      const workIds = [...new Set([...(c.workIds || [])])];
      return {
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        works: workIds
          .map(id => {
            const relWork = relWorks.getWork(relDb, id);
            if (relWork) return { id: relWork.id, title: relWork.title, image: relWork.images[0] || relWork.poster || null, status: relWork.status, price: relWork.price, currency: relWork.currency };
            const w = works.find(x => x.id === id);
            if (!w) return null;
            return { id: w.id, title: w.title, image: w.image || w.poster || null, status: w.status, price: w.price, currency: w.currency };
          })
          .filter(Boolean)
      };
    });
    res.json({ items });
  });

  router.post('/api/collections', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const name = String((req.body && req.body.name) || '').trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: "To'plam nomi kerak", code: 'nameRequired' });
    const collection = { id: 'col' + Date.now() + crypto.randomBytes(4).toString('hex'), name, workIds: [], createdAt: new Date().toISOString() };
    u.collections.push(collection);
    await saveDB();
    mirrorToRelationalDb(() => relUsers.createCollection(relDb, req.session.username, collection));
    res.json({ collection });
  });

  router.put('/api/collections/:id', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const col = u.collections.find(c => c.id === req.params.id);
    if (!col) return res.status(404).json({ error: "To'plam topilmadi", code: 'collectionNotFound' });

    const { name, addWorkId, removeWorkId } = req.body || {};
    if (typeof name === 'string' && name.trim()) {
      col.name = name.trim().slice(0, 80);
      mirrorToRelationalDb(() => relUsers.renameCollection(relDb, col.id, col.name));
    }
    const myWorks = db.works[req.session.username] || [];
    if (addWorkId && myWorks.some(w => w.id === addWorkId) && !col.workIds.includes(addWorkId)) {
      col.workIds.push(addWorkId);
      mirrorToRelationalDb(() => relUsers.addToCollection(relDb, col.id, addWorkId));
    }
    if (removeWorkId) {
      col.workIds = col.workIds.filter(id => id !== removeWorkId);
      mirrorToRelationalDb(() => relUsers.removeFromCollection(relDb, col.id, removeWorkId));
    }
    await saveDB();
    res.json({ collection: col });
  });

  router.delete('/api/collections/:id', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const idx = u.collections.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "To'plam topilmadi", code: 'collectionNotFound' });
    u.collections.splice(idx, 1);
    await saveDB();
    mirrorToRelationalDb(() => relUsers.deleteCollection(relDb, req.params.id));
    res.json({ ok: true });
  });

  /* ===================== SAQLANGANLAR (WISHLIST) ===================== */

  router.post('/api/works/:id/wishlist', requireAuth, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });

    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const idx = u.wishlist.indexOf(req.params.id);
    let saved;
    if (idx === -1) { u.wishlist.push(req.params.id); saved = true; }
    else { u.wishlist.splice(idx, 1); saved = false; }

    await saveDB();
    mirrorToRelationalDb(() => relUsers.toggleWishlist(relDb, req.session.username, req.params.id));
    res.json({ saved });
  });

  router.get('/api/wishlist', requireAuth, (req, res) => {
    const me = req.session.username;

    const relUser = relUsers.getUser(relDb, me);
    ensureModerationFields(db.users[me]);
    const oldIds = db.users[me].wishlist || [];
    const relIds = relUser ? relUser.wishlist : [];
    const wishlistIds = [...new Set([...relIds, ...oldIds])];

    const items = wishlistIds.map(id => {
      const relWork = relWorks.getWork(relDb, id);
      if (relWork) {
        const owner = relUsers.getUser(relDb, relWork.owner) || db.users[relWork.owner];
        if (!owner) return null;
        return {
          id: relWork.id, title: relWork.title, type: relWork.type, status: relWork.status,
          price: relWork.price, currency: relWork.currency || 'UZS',
          image: relWork.images[0] || null, images: relWork.images, thumbs: relWork.thumbs,
          video: relWork.video || null, poster: relWork.poster || null,
          mediaType: relWork.mediaType || (relWork.video ? 'video' : 'image'),
          username: relWork.owner, fullname: owner.fullname || relWork.owner, avatar: owner.avatar || null,
          likesCount: relWork.likes.length, likedByMe: relWork.likes.includes(me), savedByMe: true
        };
      }

      const found = findWork(id);
      if (!found) return null;
      const { work: w, owner: uname } = found;
      const owner = db.users[uname];
      if (!owner) return null;
      const likes = Array.isArray(w.likes) ? w.likes : [];
      return {
        id: w.id, title: w.title, type: w.type, status: w.status, price: w.price,
        currency: w.currency || 'UZS', image: w.image, images: workImages(w), thumbs: workThumbs(w),
        video: w.video || null, poster: w.poster || null, mediaType: w.mediaType || (w.video ? 'video' : 'image'),
        username: uname, fullname: owner.fullname || uname, avatar: owner.avatar || null,
        likesCount: likes.length, likedByMe: likes.includes(me), savedByMe: true
      };
    }).filter(Boolean);

    res.json({ items });
  });

  return router;
}

module.exports = createWishlistCollectionsRouter;
