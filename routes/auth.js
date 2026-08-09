/**
 * routes/auth.js — ro'yxatdan o'tish, kirish, 2FA, parolni tiklash,
 * /api/me, mavzu (theme), bildirishnoma sozlamalari va til rout'lari
 * (server.js'dan ajratildi).
 */

const express = require('express');
const crypto = require('crypto');

function createAuthRouter(deps) {
  const {
    requireAuth, rateLimit,
    db, saveDB, bcrypt, twofa,
    isValidUsername, SUPPORTED_LANGS,
    mirrorToRelationalDb, relDb, relUsers,
    publicUser, ensureModerationFields, refreshModeration,
    EMAIL_ENABLED, sendMail, pushTextFor, SITE_URL
  } = deps;

  const router = express.Router();

  router.post('/api/register', rateLimit('register', 8, 10 * 60 * 1000), async (req, res) => {
    try {
      const { username, password, fullname, email, lang } = req.body || {};
      const uname = String(username || '').trim().toLowerCase().replace(/\s+/g, '_');

      if (!isValidUsername(uname)) {
        return res.status(400).json({ error: "Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lishi kerak", code: 'usernameInvalid' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak", code: 'passwordTooShort' });
      }
      const emailStr = String(email || '').trim();
      if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        return res.status(400).json({ error: "Email manzili noto'g'ri formatda", code: 'emailInvalid' });
      }
      if (db.users[uname]) {
        return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band', code: 'usernameTaken' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      db.users[uname] = {
        passwordHash,
        fullname: String(fullname || '').slice(0, 100),
        email: emailStr.slice(0, 150),
        bio: '',
        avatar: null,
        phone: '',
        social: '',
        privacy: { phone: true, social: true, email: false },
        theme: null,
        lang: SUPPORTED_LANGS.includes(lang) ? lang : 'uz',
        joined: new Date().toISOString(),
        isAdmin: false,
        moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
        notifications: [],
        following: [],
        wishlist: [],
        cart: {}
      };
      db.works[uname] = [];
      await saveDB();

      mirrorToRelationalDb(() => {
        relUsers.createUser(relDb, {
          username: uname,
          passwordHash,
          fullname: db.users[uname].fullname,
          email: db.users[uname].email,
          lang: db.users[uname].lang,
          isAdmin: false
        });
      });

      req.session.username = uname;
      res.json({ user: publicUser(uname) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ro'yxatdan o'tishda server xatoligi", code: 'registerServerError' });
    }
  });

  router.post('/api/login', rateLimit('login', 15, 10 * 60 * 1000), async (req, res) => {
    try {
      const { username, password } = req.body || {};
      const uname = String(username || '').trim().toLowerCase();
      const u = db.users[uname];
      const ok = u && await bcrypt.compare(String(password || ''), u.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Foydalanuvchi nomi yoki parol noto'g'ri", code: 'loginInvalid' });
      }

      ensureModerationFields(u);
      if (refreshModeration(u, uname)) await saveDB();
      if (u.moderation.bannedUntil) {
        return res.status(403).json({
          error: 'Hisobingiz vaqtincha bloklangan (ban)', code: 'accountBanned',
          banned: true,
          until: u.moderation.bannedUntil,
          reason: u.moderation.banReason || ''
        });
      }

      if (u.twoFactor && u.twoFactor.enabled) {
        req.session.pending2faUsername = uname;
        return res.json({ twoFactorRequired: true });
      }

      req.session.username = uname;
      res.json({ user: publicUser(uname) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Kirishda server xatoligi', code: 'loginServerError' });
    }
  });

  router.post('/api/login/2fa-verify', rateLimit('2fa-verify', 10, 10 * 60 * 1000), async (req, res) => {
    const uname = req.session.pending2faUsername;
    if (!uname || !db.users[uname]) {
      return res.status(400).json({ error: "Avval login va parolni yuboring", code: 'no2faPending' });
    }
    const u = db.users[uname];
    ensureModerationFields(u);
    const cleanCode = String((req.body && req.body.code) || '').replace(/\s/g, '');

    const lock = twofa.checkLock(u.twoFactor.totpLock);
    if (lock.locked) {
      return res.status(429).json({
        error: `Juda ko'p urinish. ${lock.retryAfterSec} soniyadan keyin qayta urinib ko'ring.`,
        code: 'tooMany2faAttempts',
        retryAfterSec: lock.retryAfterSec
      });
    }

    const totpResult = twofa.verifyTotp(u.twoFactor.secret, cleanCode, {
      lastCounter: u.twoFactor.totpLastCounter
    });

    let usedBackupCode = false;
    let backupCodesRemaining = null;
    if (!totpResult.valid && totpResult.reason !== 'replay') {
      const backupResult = twofa.consumeBackupCode(u.twoFactor.backupCodeHashes, cleanCode);
      if (backupResult.valid) {
        usedBackupCode = true;
        backupCodesRemaining = backupResult.remaining;
      }
    }

    if (!totpResult.valid && !usedBackupCode) {
      u.twoFactor.totpLock = twofa.registerFailure(u.twoFactor.totpLock);
      await saveDB();
      if (totpResult.reason === 'replay') {
        return res.status(401).json({
          error: "Bu kod allaqachon ishlatilgan. Autentifikator ilovasidagi yangi kodni kiriting.",
          code: 'used2faCode'
        });
      }
      return res.status(401).json({ error: "Kod noto'g'ri yoki muddati o'tgan", code: 'invalid2faCode' });
    }

    if (totpResult.valid) u.twoFactor.totpLastCounter = totpResult.counter;
    if (usedBackupCode) u.twoFactor.backupCodeHashes = backupCodesRemaining;
    u.twoFactor.totpLock = twofa.resetFailures();
    await saveDB();

    delete req.session.pending2faUsername;
    req.session.username = uname;
    res.json({ user: publicUser(uname), usedBackupCode });
  });

  router.get('/api/2fa/status', requireAuth, (req, res) => {
    const u = db.users[req.session.username];
    res.json({ enabled: !!(u.twoFactor && u.twoFactor.enabled) });
  });

  router.post('/api/2fa/setup', requireAuth, rateLimit('2fa-setup', 10, 10 * 60 * 1000), (req, res) => {
    const uname = req.session.username;
    const secret = twofa.generateSecret();
    req.session.pending2faSecret = secret;
    res.json({ secret, otpauthUri: twofa.otpauthUri(secret, uname) });
  });

  router.post('/api/2fa/confirm', requireAuth, rateLimit('2fa-setup', 10, 10 * 60 * 1000), async (req, res) => {
    const uname = req.session.username;
    const u = db.users[uname];
    const secret = req.session.pending2faSecret;
    if (!secret) return res.status(400).json({ error: "Avval /2fa/setup chaqiring", code: 'no2faSetupPending' });
    ensureModerationFields(u);
    const cleanCode = String((req.body && req.body.code) || '').replace(/\s/g, '');

    const lock = twofa.checkLock(u.twoFactor.totpLock);
    if (lock.locked) {
      return res.status(429).json({
        error: `Juda ko'p urinish. ${lock.retryAfterSec} soniyadan keyin qayta urinib ko'ring.`,
        code: 'tooMany2faAttempts',
        retryAfterSec: lock.retryAfterSec
      });
    }

    const totpResult = twofa.verifyTotp(secret, cleanCode, { lastCounter: 0 });
    if (!totpResult.valid) {
      u.twoFactor.totpLock = twofa.registerFailure(u.twoFactor.totpLock);
      await saveDB();
      return res.status(401).json({
        error: totpResult.reason === 'replay'
          ? "Bu kod allaqachon ishlatilgan. Yangi autentifikator kodini kiriting."
          : "Kod noto'g'ri — autentifikator ilovangizdagi kodni qayta tekshiring",
        code: totpResult.reason === 'replay' ? 'used2faCode' : 'invalid2faCode'
      });
    }

    const backupCodes = twofa.generateBackupCodes(8);
    u.twoFactor = {
      enabled: true,
      secret,
      backupCodeHashes: backupCodes.map(c => twofa.hashBackupCode(c)),
      enabledAt: new Date().toISOString(),
      totpLastCounter: totpResult.counter,
      totpLock: twofa.resetFailures()
    };
    delete req.session.pending2faSecret;
    await saveDB();
    res.json({ ok: true, backupCodes });
  });

  router.post('/api/2fa/disable', requireAuth, rateLimit('2fa-setup', 10, 10 * 60 * 1000), async (req, res) => {
    const uname = req.session.username;
    const u = db.users[uname];
    const { password } = req.body || {};
    const ok = await bcrypt.compare(String(password || ''), u.passwordHash);
    if (!ok) return res.status(401).json({ error: "Parol noto'g'ri", code: 'wrongPassword' });
    u.twoFactor = { enabled: false };
    await saveDB();
    res.json({ ok: true });
  });

  router.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  router.post('/api/forgot-password', rateLimit('forgot-password', 5, 15 * 60 * 1000), async (req, res) => {
    if (!EMAIL_ENABLED) {
      return res.status(503).json({ error: "Parolni tiklash hozircha sozlanmagan (SMTP yo'q). Administratorga murojaat qiling.", code: 'emailNotConfigured' });
    }
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const genericResponse = { ok: true, message: "Agar bu email ro'yxatdan o'tgan bo'lsa, tiklash havolasi yuborildi" };
    if (!email) return res.json(genericResponse);

    const uname = Object.keys(db.users).find(k => (db.users[k].email || '').toLowerCase() === email);
    if (!uname) return res.json(genericResponse);

    const u = db.users[uname];
    const rawToken = crypto.randomBytes(32).toString('hex');
    u.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    u.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await saveDB();

    const resetUrl = `${SITE_URL}/?reset=${rawToken}&u=${encodeURIComponent(uname)}`;
    const T = pushTextFor(u.lang || 'uz');
    await sendMail(
      u.email,
      T.resetEmailSubject,
      `${T.resetEmailBody}\n\n${resetUrl}\n\n${T.resetEmailExpiry}`,
      `<p>${T.resetEmailBody}</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>${T.resetEmailExpiry}</p>`
    );
    res.json(genericResponse);
  });

  router.post('/api/reset-password', rateLimit('reset-password', 8, 15 * 60 * 1000), async (req, res) => {
    const { username, token, password } = req.body || {};
    const uname = String(username || '').trim().toLowerCase();
    const u = db.users[uname];
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak", code: 'passwordTooShort' });
    }
    if (!u || !u.resetTokenHash || !u.resetTokenExpires) {
      return res.status(400).json({ error: "Tiklash havolasi yaroqsiz yoki eskirgan", code: 'invalidResetToken' });
    }
    if (new Date(u.resetTokenExpires) < new Date()) {
      return res.status(400).json({ error: "Tiklash havolasining muddati tugagan", code: 'resetTokenExpired' });
    }
    const tokenHash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
    if (tokenHash !== u.resetTokenHash) {
      return res.status(400).json({ error: "Tiklash havolasi yaroqsiz", code: 'invalidResetToken' });
    }

    u.passwordHash = await bcrypt.hash(password, 10);
    u.resetTokenHash = null;
    u.resetTokenExpires = null;
    await saveDB();
    res.json({ ok: true });
  });

  router.get('/api/me', async (req, res) => {
    const uname = req.session.username;
    if (!uname || !db.users[uname]) return res.json({ user: null });
    const u = db.users[uname];
    ensureModerationFields(u);
    if (refreshModeration(u, uname)) await saveDB();
    res.json({ user: publicUser(uname) });
  });

  router.put('/api/theme', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    const { mode, custom } = req.body || {};
    u.theme = { mode: String(mode || 'tungi'), custom: String(custom || '#e2543f') };
    await saveDB();
    res.json({ ok: true });
  });

  router.get('/api/notification-prefs', requireAuth, (req, res) => {
    const relUser = relUsers.getUser(relDb, req.session.username);
    if (relUser) return res.json({ prefs: relUser.notifPrefs });

    const u = db.users[req.session.username];
    ensureModerationFields(u);
    res.json({ prefs: u.notifPrefs });
  });

  router.put('/api/notification-prefs', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const body = req.body || {};
    const keys = ['enabled', 'likes', 'comments', 'follows', 'orders', 'messages'];
    for (const key of keys) {
      if (typeof body[key] === 'boolean') u.notifPrefs[key] = body[key];
    }
    await saveDB();
    mirrorToRelationalDb(() => relUsers.setNotifPrefs(relDb, req.session.username, u.notifPrefs));
    res.json({ prefs: u.notifPrefs });
  });

  router.put('/api/language', requireAuth, async (req, res) => {
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    const { lang } = req.body || {};
    if (!SUPPORTED_LANGS.includes(lang)) {
      return res.status(400).json({ error: "Noto'g'ri til kodi", code: 'invalidLang' });
    }
    u.lang = lang;
    await saveDB();
    mirrorToRelationalDb(() => relUsers.updateUserFields(relDb, req.session.username, { lang: u.lang }));
    res.json({ ok: true, lang: u.lang });
  });

  return router;
}

module.exports = createAuthRouter;
