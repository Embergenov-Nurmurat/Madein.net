/**
 * routes/users.js — profil boshqaruvi, ochiq foydalanuvchi profili,
 * obuna (follow) va foydalanuvchi haqida shikoyat rout'lari
 * (server.js'dan ajratildi).
 *
 * Pattern routes/admin.js bilan bir xil: barcha bog'liqliklar `deps`
 * obyekti orqali aniq uzatiladi.
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');

function createUsersRouter(deps) {
  const {
    requireAuth, rateLimit,
    db, saveDB, bcrypt, fs,
    isValidUsername, renameUsernameEverywhere,
    mirrorToRelationalDb, relDb, relUsers, relReports,
    publicUser, publicProfile,
    upload, multerErrCode,
    workImages, workThumbs,
    ensureModerationFields, ensureReportsArray,
    addNotification, countFollowers
  } = deps;

  const router = express.Router();

  router.put('/api/profile', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    const { fullname, email, bio, phone, social, privacy, callPrivacy } = req.body || {};
    if (fullname !== undefined) u.fullname = String(fullname).slice(0, 100);
    if (email !== undefined) u.email = String(email).slice(0, 150);
    if (bio !== undefined) u.bio = String(bio).slice(0, 500);
    if (phone !== undefined) u.phone = String(phone).slice(0, 40);
    if (social !== undefined) u.social = String(social).slice(0, 300);
    if (privacy && typeof privacy === 'object') {
      u.privacy = Object.assign({ phone: true, social: true, email: false }, u.privacy || {}, {
        phone: !!privacy.phone,
        social: !!privacy.social,
        email: !!privacy.email
      });
    }
    if (callPrivacy && typeof callPrivacy === 'object') {
      const mode = ['everyone', 'nobody', 'selected'].includes(callPrivacy.mode) ? callPrivacy.mode : 'everyone';
      let allowed = [];
      if (Array.isArray(callPrivacy.allowed)) {
        const me = req.session.username;
        allowed = [...new Set(callPrivacy.allowed
          .map(x => String(x || '').trim().toLowerCase())
          .filter(x => x && x !== me && db.users[x]))]
          .slice(0, 100);
      }
      u.callPrivacy = { mode, allowed };
    }
    await saveDB();

    mirrorToRelationalDb(() => {
      relUsers.updateUserFields(relDb, req.session.username, {
        fullname: u.fullname, email: u.email, bio: u.bio, phone: u.phone,
        social: u.social, privacy: u.privacy
      });
      if (callPrivacy && typeof callPrivacy === 'object') {
        relUsers.setCallPrivacy(relDb, req.session.username, u.callPrivacy);
      }
    });

    res.json({ user: publicUser(req.session.username) });
  });

  router.put('/api/profile/credentials', rateLimit('credentials', 10, 10 * 60 * 1000), requireAuth, async (req, res) => {
    const me = req.session.username;
    const u = db.users[me];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

    const { newUsername, currentPassword, newPassword } = req.body || {};
    const wantsUsernameChange = newUsername !== undefined && String(newUsername || '').trim() !== '';
    const wantsPasswordChange = newPassword !== undefined && String(newPassword || '') !== '';

    if (!wantsUsernameChange && !wantsPasswordChange) {
      return res.status(400).json({ error: 'Hech narsa o\'zgartirilmadi', code: 'noChanges' });
    }

    if (!currentPassword) {
      return res.status(400).json({ error: 'Davom etish uchun joriy parolingizni kiriting', code: 'currentPasswordRequired' });
    }
    const passwordOk = await bcrypt.compare(String(currentPassword), u.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Joriy parol noto\'g\'ri', code: 'currentPasswordIncorrect' });
    }

    let uname = me;
    if (wantsUsernameChange) {
      const candidate = String(newUsername).trim().toLowerCase().replace(/\s+/g, '_');
      if (!isValidUsername(candidate)) {
        return res.status(400).json({ error: 'Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo\'lishi kerak', code: 'usernameInvalid' });
      }
      if (candidate !== me) {
        if (db.users[candidate]) {
          return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band', code: 'usernameTaken' });
        }
        renameUsernameEverywhere(me, candidate);
        mirrorToRelationalDb(() => relUsers.renameUser(relDb, me, candidate));
        uname = candidate;
        req.session.username = candidate;
      }
    }

    if (wantsPasswordChange) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak', code: 'passwordTooShort' });
      }
      db.users[uname].passwordHash = await bcrypt.hash(String(newPassword), 10);
      mirrorToRelationalDb(() => {
        relUsers.updateUserFields(relDb, uname, { passwordHash: db.users[uname].passwordHash });
      });
    }

    await saveDB();
    res.json({ user: publicUser(uname) });
  });

  router.post('/api/profile/avatar', requireAuth, (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });
      if (!req.file) return res.status(400).json({ error: 'Rasm talab qilinadi', code: 'imageRequired' });

      try {
        const buf = await sharp(req.file.path)
          .rotate()
          .resize({ width: 400, height: 400, fit: 'cover' })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
        fs.writeFileSync(req.file.path, buf);
      } catch (e) { /* siqib bo'lmasa, asl faylni qoldiramiz */ }

      const u = db.users[req.session.username];
      const oldAvatar = u.avatar;
      u.avatar = '/uploads/' + req.file.filename;
      await saveDB();

      if (oldAvatar) {
        fs.unlink(path.join(__dirname, '..', oldAvatar), () => {});
      }
      res.json({ user: publicUser(req.session.username) });
    });
  });

  router.get('/api/users/:username', (req, res) => {
    const uname = String(req.params.username || '').trim().toLowerCase();
    if (!db.users[uname]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

    const viewer = req.session && req.session.username;
    const profile = publicProfile(uname, viewer);

    const works = (db.works[uname] || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(w => ({
        id: w.id,
        title: w.title,
        type: w.type,
        typeCustom: w.typeCustom || null,
        status: w.status,
        price: w.price,
        currency: w.currency || 'UZS',
        stockMode: w.stockMode || null,
        stockQty: (typeof w.stockQty === 'number') ? w.stockQty : null,
        desc: w.desc,
        image: w.image,
        images: workImages(w),
        thumbs: workThumbs(w),
        createdAt: w.createdAt,
        likesCount: Array.isArray(w.likes) ? w.likes.length : 0,
        commentsCount: Array.isArray(w.comments) ? w.comments.length : 0
      }));

    res.json({ profile, works });
  });

  router.post('/api/users/:username/follow', requireAuth, async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const me = req.session.username;
    if (target === me) return res.status(400).json({ error: "O'zingizga obuna bo'la olmaysiz", code: 'cannotFollowSelf' });
    if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

    const u = db.users[me];
    ensureModerationFields(u);
    const idx = u.following.indexOf(target);
    let following;
    if (idx === -1) {
      u.following.push(target);
      following = true;
      addNotification(target, { type: 'follow', from: me });
      mirrorToRelationalDb(() => relUsers.follow(relDb, me, target));
    } else {
      u.following.splice(idx, 1);
      following = false;
      mirrorToRelationalDb(() => relUsers.unfollow(relDb, me, target));
    }
    await saveDB();
    res.json({ following, followersCount: countFollowers(target) });
  });

  router.get('/api/users/:username/followers', (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    const items = Object.keys(db.users)
      .filter(uname => Array.isArray(db.users[uname].following) && db.users[uname].following.includes(target))
      .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
    res.json({ items });
  });

  router.get('/api/users/:username/following', (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    const u = db.users[target];
    if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    ensureModerationFields(u);
    const items = (u.following || [])
      .filter(uname => db.users[uname])
      .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
    res.json({ items });
  });

  router.post('/api/users/:username/report', requireAuth, rateLimit('report', 15, 10 * 60 * 1000), async (req, res) => {
    const target = String(req.params.username || '').trim().toLowerCase();
    if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    ensureReportsArray();
    const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
    const report = {
      id: 'r' + Date.now() + crypto.randomBytes(4).toString('hex'),
      type: 'user',
      targetId: target,
      targetTitle: db.users[target].fullname || target,
      targetOwner: target,
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

  router.get('/api/seller/stats', requireAuth, (req, res) => {
    const me = req.session.username;
    const works = db.works[me] || [];

    let totalViews = 0, totalLikes = 0, totalComments = 0;
    const perWork = works.map(w => {
      const likes = Array.isArray(w.likes) ? w.likes.length : 0;
      const comments = Array.isArray(w.comments) ? w.comments.length : 0;
      const views = Number(w.views) || 0;
      totalViews += views; totalLikes += likes; totalComments += comments;
      return { id: w.id, title: w.title, image: w.image || w.poster || null, views, likes, comments, status: w.status };
    });
    perWork.sort((a, b) => b.views - a.views);

    const myOrders = db.orders.filter(o => Array.isArray(o.items) && o.items.some(it => it.sellerUsername === me));
    const revenueByCurrency = {};
    let completedCount = 0, pendingCount = 0;
    for (const o of myOrders) {
      const mine = o.items.filter(it => it.sellerUsername === me);
      if (o.status === 'completed') {
        completedCount++;
        for (const it of mine) {
          const cur = it.currency || 'UZS';
          revenueByCurrency[cur] = (revenueByCurrency[cur] || 0) + (it.price * it.qty);
        }
      } else if (o.status !== 'cancelled') {
        pendingCount++;
      }
    }

    res.json({
      totalWorks: works.length,
      totalViews,
      totalLikes,
      totalComments,
      totalOrders: myOrders.length,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
      revenueByCurrency,
      topWorks: perWork.slice(0, 10)
    });
  });

  return router;
}

module.exports = createUsersRouter;
