/**
 * routes/admin.js — administrator paneli uchun barcha rout'lar
 * (server.js'dan ajratildi).
 *
 * Bu modul ATAYLAB "sof" Express Router EMAS — u `createAdminRouter(deps)`
 * FABRIKA funksiyasi orqali eksport qilinadi. Sabab: server.js'dagi
 * rout'lar ko'plab umumiy holatga (db, saveDB, relDb, ...) va yordamchi
 * funksiyalarga bog'liq edi — bular avval ODDIY YOPILISH (closure) orqali
 * "sehrli" tarzda ko'rinardi. Bu yerda esa BARCHA bog'liqliklar `deps`
 * obyekti orqali ANIQ, ko'zga ko'rinadigan tarzda uzatiladi.
 *
 * `db` va `relDb` — MUTATSIYA QILINADIGAN obyekt/ulanish REFERENSLARI
 * (server.js'da hech qachon qayta tayinlanmaydi, faqat ichidagi
 * xususiyatlar o'zgaradi) — shuning uchun bu yerga bir marta uzatilgan
 * referens har doim eng so'nggi holatni aks ettiradi.
 */

const express = require('express');
const path = require('path');

function createAdminRouter(deps) {
  const {
    requireAuth, requireAdmin,
    db, saveDB,
    ensureModerationFields, refreshModeration, parseModerationMinutes,
    isUserOnline, getLastSeen,
    findWork, workImages,
    ensureReportsArray, purgeResolvedReports,
    addNotification,
    mirrorToRelationalDb, relDb, relUsers, relWorks, relReports,
    fs
  } = deps;

  const router = express.Router();

  router.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    let dirty = false;
    const list = Object.keys(db.users).map(uname => {
      const u = db.users[uname];
      ensureModerationFields(u);
      if (refreshModeration(u, uname)) dirty = true;
      return {
        username: uname,
        fullname: u.fullname || '',
        email: u.email || '',
        avatar: u.avatar || null,
        isAdmin: !!u.isAdmin,
        isOnline: isUserOnline(uname),
        lastSeenAt: getLastSeen(uname),
        joined: u.joined,
        worksCount: (db.works[uname] || []).length,
        bannedUntil: u.moderation.bannedUntil,
        banReason: u.moderation.banReason,
        mutedUntil: u.moderation.mutedUntil,
        muteReason: u.moderation.muteReason
      };
    }).sort((a, b) => new Date(b.joined) - new Date(a.joined));
    if (dirty) await saveDB();
    res.json({ items: list });
  });

  router.post('/api/admin/users/:username/ban', requireAuth, requireAdmin, async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const u = db.users[target];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (target === req.session.username) return res.status(400).json({ error: "O'zingizni ban qila olmaysiz", code: 'cannotBanSelf' });
    ensureModerationFields(u);
    if (u.isAdmin) return res.status(400).json({ error: "Administratorni ban qila olmaysiz", code: 'cannotBanAdmin' });

    const minutes = parseModerationMinutes(req.body);
    const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
    const until = new Date(Date.now() + minutes * 60000).toISOString();
    u.moderation.bannedUntil = until;
    u.moderation.banReason = reason;
    mirrorToRelationalDb(() => relUsers.setModeration(relDb, target, u.moderation));

    addNotification(target, { type: 'ban', until, reason });

    await saveDB();
    res.json({ ok: true, bannedUntil: until });
  });

  router.post('/api/admin/users/:username/unban', requireAuth, requireAdmin, async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const u = db.users[target];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

    ensureModerationFields(u);
    const wasBanned = !!u.moderation.bannedUntil;
    u.moderation.bannedUntil = null;
    u.moderation.banReason = '';
    mirrorToRelationalDb(() => relUsers.setModeration(relDb, target, u.moderation));

    if (wasBanned) {
      addNotification(target, { type: 'unban' });
    }

    await saveDB();
    res.json({ ok: true });
  });

  router.post('/api/admin/users/:username/mute', requireAuth, requireAdmin, async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const u = db.users[target];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (target === req.session.username) return res.status(400).json({ error: "O'zingizni mut qila olmaysiz", code: 'cannotMuteSelf' });
    ensureModerationFields(u);
    if (u.isAdmin) return res.status(400).json({ error: "Administratorni mut qila olmaysiz", code: 'cannotMuteAdmin' });

    const minutes = parseModerationMinutes(req.body);
    const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
    const until = new Date(Date.now() + minutes * 60000).toISOString();
    u.moderation.mutedUntil = until;
    u.moderation.muteReason = reason;
    mirrorToRelationalDb(() => relUsers.setModeration(relDb, target, u.moderation));

    addNotification(target, { type: 'mute', until, reason });

    await saveDB();
    res.json({ ok: true, mutedUntil: until });
  });

  router.post('/api/admin/users/:username/unmute', requireAuth, requireAdmin, async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const u = db.users[target];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

    ensureModerationFields(u);
    const wasMuted = !!u.moderation.mutedUntil;
    u.moderation.mutedUntil = null;
    u.moderation.muteReason = '';
    mirrorToRelationalDb(() => relUsers.setModeration(relDb, target, u.moderation));

    if (wasMuted) {
      addNotification(target, { type: 'unmute' });
    }

    await saveDB();
    res.json({ ok: true });
  });

  /* MIGRATSIYA IZOHI: userWorkStats() kabi, bu yerda ham ATAYLAB eski
     qatlamdan (db.users/db.works/db.orders) o'qiladi — u hamon YOZISH
     uchun ASOSIY manba, shuning uchun hisob-kitob allaqachon to'liq. */
  router.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
    ensureReportsArray();
    const usernames = Object.keys(db.users);
    const totalWorks = Object.keys(db.works).reduce((s, u) => s + (db.works[u] || []).length, 0);
    const openReports = db.reports.filter(r => r.status === 'open').length;
    const bannedCount = usernames.filter(u => {
      const mod = db.users[u].moderation;
      return mod && mod.bannedUntil && new Date(mod.bannedUntil).getTime() > Date.now();
    }).length;
    res.json({
      totalUsers: usernames.length,
      totalWorks,
      totalOrders: db.orders.length,
      openReports,
      bannedCount
    });
  });

  router.get('/api/admin/analytics', requireAuth, requireAdmin, (req, res) => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const usernames = Object.keys(db.users);

    let dau = 0, wau = 0, mau = 0;
    for (const uname of usernames) {
      const seen = getLastSeen(uname);
      if (!seen) continue;
      const age = now - seen;
      if (age <= DAY) dau++;
      if (age <= 7 * DAY) wau++;
      if (age <= 30 * DAY) mau++;
    }

    const salesByCurrency = {};
    const sellerRevenue = {};
    for (const order of db.orders) {
      const isPaid = order.paymentStatus === 'paid' || (!order.paymentMethod || order.paymentMethod === 'manual') && order.status !== 'cancelled';
      for (const currency of Object.keys(order.totalsByCurrency || {})) {
        const amount = order.totalsByCurrency[currency] || 0;
        if (!salesByCurrency[currency]) salesByCurrency[currency] = { paidTotal: 0, paidCount: 0, allTotal: 0, allCount: 0 };
        salesByCurrency[currency].allTotal += amount;
        salesByCurrency[currency].allCount += 1;
        if (isPaid) {
          salesByCurrency[currency].paidTotal += amount;
          salesByCurrency[currency].paidCount += 1;
        }
      }
      const sellersInOrder = [...new Set((order.items || []).map(it => it.sellerUsername))];
      for (const seller of sellersInOrder) {
        if (!sellerRevenue[seller]) sellerRevenue[seller] = { revenueByCurrency: {}, ordersCount: 0, paidOrdersCount: 0 };
        sellerRevenue[seller].ordersCount += 1;
        if (isPaid) sellerRevenue[seller].paidOrdersCount += 1;
        for (const item of (order.items || [])) {
          if (item.sellerUsername !== seller) continue;
          const cur = item.currency || 'UZS';
          const amt = (Number(item.price) || 0) * (Number(item.qty) || 1);
          sellerRevenue[seller].revenueByCurrency[cur] = (sellerRevenue[seller].revenueByCurrency[cur] || 0) + amt;
        }
      }
    }
    const topSellers = Object.keys(sellerRevenue)
      .map(uname => ({ username: uname, ...sellerRevenue[uname] }))
      .sort((a, b) => {
        const aMax = Math.max(0, ...Object.values(a.revenueByCurrency));
        const bMax = Math.max(0, ...Object.values(b.revenueByCurrency));
        return bMax - aMax;
      })
      .slice(0, 10);

    const days = 14;
    const growth = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * DAY); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + DAY);
      const dateStr = dayStart.toISOString().slice(0, 10);

      let newUsers = 0;
      for (const uname of usernames) {
        const joined = new Date(db.users[uname].joined).getTime();
        if (joined >= dayStart.getTime() && joined < dayEnd.getTime()) newUsers++;
      }
      let newWorks = 0;
      for (const uname of Object.keys(db.works)) {
        for (const w of (db.works[uname] || [])) {
          const created = new Date(w.createdAt).getTime();
          if (created >= dayStart.getTime() && created < dayEnd.getTime()) newWorks++;
        }
      }
      let ordersCount = 0;
      let revenueUZS = 0;
      for (const order of db.orders) {
        const created = new Date(order.createdAt).getTime();
        if (created >= dayStart.getTime() && created < dayEnd.getTime()) {
          ordersCount++;
          revenueUZS += (order.totalsByCurrency && order.totalsByCurrency.UZS) || 0;
        }
      }
      growth.push({ date: dateStr, newUsers, newWorks, ordersCount, revenueUZS });
    }

    res.json({ dau, wau, mau, salesByCurrency, topSellers, growth, totalUsers: usernames.length, totalOrders: db.orders.length });
  });

  router.get('/api/admin/reports', requireAuth, requireAdmin, async (req, res) => {
    ensureReportsArray();
    if (purgeResolvedReports()) await saveDB();
    const items = db.reports.slice().reverse().map(r => {
      let targetImage = null;
      let targetExists = true;
      if (r.type === 'work') {
        const found = findWork(r.targetId);
        if (found) targetImage = workImages(found.work)[0] || null;
        else targetExists = false;
      } else if (r.type === 'user') {
        targetExists = !!db.users[r.targetId];
      }
      return Object.assign({}, r, {
        reporterFullname: (db.users[r.reporter] && db.users[r.reporter].fullname) || r.reporter,
        targetImage,
        targetExists
      });
    });
    res.json({ items });
  });

  router.post('/api/admin/reports/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
    ensureReportsArray();
    const r = db.reports.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: 'Shikoyat topilmadi', code: 'reportNotFound' });
    r.status = 'resolved';
    r.resolvedBy = req.session.username;
    r.resolvedAt = new Date().toISOString();
    await saveDB();
    mirrorToRelationalDb(() => relReports.resolveReport(relDb, r.id, r.resolvedBy));
    res.json({ ok: true });
  });

  /* Admin: shikoyat qilingan asarni (suratni) butunlay o'chirish */
  router.delete('/api/admin/works/:id', requireAuth, requireAdmin, async (req, res) => {
    const found = findWork(req.params.id);
    if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
    const { work, owner } = found;
    db.works[owner] = (db.works[owner] || []).filter(w => w.id !== work.id);
    workImages(work).forEach(img => fs.unlink(path.join(__dirname, '..', img), () => {}));
    mirrorToRelationalDb(() => relWorks.deleteWork(relDb, work.id));

    ensureReportsArray();
    const resolvedNow = [];
    db.reports.forEach(r => {
      if (r.type === 'work' && r.targetId === work.id && r.status === 'open') {
        r.status = 'resolved';
        r.resolvedBy = req.session.username;
        r.resolvedAt = new Date().toISOString();
        r.action = 'deleted';
        resolvedNow.push(r);
      }
    });

    await saveDB();
    // MUHIM (avval e'tibordan chetda qolgan bo'shliq): asar o'chirilganda
    // avtomatik yopilgan shikoyatlarni ham relyatsion bazaga dublikat
    // qilamiz — avval bu yo'l butunlay migratsiya qilinmagan edi.
    for (const r of resolvedNow) {
      mirrorToRelationalDb(() => relReports.resolveReport(relDb, r.id, r.resolvedBy));
    }

    res.json({ ok: true });
  });

  return router;
}

module.exports = createAdminRouter;
