#!/usr/bin/env node
/**
 * VAPID kalit juftligini generatsiya qiladi (push xabarnomalar uchun).
 * Ishlatish: npm run generate-vapid
 *
 * MUHIM: har bir muhit (dev/staging/production) uchun ALOHIDA kalit
 * generatsiya qiling — bitta kalitni ikkita muhitda ishlatmang, va
 * PRIVATE kalitni hech qachon reponi/chatga joylashtirmang, faqat
 * .env faylida saqlang.
 */
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('\nYangi VAPID kalit juftligi generatsiya qilindi.');
console.log('Quyidagi qatorlarni .env fayliga joylashtiring:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@madein.net   # o'zingizning email manzilingizga almashtiring\n`);
