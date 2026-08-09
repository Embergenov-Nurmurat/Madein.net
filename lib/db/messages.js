/**
 * lib/db/messages.js — suhbatlar va xabarlar bilan ishlash uchun SQL qatlami.
 */

function convId(a, b) {
  return [a, b].sort().join('__');
}

function ensureConversation(db, a, b) {
  const id = convId(a, b);
  const exists = db.prepare('SELECT 1 FROM conversations WHERE id = ?').get(id);
  if (!exists) {
    db.prepare('INSERT INTO conversations (id, user_a, user_b, updated_at) VALUES (?, ?, ?, ?)')
      .run(id, ...[a, b].sort(), new Date().toISOString());
  }
  return id;
}

/**
 * `message.to` beriladi (chaqiruvchi rout ikkala tomonni ham biladi —
 * eski db.messages'dagi ba'zi tizim xabarlarida `to` umuman saqlanmagan
 * edi, lekin bu yerda, YOZISH vaqtida, uni har doim aniq berish mumkin).
 * `message` ichidagi qolgan maydonlar (url, poster, duration, fileName,
 * fileSize, workId, workTitle, ...) `content` ustuniga JSON sifatida
 * yig'iladi — ular xabar TURIGA (type) qarab har xil bo'ladi.
 */
function addMessage(db, conversationId, message) {
  const { id, from, to, type, text, fileName, createdAt, ...rest } = message;
  db.prepare(`INSERT INTO messages (
    id, conversation_id, from_username, to_username, type, text, file_name, content, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, conversationId, from, to, type || 'text', text ?? null, fileName ?? null,
    Object.keys(rest).length ? JSON.stringify(rest) : null, createdAt || new Date().toISOString()
  );
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
    .run(createdAt || new Date().toISOString(), conversationId);
}

function setReadUpto(db, conversationId, username, readUpto) {
  db.prepare(`INSERT INTO conversation_read_upto (conversation_id, username, read_upto) VALUES (?, ?, ?)
    ON CONFLICT(conversation_id, username) DO UPDATE SET read_upto = excluded.read_upto`)
    .run(conversationId, username, readUpto);
}

module.exports = { convId, ensureConversation, addMessage, setReadUpto };
