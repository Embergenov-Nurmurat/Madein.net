/**
 * routes/conversations.js — xabarlar (chat) rout'lari (server.js'dan ajratildi).
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');

function createConversationsRouter(deps) {
  const {
    requireAuth, requireNotMuted, rateLimit,
    db, saveDB, fs,
    getOrCreateConversation, lastMessagePreviewFor, unreadCountFor,
    mirrorToRelationalDb, relDb, relMessages,
    isNotifCategoryAllowed, sendPush, pushTextFor, ensureModerationFields,
    chatUpload, multerErrCode, UPLOADS_DIR,
    transcodeCircleVideo, transcodeVideoToMp4, getMp4DurationSeconds, extractVideoPoster,
    MAX_CHAT_CIRCLE_SECONDS, MAX_CHAT_VIDEO_SECONDS, MAX_CHAT_VOICE_SECONDS
  } = deps;

  const router = express.Router();

  router.get('/api/conversations', requireAuth, (req, res) => {
    const me = req.session.username;
    const items = Object.values(db.messages)
      .filter(c => c.participants.includes(me))
      .map(c => {
        const other = c.participants.find(p => p !== me) || me;
        const u = db.users[other];
        const last = c.messages[c.messages.length - 1] || null;
        const preview = lastMessagePreviewFor(last);
        return {
          username: other,
          fullname: (u && u.fullname) || other,
          avatar: (u && u.avatar) || null,
          lastMessage: preview.text,
          lastMessageType: preview.type,
          lastFileName: preview.fileName || null,
          lastCallStatus: last && last.type === 'call' ? (last.callStatus || 'ended') : null,
          lastFrom: last ? last.from : null,
          updatedAt: c.updatedAt,
          unread: unreadCountFor(c, me)
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ items });
  });

  router.get('/api/conversations/unread-count', requireAuth, (req, res) => {
    const me = req.session.username;
    let total = 0;
    for (const c of Object.values(db.messages)) {
      if (!c.participants.includes(me)) continue;
      total += unreadCountFor(c, me);
    }
    res.json({ count: total });
  });

  router.get('/api/conversations/:username/messages', requireAuth, async (req, res) => {
    const me = req.session.username;
    const other = String(req.params.username || '').trim().toLowerCase();
    if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' });

    const conv = getOrCreateConversation(me, other);
    if (!conv.readUpto) conv.readUpto = {};
    conv.readUpto[me] = new Date().toISOString();
    await saveDB();
    mirrorToRelationalDb(() => relMessages.setReadUpto(relDb, conv.id, me, conv.readUpto[me]));

    const u = db.users[other];
    res.json({
      otherUser: { username: other, fullname: (u && u.fullname) || other, avatar: (u && u.avatar) || null },
      items: conv.messages
    });
  });

  router.post('/api/conversations/:username/messages', requireAuth, requireNotMuted, rateLimit('message', 40, 60 * 1000), async (req, res) => {
    const me = req.session.username;
    const other = String(req.params.username || '').trim().toLowerCase();
    if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
    if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' });

    const text = String((req.body && req.body.text) || '').trim().slice(0, 1000);
    if (!text) return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas", code: 'messageEmpty' });

    const workId = req.body && req.body.workId ? String(req.body.workId).slice(0, 60) : null;
    const workTitle = req.body && req.body.workTitle ? String(req.body.workTitle).slice(0, 200) : null;

    const conv = getOrCreateConversation(me, other);
    const message = {
      id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
      from: me,
      text,
      workId,
      workTitle,
      createdAt: new Date().toISOString()
    };
    conv.messages.push(message);
    conv.updatedAt = message.createdAt;
    if (!conv.readUpto) conv.readUpto = {};
    conv.readUpto[me] = message.createdAt;
    await saveDB();
    mirrorToRelationalDb(() => {
      relMessages.addMessage(relDb, conv.id, Object.assign({ to: other }, message));
      relMessages.setReadUpto(relDb, conv.id, me, message.createdAt);
    });

    const senderFullname = (db.users[me] && db.users[me].fullname) || me;
    const recipient = db.users[other];
    if (recipient && isNotifCategoryAllowed(recipient, 'messages')) {
      sendPush(other, { title: senderFullname, body: text.slice(0, 120), url: '/' }).catch(() => {});
    }

    res.json({ message });
  });

  router.post('/api/conversations/:username/messages/media', requireAuth, requireNotMuted, rateLimit('message-media', 30, 60 * 1000), (req, res) => {
    chatUpload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });

      const me = req.session.username;
      const other = String(req.params.username || '').trim().toLowerCase();
      const cleanup = () => { if (req.file) fs.unlink(req.file.path, () => {}); };

      if (!db.users[other]) { cleanup(); return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' }); }
      if (other === me) { cleanup(); return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' }); }
      if (!req.file) return res.status(400).json({ error: 'Fayl talab qilinadi', code: 'fileRequired' });

      const kind = String(req.body.type || '').toLowerCase();
      const caption = String(req.body.caption || '').trim().slice(0, 500);

      try {
        const message = {
          id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
          from: me,
          type: kind,
          text: caption,
          createdAt: new Date().toISOString()
        };

        if (kind === 'photo') {
          message.url = '/uploads/' + req.file.filename;

        } else if (kind === 'video' || kind === 'circle') {
          const transcodedFilename = crypto.randomBytes(14).toString('hex') + '.mp4';
          const transcodedPath = path.join(UPLOADS_DIR, transcodedFilename);
          try {
            if (kind === 'circle') await transcodeCircleVideo(req.file.path, transcodedPath);
            else await transcodeVideoToMp4(req.file.path, transcodedPath);
          } catch (e) {
            cleanup();
            return res.status(400).json({ error: "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.", code: 'videoProcessingFailed' });
          }
          cleanup();

          const realDuration = getMp4DurationSeconds(transcodedPath);
          const maxSec = kind === 'circle' ? MAX_CHAT_CIRCLE_SECONDS : MAX_CHAT_VIDEO_SECONDS;
          if (realDuration && realDuration > maxSec + 1) {
            fs.unlink(transcodedPath, () => {});
            return res.status(400).json({ error: `Video juda uzun (maksimal ${maxSec} soniya)`, code: 'videoTooLong', params: { n: maxSec } });
          }

          const posterFilename = transcodedFilename.replace(/\.mp4$/, '.jpg');
          try {
            await extractVideoPoster(transcodedPath, UPLOADS_DIR, posterFilename);
            message.poster = '/uploads/' + posterFilename;
          } catch (e) { /* poster bo'lmasa ham video ko'rinaveradi */ }

          message.url = '/uploads/' + transcodedFilename;
          message.duration = realDuration || (Number(req.body.duration) || null);

        } else if (kind === 'voice') {
          message.url = '/uploads/' + req.file.filename;
          const dur = Number(req.body.duration);
          message.duration = Number.isFinite(dur) && dur > 0 ? Math.min(Math.round(dur), MAX_CHAT_VOICE_SECONDS) : null;

        } else if (kind === 'file') {
          message.url = '/uploads/' + req.file.filename;
          message.fileName = String(req.body.fileName || req.file.originalname || 'fayl').slice(0, 200);
          message.fileSize = req.file.size;

        } else {
          cleanup();
          return res.status(400).json({ error: "Noma'lum xabar turi", code: 'unknownMessageType' });
        }

        const conv = getOrCreateConversation(me, other);
        conv.messages.push(message);
        conv.updatedAt = message.createdAt;
        if (!conv.readUpto) conv.readUpto = {};
        conv.readUpto[me] = message.createdAt;
        await saveDB();
        mirrorToRelationalDb(() => {
          relMessages.addMessage(relDb, conv.id, Object.assign({ to: other }, message));
          relMessages.setReadUpto(relDb, conv.id, me, message.createdAt);
        });

        const senderFullname = (db.users[me] && db.users[me].fullname) || me;
        const recipientUser = db.users[other];
        if (recipientUser && isNotifCategoryAllowed(recipientUser, 'messages')) {
          ensureModerationFields(recipientUser);
          const labels = pushTextFor(recipientUser.lang).mediaLabels;
          const mediaLabel = labels[kind] || labels.default;
          sendPush(other, { title: senderFullname, body: mediaLabel, url: '/' }).catch(() => {});
        }

        res.json({ message });
      } catch (e) {
        cleanup();
        console.error('Chat media xatoligi:', e.message);
        res.status(500).json({ error: 'Server xatoligi', code: 'serverError' });
      }
    });
  });

  return router;
}

module.exports = createConversationsRouter;
