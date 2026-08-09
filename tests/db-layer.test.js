const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { openDatabase } = require('../lib/db/connection');
const usersDb = require('../lib/db/users');
const worksDb = require('../lib/db/works');
const ordersDb = require('../lib/db/orders');
const messagesDb = require('../lib/db/messages');
const reportsDb = require('../lib/db/reports');

describe('lib/db (relyatsion qatlam)', () => {
  let db;
  let tmpFile;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `madein-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    db = openDatabase(tmpFile);
  });

  afterEach(() => {
    db.close();
    for (const ext of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(tmpFile + ext); } catch (e) {}
    }
  });

  describe('users', () => {
    test("yangi foydalanuvchi standart qiymatlar bilan yaratiladi", () => {
      const u = usersDb.createUser(db, { username: 'alice', passwordHash: 'hash1', fullname: 'Alice' });
      assert.equal(u.username, 'alice');
      assert.equal(u.moderation.bannedUntil, null);
      assert.equal(u.notifPrefs.enabled, true);
      assert.equal(u.callPrivacy.mode, 'everyone');
      assert.deepEqual(u.following, []);
      assert.deepEqual(u.notifications, []);
      assert.deepEqual(u.wishlist, []);
      assert.deepEqual(u.collections, []);
    });

    test("mavjud bo'lmagan foydalanuvchi uchun null qaytadi", () => {
      assert.equal(usersDb.getUser(db, 'nobody'), null);
      assert.equal(usersDb.userExists(db, 'nobody'), false);
    });

    test("moderatsiya (ban/mute) to'g'ri saqlanadi va o'qiladi", () => {
      usersDb.createUser(db, { username: 'bob', passwordHash: 'h' });
      usersDb.setModeration(db, 'bob', { bannedUntil: '2099-01-01T00:00:00.000Z', banReason: "qoidabuzarlik" });
      const u = usersDb.getUser(db, 'bob');
      assert.equal(u.moderation.bannedUntil, '2099-01-01T00:00:00.000Z');
      assert.equal(u.moderation.banReason, "qoidabuzarlik");
      assert.equal(u.moderation.mutedUntil, null); // teginilmagan maydon o'zgarmadi
    });

    test('obuna bo\'lish/bekor qilish', () => {
      usersDb.createUser(db, { username: 'carol', passwordHash: 'h' });
      usersDb.createUser(db, { username: 'dave', passwordHash: 'h' });

      assert.equal(usersDb.isFollowing(db, 'carol', 'dave'), false);
      usersDb.follow(db, 'carol', 'dave');
      assert.equal(usersDb.isFollowing(db, 'carol', 'dave'), true);
      assert.equal(usersDb.followerCount(db, 'dave'), 1);
      assert.deepEqual(usersDb.getUser(db, 'carol').following, ['dave']);

      // ikki marta obuna bo'lish xatolik bermaydi (INSERT OR IGNORE)
      usersDb.follow(db, 'carol', 'dave');
      assert.equal(usersDb.followerCount(db, 'dave'), 1);

      usersDb.unfollow(db, 'carol', 'dave');
      assert.equal(usersDb.isFollowing(db, 'carol', 'dave'), false);
    });

    test('bildirishnoma qo\'shish va o\'qilgan deb belgilash', () => {
      usersDb.createUser(db, { username: 'erin', passwordHash: 'h' });
      usersDb.addNotification(db, 'erin', { id: 'n1', type: 'like', from: 'frank', workId: 'w1' });
      usersDb.addNotification(db, 'erin', { id: 'n2', type: 'follow', from: 'grace' });

      let u = usersDb.getUser(db, 'erin');
      assert.equal(u.notifications.length, 2);
      assert.equal(u.notifications[0].read, false);
      // ORDER BY created_at DESC — teng vaqtda kiritish tartibi DB'ga bog'liq
      // bo'lishi mumkin, shuning uchun to'plam sifatida tekshiramiz
      const types = u.notifications.map(n => n.type).sort();
      assert.deepEqual(types, ['follow', 'like']);

      usersDb.markNotificationsRead(db, 'erin');
      u = usersDb.getUser(db, 'erin');
      assert.ok(u.notifications.every(n => n.read === true));
    });

    test('oddiy maydonlarni yangilash (updateUserFields)', () => {
      usersDb.createUser(db, { username: 'holly', passwordHash: 'h' });
      usersDb.updateUserFields(db, 'holly', { bio: 'Hunarmand', phone: '+998901234567' });
      const u = usersDb.getUser(db, 'holly');
      assert.equal(u.bio, 'Hunarmand');
      assert.equal(u.phone, '+998901234567');
      assert.equal(u.fullname, ''); // teginilmagan maydon o'zgarmadi
    });

    test('notifPrefs faqat berilgan maydonlarni yangilaydi', () => {
      usersDb.createUser(db, { username: 'ivan', passwordHash: 'h' });
      usersDb.setNotifPrefs(db, 'ivan', { likes: false });
      const u = usersDb.getUser(db, 'ivan');
      assert.equal(u.notifPrefs.likes, false);
      assert.equal(u.notifPrefs.comments, true); // teginilmagan
    });
  });

  describe('works', () => {
    function seedSeller(uname = 'seller1') {
      usersDb.createUser(db, { username: uname, passwordHash: 'h' });
      return uname;
    }

    test('asar yaratish va rasm/teg bilan birga o\'qish', () => {
      const owner = seedSeller();
      worksDb.createWork(db, {
        id: 'w1', owner, title: 'Ko\'za', status: 'sale', price: 10000, currency: 'UZS',
        stockMode: 'fixed', stockQty: 5, desc: 'Chiroyli ko\'za',
        images: ['/uploads/a.jpg', '/uploads/b.jpg'], thumbs: ['/uploads/a-thumb.jpg', '/uploads/b-thumb.jpg'],
        tags: ['keramika', 'koza']
      });

      const w = worksDb.getWork(db, 'w1');
      assert.equal(w.title, "Ko'za");
      assert.equal(w.owner, owner);
      assert.deepEqual(w.images, ['/uploads/a.jpg', '/uploads/b.jpg']);
      assert.deepEqual(w.thumbs, ['/uploads/a-thumb.jpg', '/uploads/b-thumb.jpg']);
      assert.deepEqual(w.tags.sort(), ['keramika', 'koza']);
    });

    test('layk bosish/olib tashlash', () => {
      const owner = seedSeller();
      worksDb.createWork(db, { id: 'w2', owner, title: 'Vaza', status: 'sale', price: 5000 });
      usersDb.createUser(db, { username: 'liker', passwordHash: 'h' });

      let liked = worksDb.toggleLike(db, 'w2', 'liker');
      assert.equal(liked, true);
      assert.deepEqual(worksDb.getWork(db, 'w2').likes, ['liker']);

      liked = worksDb.toggleLike(db, 'w2', 'liker');
      assert.equal(liked, false);
      assert.deepEqual(worksDb.getWork(db, 'w2').likes, []);
    });

    test('kommentlar va sharhlar', () => {
      const owner = seedSeller();
      usersDb.createUser(db, { username: 'buyer1', passwordHash: 'h' });
      worksDb.createWork(db, { id: 'w3', owner, title: 'Savat', status: 'sale', price: 3000 });
      worksDb.addComment(db, 'w3', { id: 'c1', username: 'buyer1', text: 'Zo\'r ish!' });
      worksDb.addReview(db, 'w3', { id: 'r1', username: 'buyer1', rating: 5, text: 'Tavsiya qilaman' });

      assert.equal(worksDb.getComments(db, 'w3').length, 1);
      assert.equal(worksDb.getComments(db, 'w3')[0].text, "Zo'r ish!");

      const reviews = worksDb.getReviews(db, 'w3');
      assert.equal(reviews.length, 1);
      assert.equal(reviews[0].rating, 5);

      const avg = worksDb.averageRating(db, 'w3');
      assert.equal(avg.average, 5);
      assert.equal(avg.count, 1);
    });

    test('bitta foydalanuvchi bir asarga faqat bitta sharh qoldira oladi (UNIQUE)', () => {
      const owner = seedSeller();
      usersDb.createUser(db, { username: 'buyer2', passwordHash: 'h' });
      worksDb.createWork(db, { id: 'w4', owner, title: 'Gilam', status: 'sale', price: 20000 });
      worksDb.addReview(db, 'w4', { id: 'r1', username: 'buyer2', rating: 4 });
      assert.throws(() => worksDb.addReview(db, 'w4', { id: 'r2', username: 'buyer2', rating: 2 }));
    });

    describe('queryFeed — SQL darajasidagi filtr/qidiruv/sahifalash', () => {
      beforeEach(() => {
        const owner = seedSeller();
        const other = seedSeller('seller2');
        worksDb.createWork(db, { id: 'f1', owner, title: 'Keramik ko\'za', status: 'sale', price: 10000, tags: ['keramika'], createdAt: '2026-01-01T00:00:00.000Z' });
        worksDb.createWork(db, { id: 'f2', owner: other, title: 'Yog\'och stul', status: 'sale', price: 50000, tags: ['yogoch'], createdAt: '2026-01-02T00:00:00.000Z' });
        worksDb.createWork(db, { id: 'f3', owner, title: 'Ko\'rgazma asari', status: 'expo', price: 0, createdAt: '2026-01-03T00:00:00.000Z' });
        usersDb.createUser(db, { username: 'liker9', passwordHash: 'h' });
        worksDb.toggleLike(db, 'f2', 'liker9'); // f2 ko'proq layk oladi
      });

      test('status bo\'yicha filtrlaydi', () => {
        const { items, total } = worksDb.queryFeed(db, { status: 'sale' });
        assert.equal(total, 2);
        assert.deepEqual(items.map(i => i.id).sort(), ['f1', 'f2']);
      });

      test('owner bo\'yicha filtrlaydi', () => {
        const { items } = worksDb.queryFeed(db, { owner: 'seller1' });
        assert.deepEqual(items.map(i => i.id).sort(), ['f1', 'f3']);
      });

      test('sarlavha bo\'yicha qidiradi (LIKE)', () => {
        const { items } = worksDb.queryFeed(db, { search: 'ko\'za' });
        assert.deepEqual(items.map(i => i.id), ['f1']);
      });

      test('teg bo\'yicha filtrlaydi', () => {
        const { items } = worksDb.queryFeed(db, { tag: 'yogoch' });
        assert.deepEqual(items.map(i => i.id), ['f2']);
      });

      test('yangi (new) bo\'yicha saralaydi — standart', () => {
        const { items } = worksDb.queryFeed(db, {});
        assert.deepEqual(items.map(i => i.id), ['f3', 'f2', 'f1']);
      });

      test('ommabop (popular) bo\'yicha saralaydi — layklar soni', () => {
        const { items } = worksDb.queryFeed(db, { sort: 'popular' });
        assert.equal(items[0].id, 'f2'); // eng ko'p layk olgan birinchi
      });

      test('turi (type) bo\'yicha filtrlaydi', () => {
        const { items } = worksDb.queryFeed(db, { type: 'boshqa' });
        assert.deepEqual(items.map(i => i.id).sort(), ['f1', 'f2', 'f3']); // hammasi standart 'boshqa'
        const { items: none } = worksDb.queryFeed(db, { type: 'nofound' });
        assert.equal(none.length, 0);
      });

      test('narx oralig\'i bo\'yicha filtrlaydi (faqat "sale" holatidagilarga)', () => {
        const { items } = worksDb.queryFeed(db, { minPrice: 20000 });
        assert.deepEqual(items.map(i => i.id), ['f2']); // f1=10000 (past), f3 expo (chiqarib tashlanadi)
        const { items: ranged } = worksDb.queryFeed(db, { minPrice: 5000, maxPrice: 20000 });
        assert.deepEqual(ranged.map(i => i.id), ['f1']);
      });

      test('ownerIn ro\'yxati bo\'yicha filtrlaydi (masalan "faqat kuzatilganlar")', () => {
        const { items } = worksDb.queryFeed(db, { ownerIn: ['seller2'] });
        assert.deepEqual(items.map(i => i.id), ['f2']);
        const { items: empty } = worksDb.queryFeed(db, { ownerIn: [] });
        assert.equal(empty.length, 0, "bo'sh ro'yxat hech narsani qaytarmasligi kerak");
      });

      test('qidiruv sotuvchi username/fullname va teglar bo\'yicha ham ishlaydi', () => {
        const { items } = worksDb.queryFeed(db, { search: 'seller2' });
        assert.deepEqual(items.map(i => i.id), ['f2']);
        const { items: byTag } = worksDb.queryFeed(db, { search: 'keramika' });
        assert.deepEqual(byTag.map(i => i.id), ['f1']);
      });

      test('limit/offset orqali sahifalaydi', () => {
        const page1 = worksDb.queryFeed(db, { limit: 2, offset: 0 });
        const page2 = worksDb.queryFeed(db, { limit: 2, offset: 2 });
        assert.equal(page1.items.length, 2);
        assert.equal(page2.items.length, 1);
        assert.equal(page1.total, 3);
        assert.equal(page2.total, 3);
        // ikki sahifada takrorlanish yo'q
        const ids1 = page1.items.map(i => i.id);
        const ids2 = page2.items.map(i => i.id);
        assert.equal(ids1.some(id => ids2.includes(id)), false);
      });
    });

    test('asar o\'chirilganda bog\'liq rasm/teg/layk/komment ham o\'chadi (CASCADE)', () => {
      const owner = seedSeller();
      worksDb.createWork(db, {
        id: 'w5', owner, title: 'Test', status: 'sale', price: 1000,
        images: ['/a.jpg'], tags: ['t1']
      });
      usersDb.createUser(db, { username: 'x', passwordHash: 'h' });
      worksDb.toggleLike(db, 'w5', 'x');
      worksDb.addComment(db, 'w5', { id: 'c1', username: 'x', text: 'hi' });

      worksDb.deleteWork(db, 'w5');

      assert.equal(worksDb.getWork(db, 'w5'), null);
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM work_images WHERE work_id = ?').get('w5').n, 0);
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM work_tags WHERE work_id = ?').get('w5').n, 0);
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM likes WHERE work_id = ?').get('w5').n, 0);
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM comments WHERE work_id = ?').get('w5').n, 0);
    });
  });

  describe('renameUser — ON UPDATE CASCADE orqali barcha jadvallarni yangilash', () => {
    test('username o\'zgarishi barcha bog\'liq jadvallarda avtomatik aks etadi', () => {
      // --- boy, bir-biriga bog'langan ma\'lumot to\'plamini tayyorlaymiz ---
      usersDb.createUser(db, { username: 'renold', passwordHash: 'h', fullname: 'Rename Old' });
      usersDb.createUser(db, { username: 'friend', passwordHash: 'h' });

      // ish: egasi renold
      worksDb.createWork(db, { id: 'rw1', owner: 'renold', title: 'Asar', status: 'sale', price: 5000 });
      // friend renold'ning ishiga layk/komment/sharh qoldiradi
      worksDb.toggleLike(db, 'rw1', 'friend');
      worksDb.addComment(db, 'rw1', { id: 'rc1', username: 'friend', text: 'Zo\'r!' });
      // renold friend'ga obuna, friend renold'ga obuna (ikkala tomon ham tekshiriladi)
      usersDb.follow(db, 'renold', 'friend');
      usersDb.follow(db, 'friend', 'renold');
      // wishlist/cart/collection — renold friend'ning ishini emas, o'zining ishini
      // saqlaydi (soddalik uchun); asosiysi — bog'lanish username orqali ishlashi
      usersDb.setCartQty(db, 'renold', 'rw1', 2);
      usersDb.toggleWishlist(db, 'renold', 'rw1');
      usersDb.addNotification(db, 'renold', { id: 'rn1', type: 'like', from: 'friend', workId: 'rw1' });
      // buyurtma: friend renold'dan xarid qiladi
      ordersDb.createOrder(db, {
        id: 'ro1', buyer: 'friend', status: 'placed',
        items: [{ workId: 'rw1', title: 'Asar', qty: 1, price: 5000, currency: 'UZS', sellerUsername: 'renold' }]
      });
      // xabar: ikkalasi suhbatlashadi
      const convId = messagesDb.ensureConversation(db, 'renold', 'friend');
      messagesDb.addMessage(db, convId, { id: 'rm1', from: 'renold', to: 'friend', type: 'text', text: 'Salom' });
      messagesDb.setReadUpto(db, convId, 'renold', '2026-01-01T00:00:00.000Z');
      // shikoyat: friend renold haqida shikoyat qiladi
      reportsDb.createReport(db, { id: 'rr1', reporter: 'friend', type: 'user', targetId: 'renold', targetOwner: 'renold', reason: 'test' });

      // --- amalni bajaramiz ---
      usersDb.renameUser(db, 'renold', 'rennew');

      // --- tekshiramiz: ESKI nom HECH QAYERDA qolmagan bo'lishi kerak ---
      assert.equal(usersDb.getUser(db, 'renold'), null);
      const rennew = usersDb.getUser(db, 'rennew');
      assert.ok(rennew);
      assert.equal(rennew.fullname, 'Rename Old');

      assert.equal(worksDb.getWork(db, 'rw1').owner, 'rennew');
      assert.deepEqual(worksDb.getWork(db, 'rw1').likes, ['friend']); // boshqalarning layklari o'zgarmadi

      assert.equal(usersDb.isFollowing(db, 'rennew', 'friend'), true);
      assert.equal(usersDb.isFollowing(db, 'friend', 'rennew'), true);
      assert.equal(usersDb.isFollowing(db, 'renold', 'friend'), false);

      assert.equal(rennew.cart['rw1'], 2);
      assert.deepEqual(rennew.wishlist, ['rw1']);
      assert.equal(rennew.notifications.length, 1);

      const order = ordersDb.getOrder(db, 'ro1');
      assert.equal(order.items[0].sellerUsername, 'rennew');
      assert.equal(order.buyer, 'friend'); // xaridor o'zgarmagan

      // suhbat ID'si ham qayta hisoblanishi kerak (convId endi rennew asosida)
      const newConvId = messagesDb.convId('rennew', 'friend');
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(newConvId);
      assert.ok(conv, "suhbat yangi ID bilan topilishi kerak");
      const oldConv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
      assert.equal(oldConv, undefined, "eski suhbat ID'si qolmasligi kerak");

      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get('rm1');
      assert.equal(msg.from_username, 'rennew');
      assert.equal(msg.conversation_id, newConvId, "xabar yangi suhbat ID'siga CASCADE orqali ko'chishi kerak");

      const readUpto = db.prepare('SELECT * FROM conversation_read_upto WHERE conversation_id = ? AND username = ?')
        .get(newConvId, 'rennew');
      assert.ok(readUpto, "o'qilgan belgisi ham yangi suhbat ID'siga ko'chishi kerak");

      const report = db.prepare('SELECT * FROM reports WHERE id = ?').get('rr1');
      assert.equal(report.target_owner, 'rennew');
      assert.equal(report.target_id, 'rennew'); // type='user' bo'lgani uchun targetId ham yangilanadi
      assert.equal(report.reporter, 'friend'); // shikoyatchi o'zgarmagan

      // ikkinchi marta bir xil nomga o'zgartirishga urinish (no-op) xatolik bermasligi kerak
      usersDb.renameUser(db, 'rennew', 'rennew');
      assert.ok(usersDb.getUser(db, 'rennew'));
    });
  });
});
