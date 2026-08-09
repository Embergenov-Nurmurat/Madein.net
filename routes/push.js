/**
 * routes/push.js — Web Push obunalari rout'lari (server.js'dan ajratildi).
 */

const express = require('express');

function createPushRouter(deps) {
  const { requireAuth, db, saveDB, ensureModerationFields, PUSH_ENABLED, VAPID_PUBLIC_KEY } = deps;
  const router = express.Router();

  router.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: PUSH_ENABLED ? VAPID_PUBLIC_KEY : null });
  });

  router.post('/api/push/subscribe', requireAuth, async (req, res) => {
    if (!PUSH_ENABLED) return res.status(503).json({ error: 'Push xabarnomalar serverda sozlanmagan', code: 'pushNotConfigured' });
    const sub = req.body && req.body.subscription;
    if (!sub || !sub.endpoint || !sub.keys) {
      return res.status(400).json({ error: "Noto'g'ri obuna ma'lumoti", code: 'invalidSubscription' });
    }
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    u.pushSubscriptions = u.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
    u.pushSubscriptions.push(sub);
    if (u.pushSubscriptions.length > 10) u.pushSubscriptions = u.pushSubscriptions.slice(-10);
    await saveDB();
    res.json({ ok: true });
  });

  router.post('/api/push/unsubscribe', requireAuth, async (req, res) => {
    const endpoint = req.body && req.body.endpoint;
    const u = db.users[req.session.username];
    ensureModerationFields(u);
    if (endpoint) u.pushSubscriptions = u.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    else u.pushSubscriptions = [];
    await saveDB();
    res.json({ ok: true });
  });

  return router;
}

module.exports = createPushRouter;
