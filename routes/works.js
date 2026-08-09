/**
 * routes/works.js — asarlar (works) bilan bog'liq barcha rout'lar:
 * CRUD, lenta (feed), teglar, o'xshash asarlar, layklar, ko'rishlar,
 * sharhlar (reviews), kommentlar (server.js'dan ajratildi).
 *
 * Pattern routes/admin.js bilan bir xil: barcha bog'liqliklar `deps`
 * obyekti orqali aniq uzatiladi. `findWork` ATAYLAB server.js'da qoldirilgan
 * (u boshqa ko'plab, allaqachon ajratilgan modullar — admin/commerce/users/
 * wishlist-collections — tomonidan ham ishlatiladi), shu bois bu yerga ham
 * faqat REFERENS sifatida uzatiladi.
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');

function createWorksRouter(deps) {
  const {
    requireAuth, requireNotMuted, rateLimit,
    db, saveDB, fs,
    upload, multerErrCode,
    ALLOWED_VIDEO_MIMES, MAX_VIDEO_SECONDS, UPLOADS_DIR,
    parseTags,
    verifyImageFileOrDelete, getMp4DurationSeconds, transcodeVideoToMp4, extractVideoPoster, compressAndThumbnail,
    mirrorToRelationalDb, relDb, relUsers, relWorks, relReports,
    workImages, workThumbs,
    ensureReportsArray, findWork,
    addNotification, userWorkStats, orderHasCompletedItem
  } = deps;

  const router = express.Router();
  const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];

  router.post('/api/works/:id/report', requireAuth, rateLimit('report', 15, 10 * 60 * 1000), async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    ensureReportsArray();
    const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
    const report = {
      id: 'r' + Date.now() + crypto.randomBytes(4).toString('hex'),
      type: 'work',
      targetId: found.work.id,
      targetTitle: found.work.title,
      targetOwner: found.owner,
      reporter: req.session.username,
      reason,
      createdAt: new Date().toISOString(),
      status: 'open'
    };
    db.reports.push(report);
    await saveDB();
    mirrorToRelationalDb(() => relReports.createReport(relDb, report));
    res.json({ ok: true });
  });

  router.get('/api/works', requireAuth, (req, res) => {
    res.json({ works: db.works[req.session.username] || [] });
  });

  router.post('/api/works', requireAuth, requireNotMuted, (req, res) => {
    upload.array('images', 3)(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });
      if (!req.files || !req.files.length) return res.status(400).json({ error: 'Kamida bitta rasm yoki video talab qilinadi', code: 'mediaRequired' });

      const { title, type, status, price, currency, desc, stockMode: stockModeRaw, stockQty: stockQtyRaw, typeCustom: typeCustomRaw, tags: tagsRaw } = req.body || {};
      const cleanTitle = String(title || '').trim();
      if (!cleanTitle) {
        req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(400).json({ error: 'Asar nomi kiritilishi shart', code: 'titleRequired' });
      }
      const isSale = status === 'sale';
      const workType = ['rasm', 'haykal', 'mulaj', 'boshqa'].includes(type) ? type : 'boshqa';
      const typeCustom = workType === 'boshqa' ? String(typeCustomRaw || '').trim().slice(0, 60) : '';
      const tags = parseTags(tagsRaw);
      const stockMode = isSale && stockModeRaw === 'fixed' ? 'fixed' : 'order';
      let stockQty = null;
      if (isSale && stockMode === 'fixed') {
        const n = Math.floor(Number(stockQtyRaw));
        stockQty = Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 1;
      }

      const videoFile = req.files.find(f => ALLOWED_VIDEO_MIMES.includes(f.mimetype));
      const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/'));

      function rejectWithCleanup(status, message, code) {
        req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(status).json({ error: message, code });
      }

      for (const f of imageFiles) {
        if (!verifyImageFileOrDelete(f.path)) {
          return rejectWithCleanup(400, "Fayl ichidagi ma'lumot haqiqiy rasm formatiga mos kelmadi", 'invalidImageContent');
        }
      }

      if (videoFile) {
        if (req.files.length > 1) {
          return rejectWithCleanup(400, "Video bilan birga boshqa fayl yuklab bo'lmaydi — faqat bitta video tanlang", 'videoWithOtherFiles');
        }
        const durationSec = getMp4DurationSeconds(videoFile.path);
        if (durationSec !== null && durationSec > MAX_VIDEO_SECONDS) {
          return rejectWithCleanup(400, 'Video 10 soniyadan uzun bo\'lmasligi kerak', 'videoTooLong10s');
        }

        const transcodedFilename = crypto.randomBytes(14).toString('hex') + '.mp4';
        const transcodedPath = path.join(UPLOADS_DIR, transcodedFilename);
        const posterFilename = crypto.randomBytes(14).toString('hex') + '.jpg';

        try {
          await transcodeVideoToMp4(videoFile.path, transcodedPath);
          await extractVideoPoster(transcodedPath, UPLOADS_DIR, posterFilename);
        } catch (e) {
          fs.unlink(transcodedPath, () => {});
          fs.unlink(path.join(UPLOADS_DIR, posterFilename), () => {});
          return rejectWithCleanup(400, "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.", 'videoProcessingFailed');
        }

        fs.unlink(videoFile.path, () => {});

        const work = {
          id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
          title: cleanTitle.slice(0, 200),
          type: workType,
          typeCustom: typeCustom || undefined,
          status: isSale ? 'sale' : 'expo',
          price: isSale ? (Number(price) || 0) : 0,
          currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
          stockMode: isSale ? stockMode : null,
          stockQty: isSale ? stockQty : null,
          desc: String(desc || '').slice(0, 2000),
          tags,
          mediaType: 'video',
          video: '/uploads/' + transcodedFilename,
          poster: '/uploads/' + posterFilename,
          images: [],
          thumbs: [],
          image: null,
          createdAt: new Date().toISOString(),
          likes: [],
          comments: [],
          views: 0
        };
        const uname = req.session.username;
        if (!db.works[uname]) db.works[uname] = [];
        db.works[uname].push(work);
        await saveDB();
        mirrorToRelationalDb(() => relWorks.createWork(relDb, Object.assign({ owner: uname }, work)));
        return res.json({ work });
      }

      if (!imageFiles.length) return rejectWithCleanup(400, 'Kamida bitta rasm yoki video talab qilinadi', 'mediaRequired');

      let thumbs;
      try {
        thumbs = await Promise.all(imageFiles.map(f => compressAndThumbnail(f.path)));
      } catch (e) {
        thumbs = imageFiles.map(() => null);
      }
      const images = imageFiles.map(f => '/uploads/' + f.filename);
      const thumbImages = thumbs.map((t, i) => t ? '/uploads/' + t : images[i]);

      const work = {
        id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
        title: String(title || '').slice(0, 200),
        type: workType,
        typeCustom: typeCustom || undefined,
        status: isSale ? 'sale' : 'expo',
        price: isSale ? (Number(price) || 0) : 0,
        currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
        stockMode: isSale ? stockMode : null,
        stockQty: isSale ? stockQty : null,
        desc: String(desc || '').slice(0, 2000),
        tags,
        mediaType: 'image',
        video: null,
        images,
        thumbs: thumbImages,
        image: images[0],
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        views: 0
      };

      const uname = req.session.username;
      if (!db.works[uname]) db.works[uname] = [];
      db.works[uname].push(work);
      await saveDB();
      mirrorToRelationalDb(() => relWorks.createWork(relDb, Object.assign({ owner: uname }, work)));
      res.json({ work });
    });
  });

  router.delete('/api/works/:id', requireAuth, async (req, res) => {
    const uname = req.session.username;
    const list = db.works[uname] || [];
    const work = list.find(w => w.id === req.params.id);
    db.works[uname] = list.filter(w => w.id !== req.params.id);
    await saveDB();
    if (work) mirrorToRelationalDb(() => relWorks.deleteWork(relDb, work.id));
    if (work) {
      workImages(work).forEach(img => fs.unlink(path.join(__dirname, '..', img), () => {}));
      if (Array.isArray(work.thumbs)) {
        work.thumbs.forEach(img => {
          if (img && !workImages(work).includes(img)) fs.unlink(path.join(__dirname, '..', img), () => {});
        });
      }
      if (work.video) fs.unlink(path.join(__dirname, '..', work.video), () => {});
      if (work.poster) fs.unlink(path.join(__dirname, '..', work.poster), () => {});
    }
    res.json({ ok: true });
  });

  router.patch('/api/works/:id/status', requireAuth, requireNotMuted, async (req, res) => {
    const uname = req.session.username;
    const list = db.works[uname] || [];
    const work = list.find(w => w.id === req.params.id);
    if (!work) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });

    const { status, price, currency, stockMode: stockModeRaw, stockQty: stockQtyRaw } = req.body || {};
    if (status !== 'sale' && status !== 'expo') {
      return res.status(400).json({ error: "Holat noto'g'ri", code: 'invalidStatus' });
    }
    const isSale = status === 'sale';

    const stockModeProvided = stockModeRaw !== undefined;
    let stockMode = null;
    let stockQty = null;
    if (isSale) {
      if (stockModeProvided) {
        stockMode = stockModeRaw === 'fixed' ? 'fixed' : 'order';
      } else {
        stockMode = work.status === 'sale' && work.stockMode === 'fixed' ? 'fixed' : (work.status === 'sale' ? (work.stockMode || 'order') : 'order');
      }
      if (stockMode === 'fixed') {
        if (stockModeProvided) {
          const n = Math.floor(Number(stockQtyRaw));
          stockQty = Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : (typeof work.stockQty === 'number' ? work.stockQty : 1);
        } else {
          stockQty = typeof work.stockQty === 'number' ? work.stockQty : 1;
        }
      }
    }

    work.status = isSale ? 'sale' : 'expo';
    work.price = isSale ? (Number(price) || 0) : 0;
    work.currency = isSale && CURRENCIES.includes(currency) ? currency : (work.currency || 'UZS');
    work.stockMode = stockMode;
    work.stockQty = stockQty;

    await saveDB();
    mirrorToRelationalDb(() => relWorks.updateWorkStatus(relDb, work.id, {
      status: work.status, price: work.price, currency: work.currency,
      stockMode: work.stockMode, stockQty: work.stockQty
    }));
    res.json({ work });
  });

  router.get('/api/works/:id/similar', (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work: target } = found;
    const targetTags = new Set(Array.isArray(target.tags) ? target.tags : []);
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

    const scored = [];
    for (const uname of Object.keys(db.works)) {
      const u = db.users[uname];
      if (!u) continue;
      for (const w of db.works[uname] || []) {
        if (w.id === target.id) continue;
        const wTags = Array.isArray(w.tags) ? w.tags : [];
        const overlap = wTags.filter(t => targetTags.has(t)).length;
        const sameType = w.type === target.type ? 1 : 0;
        const score = overlap * 3 + sameType;
        if (score <= 0) continue;
        scored.push({ w, uname, u, score });
      }
    }
    scored.sort((a, b) => b.score - a.score || new Date(b.w.createdAt) - new Date(a.w.createdAt));

    const items = scored.slice(0, limit).map(({ w, uname, u }) => {
      const likes = Array.isArray(w.likes) ? w.likes : [];
      return {
        id: w.id,
        title: w.title,
        type: w.type,
        price: w.price,
        currency: w.currency || 'UZS',
        status: w.status,
        image: w.image,
        images: workImages(w),
        thumbs: workThumbs(w),
        video: w.video || null,
        poster: w.poster || null,
        mediaType: w.mediaType || (w.video ? 'video' : 'image'),
        username: uname,
        fullname: u.fullname || uname,
        avatar: u.avatar || null,
        likesCount: likes.length
      };
    });
    res.json({ items });
  });

  router.get('/api/tags', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const counts = new Map();
    for (const works of Object.values(db.works || {})) for (const w of (works || [])) for (const raw of (Array.isArray(w.tags) ? w.tags : [])) {
      const tag = String(raw).trim(); if (!tag || (q && !tag.toLowerCase().includes(q))) continue;
      const key = tag.toLowerCase(); counts.set(key, (counts.get(key) || 0) + 1);
    }
    const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([tag]) => tag);
    res.json({ tags });
  });

  let feedTrustedCache = {};
  function feedItemFromRelWork(w, me, meUser) {
    const ratingStats = relWorks.averageRating(relDb, w.id);
    if (!(w.owner in feedTrustedCache)) feedTrustedCache[w.owner] = userWorkStats(w.owner).trustedSeller;
    return {
      id: w.id,
      title: w.title,
      type: w.type,
      typeCustom: w.typeCustom || null,
      tags: w.tags,
      status: w.status,
      price: w.price,
      currency: w.currency || 'UZS',
      stockMode: w.stockMode || null,
      stockQty: (typeof w.stockQty === 'number') ? w.stockQty : null,
      desc: w.desc,
      image: w.images[0] || null,
      images: w.images,
      thumbs: w.thumbs,
      video: w.video || null,
      poster: w.poster || null,
      mediaType: w.mediaType || (w.video ? 'video' : 'image'),
      createdAt: w.createdAt,
      username: w.owner,
      fullname: (relUsers.getUser(relDb, w.owner) || db.users[w.owner] || {}).fullname || w.owner,
      avatar: (relUsers.getUser(relDb, w.owner) || db.users[w.owner] || {}).avatar || null,
      trustedSeller: feedTrustedCache[w.owner],
      likesCount: w.likes.length,
      likedByMe: w.likes.includes(me),
      inCart: !!(meUser && meUser.cart && Object.prototype.hasOwnProperty.call(meUser.cart, w.id)),
      savedByMe: !!(meUser && Array.isArray(meUser.wishlist) && meUser.wishlist.includes(w.id)),
      commentsCount: relWorks.commentsCount(relDb, w.id),
      avgRating: Math.round(ratingStats.average * 10) / 10,
      ratingCount: ratingStats.count,
      viewsCount: w.views,
      isFollowing: !!(meUser && Array.isArray(meUser.following) && meUser.following.includes(w.owner))
    };
  }

  router.get('/api/feed', (req, res) => {
    feedTrustedCache = {};
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const me = req.session.username;
    const meUser = me && db.users[me];

    const q = String(req.query.q || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const tagFilter = String(req.query.tag || '').trim().toLowerCase();
    const onlyFollowing = req.query.following === '1' || req.query.following === 'true';
    const sort = String(req.query.sort || 'new').trim().toLowerCase();
    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : null;

    if (onlyFollowing && !meUser) return res.json({ items: [], hasMore: false, total: 0 });
    const followingSet = onlyFollowing ? new Set(meUser.following || []) : null;

    const relResult = relWorks.queryFeed(relDb, {
      status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      type: type || undefined,
      ownerIn: onlyFollowing ? [...followingSet] : undefined,
      search: q || undefined,
      tag: tagFilter || undefined,
      minPrice, maxPrice,
      sort: sort === 'top' ? 'popular' : 'new',
      limit: 100000, offset: 0
    });
    const relIds = new Set(relResult.items.map(w => w.id));

    const all = relResult.items.map(w => feedItemFromRelWork(w, me, meUser));

    const trustedCache = {};
    for (const uname of Object.keys(db.works)) {
      const u = db.users[uname];
      if (!u) continue;
      if (onlyFollowing && !followingSet.has(uname)) continue;
      for (const w of db.works[uname] || []) {
        if (relIds.has(w.id)) continue;
        if (type && type !== 'all' && w.type !== type) continue;
        if (statusFilter && statusFilter !== 'all' && w.status !== statusFilter) continue;
        const workTags = Array.isArray(w.tags) ? w.tags : [];
        if (tagFilter && !workTags.includes(tagFilter)) continue;
        if ((minPrice !== null || maxPrice !== null)) {
          if (w.status !== 'sale') continue;
          if (minPrice !== null && !Number.isNaN(minPrice) && (w.price || 0) < minPrice) continue;
          if (maxPrice !== null && !Number.isNaN(maxPrice) && (w.price || 0) > maxPrice) continue;
        }
        if (q) {
          const hay = (w.title + ' ' + (w.desc || '') + ' ' + (u.fullname || '') + ' ' + uname + ' ' + workTags.join(' ')).toLowerCase();
          if (!hay.includes(q)) continue;
        }
        const likes = Array.isArray(w.likes) ? w.likes : [];
        const comments = Array.isArray(w.comments) ? w.comments : [];
        const reviews = Array.isArray(w.reviews) ? w.reviews : [];
        const ratingSum = reviews.reduce((s, r) => s + r.rating, 0);
        if (!(uname in trustedCache)) trustedCache[uname] = userWorkStats(uname).trustedSeller;
        all.push({
          id: w.id,
          title: w.title,
          type: w.type,
          typeCustom: w.typeCustom || null,
          tags: workTags,
          status: w.status,
          price: w.price,
          currency: w.currency || 'UZS',
          stockMode: w.stockMode || null,
          stockQty: (typeof w.stockQty === 'number') ? w.stockQty : null,
          desc: w.desc,
          image: w.image,
          images: workImages(w),
          thumbs: workThumbs(w),
          video: w.video || null,
          poster: w.poster || null,
          mediaType: w.mediaType || (w.video ? 'video' : 'image'),
          createdAt: w.createdAt,
          username: uname,
          fullname: u.fullname || uname,
          avatar: u.avatar || null,
          trustedSeller: trustedCache[uname],
          likesCount: likes.length,
          likedByMe: likes.includes(me),
          inCart: !!(meUser && meUser.cart && Object.prototype.hasOwnProperty.call(meUser.cart, w.id)),
          savedByMe: !!(meUser && Array.isArray(meUser.wishlist) && meUser.wishlist.includes(w.id)),
          commentsCount: comments.length,
          avgRating: reviews.length ? Math.round((ratingSum / reviews.length) * 10) / 10 : 0,
          ratingCount: reviews.length,
          viewsCount: Number(w.views) || 0,
          isFollowing: !!(meUser && Array.isArray(meUser.following) && meUser.following.includes(uname))
        });
      }
    }
    if (sort === 'top') {
      all.sort((a, b) => (b.likesCount - a.likesCount) || (new Date(b.createdAt) - new Date(a.createdAt)));
    } else {
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const page = all.slice(offset, offset + limit);
    res.json({ items: page, hasMore: offset + limit < all.length, total: all.length });
  });

  router.post('/api/works/:id/like', requireAuth, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work, owner } = found;
    if (!Array.isArray(work.likes)) work.likes = [];

    const me = req.session.username;
    const idx = work.likes.indexOf(me);
    let liked;
    if (idx === -1) {
      work.likes.push(me);
      liked = true;
      if (owner !== me) {
        addNotification(owner, { type: 'like', from: me, workId: work.id, workTitle: work.title });
      }
    }
    else { work.likes.splice(idx, 1); liked = false; }

    await saveDB();
    mirrorToRelationalDb(() => relWorks.toggleLike(relDb, work.id, me));
    res.json({ liked, likesCount: work.likes.length });
  });

  router.post('/api/works/:id/view', rateLimit('view', 120, 60 * 1000), async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work } = found;

    const today = new Date().toISOString().slice(0, 10);
    if (!req.session.viewedWorks || typeof req.session.viewedWorks !== 'object') {
      req.session.viewedWorks = {};
    }
    for (const wid of Object.keys(req.session.viewedWorks)) {
      if (req.session.viewedWorks[wid] !== today) delete req.session.viewedWorks[wid];
    }

    const alreadyViewedToday = req.session.viewedWorks[work.id] === today;
    if (!alreadyViewedToday) {
      work.views = (Number(work.views) || 0) + 1;
      req.session.viewedWorks[work.id] = today;
      await saveDB();
      mirrorToRelationalDb(() => relWorks.incrementViews(relDb, work.id));
    }
    res.json({ viewsCount: work.views, counted: !alreadyViewedToday });
  });

  router.get('/api/works/:id/reviews', (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const list = Array.isArray(found.work.reviews) ? found.work.reviews : [];
    const items = list.map(r => {
      const u = db.users[r.username];
      return {
        id: r.id,
        rating: r.rating,
        text: r.text,
        username: r.username,
        fullname: (u && u.fullname) || r.username,
        createdAt: r.createdAt
      };
    });
    const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
    res.json({ items, avg: Math.round(avg * 10) / 10, count: items.length });
  });

  router.post('/api/works/:id/reviews', requireAuth, requireNotMuted, rateLimit('review', 20, 60 * 60 * 1000), async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work, owner } = found;
    const me = req.session.username;
    if (owner === me) return res.status(400).json({ error: "O'z asaringizga sharh yoza olmaysiz", code: 'cannotReviewOwn' });

    const hasCompletedOrder = db.orders.some(o => orderHasCompletedItem(o, me, work.id));
    if (!hasCompletedOrder) {
      return res.status(403).json({ error: 'Faqat xarid yakunlangandan so\'ng sharh qoldirish mumkin', code: 'purchaseRequired' });
    }

    if (!Array.isArray(work.reviews)) work.reviews = [];
    if (work.reviews.some(r => r.username === me)) {
      return res.status(409).json({ error: 'Siz bu asarga allaqachon sharh qoldirgansiz', code: 'reviewAlreadyExists' });
    }

    const rating = Math.round(Number((req.body && req.body.rating) || 0));
    if (!(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lishi kerak", code: 'invalidRating' });
    }
    const text = String((req.body && req.body.text) || '').trim().slice(0, 500);

    const review = {
      id: 'rv' + Date.now() + crypto.randomBytes(4).toString('hex'),
      username: me,
      rating,
      text,
      createdAt: new Date().toISOString()
    };
    work.reviews.push(review);
    addNotification(owner, { type: 'review', from: me, workId: work.id, workTitle: work.title, rating });
    await saveDB();
    mirrorToRelationalDb(() => relWorks.addReview(relDb, work.id, review));
    res.json({ review });
  });

  router.get('/api/works/:id/comments', (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const list = Array.isArray(found.work.comments) ? found.work.comments : [];
    const items = list.map(c => {
      const u = db.users[c.username];
      return {
        id: c.id,
        text: c.text,
        username: c.username,
        fullname: (u && u.fullname) || c.username,
        createdAt: c.createdAt
      };
    });
    res.json({ items });
  });

  router.post('/api/works/:id/comments', requireAuth, requireNotMuted, rateLimit('comment', 30, 60 * 1000), async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work } = found;

    const text = String((req.body && req.body.text) || '').trim().slice(0, 500);
    if (!text) return res.status(400).json({ error: 'Koment matni bo\'sh bo\'lishi mumkin emas', code: 'commentEmpty' });

    if (!Array.isArray(work.comments)) work.comments = [];
    const me = req.session.username;
    const comment = {
      id: 'c' + Date.now() + crypto.randomBytes(4).toString('hex'),
      username: me,
      text,
      createdAt: new Date().toISOString()
    };
    work.comments.push(comment);
    const u = db.users[me];
    if (found.owner !== me) {
      addNotification(found.owner, { type: 'comment', from: me, workId: work.id, workTitle: work.title, commentId: comment.id });
    }
    await saveDB();
    mirrorToRelationalDb(() => relWorks.addComment(relDb, work.id, comment));

    res.json({
      comment: {
        id: comment.id,
        text: comment.text,
        username: comment.username,
        fullname: (u && u.fullname) || me,
        createdAt: comment.createdAt
      },
      commentsCount: work.comments.length
    });
  });

  router.delete('/api/works/:id/comments/:commentId', requireAuth, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work } = found;
    if (!Array.isArray(work.comments)) work.comments = [];

    const me = req.session.username;
    const idx = work.comments.findIndex(c => c.id === req.params.commentId);
    if (idx === -1) return res.status(404).json({ error: 'Koment topilmadi', code: 'commentNotFound' });

    const comment = work.comments[idx];
    const isOwner = comment.username === me;
    const isWorkOwner = found.owner === me;
    if (!isOwner && !isWorkOwner) {
      return res.status(403).json({ error: "Bu komentni o'chirishga ruxsatingiz yo'q", code: 'commentDeleteForbidden' });
    }

    work.comments.splice(idx, 1);
    await saveDB();
    mirrorToRelationalDb(() => relWorks.deleteComment(relDb, comment.id));
    res.json({ ok: true, commentsCount: work.comments.length });
  });

  return router;
}

module.exports = createWorksRouter;
