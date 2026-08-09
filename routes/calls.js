/**
 * routes/calls.js — video qo'ng'iroq (WebRTC signalizatsiya) rout'lari
 * (server.js'dan ajratildi).
 *
 * MUHIM: `activeCalls`/`userActiveCall` — faqat XOTIRADA saqlanadigan
 * Map'lar (hech qachon diskka yozilmaydi). Ular server.js'da ATAYLAB
 * QOLDIRILGAN (bu yerga faqat REFERENS sifatida uzatiladi), chunki
 * server.js'dagi `renameUsernameEverywhere()` funksiyasi username
 * o'zgarganda ularni ham yangilashi kerak — shu bois ikkala tomon ham
 * BIR XIL Map obyektiga ishora qilishi shart.
 */

const express = require('express');

function createCallsRouter(deps) {
  const {
    requireAuth, requireNotMuted, rateLimit,
    db, saveDB, ensureModerationFields,
    getOrCreateConversation, genCallId, crypto,
    mirrorToRelationalDb, relDb, relMessages,
    activeCalls, userActiveCall
  } = deps;

  const router = express.Router();
  const CALL_RING_TIMEOUT_MS = 45 * 1000;
  const CALL_STALE_MS = 2 * 60 * 1000;

  function callPrivacyCheck(fromUser, toUser) {
    const target = db.users[toUser];
    if (!target) return { ok: false, reason: 'notfound' };
    ensureModerationFields(target);
    const cp = target.callPrivacy;
    if (cp.mode === 'nobody') return { ok: false, reason: 'blocked' };
    if (cp.mode === 'selected' && !cp.allowed.includes(fromUser)) return { ok: false, reason: 'blocked' };
    return { ok: true };
  }

  function callView(call, me) {
    const other = call.from === me ? call.to : call.from;
    const ou = db.users[other];
    return {
      id: call.id,
      role: call.from === me ? 'caller' : 'callee',
      status: call.status,
      otherUser: { username: other, fullname: (ou && ou.fullname) || other, avatar: (ou && ou.avatar) || null },
      offer: call.from === me ? undefined : call.offer,
      answer: call.from === me ? call.answer : undefined,
      cameraOff: !!call.cameraOff[other],
      myCameraOff: !!call.cameraOff[me],
      createdAt: call.createdAt,
      updatedAt: call.updatedAt
    };
  }

  function endCallInternal(call, status) {
    call.status = status;
    call.updatedAt = Date.now();
    if (userActiveCall.get(call.from) === call.id) userActiveCall.delete(call.from);
    if (userActiveCall.get(call.to) === call.id) userActiveCall.delete(call.to);

    try {
      const duration = (status === 'ended' && call.acceptedAt)
        ? Math.max(0, Math.round((call.updatedAt - call.acceptedAt) / 1000))
        : 0;
      const conv = getOrCreateConversation(call.from, call.to);
      const message = {
        id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
        from: call.from,
        type: 'call',
        callStatus: status,
        callDuration: duration,
        text: '',
        createdAt: new Date(call.updatedAt).toISOString()
      };
      conv.messages.push(message);
      conv.updatedAt = message.createdAt;
      saveDB().catch(() => {});
      // MUHIM (avval e'tibordan chetda qolgan bo'shliq): qo'ng'iroq
      // haqidagi tizim xabari (masalan "Video qo'ng'iroq · 3:24") ham
      // relyatsion bazaga dublikat qilinishi kerak edi — boshqa barcha
      // xabar yuborish yo'llari (matn, media, buyurtma) allaqachon shunday
      // ishlaydi, faqat qo'ng'iroq tugashi bu qatordan chetda qolgan edi.
      // message.from har doim call.from bo'lgani uchun, oluvchi har doim
      // call.to bo'ladi.
      mirrorToRelationalDb(() => relMessages.addMessage(relDb, conv.id, Object.assign({ to: call.to }, message)));
    } catch (e) { /* jim o'tkazamiz — xabar qo'shilmasa ham qo'ng'iroq tugashi kerak */ }
  }

  setInterval(() => {
    const now = Date.now();
    for (const [id, call] of activeCalls) {
      if (call.status === 'ringing' && now - call.createdAt > CALL_RING_TIMEOUT_MS) {
        endCallInternal(call, 'missed');
      }
      if (['ended', 'declined', 'missed', 'cancelled', 'busy'].includes(call.status) && now - call.updatedAt > CALL_STALE_MS) {
        activeCalls.delete(id);
      }
    }
  }, 5000).unref();

  router.post('/api/calls/start', requireAuth, requireNotMuted, rateLimit('call-start', 20, 60 * 1000), (req, res) => {
    const me = req.session.username;
    const to = String((req.body && req.body.to) || '').trim().toLowerCase();
    if (!to || !db.users[to]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (to === me) return res.status(400).json({ error: "O'zingizga qo'ng'iroq qila olmaysiz", code: 'cannotCallSelf' });

    if (userActiveCall.has(me)) return res.status(409).json({ error: "Sizda allaqachon faol qo'ng'iroq bor", code: 'callAlreadyActive' });
    if (userActiveCall.has(to)) return res.status(409).json({ error: "Foydalanuvchi hozir band", code: 'userBusy', busy: true });

    const check = callPrivacyCheck(me, to);
    if (!check.ok) {
      return res.status(403).json({
        error: "Bu foydalanuvchi video qo'ng'iroqlarni cheklagan", code: 'callBlocked',
        blocked: true
      });
    }

    const id = genCallId();
    const call = {
      id,
      from: me,
      to,
      status: 'ringing',
      offer: null,
      answer: null,
      candidates: { [me]: [], [to]: [] },
      cameraOff: { [me]: false, [to]: false },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    activeCalls.set(id, call);
    userActiveCall.set(me, id);
    userActiveCall.set(to, id);
    res.json({ call: callView(call, me) });
  });

  router.get('/api/calls/current', requireAuth, (req, res) => {
    const me = req.session.username;
    const id = userActiveCall.get(me);
    if (!id || !activeCalls.has(id)) return res.json({ call: null });
    res.json({ call: callView(activeCalls.get(id), me) });
  });

  function getCallForParticipant(req, res) {
    const me = req.session.username;
    const call = activeCalls.get(req.params.id);
    if (!call || (call.from !== me && call.to !== me)) {
      res.status(404).json({ error: "Qo'ng'iroq topilmadi", code: 'callNotFound' });
      return null;
    }
    return call;
  }

  router.get('/api/calls/:id', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    res.json({ call: callView(call, req.session.username) });
  });

  router.post('/api/calls/:id/offer', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi taklif yubora oladi', code: 'onlyCallerCanOffer' });
    const sdp = req.body && req.body.sdp;
    if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
    call.offer = sdp;
    call.updatedAt = Date.now();
    res.json({ ok: true });
  });

  router.post('/api/calls/:id/answer', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi javob bera oladi', code: 'onlyCalleeCanAnswer' });
    if (call.status !== 'ringing') return res.status(400).json({ error: "Qo'ng'iroq allaqachon tugagan", code: 'callAlreadyEnded' });
    const sdp = req.body && req.body.sdp;
    if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
    call.answer = sdp;
    call.status = 'accepted';
    call.acceptedAt = Date.now();
    call.updatedAt = Date.now();
    res.json({ ok: true });
  });

  router.post('/api/calls/:id/candidate', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    const candidate = req.body && req.body.candidate;
    if (!candidate || typeof candidate !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
    if (!Array.isArray(call.candidates[me])) call.candidates[me] = [];
    call.candidates[me].push(candidate);
    if (call.candidates[me].length > 200) call.candidates[me].shift();
    res.json({ ok: true });
  });

  router.get('/api/calls/:id/candidates', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    const other = call.from === me ? call.to : call.from;
    res.json({ items: call.candidates[other] || [] });
  });

  router.post('/api/calls/:id/decline', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi rad eta oladi', code: 'onlyCalleeCanDecline' });
    if (call.status === 'ringing') endCallInternal(call, 'declined');
    res.json({ ok: true });
  });

  router.post('/api/calls/:id/cancel', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi bekor qila oladi', code: 'onlyCallerCanCancel' });
    if (call.status === 'ringing') endCallInternal(call, 'cancelled');
    res.json({ ok: true });
  });

  router.post('/api/calls/:id/end', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    if (!['ended', 'declined', 'missed', 'cancelled', 'busy'].includes(call.status)) endCallInternal(call, 'ended');
    res.json({ ok: true });
  });

  router.post('/api/calls/:id/camera', requireAuth, (req, res) => {
    const call = getCallForParticipant(req, res);
    if (!call) return;
    const me = req.session.username;
    call.cameraOff[me] = !!(req.body && req.body.off);
    call.updatedAt = Date.now();
    res.json({ ok: true });
  });

  return router;
}

module.exports = createCallsRouter;
