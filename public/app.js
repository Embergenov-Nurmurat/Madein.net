(function () {
      "use strict";

      /* ===================== I18N =====================
         Only translates the site's own interface (buttons, labels, empty
         states, system messages). Anything a person typed themselves —
         names, bios, work titles/descriptions, comments, chat messages —
         is never touched and always stays exactly as they wrote it. */
      const I18N = {
        uz: {
          _locale: 'uz-UZ', _dir: 'ltr', _name: "O'zbekcha",
          "auth.tagline": "Qo'lingiz bilan yaratgan rasm, haykal va mulajlaringizni saqlang — sotuvga qo'ying yoki shunchaki ko'rgazmaga qo'ying.",
          "auth.tabLogin": "Kirish", "auth.tabRegister": "Ro'yxatdan o'tish",
          "auth.loginUsername": "Foydalanuvchi nomi", "auth.loginUsernamePh": "masalan: dilnoza_art",
          "auth.loginPassword": "Parol", "auth.loginBtn": "Kirish",
          "common.serverError": "Server xatoligi",
          "auth.loginErrorDefault": "Foydalanuvchi nomi yoki parol noto'g'ri.",
          "auth.regFullname": "To'liq ism", "auth.regFullnamePh": "Ism Familiya",
          "auth.regUsername": "Foydalanuvchi nomi", "auth.regUsernamePh": "lotin harflari, bo'shliqsiz",
          "auth.regEmail": "Email",
          "auth.regPassword": "Parol", "auth.regPasswordPh": "kamida 4 belgi",
          "auth.regPassword2": "Tasdiqlash", "auth.regPassword2Ph": "qayta kiriting",
          "auth.regBtn": "Akkaunt yaratish",
          "auth.regErrorShort": "Parol kamida 4 belgidan iborat bo'lishi kerak.",
          "auth.regErrorMismatch": "Parollar mos kelmadi.",
          "auth.pwWeak": "Zaif", "auth.pwMedium": "O'rtacha", "auth.pwStrong": "Kuchli",
          "auth.pwMatch": "Mos keldi", "auth.pwNoMatch": "Mos kelmadi",
          "auth.regErrorDefault": "Ro'yxatdan o'tishda xatolik.",
          "auth.or": "yoki",
          "auth.guestBtn": "Hozircha shunchaki ko'rib chiqish",
          "auth.guestBtnSmall": "Ro'yxatdan o'tishni keyinroq amalga oshirasiz",
          "nav.home": "Bosh sahifa", "nav.profile": "Profil", "nav.messages": "Xabarlar",
          "nav.newWork": "+", "nav.myProfile": "Profilim", "nav.logout": "Chiqish",
          "nav.register": "Ro'yxatdan o'tish",
          "guest.banner": "Siz saytni <b>mehmon</b> sifatida ko'ryapsiz — asar yuklash, layk va komentariya qoldirish uchun ro'yxatdan o'ting.",
          "guest.registerBtn": "Ro'yxatdan o'tish",
          "home.eyebrow": "Lenta", "home.title": "Barcha <span>ijodkorlar</span>ning asarlari",
          "home.sub": "Platformadagi barcha foydalanuvchilar yuklagan asarlar — eng yangisidan boshlab.",
          "feed.end": "Boshqa asar qolmadi.",
          "feed.empty.title": "Hali hech narsa yo'q", "feed.empty.desc": "Birinchi bo'lib asar yuklang — u shu yerda paydo bo'ladi.",
          "cart.loading": "Yuklanmoqda...", "cart.empty.title": "Korzinka bo'sh",
          "cart.empty.desc": "Yoqtirgan asarlaringizni savat belgisi orqali shu yerga qo'shing.",
          "cart.addAria": "Savatga qo'shish", "cart.increaseAria": "Miqdorni oshirish", "cart.decreaseAria": "Miqdorni kamaytirish",
          "buyNow.aria": "Hoziroq sotib olish",
          "buyNow.confirm": "{item} — hoziroq shu narxda sotib olasizmi?",
          "buyNow.success": "Buyurtmangiz qabul qilindi!",
          "buyNow.fail": "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
          "cart.removeAria": "Savatdan olib tashlash", "cart.subtotal": "Jami", "cart.checkout": "Buyurtma berish",
          "cart.checkoutConfirm": "Buyurtmani tasdiqlaysizmi?", "cart.orderPlaced": "Buyurtmangiz qabul qilindi! Sotuvchi tez orada siz bilan bog'lanadi.",
          "cart.orderFail": "Buyurtma berib bo'lmadi",
          "notif.orderReceived": "{name} sizdan {count} ta asar buyurtma qildi.", "notif.orderPlaced": "Buyurtmangiz muvaffaqiyatli qabul qilindi.",
          "profile.empty.desc": "Birinchi asaringizni yuklab, koleksiyangizni boshlang.",
          "feed.likeAria": "Layk", "feed.commentAria": "Komentlar",
          "feed.contactAria": "Sotuvchi bilan bog'lanish", "feed.contactLabel": "Bog'lanish",
          "feed.sale": "Sotuvda", "feed.expo": "Ko'rgazma",
          "profile.stat.total": "Jami", "profile.stat.sale": "Sotuvda", "profile.stat.expo": "Ko'rgazmada",
          "profile.editBtn": "Ma'lumotlarni tahrirlash",
          "profile.edit.title": "Profil ma'lumotlari", "profile.edit.changeAvatar": "Rasm tanlash",
          "profile.edit.avatarHint": "JPG yoki PNG, 8MB gacha",
          "profile.edit.fullname": "To'liq ism", "profile.edit.email": "Email",
          "profile.edit.bio": "Bio", "profile.edit.bioPh": "O'zingiz haqingizda qisqacha...",
          "profile.edit.phone": "Telefon raqami", "profile.edit.social": "Ijtimoiy tarmoq havolasi",
          "profile.edit.privacyTitle": "Boshqalar profilingizda nimani ko'ra olishini tanlang:",
          "profile.edit.privacyPhone": "Telefon raqamimni ko'rsatish",
          "profile.edit.privacySocial": "Ijtimoiy tarmoq havolamni ko'rsatish",
          "profile.edit.privacyEmail": "Emailimni ko'rsatish",
          "profile.edit.save": "Saqlash", "profile.edit.cancel": "Bekor qilish",
          "profile.myWorks": "Mening asarlarim", "profile.language": "Sayt tili",
          "profile.joined": "A'zo bo'lgan",
          "profile.online": "Onlayn", "profile.offline": "Oflayn",
          "profile.avatarUploadFail": "Rasmni yuklab bo'lmadi. Qayta urinib ko'ring.",
          "account.title": "Login va parol",
          "account.usernameLabel": "Foydalanuvchi nomi (login)",
          "account.usernameHint": "Boshqalar sizni shu nom orqali topadi, siz ham shu nom bilan kirasiz.",
          "account.currentPassword": "Joriy parol", "account.currentPasswordPh": "o'zgartirish uchun kiriting", "account.currentPasswordHint": "O'zgarishlarni saqlash uchun joriy parolingizni kiriting.",
          "account.newPassword": "Yangi parol", "account.newPasswordPh": "ixtiyoriy, kamida 4 belgi",
          "account.newPassword2": "Yangi parolni tasdiqlash", "account.newPassword2Ph": "qayta kiriting",
          "account.save": "Saqlash", "account.saved": "Saqlandi!",
          "account.err.noChanges": "Hech narsa o'zgartirilmadi.",
          "account.err.currentPasswordRequired": "Davom etish uchun joriy parolingizni kiriting.",
          "account.err.currentPasswordIncorrect": "Joriy parol noto'g'ri.",
          "account.err.usernameInvalid": "Login 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lishi kerak.",
          "account.err.usernameTaken": "Bu foydalanuvchi nomi allaqachon band.",
          "account.err.passwordTooShort": "Yangi parol kamida 4 belgidan iborat bo'lishi kerak.",
          "account.err.mismatch": "Yangi parollar mos kelmadi.",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "Boshqa administratorni ban qila olmaysiz",
          "err.cannotMuteAdmin": "Boshqa administratorni mut qila olmaysiz",
          "err.callBlocked": "Bu foydalanuvchi video qo'ng'iroqlarni cheklagan",
          "err.commentDeleteForbidden": "Bu komentni o'chirishga ruxsatingiz yo'q",
          "err.userBusy": "Foydalanuvchi hozir band",
          "err.usernameInvalid": "Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lishi kerak",
          "err.loginInvalid": "Foydalanuvchi nomi yoki parol noto'g'ri",
          "err.tooManyAttempts": "Juda ko'p urinish qilindi, birozdan so'ng qayta urinib ko'ring",
          "err.unknownMessageType": "Noma'lum xabar turi",
          "err.invalidData": "Noto'g'ri ma'lumot",
          "err.invalidQuantity": "Noto'g'ri miqdor",
          "err.cannotCartOwnWork": "O'z asaringizni savatga qo'sha olmaysiz",
          "err.cannotBuyOwnWork": "O'z asaringizni sotib ola olmaysiz",
          "err.cannotFollowSelf": "O'zingizga obuna bo'la olmaysiz",
          "err.cannotCallSelf": "O'zingizga qo'ng'iroq qila olmaysiz",
          "err.cannotMessageSelf": "O'zingizga xabar yubora olmaysiz",
          "err.cannotBanSelf": "O'zingizni ban qila olmaysiz",
          "err.cannotMuteSelf": "O'zingizni mut qila olmaysiz",
          "err.passwordTooShort": "Parol kamida 4 belgidan iborat bo'lishi kerak",
          "err.callAlreadyEnded": "Qo'ng'iroq allaqachon tugagan",
          "err.callNotFound": "Qo'ng'iroq topilmadi",
          "err.registerServerError": "Ro'yxatdan o'tishda server xatoligi",
          "err.cartEmpty": "Savat bo'sh",
          "err.muted": "Siz vaqtincha jimlik jazosidasiz (mut), shuning uchun bu amalni bajara olmaysiz",
          "err.callAlreadyActive": "Sizda allaqachon faol qo'ng'iroq bor",
          "err.videoProcessingFailed": "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.",
          "err.messageEmpty": "Xabar matni bo'sh bo'lishi mumkin emas",
          "err.workNotFound": "Asar topilmadi",
          "err.authRequired": "Avval tizimga kiring",
          "err.adminRequired": "Bu amal uchun administrator huquqi kerak",
          "err.workNotInCart": "Bu asar savatda topilmadi",
          "err.workNotForSale": "Bu asar sotuvda emas",
          "err.workOutOfStock": "Bu asar tugagan",
          "err.usernameTaken": "Bu foydalanuvchi nomi allaqachon band",
          "err.onlyCallerCanCancel": "Faqat chaqiruvchi bekor qila oladi",
          "err.onlyCallerCanOffer": "Faqat chaqiruvchi taklif yubora oladi",
          "err.onlyCalleeCanAnswer": "Faqat qabul qiluvchi javob bera oladi",
          "err.onlyCalleeCanDecline": "Faqat qabul qiluvchi rad eta oladi",
          "err.fileRequired": "Fayl talab qilinadi",
          "err.userNotFound": "Foydalanuvchi topilmadi",
          "err.accountBanned": "Hisobingiz vaqtincha bloklangan (ban)",
          "err.mediaRequired": "Kamida bitta rasm yoki video talab qilinadi",
          "err.loginServerError": "Kirishda server xatoligi",
          "err.commentEmpty": "Koment matni bo'sh bo'lishi mumkin emas",
          "err.commentNotFound": "Koment topilmadi",
          "err.imageRequired": "Rasm talab qilinadi",
          "err.serverError": "Server xatoligi",
          "err.reportNotFound": "Shikoyat topilmadi",
          "err.noChanges": "Hech narsa o'zgartirilmadi",
          "err.currentPasswordRequired": "Davom etish uchun joriy parolingizni kiriting",
          "err.currentPasswordIncorrect": "Joriy parol noto'g'ri",
          "err.videoWithOtherFiles": "Video bilan birga boshqa fayl yuklab bo'lmaydi — faqat bitta video tanlang",
          "err.videoTooLong10s": "Video 10 soniyadan uzun bo'lmasligi kerak",
          "err.invalidWorkMediaType": "Faqat rasm yoki video (mp4/mov, 10 soniyagacha) fayllari qabul qilinadi",
          "err.dangerousFileType": "Bu turdagi fayllarni yuborib bo'lmaydi",
          "err.onlyImagesAllowed": "Faqat rasm fayllari qabul qilinadi",
          "err.onlyVideosAllowed": "Faqat video fayllari qabul qilinadi",
          "err.onlyAudioAllowed": "Faqat audio fayllari qabul qilinadi",
          "err.fileTooLarge": "Fayl hajmi juda katta",
          "err.tooManyFiles": "Juda ko'p fayl yuklandi",
          "err.uploadError": "Faylni yuklashda xatolik yuz berdi",
          "err.notEnoughStock": "Faqat {n} dona mavjud",
          "err.videoTooLong": "Video juda uzun (maksimal {n} soniya)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 Rasm",
          "chat.preview.video": "🎥 Video",
          "chat.preview.circle": "⭕ Video xabar",
          "chat.preview.voice": "🎙️ Ovozli xabar",
          "chat.preview.file": "📎 Fayl",
          "chat.voiceAria": "Ovozli xabar", "chat.circleAria": "Video xabar",
          "filter.typeAria": "Kategoriya", "filter.sortAria": "Saralash", "chat.emojiAria": "Emoji",
          "messages.eyebrow": "Muloqot", "messages.title": "Sotuvchilar bilan <span>xabarlar</span>",
          "messages.sub": "Sotuvdagi asar haqida savol berish yoki sotuvchi bilan bog'lanish uchun suhbatlaringiz shu yerda.",
          "messages.empty.title": "Hali suhbatlar yo'q",
          "messages.empty.desc": "Sotuvdagi biror asar ostidagi \"Bog'lanish\" tugmasini bosib, sotuvchiga xabar yozing.",
          "messages.loadFail.title": "Yuklab bo'lmadi", "messages.loadFail.desc": "Internet aloqasini tekshirib, qayta urinib ko'ring.",
          "messages.you": "Siz",
          "userProfile.back": "← Orqaga", "userProfile.works": "Asarlari",
          "userProfile.notFound.title": "Topilmadi", "userProfile.notFound.desc": "Bu foydalanuvchi mavjud emas.",
          "userProfile.contactBtn": "Xabar yozish",
          "upload.title": "Yangi asar yuklash",
          "upload.imagesLabel": "Rasmlar yoki video (1-3 rasm, yoki 10 soniyagacha bitta video)",
          "upload.dropDefault": "Rasm yoki video tanlash uchun bosing yoki shu yerga tashlang — 3 tagacha rasm, yoki 10 soniyagacha bitta video",
          "upload.dropChosen": "{n}/{max} rasm tanlandi — yana qo'shish uchun bosing",
          "upload.dropFull": "3 ta rasm tanlandi — kollaj bo'lib ko'rinadi",
          "upload.titleLabel": "Sarlavha", "upload.titlePh": "Masalan: «Kuz manzarasi»",
          "upload.typeLabel": "Turi", "upload.type.rasm": "Rasm (chizma)", "upload.type.haykal": "Haykal",
          "upload.type.mulaj": "Mulaj", "upload.type.boshqa": "Boshqa", "upload.type.otherPh": "Turini kiriting",
          "upload.statusLabel": "Holati", "upload.status.expo": "Faqat ko'rgazma", "upload.status.sale": "Sotuvda",
          "upload.priceLabel": "Narx", "upload.currencyLabel": "Valyuta",
          "upload.stockLabel": "Mavjudligi", "upload.stock.fixed": "Belgilangan miqdor", "upload.stock.order": "Buyurtmaga ishlanadi", "upload.stock.qtyPh": "Nechta dona bor?",
          "stock.order": "Buyurtmaga ishlanadi", "stock.out": "Tugadi", "stock.left": "{n} dona qoldi",
          "upload.descLabel": "Tavsif", "upload.descPh": "Asar haqida qisqacha ma'lumot...",
          "upload.save": "Saqlash", "upload.removeAria": "O'chirish",
                    "upload.errNoImage": "Iltimos, kamida bitta rasm tanlang.",
          "upload.errVideoTooLong": "Video 10 soniyadan uzun bo'lmasligi kerak.",
          "upload.errVideoWithImages": "Video bilan birga rasm yuklab bo'lmaydi.",
          "upload.videoNotSupported": "Brauzeringiz videoni tekshira olmadi. Iltimos, boshqa fayl tanlang.",
          "upload.errGeneric": "Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
          "lightbox.editStatus": "Holatni o'zgartirish",
          "lightbox.delete": "O'chirish", "lightbox.noDesc": "Tavsif kiritilmagan.",
          "lightbox.workTagFallback": "Asar",
          "comments.title": "Komentlar", "comments.ph": "Koment yozing...", "comments.send": "Yuborish",
          "comments.empty": "Hali komentlar yo'q. Birinchi bo'lib yozing!",
          "comments.loading": "Yuklanmoqda...", "comments.loadFail": "Komentlarni yuklab bo'lmadi.",
          "comments.delete": "O'chirish",
          "chat.ph": "Xabar yozing...", "chat.workRefPrefix": "Asar haqida",
          "chat.loadFail": "Suhbatni yuklab bo'lmadi.", "chat.empty": "Hali xabar yo'q. Birinchi bo'lib yozing!",
          "chat.sendFail": "Xabar yuborilmadi. Qayta urinib ko'ring.",
          "chat.attach.media": "Rasm / Video", "chat.attach.file": "Fayl",
          "chat.micDenied": "Mikrofon yoki kameraga ruxsat berilmadi",
          "chat.recordingVoice": "Ovozli xabar yozilmoqda...", "chat.recordingCircle": "Video xabar yozilmoqda...",
          "chat.mediaSendFail": "Fayl yuborilmadi. Qayta urinib ko'ring.",
          "chat.attachTitle": "Fayl biriktirish", "chat.circleTitle": "Video xabar (bosish orqali yozib olish)",
          "chat.voiceTitle": "Ovozli xabar (bosish orqali yozib olish)", "chat.recordCancelTitle": "Bekor qilish", "chat.recordSendTitle": "Yuborish",
          "call.startTitle": "Video qo'ng'iroq", "call.incoming": "Video qo'ng'iroq qilyapti...",
          "call.decline": "Rad etish", "call.accept": "Qabul qilish", "call.calling": "Chaqirilmoqda...",
          "call.connecting": "Ulanmoqda...", "call.peerCameraOff": "Kamera o'chirilgan",
          "call.toggleMic": "Mikrofon", "call.toggleCam": "Kamera", "call.end": "Yakunlash",
          "call.startFail": "Qo'ng'iroq qilib bo'lmadi. Qayta urinib ko'ring.",
          "call.noCamera": "Kamera topilmadi, faqat ovoz bilan ulanmoqda...",
          "call.noMediaAccess": "Mikrofon/kameraga ruxsat berilmadi.",
          "call.wasDeclined": "Qo'ng'iroq rad etildi", "call.wasMissed": "Javob berilmadi",
          "call.wasBusy": "Foydalanuvchi band", "call.ended": "Qo'ng'iroq tugadi",
          "call.msg.ended": "Video qo'ng'iroq", "call.msg.noAnswer": "Javob berilmadi",
          "call.msg.missed": "O'tkazib yuborilgan qo'ng'iroq", "call.msg.declined": "Rad etilgan qo'ng'iroq",
          "call.msg.cancelled": "Bekor qilingan qo'ng'iroq", "call.msg.busy": "Foydalanuvchi band edi",
          "profile.edit.callPrivacyTitle": "Video qo'ng'iroqlarni kimlar qila olishini tanlang:",
          "profile.edit.callPrivacyEveryone": "Hammadan", "profile.edit.callPrivacySelected": "Faqat tanlangan odamlardan",
          "profile.edit.callPrivacyNobody": "Hech kimdan",
          "profile.edit.callPrivacyAddPh": "Foydalanuvchi nomini kiriting...", "profile.edit.callPrivacyAdd": "Qo'shish",
          "profile.edit.callPrivacyEmpty": "Hozircha hech kim qo'shilmagan.",
          "profile.edit.callPrivacyRemove": "O'chirish",
          "profile.edit.callPrivacyAddSelfErr": "O'zingizni qo'sha olmaysiz.",
          "profile.edit.callPrivacyAddNotFound": "Bunday foydalanuvchi topilmadi.",
          "gate.title": "Ro'yxatdan o'ting",
          "gate.desc": "Siz hozircha mehmon sifatida ko'ryapsiz. Bu amal uchun akkaunt kerak — istasangiz hoziroq, istasangiz keyinroq ro'yxatdan o'ting.",
          "gate.later": "Keyinroq", "gate.register": "Ro'yxatdan o'tish",
          "theme.fabTitle": "Stilni o'zgartirish", "theme.title": "Sayt stili",
          "theme.tungi": "Tungi", "theme.yorug": "Yorug'", "theme.cyberpunk": "Cyberpunk", "theme.cyberpunkBlue": "Cyberpunk ko'k", "theme.cyberpunkYellow": "Cyberpunk sariq", "theme.custom": "Maxsus",
          "theme.customPick": "O'zingiz rang tanlang",
          "admin.nav": "Administrator burchagi",
          "admin.eyebrow": "Boshqaruv",
          "admin.title": "Administrator <span>burchagi</span>",
          "admin.sub": "Barcha foydalanuvchilar — ban yoki mut bering, muddatidan avval olib tashlang.",
          "admin.loading": "Yuklanmoqda...",
          "admin.loadFail": "Foydalanuvchilarni yuklab bo'lmadi.",
          "admin.empty": "Hozircha foydalanuvchilar yo'q.",
          "admin.lastSeen.never": "Saytga hali kirmagan",
          "admin.lastSeen.justNow": "Hozir saytda",
          "admin.lastSeen.minutesAgo": "{n} daqiqa oldin saytda edi",
          "admin.lastSeen.hoursAgo": "{n} soat oldin saytda edi",
          "admin.lastSeen.daysAgo": "{n} kun oldin saytda edi",
          "admin.lastSeen.onDate": "{date} sanasida saytda edi",
          "admin.badge.admin": "Administrator", "admin.badge.banned": "Ban", "admin.badge.muted": "Mut",
          "admin.badge.ok": "Faol",
          "admin.status.bannedUntil": "Ban muddati: {date} gacha",
          "admin.status.mutedUntil": "Mut muddati: {date} gacha",
          "admin.action.ban": "Ban berish", "admin.action.unban": "Bandan chiqarish",
          "admin.action.mute": "Mut berish", "admin.action.unmute": "Mutdan chiqarish",
          "admin.actionFail": "Amalni bajarib bo'lmadi.",
          "admin.confirm.unban": "Ushbu foydalanuvchining ban muddatini muddatidan avval bekor qilmoqchimisiz?",
          "admin.confirm.unmute": "Ushbu foydalanuvchining mut muddatini muddatidan avval bekor qilmoqchimisiz?",
          "admin.mod.title": "Foydalanuvchiga cheklov qo'yish",
          "admin.mod.titleBan": "@{username} ni ban qilish",
          "admin.mod.titleMute": "@{username} ni mut qilish",
          "admin.mod.minutes": "Muddat (daqiqada)",
          "admin.mod.reason": "Sabab (ixtiyoriy)",
          "admin.mod.reasonPh": "Qoidabuzarlik sababi...",
          "admin.mod.confirm": "Tasdiqlash",
          "admin.mod.errMinutes": "Muddatni to'g'ri kiriting (kamida 1 daqiqa).",
          "ban.title": "Hisobingiz bloklangan",
          "ban.until": "Ban muddati: {date} gacha.",
          "ban.reason": "Sabab: {reason}",
          "mute.banner": "Siz vaqtincha jimlik jazosidasiz — komment, xabar yozish va yangi asar yuklash mumkin emas.",
          "mute.bannerReason": "Siz {date} gacha jimlik jazosidasiz. Sabab: {reason}",
          "mute.bannerNoReason": "Siz {date} gacha jimlik jazosidasiz — komment, xabar yozish va yangi asar yuklash mumkin emas.",
          "notif.banReason": "Administrator sizni {date} gacha ban qildi. Sabab: {reason}",
          "notif.banNoReason": "Administrator sizni {date} gacha ban qildi.",
          "notif.muteReason": "Administrator sizni {date} gacha mut qildi (komment/xabar/asar yuklay olmaysiz). Sabab: {reason}",
          "notif.muteNoReason": "Administrator sizni {date} gacha mut qildi (komment/xabar/asar yuklay olmaysiz).",
          "notif.unban": "Administrator ban muddatingizni muddatidan avval bekor qildi. Endi hisobingizdan foydalanishingiz mumkin.",
          "notif.unmute": "Administrator mut jazoyingizni muddatidan avval bekor qildi. Endi komment/xabar yozishingiz va asar yuklashingiz mumkin.",
          "notif.banExpired": "Ban muddatingiz tugadi. Hisobingizdan yana foydalanishingiz mumkin.",
          "notif.muteExpired": "Mut muddatingiz tugadi. Endi komment/xabar yozishingiz va asar yuklashingiz mumkin.",
          "nav.cart": "Korzinka",
          "search.placeholder": "Qidirish...", "filter.type.all": "Barcha turlar", "filter.sort.new": "Eng yangi", "filter.sort.top": "Eng ko'p yoqtirilgan", "filter.price.min": "Narx, dan", "filter.price.max": "Narx, gacha", "filter.onlyFollowing": "Faqat kuzatuvchilarim",
          "search.clearAria": "Tozalash",
          "search.closeAria": "Yopish",
          "cart.eyebrow": "Xarid",
          "cart.title": "Sizning <span>korzinkangiz</span>",
          "cart.sub": "Savatga qo'shgan asarlaringiz shu yerda — miqdorini o'zgartiring va buyurtma bering.",
          "profile.stat.followers": "Obunachi",
          "profile.stat.following": "Obuna",
          "profile.stat.likes": "Layk",
          "profile.stat.comments": "Komment", "profile.stat.views": "Ko'rishlar",
          "admin.reportsLabel": "Shikoyatlar",
          "admin.usersLabel": "Foydalanuvchilar",
          "report.action": "Shikoyat qilish",
          "report.reasonLabel": "Sababi",
          "report.reasonPh": "Nima uchun shikoyat qilyapsiz? (ixtiyoriy)",
          "report.submitBtn": "Yuborish",
          "report.sentAlert": "Shikoyatingiz qabul qilindi. Ko'rib chiqamiz.",
          "admin.stat.users": "Foydalanuvchilar",
          "admin.stat.todayHint": "+{count} bugun",
          "admin.stat.works": "Asarlar",
          "admin.stat.likes": "Layklar",
          "admin.stat.comments": "Kommentlar",
          "admin.stat.openReports": "Ochiq shikoyatlar",
          "admin.stat.banMute": "Ban/Mut",
          "admin.report.typeWork": "Asar",
          "admin.report.typeUser": "Foydalanuvchi",
          "admin.report.subjectWork": "Asar: \"{title}\"",
          "admin.report.subjectUser": "Foydalanuvchi: @{username}",
          "admin.report.gone": "(allaqachon o'chirilgan)",
          "admin.report.reporter": "Shikoyatchi: @{username} ({fullname})",
          "admin.report.resolved": "✓ Ko'rib chiqilgan",
          "admin.report.resolvedDeleted": " · surat o'chirildi",
          "admin.report.resolveBtn": "Ko'rib chiqildi deb belgilash",
          "admin.report.deleteWorkBtn": "Suratni o'chirish",
          "admin.report.deleteConfirm": "Ushbu asarning suratini butunlay o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.",
          "admin.report.empty": "Hozircha shikoyatlar yo'q.",
          "follow.subscribeBtn": "Obuna bo'lish",
          "follow.unsubscribeBtn": "Obunani bekor qilish",
          "follow.unfollowConfirm": "Obunani bekor qilmoqchimisiz? Bu foydalanuvchining yangi asarlari haqida endi xabardor bo'lmaysiz.",
          "follow.stats": "{followers} obunachi · {following} kuzatmoqda",
          "follow.short": "Obuna",
          "follow.shortAdd": "+ Obuna",
          "notif.follow": "{name} sizga obuna bo'ldi",
          "save.aria": "Saqlash",
          "share.aria": "Ulashish", "share.linkCopied": "Havola nusxalandi: {url}", "share.copyPrompt": "Havolani nusxalang:",
          "feedThumb.aria": "Rasmni to'liq hajmda ko'rish",
          "notif.someone": "Kimdir",
      },
        en: {
          _locale: 'en-US', _dir: 'ltr', _name: "English",
          "auth.tagline": "Keep the paintings, sculptures and models you made by hand — put them up for sale or just for show.",
          "auth.tabLogin": "Log in", "auth.tabRegister": "Sign up",
          "auth.loginUsername": "Username", "auth.loginUsernamePh": "e.g. dilnoza_art",
          "auth.loginPassword": "Password", "auth.loginBtn": "Log in",
          "common.serverError": "Server error",
          "auth.loginErrorDefault": "Incorrect username or password.",
          "auth.regFullname": "Full name", "auth.regFullnamePh": "First Last",
          "auth.regUsername": "Username", "auth.regUsernamePh": "Latin letters, no spaces",
          "auth.regEmail": "Email",
          "auth.regPassword": "Password", "auth.regPasswordPh": "at least 4 characters",
          "auth.regPassword2": "Confirm", "auth.regPassword2Ph": "type it again",
          "auth.regBtn": "Create account",
          "auth.regErrorShort": "Password must be at least 4 characters.",
          "auth.regErrorMismatch": "Passwords don't match.",
          "auth.pwWeak": "Weak", "auth.pwMedium": "Medium", "auth.pwStrong": "Strong",
          "auth.pwMatch": "Matches", "auth.pwNoMatch": "Doesn't match",
          "auth.regErrorDefault": "Something went wrong while signing up.",
          "auth.or": "or",
          "auth.guestBtn": "Just browse for now",
          "auth.guestBtnSmall": "You can register later",
          "nav.home": "Home", "nav.profile": "Profile", "nav.messages": "Messages",
          "nav.newWork": "+", "nav.myProfile": "My profile", "nav.logout": "Log out",
          "nav.register": "Sign up",
          "guest.banner": "You're browsing as a <b>guest</b> — sign up to upload work, like, and comment.",
          "guest.registerBtn": "Sign up",
          "home.eyebrow": "Feed", "home.title": "Works from <span>all creators</span>",
          "home.sub": "Everything uploaded on the platform — newest first.",
          "feed.end": "No more works to show.",
          "feed.empty.title": "Nothing here yet", "feed.empty.desc": "Upload the first piece and start your collection.",
          "cart.loading": "Loading...", "cart.empty.title": "Your cart is empty",
          "cart.empty.desc": "Tap the cart icon on pieces you like to add them here.",
          "cart.addAria": "Add to cart", "cart.increaseAria": "Increase quantity", "cart.decreaseAria": "Decrease quantity",
          "buyNow.aria": "Buy now",
          "buyNow.confirm": "Buy {item} right now?",
          "buyNow.success": "Your order has been placed!",
          "buyNow.fail": "Something went wrong. Please try again.",
          "cart.removeAria": "Remove from cart", "cart.subtotal": "Subtotal", "cart.checkout": "Place order",
          "cart.checkoutConfirm": "Confirm your order?", "cart.orderPlaced": "Your order has been placed! The seller will contact you soon.",
          "cart.orderFail": "Couldn't place the order",
          "notif.orderReceived": "{name} ordered {count} of your works.", "notif.orderPlaced": "Your order was placed successfully.",
          "profile.empty.desc": "Upload your first piece to start your collection.",
          "feed.likeAria": "Like", "feed.commentAria": "Comments",
          "feed.contactAria": "Contact the seller", "feed.contactLabel": "Contact",
          "feed.sale": "For sale", "feed.expo": "On display",
          "profile.stat.total": "Total", "profile.stat.sale": "For sale", "profile.stat.expo": "On display",
          "profile.editBtn": "Edit details",
          "profile.edit.title": "Profile details", "profile.edit.changeAvatar": "Choose photo",
          "profile.edit.avatarHint": "JPG or PNG, up to 8MB",
          "profile.edit.fullname": "Full name", "profile.edit.email": "Email",
          "profile.edit.bio": "Bio", "profile.edit.bioPh": "A short line about yourself...",
          "profile.edit.phone": "Phone number", "profile.edit.social": "Social media link",
          "profile.edit.privacyTitle": "Choose what others can see on your profile:",
          "profile.edit.privacyPhone": "Show my phone number",
          "profile.edit.privacySocial": "Show my social media link",
          "profile.edit.privacyEmail": "Show my email",
          "profile.edit.save": "Save", "profile.edit.cancel": "Cancel",
          "profile.myWorks": "My works", "profile.language": "Site language",
          "profile.joined": "Joined",
          "profile.online": "Online", "profile.offline": "Offline",
          "profile.avatarUploadFail": "Couldn't upload the photo. Please try again.",
          "account.title": "Login & password",
          "account.usernameLabel": "Username (login)",
          "account.usernameHint": "Others find you by this name, and you use it to log in.",
          "account.currentPassword": "Current password", "account.currentPasswordPh": "enter to make changes", "account.currentPasswordHint": "Enter your current password to save changes.",
          "account.newPassword": "New password", "account.newPasswordPh": "optional, at least 4 characters",
          "account.newPassword2": "Confirm new password", "account.newPassword2Ph": "type it again",
          "account.save": "Save", "account.saved": "Saved!",
          "account.err.noChanges": "Nothing was changed.",
          "account.err.currentPasswordRequired": "Enter your current password to continue.",
          "account.err.currentPasswordIncorrect": "Current password is incorrect.",
          "account.err.usernameInvalid": "Username must be 3-32 characters, letters/numbers/underscore only.",
          "account.err.usernameTaken": "This username is already taken.",
          "account.err.passwordTooShort": "New password must be at least 4 characters.",
          "account.err.mismatch": "New passwords don't match.",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "You can't ban another administrator",
          "err.cannotMuteAdmin": "You can't mute another administrator",
          "err.callBlocked": "This user has restricted video calls",
          "err.commentDeleteForbidden": "You don't have permission to delete this comment",
          "err.userBusy": "This user is currently busy",
          "err.usernameInvalid": "Username must be 3-32 characters, Latin letters/numbers/underscore only",
          "err.loginInvalid": "Incorrect username or password",
          "err.tooManyAttempts": "Too many attempts, please try again shortly",
          "err.unknownMessageType": "Unknown message type",
          "err.invalidData": "Invalid data",
          "err.invalidQuantity": "Invalid quantity",
          "err.cannotCartOwnWork": "You can't add your own work to the cart",
          "err.cannotBuyOwnWork": "You can't buy your own work",
          "err.cannotFollowSelf": "You can't follow yourself",
          "err.cannotCallSelf": "You can't call yourself",
          "err.cannotMessageSelf": "You can't message yourself",
          "err.cannotBanSelf": "You can't ban yourself",
          "err.cannotMuteSelf": "You can't mute yourself",
          "err.passwordTooShort": "Password must be at least 4 characters",
          "err.callAlreadyEnded": "The call has already ended",
          "err.callNotFound": "Call not found",
          "err.registerServerError": "Server error during registration",
          "err.cartEmpty": "Cart is empty",
          "err.muted": "You're temporarily muted, so you can't perform this action",
          "err.callAlreadyActive": "You already have an active call",
          "err.videoProcessingFailed": "Something went wrong processing the video. Please choose another one.",
          "err.messageEmpty": "Message text can't be empty",
          "err.workNotFound": "Work not found",
          "err.authRequired": "Please log in first",
          "err.adminRequired": "Administrator access is required for this action",
          "err.workNotInCart": "This work isn't in your cart",
          "err.workNotForSale": "This work isn't for sale",
          "err.workOutOfStock": "This work is out of stock",
          "err.usernameTaken": "This username is already taken",
          "err.onlyCallerCanCancel": "Only the caller can cancel",
          "err.onlyCallerCanOffer": "Only the caller can send an offer",
          "err.onlyCalleeCanAnswer": "Only the recipient can answer",
          "err.onlyCalleeCanDecline": "Only the recipient can decline",
          "err.fileRequired": "A file is required",
          "err.userNotFound": "User not found",
          "err.accountBanned": "Your account is temporarily blocked (banned)",
          "err.mediaRequired": "At least one photo or video is required",
          "err.loginServerError": "Server error while logging in",
          "err.commentEmpty": "Comment text can't be empty",
          "err.commentNotFound": "Comment not found",
          "err.imageRequired": "An image is required",
          "err.serverError": "Server error",
          "err.reportNotFound": "Report not found",
          "err.noChanges": "Nothing was changed",
          "err.currentPasswordRequired": "Enter your current password to continue",
          "err.currentPasswordIncorrect": "Current password is incorrect",
          "err.videoWithOtherFiles": "You can't upload a video together with other files — choose just one video",
          "err.videoTooLong10s": "The video must not be longer than 10 seconds",
          "err.invalidWorkMediaType": "Only photo or video files (mp4/mov, up to 10 seconds) are accepted",
          "err.dangerousFileType": "This type of file can't be sent",
          "err.onlyImagesAllowed": "Only image files are accepted",
          "err.onlyVideosAllowed": "Only video files are accepted",
          "err.onlyAudioAllowed": "Only audio files are accepted",
          "err.fileTooLarge": "The file is too large",
          "err.tooManyFiles": "Too many files uploaded",
          "err.uploadError": "Something went wrong uploading the file",
          "err.notEnoughStock": "Only {n} left in stock",
          "err.videoTooLong": "Video is too long (maximum {n} seconds)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 Photo",
          "chat.preview.video": "🎥 Video",
          "chat.preview.circle": "⭕ Video message",
          "chat.preview.voice": "🎙️ Voice message",
          "chat.preview.file": "📎 File",
          "chat.voiceAria": "Voice message", "chat.circleAria": "Video message",
          "filter.typeAria": "Category", "filter.sortAria": "Sort", "chat.emojiAria": "Emoji",
          "messages.eyebrow": "Conversations", "messages.title": "Messages with <span>sellers</span>",
          "messages.sub": "Ask about a piece for sale or reach out to a seller — your chats live here.",
          "messages.empty.title": "No conversations yet",
          "messages.empty.desc": "Tap \"Contact\" under any piece for sale to message the seller.",
          "messages.loadFail.title": "Couldn't load", "messages.loadFail.desc": "Check your connection and try again.",
          "messages.you": "You",
          "userProfile.back": "← Back", "userProfile.works": "Works",
          "userProfile.notFound.title": "Not found", "userProfile.notFound.desc": "This user doesn't exist.",
          "userProfile.contactBtn": "Send a message",
          "upload.title": "Upload a new work",
          "upload.imagesLabel": "Photos or a video (1–3 photos, or one video up to 10s)",
          "upload.dropDefault": "Click to choose photos/video or drop them here — up to 3 photos, or one video up to 10s",
          "upload.dropChosen": "{n}/{max} photos chosen — click to add more",
          "upload.dropFull": "3 photos chosen — shown as a collage",
          "upload.titleLabel": "Title", "upload.titlePh": "e.g. \"Autumn landscape\"",
          "upload.typeLabel": "Type", "upload.type.rasm": "Painting / drawing", "upload.type.haykal": "Sculpture",
          "upload.type.mulaj": "Model", "upload.type.boshqa": "Other", "upload.type.otherPh": "Enter the type",
          "upload.statusLabel": "Status", "upload.status.expo": "Display only", "upload.status.sale": "For sale",
          "upload.priceLabel": "Price", "upload.currencyLabel": "Currency",
          "upload.stockLabel": "Availability", "upload.stock.fixed": "Fixed quantity", "upload.stock.order": "Made to order", "upload.stock.qtyPh": "How many are available?",
          "stock.order": "Made to order", "stock.out": "Sold out", "stock.left": "{n} left",
          "upload.descLabel": "Description", "upload.descPh": "A short description of the piece...",
          "upload.save": "Save", "upload.removeAria": "Remove",
                    "upload.errNoImage": "Please choose at least one photo.",
          "upload.errVideoTooLong": "Video must be 10 seconds or shorter.",
          "upload.errVideoWithImages": "You can't upload a video together with photos.",
          "upload.videoNotSupported": "Your browser could not check the video. Please choose another file.",
          "upload.errGeneric": "Something went wrong while saving. Please try again.",
          "lightbox.editStatus": "Change status",
          "lightbox.delete": "Delete", "lightbox.noDesc": "No description provided.",
          "lightbox.workTagFallback": "Work",
          "comments.title": "Comments", "comments.ph": "Write a comment...", "comments.send": "Send",
          "comments.empty": "No comments yet. Be the first to write one!",
          "comments.loading": "Loading...", "comments.loadFail": "Couldn't load comments.",
          "comments.delete": "Delete",
          "chat.ph": "Write a message...", "chat.workRefPrefix": "About",
          "chat.loadFail": "Couldn't load the conversation.", "chat.empty": "No messages yet. Be the first to write one!",
          "chat.sendFail": "Message not sent. Please try again.",
          "chat.attach.media": "Photo / Video", "chat.attach.file": "File",
          "chat.micDenied": "Microphone or camera access was denied",
          "chat.recordingVoice": "Recording voice message...", "chat.recordingCircle": "Recording video message...",
          "chat.mediaSendFail": "File wasn't sent. Please try again.",
          "chat.attachTitle": "Attach a file", "chat.circleTitle": "Video message (click to record)",
          "chat.voiceTitle": "Voice message (click to record)", "chat.recordCancelTitle": "Cancel", "chat.recordSendTitle": "Send",
          "call.startTitle": "Video call", "call.incoming": "Video calling...",
          "call.decline": "Decline", "call.accept": "Accept", "call.calling": "Calling...",
          "call.connecting": "Connecting...", "call.peerCameraOff": "Camera is off",
          "call.toggleMic": "Microphone", "call.toggleCam": "Camera", "call.end": "End call",
          "call.startFail": "Couldn't place the call. Please try again.",
          "call.noCamera": "No camera found, connecting with audio only...",
          "call.noMediaAccess": "Microphone/camera access was denied.",
          "call.wasDeclined": "Call declined", "call.wasMissed": "No answer",
          "call.wasBusy": "User is busy", "call.ended": "Call ended",
          "call.msg.ended": "Video call", "call.msg.noAnswer": "No answer",
          "call.msg.missed": "Missed call", "call.msg.declined": "Declined call",
          "call.msg.cancelled": "Cancelled call", "call.msg.busy": "User was busy",
          "profile.edit.callPrivacyTitle": "Choose who can video call you:",
          "profile.edit.callPrivacyEveryone": "Everyone", "profile.edit.callPrivacySelected": "Only selected people",
          "profile.edit.callPrivacyNobody": "No one",
          "profile.edit.callPrivacyAddPh": "Enter a username...", "profile.edit.callPrivacyAdd": "Add",
          "profile.edit.callPrivacyEmpty": "No one added yet.",
          "profile.edit.callPrivacyRemove": "Remove",
          "profile.edit.callPrivacyAddSelfErr": "You can't add yourself.",
          "profile.edit.callPrivacyAddNotFound": "No such user found.",
          "gate.title": "Please sign up",
          "gate.desc": "You're currently browsing as a guest. This action needs an account — you can sign up now or later.",
          "gate.later": "Later", "gate.register": "Sign up",
          "theme.fabTitle": "Change style", "theme.title": "Site style",
          "theme.tungi": "Night", "theme.yorug": "Light", "theme.cyberpunk": "Cyberpunk", "theme.cyberpunkBlue": "Cyberpunk blue", "theme.cyberpunkYellow": "Cyberpunk yellow", "theme.custom": "Custom",
          "theme.customPick": "Pick your own color",
          "admin.nav": "Admin corner",
          "admin.eyebrow": "Moderation",
          "admin.title": "Admin <span>corner</span>",
          "admin.sub": "All users — ban or mute them, or lift a restriction early.",
          "admin.loading": "Loading...",
          "admin.loadFail": "Couldn't load users.",
          "admin.empty": "No users yet.",
          "admin.lastSeen.never": "Never visited the site",
          "admin.lastSeen.justNow": "Online right now",
          "admin.lastSeen.minutesAgo": "Last seen {n} min ago",
          "admin.lastSeen.hoursAgo": "Last seen {n} h ago",
          "admin.lastSeen.daysAgo": "Last seen {n} d ago",
          "admin.lastSeen.onDate": "Last seen on {date}",
          "admin.badge.admin": "Admin", "admin.badge.banned": "Banned", "admin.badge.muted": "Muted",
          "admin.badge.ok": "Active",
          "admin.status.bannedUntil": "Banned until {date}",
          "admin.status.mutedUntil": "Muted until {date}",
          "admin.action.ban": "Ban", "admin.action.unban": "Unban",
          "admin.action.mute": "Mute", "admin.action.unmute": "Unmute",
          "admin.actionFail": "Couldn't complete the action.",
          "admin.confirm.unban": "Lift this user's ban early?",
          "admin.confirm.unmute": "Lift this user's mute early?",
          "admin.mod.title": "Restrict a user",
          "admin.mod.titleBan": "Ban @{username}",
          "admin.mod.titleMute": "Mute @{username}",
          "admin.mod.minutes": "Duration (minutes)",
          "admin.mod.reason": "Reason (optional)",
          "admin.mod.reasonPh": "Reason for the violation...",
          "admin.mod.confirm": "Confirm",
          "admin.mod.errMinutes": "Enter a valid duration (at least 1 minute).",
          "ban.title": "Your account is blocked",
          "ban.until": "Ban expires: {date}.",
          "ban.reason": "Reason: {reason}",
          "mute.banner": "You're temporarily muted — you can't comment, message, or upload new work.",
          "mute.bannerReason": "You're muted until {date}. Reason: {reason}",
          "mute.bannerNoReason": "You're muted until {date} — you can't comment, message, or upload new work.",
          "notif.banReason": "Administrator banned you until {date}. Reason: {reason}",
          "notif.banNoReason": "Administrator banned you until {date}.",
          "notif.muteReason": "Administrator muted you until {date} (you can't comment, message, or upload new work). Reason: {reason}",
          "notif.muteNoReason": "Administrator muted you until {date} (you can't comment, message, or upload new work).",
          "notif.unban": "Administrator lifted your ban early. You can use your account again.",
          "notif.unmute": "Administrator lifted your mute early. You can comment, message, and upload new work again.",
          "notif.banExpired": "Your ban has expired. You can use your account again.",
          "notif.muteExpired": "Your mute has expired. You can comment, message, and upload new work again.",
          "nav.cart": "Cart",
          "search.placeholder": "Search...", "filter.type.all": "All types", "filter.sort.new": "Newest", "filter.sort.top": "Most liked", "filter.price.min": "Price from", "filter.price.max": "Price to", "filter.onlyFollowing": "Only who I follow",
          "search.clearAria": "Clear",
          "search.closeAria": "Close",
          "cart.eyebrow": "Shopping",
          "cart.title": "Your <span>cart</span>",
          "cart.sub": "Works you've added to your cart are here — adjust quantities and place your order.",
          "profile.stat.followers": "Followers",
          "profile.stat.following": "Following",
          "profile.stat.likes": "Likes",
          "profile.stat.comments": "Comments", "profile.stat.views": "Views",
          "admin.reportsLabel": "Reports",
          "admin.usersLabel": "Users",
          "report.action": "Report",
          "report.reasonLabel": "Reason",
          "report.reasonPh": "Why are you reporting this? (optional)",
          "report.submitBtn": "Submit",
          "report.sentAlert": "Your report has been received. We'll review it.",
          "admin.stat.users": "Users",
          "admin.stat.todayHint": "+{count} today",
          "admin.stat.works": "Works",
          "admin.stat.likes": "Likes",
          "admin.stat.comments": "Comments",
          "admin.stat.openReports": "Open reports",
          "admin.stat.banMute": "Ban/Mute",
          "admin.report.typeWork": "Work",
          "admin.report.typeUser": "User",
          "admin.report.subjectWork": "Work: \"{title}\"",
          "admin.report.subjectUser": "User: @{username}",
          "admin.report.gone": "(already deleted)",
          "admin.report.reporter": "Reporter: @{username} ({fullname})",
          "admin.report.resolved": "✓ Reviewed",
          "admin.report.resolvedDeleted": " · image deleted",
          "admin.report.resolveBtn": "Mark as reviewed",
          "admin.report.deleteWorkBtn": "Delete image",
          "admin.report.deleteConfirm": "Do you want to permanently delete this work's image? This action cannot be undone.",
          "admin.report.empty": "No reports yet.",
          "follow.subscribeBtn": "Follow",
          "follow.unsubscribeBtn": "Unfollow",
          "follow.unfollowConfirm": "Do you want to unfollow? You will no longer be notified about this user's new works.",
          "follow.stats": "{followers} followers · {following} following",
          "follow.short": "Following",
          "follow.shortAdd": "+ Follow",
          "notif.follow": "{name} started following you",
          "save.aria": "Save",
          "share.aria": "Share", "share.linkCopied": "Link copied: {url}", "share.copyPrompt": "Copy the link:",
          "feedThumb.aria": "View image in full size",
          "notif.someone": "Someone",
      },
        zh: {
          _locale: 'zh-CN', _dir: 'ltr', _name: "中文",
          "auth.tagline": "保存您亲手制作的绘画、雕塑和模型 — 可以出售，也可以只是展示。",
          "auth.tabLogin": "登录", "auth.tabRegister": "注册",
          "auth.loginUsername": "用户名", "auth.loginUsernamePh": "例如：dilnoza_art",
          "auth.loginPassword": "密码", "auth.loginBtn": "登录",
          "common.serverError": "服务器错误",
          "auth.loginErrorDefault": "用户名或密码不正确。",
          "auth.regFullname": "全名", "auth.regFullnamePh": "姓名",
          "auth.regUsername": "用户名", "auth.regUsernamePh": "拉丁字母，无空格",
          "auth.regEmail": "邮箱",
          "auth.regPassword": "密码", "auth.regPasswordPh": "至少4个字符",
          "auth.regPassword2": "确认密码", "auth.regPassword2Ph": "再次输入",
          "auth.regBtn": "创建账户",
          "auth.regErrorShort": "密码必须至少4个字符。",
          "auth.regErrorMismatch": "两次输入的密码不一致。",
          "auth.pwWeak": "弱", "auth.pwMedium": "中等", "auth.pwStrong": "强",
          "auth.pwMatch": "匹配", "auth.pwNoMatch": "不匹配",
          "auth.regErrorDefault": "注册时出错。",
          "auth.or": "或",
          "auth.guestBtn": "先随便看看",
          "auth.guestBtnSmall": "您可以稍后注册",
          "nav.home": "首页", "nav.profile": "个人资料", "nav.messages": "消息",
          "nav.newWork": "+", "nav.myProfile": "我的主页", "nav.logout": "退出登录",
          "nav.register": "注册",
          "guest.banner": "您正以<b>访客</b>身份浏览 — 注册后即可上传作品、点赞和评论。",
          "guest.registerBtn": "注册",
          "home.eyebrow": "动态", "home.title": "<span>所有创作者</span>的作品",
          "home.sub": "平台上所有用户上传的作品 — 按最新排序。",
          "feed.end": "没有更多作品了。",
          "feed.empty.title": "这里还什么都没有", "feed.empty.desc": "上传您的第一件作品，开始您的收藏吧。",
          "cart.loading": "加载中...", "cart.empty.title": "购物车是空的",
          "cart.empty.desc": "点击喜欢的作品上的购物车图标，将它们添加到这里。",
          "cart.addAria": "加入购物车", "cart.increaseAria": "增加数量", "cart.decreaseAria": "减少数量",
          "buyNow.aria": "立即购买",
          "buyNow.confirm": "立即购买 {item} 吗？",
          "buyNow.success": "您的订单已提交！",
          "buyNow.fail": "出错了，请重试。",
          "cart.removeAria": "从购物车中移除", "cart.subtotal": "小计", "cart.checkout": "下单",
          "cart.checkoutConfirm": "确认下单吗？", "cart.orderPlaced": "您的订单已提交！卖家会尽快与您联系。",
          "cart.orderFail": "下单失败",
          "notif.orderReceived": "{name} 订购了您的 {count} 件作品。", "notif.orderPlaced": "您的订单已成功提交。",
          "profile.empty.desc": "上传您的第一件作品，开始您的收藏吧。",
          "feed.likeAria": "点赞", "feed.commentAria": "评论",
          "feed.contactAria": "联系卖家", "feed.contactLabel": "联系",
          "feed.sale": "出售中", "feed.expo": "展览中",
          "profile.stat.total": "总数", "profile.stat.sale": "出售中", "profile.stat.expo": "展览中",
          "profile.editBtn": "编辑资料",
          "profile.edit.title": "个人资料信息", "profile.edit.changeAvatar": "选择照片",
          "profile.edit.avatarHint": "JPG 或 PNG，最大 8MB",
          "profile.edit.fullname": "全名", "profile.edit.email": "邮箱",
          "profile.edit.bio": "简介", "profile.edit.bioPh": "简单介绍一下自己...",
          "profile.edit.phone": "电话号码", "profile.edit.social": "社交媒体链接",
          "profile.edit.privacyTitle": "选择他人可以在您的主页上看到的内容：",
          "profile.edit.privacyPhone": "显示我的电话号码",
          "profile.edit.privacySocial": "显示我的社交媒体链接",
          "profile.edit.privacyEmail": "显示我的邮箱",
          "profile.edit.save": "保存", "profile.edit.cancel": "取消",
          "profile.myWorks": "我的作品", "profile.language": "网站语言",
          "profile.joined": "加入时间",
          "profile.online": "在线", "profile.offline": "离线",
          "profile.avatarUploadFail": "照片上传失败，请重试。",
          "account.title": "登录名与密码",
          "account.usernameLabel": "用户名（登录名）",
          "account.usernameHint": "其他人通过该名称找到您，登录时也使用它。",
          "account.currentPassword": "当前密码", "account.currentPasswordPh": "输入以进行更改", "account.currentPasswordHint": "输入当前密码以保存更改。",
          "account.newPassword": "新密码", "account.newPasswordPh": "可选，至少4个字符",
          "account.newPassword2": "确认新密码", "account.newPassword2Ph": "再次输入",
          "account.save": "保存", "account.saved": "已保存！",
          "account.err.noChanges": "没有任何更改。",
          "account.err.currentPasswordRequired": "请输入当前密码以继续。",
          "account.err.currentPasswordIncorrect": "当前密码不正确。",
          "account.err.usernameInvalid": "用户名须为3-32个字符，仅限字母、数字和下划线。",
          "account.err.usernameTaken": "该用户名已被占用。",
          "account.err.passwordTooShort": "新密码至少需要4个字符。",
          "account.err.mismatch": "两次输入的新密码不一致。",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "您不能封禁其他管理员",
          "err.cannotMuteAdmin": "您不能禁言其他管理员",
          "err.callBlocked": "该用户已限制视频通话",
          "err.commentDeleteForbidden": "您无权删除此评论",
          "err.userBusy": "该用户当前忙线中",
          "err.usernameInvalid": "用户名须为3-32个字符，仅限拉丁字母、数字和下划线",
          "err.loginInvalid": "用户名或密码错误",
          "err.tooManyAttempts": "尝试次数过多，请稍后再试",
          "err.unknownMessageType": "未知的消息类型",
          "err.invalidData": "数据无效",
          "err.invalidQuantity": "数量无效",
          "err.cannotCartOwnWork": "您不能将自己的作品加入购物车",
          "err.cannotBuyOwnWork": "您不能购买自己的作品",
          "err.cannotFollowSelf": "您不能关注自己",
          "err.cannotCallSelf": "您不能给自己打电话",
          "err.cannotMessageSelf": "您不能给自己发消息",
          "err.cannotBanSelf": "您不能封禁自己",
          "err.cannotMuteSelf": "您不能禁言自己",
          "err.passwordTooShort": "密码至少需要4个字符",
          "err.callAlreadyEnded": "通话已结束",
          "err.callNotFound": "未找到通话",
          "err.registerServerError": "注册时服务器出错",
          "err.cartEmpty": "购物车为空",
          "err.muted": "您当前处于禁言状态，无法执行此操作",
          "err.callAlreadyActive": "您已有正在进行的通话",
          "err.videoProcessingFailed": "处理视频时出错，请选择其他视频。",
          "err.messageEmpty": "消息内容不能为空",
          "err.workNotFound": "未找到该作品",
          "err.authRequired": "请先登录",
          "err.adminRequired": "此操作需要管理员权限",
          "err.workNotInCart": "购物车中未找到该作品",
          "err.workNotForSale": "该作品不出售",
          "err.workOutOfStock": "该作品已售罄",
          "err.usernameTaken": "该用户名已被占用",
          "err.onlyCallerCanCancel": "只有拨打方可以取消",
          "err.onlyCallerCanOffer": "只有拨打方可以发送邀请",
          "err.onlyCalleeCanAnswer": "只有接听方可以接听",
          "err.onlyCalleeCanDecline": "只有接听方可以拒绝",
          "err.fileRequired": "需要提供文件",
          "err.userNotFound": "未找到该用户",
          "err.accountBanned": "您的账号已被暂时封禁",
          "err.mediaRequired": "至少需要一张照片或一个视频",
          "err.loginServerError": "登录时服务器出错",
          "err.commentEmpty": "评论内容不能为空",
          "err.commentNotFound": "未找到该评论",
          "err.imageRequired": "需要提供图片",
          "err.serverError": "服务器错误",
          "err.reportNotFound": "未找到该举报",
          "err.noChanges": "没有任何更改",
          "err.currentPasswordRequired": "请输入当前密码以继续",
          "err.currentPasswordIncorrect": "当前密码不正确",
          "err.videoWithOtherFiles": "视频不能与其他文件一起上传——请只选择一个视频",
          "err.videoTooLong10s": "视频时长不能超过10秒",
          "err.invalidWorkMediaType": "仅接受照片或视频文件（mp4/mov，最长10秒）",
          "err.dangerousFileType": "无法发送此类型的文件",
          "err.onlyImagesAllowed": "仅接受图片文件",
          "err.onlyVideosAllowed": "仅接受视频文件",
          "err.onlyAudioAllowed": "仅接受音频文件",
          "err.fileTooLarge": "文件太大",
          "err.tooManyFiles": "上传的文件过多",
          "err.uploadError": "上传文件时出错",
          "err.notEnoughStock": "仅剩 {n} 件",
          "err.videoTooLong": "视频过长（最长 {n} 秒）",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 图片",
          "chat.preview.video": "🎥 视频",
          "chat.preview.circle": "⭕ 视频消息",
          "chat.preview.voice": "🎙️ 语音消息",
          "chat.preview.file": "📎 文件",
          "chat.voiceAria": "语音消息", "chat.circleAria": "视频消息",
          "filter.typeAria": "类别", "filter.sortAria": "排序", "chat.emojiAria": "表情符号",
          "messages.eyebrow": "交流", "messages.title": "与<span>卖家</span>的消息",
          "messages.sub": "在这里可以询问出售中的作品，或联系卖家 — 所有对话都在这里。",
          "messages.empty.title": "还没有对话",
          "messages.empty.desc": "点击出售中作品下方的“联系”按钮，给卖家发消息。",
          "messages.loadFail.title": "加载失败", "messages.loadFail.desc": "请检查网络连接后重试。",
          "messages.you": "我",
          "userProfile.back": "← 返回", "userProfile.works": "作品",
          "userProfile.notFound.title": "未找到", "userProfile.notFound.desc": "该用户不存在。",
          "userProfile.contactBtn": "发消息",
          "upload.title": "上传新作品",
          "upload.imagesLabel": "照片或视频（1至3张照片，或1段最长10秒的视频）",
          "upload.dropDefault": "点击选择照片/视频或拖放到此处 — 最多3张照片，或1段最长10秒的视频",
          "upload.dropChosen": "已选择 {n}/{max} 张照片 — 点击继续添加",
          "upload.dropFull": "已选择3张照片 — 将以拼图形式展示",
          "upload.titleLabel": "标题", "upload.titlePh": "例如：《秋日风景》",
          "upload.typeLabel": "类型", "upload.type.rasm": "绘画", "upload.type.haykal": "雕塑",
          "upload.type.mulaj": "模型", "upload.type.boshqa": "其他", "upload.type.otherPh": "请输入类型",
          "upload.statusLabel": "状态", "upload.status.expo": "仅展示", "upload.status.sale": "出售中",
          "upload.priceLabel": "价格", "upload.currencyLabel": "货币",
          "upload.stockLabel": "库存情况", "upload.stock.fixed": "固定数量", "upload.stock.order": "按需定制", "upload.stock.qtyPh": "有多少件？",
          "stock.order": "按需定制", "stock.out": "已售罄", "stock.left": "仅剩 {n} 件",
          "upload.descLabel": "描述", "upload.descPh": "简单描述一下这件作品...",
          "upload.save": "保存", "upload.removeAria": "移除",
                    "upload.errNoImage": "请至少选择一张照片。",
          "upload.errVideoTooLong": "视频时长不能超过10秒。",
          "upload.errVideoWithImages": "不能将视频与照片一起上传。",
          "upload.videoNotSupported": "您的浏览器无法检查该视频，请选择其他文件。",
          "upload.errGeneric": "保存时出错，请重试。",
          "lightbox.editStatus": "更改状态",
          "lightbox.delete": "删除", "lightbox.noDesc": "未提供描述。",
          "lightbox.workTagFallback": "作品",
          "comments.title": "评论", "comments.ph": "写评论...", "comments.send": "发送",
          "comments.empty": "还没有评论，快来抢沙发吧！",
          "comments.loading": "加载中...", "comments.loadFail": "评论加载失败。",
          "comments.delete": "删除",
          "chat.ph": "输入消息...", "chat.workRefPrefix": "关于",
          "chat.loadFail": "对话加载失败。", "chat.empty": "还没有消息，快来发第一条吧！",
          "chat.sendFail": "消息发送失败，请重试。",
          "chat.attach.media": "照片/视频", "chat.attach.file": "文件",
          "chat.micDenied": "麦克风或摄像头权限被拒绝",
          "chat.recordingVoice": "正在录制语音消息...", "chat.recordingCircle": "正在录制视频消息...",
          "chat.mediaSendFail": "文件发送失败，请重试。",
          "chat.attachTitle": "添加附件", "chat.circleTitle": "视频消息（点击录制）",
          "chat.voiceTitle": "语音消息（点击录制）", "chat.recordCancelTitle": "取消", "chat.recordSendTitle": "发送",
          "gate.title": "请注册",
          "gate.desc": "您目前以访客身份浏览。此操作需要账户 — 您可以现在注册，也可以稍后再说。",
          "gate.later": "稍后", "gate.register": "注册",
          "theme.fabTitle": "更改样式", "theme.title": "网站样式",
          "theme.tungi": "夜间", "theme.yorug": "明亮", "theme.cyberpunk": "赛博朋克", "theme.cyberpunkBlue": "赛博朋克蓝", "theme.cyberpunkYellow": "赛博朋克黄", "theme.custom": "自定义",
          "theme.customPick": "选择您自己的颜色",
          "admin.nav": "管理员角",
          "admin.eyebrow": "管理",
          "admin.title": "管理员<span>角</span>",
          "admin.sub": "所有用户 — 封禁或禁言，或提前解除限制。",
          "admin.loading": "加载中...",
          "admin.loadFail": "无法加载用户。",
          "admin.empty": "暂无用户。",
          "admin.lastSeen.never": "从未访问过网站",
          "admin.lastSeen.justNow": "当前在线",
          "admin.lastSeen.minutesAgo": "{n} 分钟前在线",
          "admin.lastSeen.hoursAgo": "{n} 小时前在线",
          "admin.lastSeen.daysAgo": "{n} 天前在线",
          "admin.lastSeen.onDate": "最后在线于 {date}",
          "admin.badge.admin": "管理员", "admin.badge.banned": "已封禁", "admin.badge.muted": "已禁言",
          "admin.badge.ok": "正常",
          "admin.status.bannedUntil": "封禁至 {date}",
          "admin.status.mutedUntil": "禁言至 {date}",
          "admin.action.ban": "封禁", "admin.action.unban": "解除封禁",
          "admin.action.mute": "禁言", "admin.action.unmute": "解除禁言",
          "admin.actionFail": "无法完成操作。",
          "admin.confirm.unban": "确定要提前解除该用户的封禁吗？",
          "admin.confirm.unmute": "确定要提前解除该用户的禁言吗？",
          "admin.mod.title": "限制用户",
          "admin.mod.titleBan": "封禁 @{username}",
          "admin.mod.titleMute": "禁言 @{username}",
          "admin.mod.minutes": "时长（分钟）",
          "admin.mod.reason": "原因（可选）",
          "admin.mod.reasonPh": "违规原因...",
          "admin.mod.confirm": "确认",
          "admin.mod.errMinutes": "请输入有效时长（至少1分钟）。",
          "ban.title": "您的账户已被封禁",
          "ban.until": "封禁截止：{date}。",
          "ban.reason": "原因：{reason}",
          "mute.banner": "您暂时被禁言 — 无法评论、发消息或上传新作品。",
          "mute.bannerReason": "您被禁言至 {date}。原因：{reason}",
          "mute.bannerNoReason": "您被禁言至 {date} — 无法评论、发消息或上传新作品。",
          "notif.banReason": "管理员已将您封禁至 {date}。原因：{reason}",
          "notif.banNoReason": "管理员已将您封禁至 {date}。",
          "notif.muteReason": "管理员已将您禁言至 {date}（无法评论/发消息/上传作品）。原因：{reason}",
          "notif.muteNoReason": "管理员已将您禁言至 {date}（无法评论/发消息/上传作品）。",
          "notif.unban": "管理员已提前解除您的封禁。您可以再次使用账户。",
          "notif.unmute": "管理员已提前解除您的禁言。您可以再次评论、发消息和上传作品。",
          "notif.banExpired": "您的封禁期已结束。您可以再次使用账户。",
          "notif.muteExpired": "您的禁言期已结束。您可以再次评论、发消息和上传作品。",
          "nav.cart": "购物车",
          "search.placeholder": "搜索...", "filter.type.all": "所有类型", "filter.sort.new": "最新", "filter.sort.top": "最多点赞", "filter.price.min": "价格从", "filter.price.max": "价格到", "filter.onlyFollowing": "仅我关注的人",
          "search.clearAria": "清除",
          "search.closeAria": "关闭",
          "cart.eyebrow": "购物",
          "cart.title": "您的<span>购物车</span>",
          "cart.sub": "您添加到购物车的作品都在这里——调整数量并下单。",
          "profile.stat.followers": "粉丝",
          "profile.stat.following": "关注",
          "profile.stat.likes": "点赞",
          "profile.stat.comments": "评论", "profile.stat.views": "浏览量",
          "admin.reportsLabel": "举报",
          "admin.usersLabel": "用户",
          "report.action": "举报",
          "report.reasonLabel": "原因",
          "report.reasonPh": "您举报的原因是什么？（可选）",
          "report.submitBtn": "提交",
          "report.sentAlert": "您的举报已收到，我们将进行审核。",
          "admin.stat.users": "用户",
          "admin.stat.todayHint": "今日 +{count}",
          "admin.stat.works": "作品",
          "admin.stat.likes": "点赞",
          "admin.stat.comments": "评论",
          "admin.stat.openReports": "待处理举报",
          "admin.stat.banMute": "封禁/禁言",
          "admin.report.typeWork": "作品",
          "admin.report.typeUser": "用户",
          "admin.report.subjectWork": "作品：《{title}》",
          "admin.report.subjectUser": "用户：@{username}",
          "admin.report.gone": "（已删除）",
          "admin.report.reporter": "举报人：@{username}（{fullname}）",
          "admin.report.resolved": "✓ 已处理",
          "admin.report.resolvedDeleted": " · 图片已删除",
          "admin.report.resolveBtn": "标记为已处理",
          "admin.report.deleteWorkBtn": "删除图片",
          "admin.report.deleteConfirm": "您要永久删除该作品的图片吗？此操作无法撤销。",
          "admin.report.empty": "暂无举报。",
          "follow.subscribeBtn": "关注",
          "follow.unsubscribeBtn": "取消关注",
          "follow.unfollowConfirm": "您要取消关注吗？您将不再收到该用户新作品的通知。",
          "follow.stats": "{followers} 位粉丝 · 关注 {following} 人",
          "follow.short": "已关注",
          "follow.shortAdd": "+ 关注",
          "notif.follow": "{name} 关注了您",
          "save.aria": "保存",
          "share.aria": "分享", "share.linkCopied": "链接已复制：{url}", "share.copyPrompt": "复制链接：",
          /* ---- video call feature (previously missing from this language) ---- */
          "call.startTitle": "视频通话",
          "call.incoming": "正在视频通话...",
          "call.decline": "拒绝",
          "call.accept": "接受",
          "call.calling": "正在呼叫...",
          "call.connecting": "正在连接...",
          "call.peerCameraOff": "摄像头已关闭",
          "call.toggleMic": "麦克风",
          "call.toggleCam": "摄像头",
          "call.end": "结束通话",
          "call.startFail": "无法拨打电话，请重试。",
          "call.noCamera": "未找到摄像头，仅以语音方式连接...",
          "call.noMediaAccess": "麦克风/摄像头访问被拒绝。",
          "call.wasDeclined": "通话被拒绝",
          "call.wasMissed": "无人接听",
          "call.wasBusy": "用户正忙",
          "call.ended": "通话已结束",
          "call.msg.ended": "视频通话",
          "call.msg.noAnswer": "无人接听",
          "call.msg.missed": "未接来电",
          "call.msg.declined": "已拒绝的通话",
          "call.msg.cancelled": "已取消的通话",
          "call.msg.busy": "用户当时正忙",
          "profile.edit.callPrivacyTitle": "选择谁可以给您打视频电话：",
          "profile.edit.callPrivacyEveryone": "所有人",
          "profile.edit.callPrivacySelected": "仅限所选人员",
          "profile.edit.callPrivacyNobody": "任何人都不可以",
          "profile.edit.callPrivacyAddPh": "输入用户名...",
          "profile.edit.callPrivacyAdd": "添加",
          "profile.edit.callPrivacyEmpty": "尚未添加任何人。",
          "profile.edit.callPrivacyRemove": "移除",
          "profile.edit.callPrivacyAddSelfErr": "您不能添加自己。",
          "profile.edit.callPrivacyAddNotFound": "未找到该用户。",
          "feedThumb.aria": "查看大图",
          "notif.someone": "有人",
      },
        hi: {
          _locale: 'hi-IN', _dir: 'ltr', _name: "हिन्दी",
          "auth.tagline": "अपने हाथों से बनाई गई पेंटिंग, मूर्तियाँ और मॉडल सहेजें — बिक्री के लिए रखें या बस प्रदर्शित करें।",
          "auth.tabLogin": "लॉग इन करें", "auth.tabRegister": "साइन अप करें",
          "auth.loginUsername": "उपयोगकर्ता नाम", "auth.loginUsernamePh": "उदाहरण: dilnoza_art",
          "auth.loginPassword": "पासवर्ड", "auth.loginBtn": "लॉग इन करें",
          "common.serverError": "सर्वर त्रुटि",
          "auth.loginErrorDefault": "उपयोगकर्ता नाम या पासवर्ड गलत है।",
          "auth.regFullname": "पूरा नाम", "auth.regFullnamePh": "नाम उपनाम",
          "auth.regUsername": "उपयोगकर्ता नाम", "auth.regUsernamePh": "लैटिन अक्षर, बिना स्पेस",
          "auth.regEmail": "ईमेल",
          "auth.regPassword": "पासवर्ड", "auth.regPasswordPh": "कम से कम 4 अक्षर",
          "auth.regPassword2": "पुष्टि करें", "auth.regPassword2Ph": "दोबारा लिखें",
          "auth.regBtn": "खाता बनाएं",
          "auth.regErrorShort": "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।",
          "auth.regErrorMismatch": "पासवर्ड मेल नहीं खाते।",
          "auth.pwWeak": "कमज़ोर", "auth.pwMedium": "औसत", "auth.pwStrong": "मज़बूत",
          "auth.pwMatch": "मेल खाता है", "auth.pwNoMatch": "मेल नहीं खाता",
          "auth.regErrorDefault": "साइन अप करते समय त्रुटि हुई।",
          "auth.or": "या",
          "auth.guestBtn": "अभी सिर्फ़ देखें",
          "auth.guestBtnSmall": "आप बाद में साइन अप कर सकते हैं",
          "nav.home": "होम", "nav.profile": "प्रोफ़ाइल", "nav.messages": "संदेश",
          "nav.newWork": "+", "nav.myProfile": "मेरी प्रोफ़ाइल", "nav.logout": "लॉग आउट",
          "nav.register": "साइन अप करें",
          "guest.banner": "आप <b>अतिथि</b> के रूप में देख रहे हैं — अपलोड, लाइक और कमेंट के लिए साइन अप करें।",
          "guest.registerBtn": "साइन अप करें",
          "home.eyebrow": "फ़ीड", "home.title": "<span>सभी कलाकारों</span> की कृतियाँ",
          "home.sub": "मंच पर सभी उपयोगकर्ताओं द्वारा अपलोड की गई कृतियाँ — नवीनतम पहले।",
          "feed.end": "और कोई कृति नहीं है।",
          "feed.empty.title": "अभी तक कुछ भी नहीं है", "feed.empty.desc": "अपनी पहली कृति अपलोड करके संग्रह शुरू करें।",
          "cart.loading": "लोड हो रहा है...", "cart.empty.title": "आपकी कार्ट खाली है",
          "cart.empty.desc": "पसंद की गई कृतियों को यहाँ जोड़ने के लिए कार्ट आइकन दबाएँ।",
          "cart.addAria": "कार्ट में जोड़ें", "cart.increaseAria": "मात्रा बढ़ाएं", "cart.decreaseAria": "मात्रा घटाएं",
          "buyNow.aria": "अभी खरीदें",
          "buyNow.confirm": "क्या आप {item} अभी इसी कीमत पर खरीदना चाहते हैं?",
          "buyNow.success": "आपका ऑर्डर दर्ज कर लिया गया है!",
          "buyNow.fail": "कुछ गड़बड़ हो गई। कृपया फिर से प्रयास करें।",
          "cart.removeAria": "कार्ट से हटाएं", "cart.subtotal": "उप-योग", "cart.checkout": "ऑर्डर करें",
          "cart.checkoutConfirm": "क्या आप ऑर्डर की पुष्टि करते हैं?", "cart.orderPlaced": "आपका ऑर्डर दे दिया गया है! विक्रेता जल्द ही आपसे संपर्क करेगा।",
          "cart.orderFail": "ऑर्डर नहीं दिया जा सका",
          "notif.orderReceived": "{name} ने आपकी {count} कृतियों का ऑर्डर दिया।", "notif.orderPlaced": "आपका ऑर्डर सफलतापूर्वक दे दिया गया।",
          "profile.empty.desc": "अपनी पहली कृति अपलोड करके अपना संग्रह शुरू करें।",
          "feed.likeAria": "लाइक", "feed.commentAria": "टिप्पणियाँ",
          "feed.contactAria": "विक्रेता से संपर्क करें", "feed.contactLabel": "संपर्क करें",
          "feed.sale": "बिक्री के लिए", "feed.expo": "प्रदर्शन में",
          "profile.stat.total": "कुल", "profile.stat.sale": "बिक्री के लिए", "profile.stat.expo": "प्रदर्शन में",
          "profile.editBtn": "जानकारी संपादित करें",
          "profile.edit.title": "प्रोफ़ाइल जानकारी", "profile.edit.changeAvatar": "फ़ोटो चुनें",
          "profile.edit.avatarHint": "JPG या PNG, 8MB तक",
          "profile.edit.fullname": "पूरा नाम", "profile.edit.email": "ईमेल",
          "profile.edit.bio": "बायो", "profile.edit.bioPh": "अपने बारे में संक्षेप में लिखें...",
          "profile.edit.phone": "फ़ोन नंबर", "profile.edit.social": "सोशल मीडिया लिंक",
          "profile.edit.privacyTitle": "चुनें कि अन्य लोग आपकी प्रोफ़ाइल पर क्या देख सकते हैं:",
          "profile.edit.privacyPhone": "मेरा फ़ोन नंबर दिखाएं",
          "profile.edit.privacySocial": "मेरा सोशल मीडिया लिंक दिखाएं",
          "profile.edit.privacyEmail": "मेरा ईमेल दिखाएं",
          "profile.edit.save": "सहेजें", "profile.edit.cancel": "रद्द करें",
          "profile.myWorks": "मेरी कृतियाँ", "profile.language": "साइट की भाषा",
          "profile.joined": "शामिल हुए",
          "profile.online": "ऑनलाइन", "profile.offline": "ऑफ़लाइन",
          "profile.avatarUploadFail": "फ़ोटो अपलोड नहीं हो सकी। फिर कोशिश करें।",
          "account.title": "लॉगिन और पासवर्ड",
          "account.usernameLabel": "उपयोगकर्ता नाम (लॉगिन)",
          "account.usernameHint": "दूसरे लोग आपको इसी नाम से खोजते हैं, और आप इसी से लॉगिन करते हैं।",
          "account.currentPassword": "मौजूदा पासवर्ड", "account.currentPasswordPh": "बदलाव के लिए दर्ज करें", "account.currentPasswordHint": "बदलाव सहेजने के लिए अपना मौजूदा पासवर्ड दर्ज करें।",
          "account.newPassword": "नया पासवर्ड", "account.newPasswordPh": "वैकल्पिक, कम से कम 4 अक्षर",
          "account.newPassword2": "नए पासवर्ड की पुष्टि करें", "account.newPassword2Ph": "दोबारा लिखें",
          "account.save": "सहेजें", "account.saved": "सहेज लिया गया!",
          "account.err.noChanges": "कुछ भी नहीं बदला गया।",
          "account.err.currentPasswordRequired": "जारी रखने के लिए अपना मौजूदा पासवर्ड दर्ज करें।",
          "account.err.currentPasswordIncorrect": "मौजूदा पासवर्ड गलत है।",
          "account.err.usernameInvalid": "उपयोगकर्ता नाम 3-32 अक्षर का होना चाहिए, केवल अक्षर/अंक/अंडरस्कोर।",
          "account.err.usernameTaken": "यह उपयोगकर्ता नाम पहले से लिया जा चुका है।",
          "account.err.passwordTooShort": "नया पासवर्ड कम से कम 4 अक्षर का होना चाहिए।",
          "account.err.mismatch": "नए पासवर्ड मेल नहीं खाते।",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "आप किसी अन्य प्रशासक को बैन नहीं कर सकते",
          "err.cannotMuteAdmin": "आप किसी अन्य प्रशासक को म्यूट नहीं कर सकते",
          "err.callBlocked": "इस उपयोगकर्ता ने वीडियो कॉल प्रतिबंधित कर दी है",
          "err.commentDeleteForbidden": "इस टिप्पणी को हटाने की आपको अनुमति नहीं है",
          "err.userBusy": "यह उपयोगकर्ता अभी व्यस्त है",
          "err.usernameInvalid": "उपयोगकर्ता नाम 3-32 अक्षर का होना चाहिए, केवल लैटिन अक्षर/अंक/अंडरस्कोर की अनुमति है",
          "err.loginInvalid": "उपयोगकर्ता नाम या पासवर्ड गलत है",
          "err.tooManyAttempts": "बहुत अधिक प्रयास किए गए, कृपया थोड़ी देर बाद पुनः प्रयास करें",
          "err.unknownMessageType": "अज्ञात संदेश प्रकार",
          "err.invalidData": "अमान्य डेटा",
          "err.invalidQuantity": "अमान्य मात्रा",
          "err.cannotCartOwnWork": "आप अपनी खुद की कृति को कार्ट में नहीं जोड़ सकते",
          "err.cannotBuyOwnWork": "आप अपनी खुद की कृति नहीं खरीद सकते",
          "err.cannotFollowSelf": "आप खुद को फॉलो नहीं कर सकते",
          "err.cannotCallSelf": "आप खुद को कॉल नहीं कर सकते",
          "err.cannotMessageSelf": "आप खुद को संदेश नहीं भेज सकते",
          "err.cannotBanSelf": "आप खुद को बैन नहीं कर सकते",
          "err.cannotMuteSelf": "आप खुद को म्यूट नहीं कर सकते",
          "err.passwordTooShort": "पासवर्ड कम से कम 4 अक्षर का होना चाहिए",
          "err.callAlreadyEnded": "कॉल पहले ही समाप्त हो चुकी है",
          "err.callNotFound": "कॉल नहीं मिली",
          "err.registerServerError": "पंजीकरण के दौरान सर्वर त्रुटि",
          "err.cartEmpty": "कार्ट खाली है",
          "err.muted": "आप अस्थायी रूप से म्यूट हैं, इसलिए यह कार्रवाई नहीं कर सकते",
          "err.callAlreadyActive": "आपकी पहले से एक सक्रिय कॉल है",
          "err.videoProcessingFailed": "वीडियो प्रोसेस करते समय त्रुटि हुई। कृपया कोई दूसरा वीडियो चुनें।",
          "err.messageEmpty": "संदेश खाली नहीं हो सकता",
          "err.workNotFound": "कृति नहीं मिली",
          "err.authRequired": "कृपया पहले लॉग इन करें",
          "err.adminRequired": "इस कार्रवाई के लिए प्रशासक अधिकार आवश्यक है",
          "err.workNotInCart": "यह कृति कार्ट में नहीं मिली",
          "err.workNotForSale": "यह कृति बिक्री के लिए नहीं है",
          "err.workOutOfStock": "यह कृति स्टॉक में नहीं है",
          "err.usernameTaken": "यह उपयोगकर्ता नाम पहले से लिया जा चुका है",
          "err.onlyCallerCanCancel": "केवल कॉल करने वाला ही रद्द कर सकता है",
          "err.onlyCallerCanOffer": "केवल कॉल करने वाला ही ऑफर भेज सकता है",
          "err.onlyCalleeCanAnswer": "केवल प्राप्तकर्ता ही जवाब दे सकता है",
          "err.onlyCalleeCanDecline": "केवल प्राप्तकर्ता ही अस्वीकार कर सकता है",
          "err.fileRequired": "फ़ाइल आवश्यक है",
          "err.userNotFound": "उपयोगकर्ता नहीं मिला",
          "err.accountBanned": "आपका खाता अस्थायी रूप से ब्लॉक (बैन) है",
          "err.mediaRequired": "कम से कम एक फोटो या वीडियो आवश्यक है",
          "err.loginServerError": "लॉगिन के दौरान सर्वर त्रुटि",
          "err.commentEmpty": "टिप्पणी खाली नहीं हो सकती",
          "err.commentNotFound": "टिप्पणी नहीं मिली",
          "err.imageRequired": "छवि आवश्यक है",
          "err.serverError": "सर्वर त्रुटि",
          "err.reportNotFound": "शिकायत नहीं मिली",
          "err.noChanges": "कुछ भी नहीं बदला गया",
          "err.currentPasswordRequired": "जारी रखने के लिए अपना मौजूदा पासवर्ड दर्ज करें",
          "err.currentPasswordIncorrect": "मौजूदा पासवर्ड गलत है",
          "err.videoWithOtherFiles": "वीडियो को अन्य फ़ाइलों के साथ अपलोड नहीं किया जा सकता — केवल एक वीडियो चुनें",
          "err.videoTooLong10s": "वीडियो 10 सेकंड से लंबा नहीं होना चाहिए",
          "err.invalidWorkMediaType": "केवल फोटो या वीडियो फ़ाइलें (mp4/mov, 10 सेकंड तक) स्वीकार की जाती हैं",
          "err.dangerousFileType": "इस प्रकार की फ़ाइलें नहीं भेजी जा सकतीं",
          "err.onlyImagesAllowed": "केवल छवि फ़ाइलें स्वीकार की जाती हैं",
          "err.onlyVideosAllowed": "केवल वीडियो फ़ाइलें स्वीकार की जाती हैं",
          "err.onlyAudioAllowed": "केवल ऑडियो फ़ाइलें स्वीकार की जाती हैं",
          "err.fileTooLarge": "फ़ाइल बहुत बड़ी है",
          "err.tooManyFiles": "बहुत अधिक फ़ाइलें अपलोड की गईं",
          "err.uploadError": "फ़ाइल अपलोड करते समय त्रुटि हुई",
          "err.notEnoughStock": "केवल {n} बचे हैं",
          "err.videoTooLong": "वीडियो बहुत लंबा है (अधिकतम {n} सेकंड)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 फोटो",
          "chat.preview.video": "🎥 वीडियो",
          "chat.preview.circle": "⭕ वीडियो संदेश",
          "chat.preview.voice": "🎙️ वॉइस संदेश",
          "chat.preview.file": "📎 फ़ाइल",
          "chat.voiceAria": "वॉइस संदेश", "chat.circleAria": "वीडियो संदेश",
          "filter.typeAria": "श्रेणी", "filter.sortAria": "क्रमबद्ध करें", "chat.emojiAria": "इमोजी",
          "messages.eyebrow": "बातचीत", "messages.title": "<span>विक्रेताओं</span> के साथ संदेश",
          "messages.sub": "बिक्री की किसी कृति के बारे में पूछें या विक्रेता से संपर्क करें — आपकी बातचीत यहाँ है।",
          "messages.empty.title": "अभी तक कोई बातचीत नहीं",
          "messages.empty.desc": "बिक्री की किसी कृति के नीचे \"संपर्क करें\" दबाकर विक्रेता को संदेश भेजें।",
          "messages.loadFail.title": "लोड नहीं हो सका", "messages.loadFail.desc": "अपना इंटरनेट कनेक्शन जांचें और फिर कोशिश करें।",
          "messages.you": "आप",
          "userProfile.back": "← वापस", "userProfile.works": "कृतियाँ",
          "userProfile.notFound.title": "नहीं मिला", "userProfile.notFound.desc": "यह उपयोगकर्ता मौजूद नहीं है।",
          "userProfile.contactBtn": "संदेश भेजें",
          "upload.title": "नई कृति अपलोड करें",
          "upload.imagesLabel": "फ़ोटो या वीडियो (1 से 3 फ़ोटो, या 10 सेकंड तक का एक वीडियो)",
          "upload.dropDefault": "फ़ोटो/वीडियो चुनने के लिए क्लिक करें या यहाँ छोड़ें — 3 फ़ोटो तक, या 10 सेकंड तक का एक वीडियो",
          "upload.dropChosen": "{n}/{max} फ़ोटो चुनी गईं — और जोड़ने के लिए क्लिक करें",
          "upload.dropFull": "3 फ़ोटो चुनी गईं — कोलाज के रूप में दिखेंगी",
          "upload.titleLabel": "शीर्षक", "upload.titlePh": "उदाहरण: «शरद ऋतु का दृश्य»",
          "upload.typeLabel": "प्रकार", "upload.type.rasm": "पेंटिंग / चित्र", "upload.type.haykal": "मूर्ति",
          "upload.type.mulaj": "मॉडल", "upload.type.boshqa": "अन्य", "upload.type.otherPh": "प्रकार दर्ज करें",
          "upload.statusLabel": "स्थिति", "upload.status.expo": "केवल प्रदर्शन", "upload.status.sale": "बिक्री के लिए",
          "upload.priceLabel": "मूल्य", "upload.currencyLabel": "मुद्रा",
          "upload.stockLabel": "उपलब्धता", "upload.stock.fixed": "निश्चित मात्रा", "upload.stock.order": "ऑर्डर पर बनाया जाता है", "upload.stock.qtyPh": "कितनी नग उपलब्ध हैं?",
          "stock.order": "ऑर्डर पर बनाया जाता है", "stock.out": "बिक चुका है", "stock.left": "केवल {n} बचे हैं",
          "upload.descLabel": "विवरण", "upload.descPh": "कृति के बारे में संक्षिप्त जानकारी...",
          "upload.save": "सहेजें", "upload.removeAria": "हटाएं",
                    "upload.errNoImage": "कृपया कम से कम एक फ़ोटो चुनें।",
          "upload.errVideoTooLong": "वीडियो 10 सेकंड से लंबा नहीं होना चाहिए।",
          "upload.errVideoWithImages": "वीडियो के साथ फ़ोटो अपलोड नहीं की जा सकतीं।",
          "upload.videoNotSupported": "आपका ब्राउज़र वीडियो जाँच नहीं सका। कृपया दूसरी फ़ाइल चुनें।",
          "upload.errGeneric": "सहेजने में त्रुटि हुई। फिर कोशिश करें।",
          "lightbox.editStatus": "स्थिति बदलें",
          "lightbox.delete": "हटाएं", "lightbox.noDesc": "कोई विवरण नहीं दिया गया।",
          "lightbox.workTagFallback": "कृति",
          "comments.title": "टिप्पणियाँ", "comments.ph": "टिप्पणी लिखें...", "comments.send": "भेजें",
          "comments.empty": "अभी तक कोई टिप्पणी नहीं। पहले आप लिखें!",
          "comments.loading": "लोड हो रहा है...", "comments.loadFail": "टिप्पणियाँ लोड नहीं हो सकीं।",
          "comments.delete": "हटाएं",
          "chat.ph": "संदेश लिखें...", "chat.workRefPrefix": "इस बारे में",
          "chat.loadFail": "बातचीत लोड नहीं हो सकी।", "chat.empty": "अभी तक कोई संदेश नहीं। पहले आप लिखें!",
          "chat.sendFail": "संदेश नहीं भेजा जा सका। फिर कोशिश करें।",
          "chat.attach.media": "फ़ोटो / वीडियो", "chat.attach.file": "फ़ाइल",
          "chat.micDenied": "माइक्रोफ़ोन या कैमरे की अनुमति नहीं मिली",
          "chat.recordingVoice": "वॉइस मैसेज रिकॉर्ड हो रहा है...", "chat.recordingCircle": "वीडियो मैसेज रिकॉर्ड हो रहा है...",
          "chat.mediaSendFail": "फ़ाइल नहीं भेजी जा सकी। फिर कोशिश करें।",
          "chat.attachTitle": "फ़ाइल जोड़ें", "chat.circleTitle": "वीडियो संदेश (रिकॉर्ड करने के लिए क्लिक करें)",
          "chat.voiceTitle": "वॉइस संदेश (रिकॉर्ड करने के लिए क्लिक करें)", "chat.recordCancelTitle": "रद्द करें", "chat.recordSendTitle": "भेजें",
          "gate.title": "कृपया साइन अप करें",
          "gate.desc": "आप अभी अतिथि के रूप में देख रहे हैं। इस कार्य के लिए खाता चाहिए — अभी या बाद में साइन अप करें।",
          "gate.later": "बाद में", "gate.register": "साइन अप करें",
          "theme.fabTitle": "शैली बदलें", "theme.title": "साइट शैली",
          "theme.tungi": "रात्रि", "theme.yorug": "उजला", "theme.cyberpunk": "साइबरपंक", "theme.cyberpunkBlue": "साइबरपंक नीला", "theme.cyberpunkYellow": "साइबरपंक पीला", "theme.custom": "कस्टम",
          "theme.customPick": "अपना रंग चुनें",
          "admin.nav": "प्रशासक कोना",
          "admin.eyebrow": "मॉडरेशन",
          "admin.title": "प्रशासक <span>कोना</span>",
          "admin.sub": "सभी उपयोगकर्ता — बैन या म्यूट करें, या प्रतिबंध जल्दी हटाएं।",
          "admin.loading": "लोड हो रहा है...",
          "admin.loadFail": "उपयोगकर्ताओं को लोड नहीं किया जा सका।",
          "admin.empty": "अभी तक कोई उपयोगकर्ता नहीं है।",
          "admin.lastSeen.never": "कभी साइट पर नहीं आया",
          "admin.lastSeen.justNow": "अभी ऑनलाइन है",
          "admin.lastSeen.minutesAgo": "{n} मिनट पहले साइट पर था",
          "admin.lastSeen.hoursAgo": "{n} घंटे पहले साइट पर था",
          "admin.lastSeen.daysAgo": "{n} दिन पहले साइट पर था",
          "admin.lastSeen.onDate": "{date} को साइट पर था",
          "admin.badge.admin": "प्रशासक", "admin.badge.banned": "बैन", "admin.badge.muted": "म्यूट",
          "admin.badge.ok": "सक्रिय",
          "admin.status.bannedUntil": "बैन {date} तक",
          "admin.status.mutedUntil": "म्यूट {date} तक",
          "admin.action.ban": "बैन करें", "admin.action.unban": "बैन हटाएं",
          "admin.action.mute": "म्यूट करें", "admin.action.unmute": "म्यूट हटाएं",
          "admin.actionFail": "कार्रवाई पूरी नहीं की जा सकी।",
          "admin.confirm.unban": "क्या आप इस उपयोगकर्ता का बैन जल्दी हटाना चाहते हैं?",
          "admin.confirm.unmute": "क्या आप इस उपयोगकर्ता का म्यूट जल्दी हटाना चाहते हैं?",
          "admin.mod.title": "उपयोगकर्ता को प्रतिबंधित करें",
          "admin.mod.titleBan": "@{username} को बैन करें",
          "admin.mod.titleMute": "@{username} को म्यूट करें",
          "admin.mod.minutes": "अवधि (मिनट)",
          "admin.mod.reason": "कारण (वैकल्पिक)",
          "admin.mod.reasonPh": "उल्लंघन का कारण...",
          "admin.mod.confirm": "पुष्टि करें",
          "admin.mod.errMinutes": "सही अवधि दर्ज करें (कम से कम 1 मिनट)।",
          "ban.title": "आपका खाता ब्लॉक कर दिया गया है",
          "ban.until": "बैन समाप्त होगा: {date}।",
          "ban.reason": "कारण: {reason}",
          "mute.banner": "आप अस्थायी रूप से म्यूट हैं — आप टिप्पणी, संदेश या नई कृति अपलोड नहीं कर सकते।",
          "mute.bannerReason": "आप {date} तक म्यूट हैं। कारण: {reason}",
          "mute.bannerNoReason": "आप {date} तक म्यूट हैं — आप टिप्पणी, संदेश या नई कृति अपलोड नहीं कर सकते।",
          "notif.banReason": "प्रशासक ने आपको {date} तक बैन किया। कारण: {reason}",
          "notif.banNoReason": "प्रशासक ने आपको {date} तक बैन किया।",
          "notif.muteReason": "प्रशासक ने आपको {date} तक म्यूट किया (आप टिप्पणी/संदेश/कृति अपलोड नहीं कर सकते)। कारण: {reason}",
          "notif.muteNoReason": "प्रशासक ने आपको {date} तक म्यूट किया (आप टिप्पणी/संदेश/कृति अपलोड नहीं कर सकते)।",
          "notif.unban": "प्रशासक ने आपका बैन समय से पहले हटा दिया। अब आप अपने खाते का उपयोग फिर से कर सकते हैं।",
          "notif.unmute": "प्रशासक ने आपका म्यूट समय से पहले हटा दिया। अब आप फिर से टिप्पणी, संदेश और कृति अपलोड कर सकते हैं।",
          "notif.banExpired": "आपका बैन समाप्त हो गया है। अब आप अपने खाते का उपयोग फिर से कर सकते हैं।",
          "notif.muteExpired": "आपका म्यूट समाप्त हो गया है। अब आप फिर से टिप्पणी, संदेश और कृति अपलोड कर सकते हैं।",
          "nav.cart": "कार्ट",
          "search.placeholder": "खोजें...", "filter.type.all": "सभी प्रकार", "filter.sort.new": "सबसे नया", "filter.sort.top": "सबसे ज़्यादा पसंद किया गया", "filter.price.min": "कीमत से", "filter.price.max": "कीमत तक", "filter.onlyFollowing": "केवल जिन्हें मैं फॉलो करता हूँ",
          "search.clearAria": "साफ़ करें",
          "search.closeAria": "बंद करें",
          "cart.eyebrow": "खरीदारी",
          "cart.title": "आपकी <span>कार्ट</span>",
          "cart.sub": "आपने कार्ट में जोड़ी गई कृतियाँ यहाँ हैं — मात्रा बदलें और ऑर्डर करें।",
          "profile.stat.followers": "फ़ॉलोअर्स",
          "profile.stat.following": "फ़ॉलोइंग",
          "profile.stat.likes": "लाइक",
          "profile.stat.comments": "टिप्पणियाँ", "profile.stat.views": "व्यूज़",
          "admin.reportsLabel": "शिकायतें",
          "admin.usersLabel": "उपयोगकर्ता",
          "report.action": "शिकायत करें",
          "report.reasonLabel": "कारण",
          "report.reasonPh": "आप शिकायत क्यों कर रहे हैं? (वैकल्पिक)",
          "report.submitBtn": "जमा करें",
          "report.sentAlert": "आपकी शिकायत प्राप्त हो गई है। हम इसकी समीक्षा करेंगे।",
          "admin.stat.users": "उपयोगकर्ता",
          "admin.stat.todayHint": "+{count} आज",
          "admin.stat.works": "कृतियाँ",
          "admin.stat.likes": "लाइक",
          "admin.stat.comments": "टिप्पणियाँ",
          "admin.stat.openReports": "खुली शिकायतें",
          "admin.stat.banMute": "बैन/म्यूट",
          "admin.report.typeWork": "कृति",
          "admin.report.typeUser": "उपयोगकर्ता",
          "admin.report.subjectWork": "कृति: \"{title}\"",
          "admin.report.subjectUser": "उपयोगकर्ता: @{username}",
          "admin.report.gone": "(पहले ही हटाया जा चुका है)",
          "admin.report.reporter": "शिकायतकर्ता: @{username} ({fullname})",
          "admin.report.resolved": "✓ समीक्षित",
          "admin.report.resolvedDeleted": " · छवि हटाई गई",
          "admin.report.resolveBtn": "समीक्षित के रूप में चिह्नित करें",
          "admin.report.deleteWorkBtn": "छवि हटाएं",
          "admin.report.deleteConfirm": "क्या आप इस कृति की छवि को स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
          "admin.report.empty": "अभी तक कोई शिकायत नहीं है।",
          "follow.subscribeBtn": "फ़ॉलो करें",
          "follow.unsubscribeBtn": "अनफ़ॉलो करें",
          "follow.unfollowConfirm": "क्या आप अनफ़ॉलो करना चाहते हैं? अब आपको इस उपयोगकर्ता की नई कृतियों की सूचना नहीं मिलेगी।",
          "follow.stats": "{followers} फ़ॉलोअर्स · {following} फ़ॉलोइंग",
          "follow.short": "फ़ॉलो हो रहा है",
          "follow.shortAdd": "+ फ़ॉलो",
          "notif.follow": "{name} ने आपको फ़ॉलो करना शुरू किया",
          "save.aria": "सहेजें",
          "share.aria": "शेयर करें", "share.linkCopied": "लिंक कॉपी हो गया: {url}", "share.copyPrompt": "लिंक कॉपी करें:",
          /* ---- video call feature (previously missing from this language) ---- */
          "call.startTitle": "वीडियो कॉल",
          "call.incoming": "वीडियो कॉल आ रही है...",
          "call.decline": "अस्वीकार करें",
          "call.accept": "स्वीकार करें",
          "call.calling": "कॉल की जा रही है...",
          "call.connecting": "कनेक्ट हो रहा है...",
          "call.peerCameraOff": "कैमरा बंद है",
          "call.toggleMic": "माइक्रोफ़ोन",
          "call.toggleCam": "कैमरा",
          "call.end": "कॉल समाप्त करें",
          "call.startFail": "कॉल नहीं हो सकी। कृपया पुनः प्रयास करें।",
          "call.noCamera": "कैमरा नहीं मिला, केवल ऑडियो से जोड़ा जा रहा है...",
          "call.noMediaAccess": "माइक्रोफ़ोन/कैमरा एक्सेस अस्वीकृत कर दिया गया।",
          "call.wasDeclined": "कॉल अस्वीकार कर दी गई",
          "call.wasMissed": "कोई जवाब नहीं",
          "call.wasBusy": "उपयोगकर्ता व्यस्त है",
          "call.ended": "कॉल समाप्त हुई",
          "call.msg.ended": "वीडियो कॉल",
          "call.msg.noAnswer": "कोई जवाब नहीं",
          "call.msg.missed": "छूटी हुई कॉल",
          "call.msg.declined": "अस्वीकृत कॉल",
          "call.msg.cancelled": "रद्द की गई कॉल",
          "call.msg.busy": "उपयोगकर्ता व्यस्त था",
          "profile.edit.callPrivacyTitle": "चुनें कि आपको वीडियो कॉल कौन कर सकता है:",
          "profile.edit.callPrivacyEveryone": "सभी",
          "profile.edit.callPrivacySelected": "केवल चुनिंदा लोग",
          "profile.edit.callPrivacyNobody": "कोई नहीं",
          "profile.edit.callPrivacyAddPh": "उपयोगकर्ता नाम दर्ज करें...",
          "profile.edit.callPrivacyAdd": "जोड़ें",
          "profile.edit.callPrivacyEmpty": "अभी तक कोई नहीं जोड़ा गया है।",
          "profile.edit.callPrivacyRemove": "हटाएं",
          "profile.edit.callPrivacyAddSelfErr": "आप खुद को नहीं जोड़ सकते।",
          "profile.edit.callPrivacyAddNotFound": "ऐसा कोई उपयोगकर्ता नहीं मिला।",
          "feedThumb.aria": "छवि को पूर्ण आकार में देखें",
          "notif.someone": "किसी ने",
      },
        es: {
          _locale: 'es-ES', _dir: 'ltr', _name: "Español",
          "auth.tagline": "Guarda las pinturas, esculturas y maquetas que hiciste a mano — publícalas en venta o solo para mostrarlas.",
          "auth.tabLogin": "Iniciar sesión", "auth.tabRegister": "Registrarse",
          "auth.loginUsername": "Nombre de usuario", "auth.loginUsernamePh": "p. ej.: dilnoza_art",
          "auth.loginPassword": "Contraseña", "auth.loginBtn": "Iniciar sesión",
          "common.serverError": "Error del servidor",
          "auth.loginErrorDefault": "Nombre de usuario o contraseña incorrectos.",
          "auth.regFullname": "Nombre completo", "auth.regFullnamePh": "Nombre Apellido",
          "auth.regUsername": "Nombre de usuario", "auth.regUsernamePh": "letras latinas, sin espacios",
          "auth.regEmail": "Correo electrónico",
          "auth.regPassword": "Contraseña", "auth.regPasswordPh": "mínimo 4 caracteres",
          "auth.regPassword2": "Confirmar", "auth.regPassword2Ph": "vuelve a escribirla",
          "auth.regBtn": "Crear cuenta",
          "auth.regErrorShort": "La contraseña debe tener al menos 4 caracteres.",
          "auth.regErrorMismatch": "Las contraseñas no coinciden.",
          "auth.pwWeak": "Débil", "auth.pwMedium": "Media", "auth.pwStrong": "Fuerte",
          "auth.pwMatch": "Coincide", "auth.pwNoMatch": "No coincide",
          "auth.regErrorDefault": "Ocurrió un error al registrarse.",
          "auth.or": "o",
          "auth.guestBtn": "Solo quiero explorar por ahora",
          "auth.guestBtnSmall": "Puedes registrarte más tarde",
          "nav.home": "Inicio", "nav.profile": "Perfil", "nav.messages": "Mensajes",
          "nav.newWork": "+", "nav.myProfile": "Mi perfil", "nav.logout": "Cerrar sesión",
          "nav.register": "Registrarse",
          "guest.banner": "Estás navegando como <b>invitado</b> — regístrate para subir obras, dar like y comentar.",
          "guest.registerBtn": "Registrarse",
          "home.eyebrow": "Novedades", "home.title": "Obras de <span>todos los creadores</span>",
          "home.sub": "Todo lo que los usuarios han subido a la plataforma — lo más reciente primero.",
          "feed.end": "No hay más obras.",
          "feed.empty.title": "Todavía no hay nada aquí", "feed.empty.desc": "Sube tu primera obra y empieza tu colección.",
          "cart.loading": "Cargando...", "cart.empty.title": "Tu carrito está vacío",
          "cart.empty.desc": "Toca el icono del carrito en las obras que te gusten para añadirlas aquí.",
          "cart.addAria": "Añadir al carrito", "cart.increaseAria": "Aumentar cantidad", "cart.decreaseAria": "Disminuir cantidad",
          "buyNow.aria": "Comprar ahora",
          "buyNow.confirm": "¿Comprar {item} ahora mismo?",
          "buyNow.success": "¡Tu pedido se ha realizado!",
          "buyNow.fail": "Algo salió mal. Inténtalo de nuevo.",
          "cart.removeAria": "Quitar del carrito", "cart.subtotal": "Subtotal", "cart.checkout": "Hacer pedido",
          "cart.checkoutConfirm": "¿Confirmar tu pedido?", "cart.orderPlaced": "¡Tu pedido ha sido realizado! El vendedor se pondrá en contacto contigo pronto.",
          "cart.orderFail": "No se pudo realizar el pedido",
          "notif.orderReceived": "{name} pidió {count} de tus obras.", "notif.orderPlaced": "Tu pedido se realizó con éxito.",
          "profile.empty.desc": "Sube tu primera obra y empieza tu colección.",
          "feed.likeAria": "Me gusta", "feed.commentAria": "Comentarios",
          "feed.contactAria": "Contactar al vendedor", "feed.contactLabel": "Contactar",
          "feed.sale": "En venta", "feed.expo": "En exhibición",
          "profile.stat.total": "Total", "profile.stat.sale": "En venta", "profile.stat.expo": "En exhibición",
          "profile.editBtn": "Editar datos",
          "profile.edit.title": "Datos del perfil", "profile.edit.changeAvatar": "Elegir foto",
          "profile.edit.avatarHint": "JPG o PNG, hasta 8MB",
          "profile.edit.fullname": "Nombre completo", "profile.edit.email": "Correo electrónico",
          "profile.edit.bio": "Biografía", "profile.edit.bioPh": "Cuéntanos algo breve sobre ti...",
          "profile.edit.phone": "Número de teléfono", "profile.edit.social": "Enlace de red social",
          "profile.edit.privacyTitle": "Elige qué pueden ver otros en tu perfil:",
          "profile.edit.privacyPhone": "Mostrar mi número de teléfono",
          "profile.edit.privacySocial": "Mostrar mi enlace de red social",
          "profile.edit.privacyEmail": "Mostrar mi correo electrónico",
          "profile.edit.save": "Guardar", "profile.edit.cancel": "Cancelar",
          "profile.myWorks": "Mis obras", "profile.language": "Idioma del sitio",
          "profile.joined": "Se unió el",
          "profile.online": "En línea", "profile.offline": "Desconectado",
          "profile.avatarUploadFail": "No se pudo subir la foto. Inténtalo de nuevo.",
          "account.title": "Usuario y contraseña",
          "account.usernameLabel": "Nombre de usuario (login)",
          "account.usernameHint": "Los demás te encuentran por este nombre, y también lo usas para iniciar sesión.",
          "account.currentPassword": "Contraseña actual", "account.currentPasswordPh": "introdúcela para hacer cambios", "account.currentPasswordHint": "Introduce tu contraseña actual para guardar los cambios.",
          "account.newPassword": "Nueva contraseña", "account.newPasswordPh": "opcional, mínimo 4 caracteres",
          "account.newPassword2": "Confirmar nueva contraseña", "account.newPassword2Ph": "vuelve a escribirla",
          "account.save": "Guardar", "account.saved": "¡Guardado!",
          "account.err.noChanges": "No se cambió nada.",
          "account.err.currentPasswordRequired": "Introduce tu contraseña actual para continuar.",
          "account.err.currentPasswordIncorrect": "La contraseña actual es incorrecta.",
          "account.err.usernameInvalid": "El usuario debe tener 3-32 caracteres, solo letras/números/guion bajo.",
          "account.err.usernameTaken": "Ese nombre de usuario ya está en uso.",
          "account.err.passwordTooShort": "La nueva contraseña debe tener al menos 4 caracteres.",
          "account.err.mismatch": "Las nuevas contraseñas no coinciden.",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "No puedes banear a otro administrador",
          "err.cannotMuteAdmin": "No puedes silenciar a otro administrador",
          "err.callBlocked": "Este usuario ha restringido las videollamadas",
          "err.commentDeleteForbidden": "No tienes permiso para eliminar este comentario",
          "err.userBusy": "Este usuario está ocupado en este momento",
          "err.usernameInvalid": "El nombre de usuario debe tener 3-32 caracteres: solo letras latinas, números y guion bajo",
          "err.loginInvalid": "Nombre de usuario o contraseña incorrectos",
          "err.tooManyAttempts": "Demasiados intentos, inténtalo de nuevo en un momento",
          "err.unknownMessageType": "Tipo de mensaje desconocido",
          "err.invalidData": "Datos no válidos",
          "err.invalidQuantity": "Cantidad no válida",
          "err.cannotCartOwnWork": "No puedes añadir tu propia obra al carrito",
          "err.cannotBuyOwnWork": "No puedes comprar tu propia obra",
          "err.cannotFollowSelf": "No puedes seguirte a ti mismo",
          "err.cannotCallSelf": "No puedes llamarte a ti mismo",
          "err.cannotMessageSelf": "No puedes enviarte un mensaje a ti mismo",
          "err.cannotBanSelf": "No puedes banearte a ti mismo",
          "err.cannotMuteSelf": "No puedes silenciarte a ti mismo",
          "err.passwordTooShort": "La contraseña debe tener al menos 4 caracteres",
          "err.callAlreadyEnded": "La llamada ya ha terminado",
          "err.callNotFound": "Llamada no encontrada",
          "err.registerServerError": "Error del servidor durante el registro",
          "err.cartEmpty": "El carrito está vacío",
          "err.muted": "Estás temporalmente silenciado, así que no puedes realizar esta acción",
          "err.callAlreadyActive": "Ya tienes una llamada activa",
          "err.videoProcessingFailed": "Se produjo un error al procesar el video. Elige otro video.",
          "err.messageEmpty": "El texto del mensaje no puede estar vacío",
          "err.workNotFound": "Obra no encontrada",
          "err.authRequired": "Primero inicia sesión",
          "err.adminRequired": "Esta acción requiere permisos de administrador",
          "err.workNotInCart": "Esta obra no está en el carrito",
          "err.workNotForSale": "Esta obra no está en venta",
          "err.workOutOfStock": "Esta obra se ha agotado",
          "err.usernameTaken": "Este nombre de usuario ya está en uso",
          "err.onlyCallerCanCancel": "Solo quien llama puede cancelar",
          "err.onlyCallerCanOffer": "Solo quien llama puede enviar la oferta",
          "err.onlyCalleeCanAnswer": "Solo el destinatario puede responder",
          "err.onlyCalleeCanDecline": "Solo el destinatario puede rechazar",
          "err.fileRequired": "Se requiere un archivo",
          "err.userNotFound": "Usuario no encontrado",
          "err.accountBanned": "Tu cuenta está bloqueada temporalmente (baneada)",
          "err.mediaRequired": "Se requiere al menos una foto o video",
          "err.loginServerError": "Error del servidor al iniciar sesión",
          "err.commentEmpty": "El texto del comentario no puede estar vacío",
          "err.commentNotFound": "Comentario no encontrado",
          "err.imageRequired": "Se requiere una imagen",
          "err.serverError": "Error del servidor",
          "err.reportNotFound": "Reporte no encontrado",
          "err.noChanges": "No se cambió nada",
          "err.currentPasswordRequired": "Introduce tu contraseña actual para continuar",
          "err.currentPasswordIncorrect": "La contraseña actual es incorrecta",
          "err.videoWithOtherFiles": "No puedes subir un video junto con otros archivos — elige solo un video",
          "err.videoTooLong10s": "El video no debe durar más de 10 segundos",
          "err.invalidWorkMediaType": "Solo se aceptan fotos o videos (mp4/mov, hasta 10 segundos)",
          "err.dangerousFileType": "No se pueden enviar archivos de este tipo",
          "err.onlyImagesAllowed": "Solo se aceptan archivos de imagen",
          "err.onlyVideosAllowed": "Solo se aceptan archivos de video",
          "err.onlyAudioAllowed": "Solo se aceptan archivos de audio",
          "err.fileTooLarge": "El archivo es demasiado grande",
          "err.tooManyFiles": "Se subieron demasiados archivos",
          "err.uploadError": "Se produjo un error al subir el archivo",
          "err.notEnoughStock": "Solo quedan {n} unidades",
          "err.videoTooLong": "El video es demasiado largo (máximo {n} segundos)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 Foto",
          "chat.preview.video": "🎥 Video",
          "chat.preview.circle": "⭕ Videomensaje",
          "chat.preview.voice": "🎙️ Mensaje de voz",
          "chat.preview.file": "📎 Archivo",
          "chat.voiceAria": "Mensaje de voz", "chat.circleAria": "Videomensaje",
          "filter.typeAria": "Categoría", "filter.sortAria": "Ordenar", "chat.emojiAria": "Emoji",
          "messages.eyebrow": "Conversaciones", "messages.title": "Mensajes con <span>vendedores</span>",
          "messages.sub": "Pregunta sobre alguna obra en venta o contacta a un vendedor — tus chats están aquí.",
          "messages.empty.title": "Todavía no hay conversaciones",
          "messages.empty.desc": "Toca \"Contactar\" bajo cualquier obra en venta para escribirle al vendedor.",
          "messages.loadFail.title": "No se pudo cargar", "messages.loadFail.desc": "Revisa tu conexión e inténtalo de nuevo.",
          "messages.you": "Tú",
          "userProfile.back": "← Atrás", "userProfile.works": "Obras",
          "userProfile.notFound.title": "No encontrado", "userProfile.notFound.desc": "Este usuario no existe.",
          "userProfile.contactBtn": "Enviar mensaje",
          "upload.title": "Subir una nueva obra",
          "upload.imagesLabel": "Fotos o un video (de 1 a 3 fotos, o un video de hasta 10 segundos)",
          "upload.dropDefault": "Haz clic para elegir fotos/video o arrástralos aquí — hasta 3 fotos, o un video de hasta 10 segundos",
          "upload.dropChosen": "{n}/{max} fotos elegidas — haz clic para añadir más",
          "upload.dropFull": "3 fotos elegidas — se mostrarán como collage",
          "upload.titleLabel": "Título", "upload.titlePh": "p. ej.: «Paisaje de otoño»",
          "upload.typeLabel": "Tipo", "upload.type.rasm": "Pintura / dibujo", "upload.type.haykal": "Escultura",
          "upload.type.mulaj": "Maqueta", "upload.type.boshqa": "Otro", "upload.type.otherPh": "Escribe el tipo",
          "upload.statusLabel": "Estado", "upload.status.expo": "Solo exhibición", "upload.status.sale": "En venta",
          "upload.priceLabel": "Precio", "upload.currencyLabel": "Moneda",
          "upload.stockLabel": "Disponibilidad", "upload.stock.fixed": "Cantidad fija", "upload.stock.order": "Se hace por encargo", "upload.stock.qtyPh": "¿Cuántas unidades hay?",
          "stock.order": "Se hace por encargo", "stock.out": "Agotado", "stock.left": "Quedan {n}",
          "upload.descLabel": "Descripción", "upload.descPh": "Una breve descripción de la obra...",
          "upload.save": "Guardar", "upload.removeAria": "Quitar",
                    "upload.errNoImage": "Por favor elige al menos una foto.",
          "upload.errVideoTooLong": "El video no debe durar más de 10 segundos.",
          "upload.errVideoWithImages": "No puedes subir un video junto con fotos.",
          "upload.videoNotSupported": "Tu navegador no pudo comprobar el video. Elige otro archivo.",
          "upload.errGeneric": "Ocurrió un error al guardar. Inténtalo de nuevo.",
          "lightbox.editStatus": "Cambiar estado",
          "lightbox.delete": "Eliminar", "lightbox.noDesc": "Sin descripción.",
          "lightbox.workTagFallback": "Obra",
          "comments.title": "Comentarios", "comments.ph": "Escribe un comentario...", "comments.send": "Enviar",
          "comments.empty": "Aún no hay comentarios. ¡Sé el primero en escribir uno!",
          "comments.loading": "Cargando...", "comments.loadFail": "No se pudieron cargar los comentarios.",
          "comments.delete": "Eliminar",
          "chat.ph": "Escribe un mensaje...", "chat.workRefPrefix": "Sobre",
          "chat.loadFail": "No se pudo cargar la conversación.", "chat.empty": "Aún no hay mensajes. ¡Sé el primero en escribir uno!",
          "chat.sendFail": "No se pudo enviar el mensaje. Inténtalo de nuevo.",
          "chat.attach.media": "Foto / Video", "chat.attach.file": "Archivo",
          "chat.micDenied": "Se denegó el acceso al micrófono o la cámara",
          "chat.recordingVoice": "Grabando mensaje de voz...", "chat.recordingCircle": "Grabando mensaje de video...",
          "chat.mediaSendFail": "No se pudo enviar el archivo. Inténtalo de nuevo.",
          "chat.attachTitle": "Adjuntar archivo", "chat.circleTitle": "Mensaje de video (clic para grabar)",
          "chat.voiceTitle": "Mensaje de voz (clic para grabar)", "chat.recordCancelTitle": "Cancelar", "chat.recordSendTitle": "Enviar",
          "gate.title": "Regístrate",
          "gate.desc": "Por ahora estás navegando como invitado. Esta acción requiere una cuenta — puedes registrarte ahora o más tarde.",
          "gate.later": "Más tarde", "gate.register": "Registrarse",
          "theme.fabTitle": "Cambiar estilo", "theme.title": "Estilo del sitio",
          "theme.tungi": "Nocturno", "theme.yorug": "Claro", "theme.cyberpunk": "Cyberpunk", "theme.cyberpunkBlue": "Cyberpunk azul", "theme.cyberpunkYellow": "Cyberpunk amarillo", "theme.custom": "Personalizado",
          "theme.customPick": "Elige tu propio color",
          "admin.nav": "Rincón del administrador",
          "admin.eyebrow": "Moderación",
          "admin.title": "Rincón del <span>administrador</span>",
          "admin.sub": "Todos los usuarios — banéalos o siléncialos, o levanta una restricción antes de tiempo.",
          "admin.loading": "Cargando...",
          "admin.loadFail": "No se pudieron cargar los usuarios.",
          "admin.empty": "Todavía no hay usuarios.",
          "admin.lastSeen.never": "Nunca visitó el sitio",
          "admin.lastSeen.justNow": "En línea ahora",
          "admin.lastSeen.minutesAgo": "Visto hace {n} min",
          "admin.lastSeen.hoursAgo": "Visto hace {n} h",
          "admin.lastSeen.daysAgo": "Visto hace {n} d",
          "admin.lastSeen.onDate": "Visto por última vez el {date}",
          "admin.badge.admin": "Administrador", "admin.badge.banned": "Baneado", "admin.badge.muted": "Silenciado",
          "admin.badge.ok": "Activo",
          "admin.status.bannedUntil": "Baneado hasta {date}",
          "admin.status.mutedUntil": "Silenciado hasta {date}",
          "admin.action.ban": "Banear", "admin.action.unban": "Quitar baneo",
          "admin.action.mute": "Silenciar", "admin.action.unmute": "Quitar silencio",
          "admin.actionFail": "No se pudo completar la acción.",
          "admin.confirm.unban": "¿Quitar el baneo de este usuario antes de tiempo?",
          "admin.confirm.unmute": "¿Quitar el silencio de este usuario antes de tiempo?",
          "admin.mod.title": "Restringir a un usuario",
          "admin.mod.titleBan": "Banear a @{username}",
          "admin.mod.titleMute": "Silenciar a @{username}",
          "admin.mod.minutes": "Duración (minutos)",
          "admin.mod.reason": "Motivo (opcional)",
          "admin.mod.reasonPh": "Motivo de la infracción...",
          "admin.mod.confirm": "Confirmar",
          "admin.mod.errMinutes": "Introduce una duración válida (al menos 1 minuto).",
          "ban.title": "Tu cuenta está bloqueada",
          "ban.until": "El baneo termina: {date}.",
          "ban.reason": "Motivo: {reason}",
          "mute.banner": "Estás silenciado temporalmente — no puedes comentar, enviar mensajes ni subir nuevas obras.",
          "mute.bannerReason": "Estás silenciado hasta {date}. Motivo: {reason}",
          "mute.bannerNoReason": "Estás silenciado hasta {date} — no puedes comentar, enviar mensajes ni subir nuevas obras.",
          "notif.banReason": "El administrador te baneó hasta {date}. Motivo: {reason}",
          "notif.banNoReason": "El administrador te baneó hasta {date}.",
          "notif.muteReason": "El administrador te silenció hasta {date} (no puedes comentar, enviar mensajes ni subir obras). Motivo: {reason}",
          "notif.muteNoReason": "El administrador te silenció hasta {date} (no puedes comentar, enviar mensajes ni subir obras).",
          "notif.unban": "El administrador quitó tu baneo antes de tiempo. Ya puedes volver a usar tu cuenta.",
          "notif.unmute": "El administrador quitó tu silencio antes de tiempo. Ya puedes comentar, enviar mensajes y subir obras de nuevo.",
          "notif.banExpired": "Tu baneo ha terminado. Ya puedes volver a usar tu cuenta.",
          "notif.muteExpired": "Tu silencio ha terminado. Ya puedes comentar, enviar mensajes y subir obras de nuevo.",
          "nav.cart": "Carrito",
          "search.placeholder": "Buscar...", "filter.type.all": "Todos los tipos", "filter.sort.new": "Más reciente", "filter.sort.top": "Más gustados", "filter.price.min": "Precio desde", "filter.price.max": "Precio hasta", "filter.onlyFollowing": "Solo a quienes sigo",
          "search.clearAria": "Borrar",
          "search.closeAria": "Cerrar",
          "cart.eyebrow": "Compras",
          "cart.title": "Tu <span>carrito</span>",
          "cart.sub": "Las obras que agregaste al carrito están aquí — ajusta las cantidades y haz tu pedido.",
          "profile.stat.followers": "Seguidores",
          "profile.stat.following": "Siguiendo",
          "profile.stat.likes": "Me gusta",
          "profile.stat.comments": "Comentarios", "profile.stat.views": "Vistas",
          "admin.reportsLabel": "Denuncias",
          "admin.usersLabel": "Usuarios",
          "report.action": "Denunciar",
          "report.reasonLabel": "Motivo",
          "report.reasonPh": "¿Por qué estás denunciando esto? (opcional)",
          "report.submitBtn": "Enviar",
          "report.sentAlert": "Tu denuncia ha sido recibida. La revisaremos.",
          "admin.stat.users": "Usuarios",
          "admin.stat.todayHint": "+{count} hoy",
          "admin.stat.works": "Obras",
          "admin.stat.likes": "Me gusta",
          "admin.stat.comments": "Comentarios",
          "admin.stat.openReports": "Denuncias abiertas",
          "admin.stat.banMute": "Ban/Mute",
          "admin.report.typeWork": "Obra",
          "admin.report.typeUser": "Usuario",
          "admin.report.subjectWork": "Obra: \"{title}\"",
          "admin.report.subjectUser": "Usuario: @{username}",
          "admin.report.gone": "(ya eliminado)",
          "admin.report.reporter": "Denunciante: @{username} ({fullname})",
          "admin.report.resolved": "✓ Revisado",
          "admin.report.resolvedDeleted": " · imagen eliminada",
          "admin.report.resolveBtn": "Marcar como revisado",
          "admin.report.deleteWorkBtn": "Eliminar imagen",
          "admin.report.deleteConfirm": "¿Quieres eliminar permanentemente la imagen de esta obra? Esta acción no se puede deshacer.",
          "admin.report.empty": "Aún no hay denuncias.",
          "follow.subscribeBtn": "Seguir",
          "follow.unsubscribeBtn": "Dejar de seguir",
          "follow.unfollowConfirm": "¿Quieres dejar de seguir? Ya no recibirás notificaciones sobre las nuevas obras de este usuario.",
          "follow.stats": "{followers} seguidores · siguiendo a {following}",
          "follow.short": "Siguiendo",
          "follow.shortAdd": "+ Seguir",
          "notif.follow": "{name} empezó a seguirte",
          "save.aria": "Guardar",
          "share.aria": "Compartir", "share.linkCopied": "Enlace copiado: {url}", "share.copyPrompt": "Copia el enlace:",
          /* ---- video call feature (previously missing from this language) ---- */
          "call.startTitle": "Videollamada",
          "call.incoming": "Videollamada entrante...",
          "call.decline": "Rechazar",
          "call.accept": "Aceptar",
          "call.calling": "Llamando...",
          "call.connecting": "Conectando...",
          "call.peerCameraOff": "La cámara está apagada",
          "call.toggleMic": "Micrófono",
          "call.toggleCam": "Cámara",
          "call.end": "Finalizar llamada",
          "call.startFail": "No se pudo realizar la llamada. Inténtalo de nuevo.",
          "call.noCamera": "No se encontró cámara, conectando solo con audio...",
          "call.noMediaAccess": "Se denegó el acceso al micrófono/cámara.",
          "call.wasDeclined": "Llamada rechazada",
          "call.wasMissed": "Sin respuesta",
          "call.wasBusy": "El usuario está ocupado",
          "call.ended": "Llamada finalizada",
          "call.msg.ended": "Videollamada",
          "call.msg.noAnswer": "Sin respuesta",
          "call.msg.missed": "Llamada perdida",
          "call.msg.declined": "Llamada rechazada",
          "call.msg.cancelled": "Llamada cancelada",
          "call.msg.busy": "El usuario estaba ocupado",
          "profile.edit.callPrivacyTitle": "Elige quién puede hacerte videollamadas:",
          "profile.edit.callPrivacyEveryone": "Todos",
          "profile.edit.callPrivacySelected": "Solo personas seleccionadas",
          "profile.edit.callPrivacyNobody": "Nadie",
          "profile.edit.callPrivacyAddPh": "Introduce un nombre de usuario...",
          "profile.edit.callPrivacyAdd": "Añadir",
          "profile.edit.callPrivacyEmpty": "Aún no se ha añadido a nadie.",
          "profile.edit.callPrivacyRemove": "Quitar",
          "profile.edit.callPrivacyAddSelfErr": "No puedes añadirte a ti mismo.",
          "profile.edit.callPrivacyAddNotFound": "No se encontró ese usuario.",
          "feedThumb.aria": "Ver imagen a tamaño completo",
          "notif.someone": "Alguien",
      },
        ar: {
          _locale: 'ar-SA', _dir: 'rtl', _name: "العربية",
          "auth.tagline": "احفظ اللوحات والمنحوتات والمجسمات التي صنعتها بيديك — اعرضها للبيع أو للعرض فقط.",
          "auth.tabLogin": "تسجيل الدخول", "auth.tabRegister": "إنشاء حساب",
          "auth.loginUsername": "اسم المستخدم", "auth.loginUsernamePh": "مثال: dilnoza_art",
          "auth.loginPassword": "كلمة المرور", "auth.loginBtn": "تسجيل الدخول",
          "common.serverError": "خطأ في الخادم",
          "auth.loginErrorDefault": "اسم المستخدم أو كلمة المرور غير صحيحة.",
          "auth.regFullname": "الاسم الكامل", "auth.regFullnamePh": "الاسم واللقب",
          "auth.regUsername": "اسم المستخدم", "auth.regUsernamePh": "أحرف لاتينية بدون مسافات",
          "auth.regEmail": "البريد الإلكتروني",
          "auth.regPassword": "كلمة المرور", "auth.regPasswordPh": "4 أحرف على الأقل",
          "auth.regPassword2": "تأكيد كلمة المرور", "auth.regPassword2Ph": "أعد كتابتها",
          "auth.regBtn": "إنشاء حساب",
          "auth.regErrorShort": "يجب ألا تقل كلمة المرور عن 4 أحرف.",
          "auth.regErrorMismatch": "كلمتا المرور غير متطابقتين.",
          "auth.pwWeak": "ضعيفة", "auth.pwMedium": "متوسطة", "auth.pwStrong": "قوية",
          "auth.pwMatch": "متطابقة", "auth.pwNoMatch": "غير متطابقة",
          "auth.regErrorDefault": "حدث خطأ أثناء إنشاء الحساب.",
          "auth.or": "أو",
          "auth.guestBtn": "تصفّح فقط الآن",
          "auth.guestBtnSmall": "يمكنك التسجيل لاحقًا",
          "nav.home": "الرئيسية", "nav.profile": "الملف الشخصي", "nav.messages": "الرسائل",
          "nav.newWork": "+", "nav.myProfile": "ملفي الشخصي", "nav.logout": "تسجيل الخروج",
          "nav.register": "إنشاء حساب",
          "guest.banner": "أنت تتصفح كـ<b>ضيف</b> — سجّل للتمكن من رفع الأعمال والإعجاب والتعليق.",
          "guest.registerBtn": "إنشاء حساب",
          "home.eyebrow": "الواجهة", "home.title": "أعمال <span>جميع المبدعين</span>",
          "home.sub": "كل ما رفعه المستخدمون على المنصة — الأحدث أولاً.",
          "feed.end": "لا مزيد من الأعمال.",
          "feed.empty.title": "لا يوجد شيء هنا بعد", "feed.empty.desc": "ارفع أول عمل لك وابدأ مجموعتك.",
          "cart.loading": "جارٍ التحميل...", "cart.empty.title": "عربة التسوق فارغة",
          "cart.empty.desc": "اضغط على أيقونة العربة في الأعمال التي تعجبك لإضافتها هنا.",
          "cart.addAria": "أضف إلى العربة", "cart.increaseAria": "زيادة الكمية", "cart.decreaseAria": "تقليل الكمية",
          "buyNow.aria": "اشترِ الآن",
          "buyNow.confirm": "هل تريد شراء {item} الآن؟",
          "buyNow.success": "تم تقديم طلبك!",
          "buyNow.fail": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
          "cart.removeAria": "إزالة من العربة", "cart.subtotal": "المجموع الفرعي", "cart.checkout": "تقديم الطلب",
          "cart.checkoutConfirm": "هل تريد تأكيد الطلب؟", "cart.orderPlaced": "تم تقديم طلبك! سيتواصل معك البائع قريبًا.",
          "cart.orderFail": "تعذر تقديم الطلب",
          "notif.orderReceived": "طلب {name} {count} من أعمالك.", "notif.orderPlaced": "تم تقديم طلبك بنجاح.",
          "profile.empty.desc": "ارفع أول عمل لك لتبدأ مجموعتك.",
          "feed.likeAria": "إعجاب", "feed.commentAria": "التعليقات",
          "feed.contactAria": "التواصل مع البائع", "feed.contactLabel": "تواصل",
          "feed.sale": "للبيع", "feed.expo": "للعرض",
          "profile.stat.total": "الإجمالي", "profile.stat.sale": "للبيع", "profile.stat.expo": "للعرض",
          "profile.editBtn": "تعديل البيانات",
          "profile.edit.title": "بيانات الملف الشخصي", "profile.edit.changeAvatar": "اختيار صورة",
          "profile.edit.avatarHint": "JPG أو PNG، حتى 8 ميغابايت",
          "profile.edit.fullname": "الاسم الكامل", "profile.edit.email": "البريد الإلكتروني",
          "profile.edit.bio": "نبذة", "profile.edit.bioPh": "اكتب نبذة قصيرة عن نفسك...",
          "profile.edit.phone": "رقم الهاتف", "profile.edit.social": "رابط التواصل الاجتماعي",
          "profile.edit.privacyTitle": "اختر ما يمكن للآخرين رؤيته في ملفك الشخصي:",
          "profile.edit.privacyPhone": "إظهار رقم هاتفي",
          "profile.edit.privacySocial": "إظهار رابط التواصل الاجتماعي الخاص بي",
          "profile.edit.privacyEmail": "إظهار بريدي الإلكتروني",
          "profile.edit.save": "حفظ", "profile.edit.cancel": "إلغاء",
          "profile.myWorks": "أعمالي", "profile.language": "لغة الموقع",
          "profile.joined": "تاريخ الانضمام",
          "profile.online": "متصل", "profile.offline": "غير متصل",
          "profile.avatarUploadFail": "تعذّر رفع الصورة. حاول مرة أخرى.",
          "account.title": "اسم الدخول وكلمة المرور",
          "account.usernameLabel": "اسم المستخدم (تسجيل الدخول)",
          "account.usernameHint": "يجدك الآخرون بهذا الاسم، وتستخدمه أيضًا لتسجيل الدخول.",
          "account.currentPassword": "كلمة المرور الحالية", "account.currentPasswordPh": "أدخلها لإجراء التغييرات", "account.currentPasswordHint": "أدخل كلمة المرور الحالية لحفظ التغييرات.",
          "account.newPassword": "كلمة مرور جديدة", "account.newPasswordPh": "اختياري، 4 أحرف على الأقل",
          "account.newPassword2": "تأكيد كلمة المرور الجديدة", "account.newPassword2Ph": "أعد كتابتها",
          "account.save": "حفظ", "account.saved": "تم الحفظ!",
          "account.err.noChanges": "لم يتم تغيير أي شيء.",
          "account.err.currentPasswordRequired": "أدخل كلمة المرور الحالية للمتابعة.",
          "account.err.currentPasswordIncorrect": "كلمة المرور الحالية غير صحيحة.",
          "account.err.usernameInvalid": "يجب أن يتكون اسم المستخدم من 3-32 حرفًا، أحرف/أرقام/شرطة سفلية فقط.",
          "account.err.usernameTaken": "اسم المستخدم هذا مُستخدم بالفعل.",
          "account.err.passwordTooShort": "يجب أن تتكون كلمة المرور الجديدة من 4 أحرف على الأقل.",
          "account.err.mismatch": "كلمتا المرور الجديدتان غير متطابقتين.",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "لا يمكنك حظر مشرف آخر",
          "err.cannotMuteAdmin": "لا يمكنك كتم مشرف آخر",
          "err.callBlocked": "قام هذا المستخدم بتقييد مكالمات الفيديو",
          "err.commentDeleteForbidden": "ليس لديك إذن لحذف هذا التعليق",
          "err.userBusy": "هذا المستخدم مشغول حاليًا",
          "err.usernameInvalid": "يجب أن يتكون اسم المستخدم من 3-32 حرفًا، وأحرف لاتينية/أرقام/شرطة سفلية فقط",
          "err.loginInvalid": "اسم المستخدم أو كلمة المرور غير صحيحة",
          "err.tooManyAttempts": "محاولات كثيرة جدًا، يرجى المحاولة مرة أخرى بعد قليل",
          "err.unknownMessageType": "نوع رسالة غير معروف",
          "err.invalidData": "بيانات غير صالحة",
          "err.invalidQuantity": "كمية غير صالحة",
          "err.cannotCartOwnWork": "لا يمكنك إضافة عملك الخاص إلى السلة",
          "err.cannotBuyOwnWork": "لا يمكنك شراء عملك الخاص",
          "err.cannotFollowSelf": "لا يمكنك متابعة نفسك",
          "err.cannotCallSelf": "لا يمكنك الاتصال بنفسك",
          "err.cannotMessageSelf": "لا يمكنك مراسلة نفسك",
          "err.cannotBanSelf": "لا يمكنك حظر نفسك",
          "err.cannotMuteSelf": "لا يمكنك كتم نفسك",
          "err.passwordTooShort": "يجب أن تتكون كلمة المرور من 4 أحرف على الأقل",
          "err.callAlreadyEnded": "المكالمة انتهت بالفعل",
          "err.callNotFound": "المكالمة غير موجودة",
          "err.registerServerError": "خطأ في الخادم أثناء التسجيل",
          "err.cartEmpty": "السلة فارغة",
          "err.muted": "أنت مكتوم مؤقتًا، لذا لا يمكنك تنفيذ هذا الإجراء",
          "err.callAlreadyActive": "لديك بالفعل مكالمة نشطة",
          "err.videoProcessingFailed": "حدث خطأ أثناء معالجة الفيديو. يرجى اختيار فيديو آخر.",
          "err.messageEmpty": "لا يمكن أن يكون نص الرسالة فارغًا",
          "err.workNotFound": "العمل غير موجود",
          "err.authRequired": "يرجى تسجيل الدخول أولاً",
          "err.adminRequired": "هذا الإجراء يتطلب صلاحيات مشرف",
          "err.workNotInCart": "هذا العمل غير موجود في السلة",
          "err.workNotForSale": "هذا العمل ليس للبيع",
          "err.workOutOfStock": "نفدت الكمية من هذا العمل",
          "err.usernameTaken": "اسم المستخدم هذا مُستخدم بالفعل",
          "err.onlyCallerCanCancel": "يمكن للمتصل فقط الإلغاء",
          "err.onlyCallerCanOffer": "يمكن للمتصل فقط إرسال العرض",
          "err.onlyCalleeCanAnswer": "يمكن للمستلم فقط الرد",
          "err.onlyCalleeCanDecline": "يمكن للمستلم فقط الرفض",
          "err.fileRequired": "الملف مطلوب",
          "err.userNotFound": "المستخدم غير موجود",
          "err.accountBanned": "تم حظر حسابك مؤقتًا",
          "err.mediaRequired": "مطلوب صورة أو فيديو واحد على الأقل",
          "err.loginServerError": "خطأ في الخادم أثناء تسجيل الدخول",
          "err.commentEmpty": "لا يمكن أن يكون نص التعليق فارغًا",
          "err.commentNotFound": "التعليق غير موجود",
          "err.imageRequired": "الصورة مطلوبة",
          "err.serverError": "خطأ في الخادم",
          "err.reportNotFound": "البلاغ غير موجود",
          "err.noChanges": "لم يتم تغيير أي شيء",
          "err.currentPasswordRequired": "أدخل كلمة المرور الحالية للمتابعة",
          "err.currentPasswordIncorrect": "كلمة المرور الحالية غير صحيحة",
          "err.videoWithOtherFiles": "لا يمكن رفع فيديو مع ملفات أخرى — اختر فيديو واحدًا فقط",
          "err.videoTooLong10s": "يجب ألا تتجاوز مدة الفيديو 10 ثوانٍ",
          "err.invalidWorkMediaType": "يُقبل فقط الصور أو الفيديوهات (mp4/mov، حتى 10 ثوانٍ)",
          "err.dangerousFileType": "لا يمكن إرسال هذا النوع من الملفات",
          "err.onlyImagesAllowed": "يُقبل فقط ملفات الصور",
          "err.onlyVideosAllowed": "يُقبل فقط ملفات الفيديو",
          "err.onlyAudioAllowed": "يُقبل فقط ملفات الصوت",
          "err.fileTooLarge": "حجم الملف كبير جدًا",
          "err.tooManyFiles": "تم رفع عدد كبير جدًا من الملفات",
          "err.uploadError": "حدث خطأ أثناء رفع الملف",
          "err.notEnoughStock": "لم يتبقَّ سوى {n}",
          "err.videoTooLong": "الفيديو طويل جدًا (الحد الأقصى {n} ثانية)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 صورة",
          "chat.preview.video": "🎥 فيديو",
          "chat.preview.circle": "⭕ رسالة فيديو",
          "chat.preview.voice": "🎙️ رسالة صوتية",
          "chat.preview.file": "📎 ملف",
          "chat.voiceAria": "رسالة صوتية", "chat.circleAria": "رسالة فيديو",
          "filter.typeAria": "الفئة", "filter.sortAria": "الترتيب", "chat.emojiAria": "الرموز التعبيرية",
          "messages.eyebrow": "المحادثات", "messages.title": "رسائل مع <span>البائعين</span>",
          "messages.sub": "اسأل عن عمل معروض للبيع أو تواصل مع بائع — محادثاتك هنا.",
          "messages.empty.title": "لا توجد محادثات بعد",
          "messages.empty.desc": "اضغط زر \"تواصل\" أسفل أي عمل معروض للبيع لمراسلة البائع.",
          "messages.loadFail.title": "تعذّر التحميل", "messages.loadFail.desc": "تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
          "messages.you": "أنت",
          "userProfile.back": "→ رجوع", "userProfile.works": "الأعمال",
          "userProfile.notFound.title": "غير موجود", "userProfile.notFound.desc": "هذا المستخدم غير موجود.",
          "userProfile.contactBtn": "إرسال رسالة",
          "upload.title": "رفع عمل جديد",
          "upload.imagesLabel": "صور أو فيديو (من 1 إلى 3 صور، أو فيديو واحد حتى 10 ثوانٍ)",
          "upload.dropDefault": "اضغط لاختيار صور/فيديو أو اسحبها هنا — حتى 3 صور، أو فيديو واحد حتى 10 ثوانٍ",
          "upload.dropChosen": "تم اختيار {n}/{max} صور — اضغط لإضافة المزيد",
          "upload.dropFull": "تم اختيار 3 صور — ستُعرض كصورة مجمّعة",
          "upload.titleLabel": "العنوان", "upload.titlePh": "مثال: «منظر الخريف»",
          "upload.typeLabel": "النوع", "upload.type.rasm": "لوحة / رسم", "upload.type.haykal": "منحوتة",
          "upload.type.mulaj": "مجسم", "upload.type.boshqa": "أخرى", "upload.type.otherPh": "أدخل النوع",
          "upload.statusLabel": "الحالة", "upload.status.expo": "للعرض فقط", "upload.status.sale": "للبيع",
          "upload.priceLabel": "السعر", "upload.currencyLabel": "العملة",
          "upload.stockLabel": "التوفر", "upload.stock.fixed": "كمية محددة", "upload.stock.order": "يُصنع حسب الطلب", "upload.stock.qtyPh": "كم عدد القطع المتوفرة؟",
          "stock.order": "يُصنع حسب الطلب", "stock.out": "نفدت الكمية", "stock.left": "تبقّى {n} فقط",
          "upload.descLabel": "الوصف", "upload.descPh": "وصف مختصر للعمل...",
          "upload.save": "حفظ", "upload.removeAria": "إزالة",
                    "upload.errNoImage": "الرجاء اختيار صورة واحدة على الأقل.",
          "upload.errVideoTooLong": "يجب ألا تتجاوز مدة الفيديو 10 ثوانٍ.",
          "upload.errVideoWithImages": "لا يمكن رفع فيديو مع صور معًا.",
          "upload.videoNotSupported": "تعذّر على متصفحك التحقق من الفيديو. الرجاء اختيار ملف آخر.",
          "upload.errGeneric": "حدث خطأ أثناء الحفظ. حاول مرة أخرى.",
          "lightbox.editStatus": "تغيير الحالة",
          "lightbox.delete": "حذف", "lightbox.noDesc": "لا يوجد وصف.",
          "lightbox.workTagFallback": "عمل",
          "comments.title": "التعليقات", "comments.ph": "اكتب تعليقًا...", "comments.send": "إرسال",
          "comments.empty": "لا توجد تعليقات بعد. كن أول من يكتب!",
          "comments.loading": "جارٍ التحميل...", "comments.loadFail": "تعذّر تحميل التعليقات.",
          "comments.delete": "حذف",
          "chat.ph": "اكتب رسالة...", "chat.workRefPrefix": "بخصوص",
          "chat.loadFail": "تعذّر تحميل المحادثة.", "chat.empty": "لا توجد رسائل بعد. كن أول من يكتب!",
          "chat.sendFail": "تعذّر إرسال الرسالة. حاول مرة أخرى.",
          "chat.attach.media": "صورة / فيديو", "chat.attach.file": "ملف",
          "chat.micDenied": "تم رفض إذن الميكروفون أو الكاميرا",
          "chat.recordingVoice": "جارٍ تسجيل رسالة صوتية...", "chat.recordingCircle": "جارٍ تسجيل رسالة فيديو...",
          "chat.mediaSendFail": "تعذّر إرسال الملف. حاول مرة أخرى.",
          "chat.attachTitle": "إرفاق ملف", "chat.circleTitle": "رسالة فيديو (انقر للتسجيل)",
          "chat.voiceTitle": "رسالة صوتية (انقر للتسجيل)", "chat.recordCancelTitle": "إلغاء", "chat.recordSendTitle": "إرسال",
          "gate.title": "الرجاء إنشاء حساب",
          "gate.desc": "أنت تتصفح حاليًا كضيف. تتطلب هذه العملية حسابًا — يمكنك التسجيل الآن أو لاحقًا.",
          "gate.later": "لاحقًا", "gate.register": "إنشاء حساب",
          "theme.fabTitle": "تغيير النمط", "theme.title": "نمط الموقع",
          "theme.tungi": "ليلي", "theme.yorug": "فاتح", "theme.cyberpunk": "سايبربانك", "theme.cyberpunkBlue": "سايبربانك أزرق", "theme.cyberpunkYellow": "سايبربانك أصفر", "theme.custom": "مخصص",
          "theme.customPick": "اختر لونك الخاص",
          "admin.nav": "زاوية المشرف",
          "admin.eyebrow": "الإشراف",
          "admin.title": "زاوية <span>المشرف</span>",
          "admin.sub": "جميع المستخدمين — احظرهم أو أسكتهم، أو ألغِ قيدًا مبكرًا.",
          "admin.loading": "جارٍ التحميل...",
          "admin.loadFail": "تعذر تحميل المستخدمين.",
          "admin.empty": "لا يوجد مستخدمون بعد.",
          "admin.lastSeen.never": "لم يزر الموقع مطلقًا",
          "admin.lastSeen.justNow": "متصل الآن",
          "admin.lastSeen.minutesAgo": "آخر ظهور قبل {n} دقيقة",
          "admin.lastSeen.hoursAgo": "آخر ظهور قبل {n} ساعة",
          "admin.lastSeen.daysAgo": "آخر ظهور قبل {n} يوم",
          "admin.lastSeen.onDate": "آخر ظهور في {date}",
          "admin.badge.admin": "مشرف", "admin.badge.banned": "محظور", "admin.badge.muted": "مكتوم",
          "admin.badge.ok": "نشط",
          "admin.status.bannedUntil": "محظور حتى {date}",
          "admin.status.mutedUntil": "مكتوم حتى {date}",
          "admin.action.ban": "حظر", "admin.action.unban": "إلغاء الحظر",
          "admin.action.mute": "كتم", "admin.action.unmute": "إلغاء الكتم",
          "admin.actionFail": "تعذر إتمام الإجراء.",
          "admin.confirm.unban": "هل تريد إلغاء حظر هذا المستخدم مبكرًا؟",
          "admin.confirm.unmute": "هل تريد إلغاء كتم هذا المستخدم مبكرًا؟",
          "admin.mod.title": "تقييد مستخدم",
          "admin.mod.titleBan": "حظر @{username}",
          "admin.mod.titleMute": "كتم @{username}",
          "admin.mod.minutes": "المدة (بالدقائق)",
          "admin.mod.reason": "السبب (اختياري)",
          "admin.mod.reasonPh": "سبب المخالفة...",
          "admin.mod.confirm": "تأكيد",
          "admin.mod.errMinutes": "أدخل مدة صحيحة (دقيقة واحدة على الأقل).",
          "ban.title": "حسابك محظور",
          "ban.until": "ينتهي الحظر في: {date}.",
          "ban.reason": "السبب: {reason}",
          "mute.banner": "أنت مكتوم مؤقتًا — لا يمكنك التعليق أو المراسلة أو رفع عمل جديد.",
          "mute.bannerReason": "أنت مكتوم حتى {date}. السبب: {reason}",
          "mute.bannerNoReason": "أنت مكتوم حتى {date} — لا يمكنك التعليق أو المراسلة أو رفع عمل جديد.",
          "notif.banReason": "قام المشرف بحظرك حتى {date}. السبب: {reason}",
          "notif.banNoReason": "قام المشرف بحظرك حتى {date}.",
          "notif.muteReason": "قام المشرف بكتمك حتى {date} (لا يمكنك التعليق/المراسلة/رفع الأعمال). السبب: {reason}",
          "notif.muteNoReason": "قام المشرف بكتمك حتى {date} (لا يمكنك التعليق/المراسلة/رفع الأعمال).",
          "notif.unban": "ألغى المشرف حظرك مبكرًا. يمكنك استخدام حسابك مجددًا.",
          "notif.unmute": "ألغى المشرف كتمك مبكرًا. يمكنك التعليق والمراسلة ورفع الأعمال مجددًا.",
          "notif.banExpired": "انتهت مدة حظرك. يمكنك استخدام حسابك مجددًا.",
          "notif.muteExpired": "انتهت مدة كتمك. يمكنك التعليق والمراسلة ورفع الأعمال مجددًا.",
          "nav.cart": "عربة التسوق",
          "search.placeholder": "بحث...", "filter.type.all": "جميع الأنواع", "filter.sort.new": "الأحدث", "filter.sort.top": "الأكثر إعجابًا", "filter.price.min": "السعر من", "filter.price.max": "السعر إلى", "filter.onlyFollowing": "من أتابعهم فقط",
          "search.clearAria": "مسح",
          "search.closeAria": "إغلاق",
          "cart.eyebrow": "التسوق",
          "cart.title": "عربة <span>تسوقك</span>",
          "cart.sub": "الأعمال التي أضفتها إلى عربة التسوق موجودة هنا — عدّل الكميات وقدّم طلبك.",
          "profile.stat.followers": "المتابعون",
          "profile.stat.following": "المتابَعون",
          "profile.stat.likes": "الإعجابات",
          "profile.stat.comments": "التعليقات", "profile.stat.views": "المشاهدات",
          "admin.reportsLabel": "البلاغات",
          "admin.usersLabel": "المستخدمون",
          "report.action": "إبلاغ",
          "report.reasonLabel": "السبب",
          "report.reasonPh": "لماذا تبلغ عن هذا؟ (اختياري)",
          "report.submitBtn": "إرسال",
          "report.sentAlert": "تم استلام بلاغك. سنراجعه.",
          "admin.stat.users": "المستخدمون",
          "admin.stat.todayHint": "+{count} اليوم",
          "admin.stat.works": "الأعمال",
          "admin.stat.likes": "الإعجابات",
          "admin.stat.comments": "التعليقات",
          "admin.stat.openReports": "بلاغات مفتوحة",
          "admin.stat.banMute": "حظر/كتم",
          "admin.report.typeWork": "عمل",
          "admin.report.typeUser": "مستخدم",
          "admin.report.subjectWork": "العمل: \"{title}\"",
          "admin.report.subjectUser": "المستخدم: @{username}",
          "admin.report.gone": "(تم حذفه بالفعل)",
          "admin.report.reporter": "المبلّغ: @{username} ({fullname})",
          "admin.report.resolved": "✓ تمت المراجعة",
          "admin.report.resolvedDeleted": " · تم حذف الصورة",
          "admin.report.resolveBtn": "وضع علامة تمت المراجعة",
          "admin.report.deleteWorkBtn": "حذف الصورة",
          "admin.report.deleteConfirm": "هل تريد حذف صورة هذا العمل نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
          "admin.report.empty": "لا توجد بلاغات حتى الآن.",
          "follow.subscribeBtn": "متابعة",
          "follow.unsubscribeBtn": "إلغاء المتابعة",
          "follow.unfollowConfirm": "هل تريد إلغاء المتابعة؟ لن يتم إعلامك بعد الآن بالأعمال الجديدة لهذا المستخدم.",
          "follow.stats": "{followers} متابع · يتابع {following}",
          "follow.short": "متابَع",
          "follow.shortAdd": "+ متابعة",
          "notif.follow": "بدأ {name} بمتابعتك",
          "save.aria": "حفظ",
          "share.aria": "مشاركة", "share.linkCopied": "تم نسخ الرابط: {url}", "share.copyPrompt": "انسخ الرابط:",
          /* ---- video call feature (previously missing from this language) ---- */
          "call.startTitle": "مكالمة فيديو",
          "call.incoming": "مكالمة فيديو واردة...",
          "call.decline": "رفض",
          "call.accept": "قبول",
          "call.calling": "جارٍ الاتصال...",
          "call.connecting": "جارٍ الربط...",
          "call.peerCameraOff": "الكاميرا مغلقة",
          "call.toggleMic": "الميكروفون",
          "call.toggleCam": "الكاميرا",
          "call.end": "إنهاء المكالمة",
          "call.startFail": "تعذر إجراء المكالمة. يرجى المحاولة مرة أخرى.",
          "call.noCamera": "لم يتم العثور على كاميرا، يتم الاتصال بالصوت فقط...",
          "call.noMediaAccess": "تم رفض الوصول إلى الميكروفون/الكاميرا.",
          "call.wasDeclined": "تم رفض المكالمة",
          "call.wasMissed": "لا يوجد رد",
          "call.wasBusy": "المستخدم مشغول",
          "call.ended": "انتهت المكالمة",
          "call.msg.ended": "مكالمة فيديو",
          "call.msg.noAnswer": "لا يوجد رد",
          "call.msg.missed": "مكالمة فائتة",
          "call.msg.declined": "مكالمة مرفوضة",
          "call.msg.cancelled": "مكالمة ملغاة",
          "call.msg.busy": "كان المستخدم مشغولاً",
          "profile.edit.callPrivacyTitle": "اختر من يمكنه الاتصال بك عبر الفيديو:",
          "profile.edit.callPrivacyEveryone": "الجميع",
          "profile.edit.callPrivacySelected": "الأشخاص المحددون فقط",
          "profile.edit.callPrivacyNobody": "لا أحد",
          "profile.edit.callPrivacyAddPh": "أدخل اسم المستخدم...",
          "profile.edit.callPrivacyAdd": "إضافة",
          "profile.edit.callPrivacyEmpty": "لم تتم إضافة أي شخص بعد.",
          "profile.edit.callPrivacyRemove": "إزالة",
          "profile.edit.callPrivacyAddSelfErr": "لا يمكنك إضافة نفسك.",
          "profile.edit.callPrivacyAddNotFound": "لم يتم العثور على هذا المستخدم.",
          "feedThumb.aria": "عرض الصورة بالحجم الكامل",
          "notif.someone": "شخص ما",
      },
        ru: {
          _locale: 'ru-RU', _dir: 'ltr', _name: "Русский",
          "auth.tagline": "Сохраняйте картины, скульптуры и макеты, сделанные своими руками, — выставляйте на продажу или просто на показ.",
          "auth.tabLogin": "Войти", "auth.tabRegister": "Регистрация",
          "auth.loginUsername": "Имя пользователя", "auth.loginUsernamePh": "например: dilnoza_art",
          "auth.loginPassword": "Пароль", "auth.loginBtn": "Войти",
          "common.serverError": "Ошибка сервера",
          "auth.loginErrorDefault": "Неверное имя пользователя или пароль.",
          "auth.regFullname": "Полное имя", "auth.regFullnamePh": "Имя Фамилия",
          "auth.regUsername": "Имя пользователя", "auth.regUsernamePh": "латинские буквы, без пробелов",
          "auth.regEmail": "Email",
          "auth.regPassword": "Пароль", "auth.regPasswordPh": "минимум 4 символа",
          "auth.regPassword2": "Подтверждение", "auth.regPassword2Ph": "введите ещё раз",
          "auth.regBtn": "Создать аккаунт",
          "auth.regErrorShort": "Пароль должен содержать минимум 4 символа.",
          "auth.regErrorMismatch": "Пароли не совпадают.",
          "auth.pwWeak": "Слабый", "auth.pwMedium": "Средний", "auth.pwStrong": "Надёжный",
          "auth.pwMatch": "Совпадает", "auth.pwNoMatch": "Не совпадает",
          "auth.regErrorDefault": "Что-то пошло не так при регистрации.",
          "auth.or": "или",
          "auth.guestBtn": "Просто посмотреть",
          "auth.guestBtnSmall": "Зарегистрироваться можно позже",
          "nav.home": "Главная", "nav.profile": "Профиль", "nav.messages": "Сообщения",
          "nav.newWork": "+", "nav.myProfile": "Мой профиль", "nav.logout": "Выйти",
          "nav.register": "Регистрация",
          "guest.banner": "Вы просматриваете сайт как <b>гость</b> — зарегистрируйтесь, чтобы загружать работы, ставить лайки и комментировать.",
          "guest.registerBtn": "Регистрация",
          "home.eyebrow": "Лента", "home.title": "Работы <span>всех авторов</span>",
          "home.sub": "Всё, что загружено на платформу — сначала новое.",
          "feed.end": "Больше работ нет.",
          "feed.empty.title": "Здесь пока пусто", "feed.empty.desc": "Загрузите первую работу и начните свою коллекцию.",
          "cart.loading": "Загрузка...", "cart.empty.title": "Ваша корзина пуста",
          "cart.empty.desc": "Нажмите значок корзины на понравившихся работах, чтобы добавить их сюда.",
          "cart.addAria": "Добавить в корзину", "cart.increaseAria": "Увеличить количество", "cart.decreaseAria": "Уменьшить количество",
          "buyNow.aria": "Купить сейчас",
          "buyNow.confirm": "Купить {item} прямо сейчас?",
          "buyNow.success": "Ваш заказ оформлен!",
          "buyNow.fail": "Произошла ошибка. Попробуйте ещё раз.",
          "cart.removeAria": "Удалить из корзины", "cart.subtotal": "Промежуточный итог", "cart.checkout": "Оформить заказ",
          "cart.checkoutConfirm": "Подтвердить заказ?", "cart.orderPlaced": "Ваш заказ оформлен! Продавец скоро свяжется с вами.",
          "cart.orderFail": "Не удалось оформить заказ",
          "notif.orderReceived": "{name} заказал(а) {count} ваших работ.", "notif.orderPlaced": "Ваш заказ успешно оформлен.",
          "profile.empty.desc": "Загрузите свою первую работу, чтобы начать коллекцию.",
          "feed.likeAria": "Нравится", "feed.commentAria": "Комментарии",
          "feed.contactAria": "Связаться с продавцом", "feed.contactLabel": "Связаться",
          "feed.sale": "Продаётся", "feed.expo": "На выставке",
          "profile.stat.total": "Всего", "profile.stat.sale": "Продаётся", "profile.stat.expo": "На выставке",
          "profile.editBtn": "Редактировать данные",
          "profile.edit.title": "Данные профиля", "profile.edit.changeAvatar": "Выбрать фото",
          "profile.edit.avatarHint": "JPG или PNG, до 8 МБ",
          "profile.edit.fullname": "Полное имя", "profile.edit.email": "Email",
          "profile.edit.bio": "О себе", "profile.edit.bioPh": "Короткая строка о себе...",
          "profile.edit.phone": "Номер телефона", "profile.edit.social": "Ссылка на соцсеть",
          "profile.edit.privacyTitle": "Выберите, что другие видят в вашем профиле:",
          "profile.edit.privacyPhone": "Показывать мой номер телефона",
          "profile.edit.privacySocial": "Показывать ссылку на мою соцсеть",
          "profile.edit.privacyEmail": "Показывать мой email",
          "profile.edit.save": "Сохранить", "profile.edit.cancel": "Отмена",
          "profile.myWorks": "Мои работы", "profile.language": "Язык сайта",
          "profile.joined": "Дата регистрации",
          "profile.online": "Онлайн", "profile.offline": "Оффлайн",
          "profile.avatarUploadFail": "Не удалось загрузить фото. Попробуйте ещё раз.",
          "account.title": "Логин и пароль",
          "account.usernameLabel": "Имя пользователя (логин)",
          "account.usernameHint": "По этому имени вас находят другие, и вы используете его для входа.",
          "account.currentPassword": "Текущий пароль", "account.currentPasswordPh": "введите, чтобы внести изменения", "account.currentPasswordHint": "Введите текущий пароль, чтобы сохранить изменения.",
          "account.newPassword": "Новый пароль", "account.newPasswordPh": "необязательно, минимум 4 символа",
          "account.newPassword2": "Подтверждение нового пароля", "account.newPassword2Ph": "введите ещё раз",
          "account.save": "Сохранить", "account.saved": "Сохранено!",
          "account.err.noChanges": "Ничего не изменено.",
          "account.err.currentPasswordRequired": "Введите текущий пароль, чтобы продолжить.",
          "account.err.currentPasswordIncorrect": "Текущий пароль неверен.",
          "account.err.usernameInvalid": "Имя пользователя должно быть 3-32 символа, только латиница/цифры/подчёркивание.",
          "account.err.usernameTaken": "Это имя пользователя уже занято.",
          "account.err.passwordTooShort": "Новый пароль должен содержать минимум 4 символа.",
          "account.err.mismatch": "Новые пароли не совпадают.",
          /* ---- generic API error kodlari (server "code" maydoni orqali) ---- */
          "err.cannotBanAdmin": "Вы не можете забанить другого администратора",
          "err.cannotMuteAdmin": "Вы не можете заглушить другого администратора",
          "err.callBlocked": "Этот пользователь ограничил видеозвонки",
          "err.commentDeleteForbidden": "У вас нет прав на удаление этого комментария",
          "err.userBusy": "Пользователь сейчас занят",
          "err.usernameInvalid": "Имя пользователя должно содержать 3-32 символа: только латинские буквы, цифры и подчёркивание",
          "err.loginInvalid": "Неверное имя пользователя или пароль",
          "err.tooManyAttempts": "Слишком много попыток, повторите чуть позже",
          "err.unknownMessageType": "Неизвестный тип сообщения",
          "err.invalidData": "Неверные данные",
          "err.invalidQuantity": "Неверное количество",
          "err.cannotCartOwnWork": "Вы не можете добавить свою работу в корзину",
          "err.cannotBuyOwnWork": "Вы не можете купить свою собственную работу",
          "err.cannotFollowSelf": "Вы не можете подписаться на самого себя",
          "err.cannotCallSelf": "Вы не можете позвонить самому себе",
          "err.cannotMessageSelf": "Вы не можете отправить сообщение самому себе",
          "err.cannotBanSelf": "Вы не можете забанить самого себя",
          "err.cannotMuteSelf": "Вы не можете заглушить самого себя",
          "err.passwordTooShort": "Пароль должен содержать не менее 4 символов",
          "err.callAlreadyEnded": "Звонок уже завершён",
          "err.callNotFound": "Звонок не найден",
          "err.registerServerError": "Ошибка сервера при регистрации",
          "err.cartEmpty": "Корзина пуста",
          "err.muted": "Вы временно в режиме без права голоса (мут), поэтому не можете выполнить это действие",
          "err.callAlreadyActive": "У вас уже есть активный звонок",
          "err.videoProcessingFailed": "Не удалось обработать видео. Выберите другое видео.",
          "err.messageEmpty": "Текст сообщения не может быть пустым",
          "err.workNotFound": "Работа не найдена",
          "err.authRequired": "Сначала войдите в систему",
          "err.adminRequired": "Для этого действия нужны права администратора",
          "err.workNotInCart": "Эта работа не найдена в корзине",
          "err.workNotForSale": "Эта работа не продаётся",
          "err.workOutOfStock": "Эта работа закончилась",
          "err.usernameTaken": "Это имя пользователя уже занято",
          "err.onlyCallerCanCancel": "Отменить может только позвонивший",
          "err.onlyCallerCanOffer": "Отправить предложение может только позвонивший",
          "err.onlyCalleeCanAnswer": "Ответить может только тот, кому звонят",
          "err.onlyCalleeCanDecline": "Отклонить может только тот, кому звонят",
          "err.fileRequired": "Требуется файл",
          "err.userNotFound": "Пользователь не найден",
          "err.accountBanned": "Ваш аккаунт временно заблокирован (бан)",
          "err.mediaRequired": "Требуется хотя бы одно фото или видео",
          "err.loginServerError": "Ошибка сервера при входе",
          "err.commentEmpty": "Текст комментария не может быть пустым",
          "err.commentNotFound": "Комментарий не найден",
          "err.imageRequired": "Требуется изображение",
          "err.serverError": "Ошибка сервера",
          "err.reportNotFound": "Жалоба не найдена",
          "err.noChanges": "Ничего не изменено",
          "err.currentPasswordRequired": "Введите текущий пароль, чтобы продолжить",
          "err.currentPasswordIncorrect": "Текущий пароль неверен",
          "err.videoWithOtherFiles": "Нельзя загрузить видео вместе с другими файлами — выберите только одно видео",
          "err.videoTooLong10s": "Видео не должно быть длиннее 10 секунд",
          "err.invalidWorkMediaType": "Принимаются только фото или видео (mp4/mov, до 10 секунд)",
          "err.dangerousFileType": "Файлы такого типа отправлять нельзя",
          "err.onlyImagesAllowed": "Принимаются только файлы изображений",
          "err.onlyVideosAllowed": "Принимаются только видеофайлы",
          "err.onlyAudioAllowed": "Принимаются только аудиофайлы",
          "err.fileTooLarge": "Файл слишком большой",
          "err.tooManyFiles": "Загружено слишком много файлов",
          "err.uploadError": "Ошибка при загрузке файла",
          "err.notEnoughStock": "Осталось только {n} шт.",
          "err.videoTooLong": "Видео слишком длинное (максимум {n} секунд)",
          /* ---- suhbatlar ro'yxatidagi so'nggi xabar önizlemesi (media turlari) ---- */
          "chat.preview.photo": "📷 Фото",
          "chat.preview.video": "🎥 Видео",
          "chat.preview.circle": "⭕ Видеосообщение",
          "chat.preview.voice": "🎙️ Голосовое сообщение",
          "chat.preview.file": "📎 Файл",
          "chat.voiceAria": "Голосовое сообщение", "chat.circleAria": "Видеосообщение",
          "filter.typeAria": "Категория", "filter.sortAria": "Сортировка", "chat.emojiAria": "Эмодзи",
          "messages.eyebrow": "Переписка", "messages.title": "Сообщения с <span>продавцами</span>",
          "messages.sub": "Задайте вопрос о работе или свяжитесь с продавцом — все чаты здесь.",
          "messages.empty.title": "Пока нет переписок",
          "messages.empty.desc": "Нажмите «Связаться» под работой, чтобы написать продавцу.",
          "messages.loadFail.title": "Не удалось загрузить", "messages.loadFail.desc": "Проверьте соединение и попробуйте снова.",
          "messages.you": "Вы",
          "userProfile.back": "← Назад", "userProfile.works": "Работы",
          "userProfile.notFound.title": "Не найдено", "userProfile.notFound.desc": "Такого пользователя не существует.",
          "userProfile.contactBtn": "Написать сообщение",
          "upload.title": "Загрузить новую работу",
          "upload.imagesLabel": "Фото или видео (от 1 до 3 фото, или одно видео до 10 секунд)",
          "upload.dropDefault": "Нажмите, чтобы выбрать фото/видео, или перетащите сюда — до 3 фото, или одно видео до 10 секунд",
          "upload.dropChosen": "{n}/{max} фото выбрано — нажмите, чтобы добавить ещё",
          "upload.dropFull": "Выбрано 3 фото — показываются как коллаж",
          "upload.titleLabel": "Заголовок", "upload.titlePh": "например: «Осенний пейзаж»",
          "upload.typeLabel": "Тип", "upload.type.rasm": "Картина / рисунок", "upload.type.haykal": "Скульптура",
          "upload.type.mulaj": "Макет", "upload.type.boshqa": "Другое", "upload.type.otherPh": "Укажите тип",
          "upload.statusLabel": "Статус", "upload.status.expo": "Только показ", "upload.status.sale": "Продаётся",
          "upload.priceLabel": "Цена", "upload.currencyLabel": "Валюта",
          "upload.stockLabel": "Наличие", "upload.stock.fixed": "Точное количество", "upload.stock.order": "Изготавливается на заказ", "upload.stock.qtyPh": "Сколько штук в наличии?",
          "stock.order": "Изготавливается на заказ", "stock.out": "Распродано", "stock.left": "Осталось {n}",
          "upload.descLabel": "Описание", "upload.descPh": "Краткое описание работы...",
          "upload.save": "Сохранить", "upload.removeAria": "Удалить",
                    "upload.errNoImage": "Выберите хотя бы одно фото.",
          "upload.errVideoTooLong": "Видео не должно быть длиннее 10 секунд.",
          "upload.errVideoWithImages": "Нельзя загрузить видео вместе с фото.",
          "upload.videoNotSupported": "Ваш браузер не смог проверить видео. Выберите другой файл.",
          "upload.errGeneric": "Что-то пошло не так при сохранении. Попробуйте ещё раз.",
          "lightbox.editStatus": "Изменить статус",
          "lightbox.delete": "Удалить", "lightbox.noDesc": "Описание не указано.",
          "lightbox.workTagFallback": "Работа",
          "comments.title": "Комментарии", "comments.ph": "Написать комментарий...", "comments.send": "Отправить",
          "comments.empty": "Комментариев пока нет. Будьте первым!",
          "comments.loading": "Загрузка...", "comments.loadFail": "Не удалось загрузить комментарии.",
          "comments.delete": "Удалить",
          "chat.ph": "Написать сообщение...", "chat.workRefPrefix": "О работе",
          "chat.loadFail": "Не удалось загрузить переписку.", "chat.empty": "Сообщений пока нет. Будьте первым!",
          "chat.sendFail": "Сообщение не отправлено. Попробуйте ещё раз.",
          "chat.attach.media": "Фото / видео", "chat.attach.file": "Файл",
          "chat.micDenied": "Доступ к микрофону или камере запрещён",
          "chat.recordingVoice": "Запись голосового сообщения...", "chat.recordingCircle": "Запись видеосообщения...",
          "chat.mediaSendFail": "Не удалось отправить файл. Попробуйте ещё раз.",
          "chat.attachTitle": "Прикрепить файл", "chat.circleTitle": "Видеосообщение (нажмите для записи)",
          "chat.voiceTitle": "Голосовое сообщение (нажмите для записи)", "chat.recordCancelTitle": "Отмена", "chat.recordSendTitle": "Отправить",
          "gate.title": "Пожалуйста, зарегистрируйтесь",
          "gate.desc": "Сейчас вы просматриваете сайт как гость. Для этого действия нужен аккаунт — можно зарегистрироваться сейчас или позже.",
          "gate.later": "Позже", "gate.register": "Регистрация",
          "theme.fabTitle": "Изменить стиль", "theme.title": "Стиль сайта",
          "theme.tungi": "Ночной", "theme.yorug": "Светлый", "theme.cyberpunk": "Киберпанк", "theme.cyberpunkBlue": "Киберпанк синий", "theme.cyberpunkYellow": "Киберпанк жёлтый", "theme.custom": "Свой",
          "theme.customPick": "Выберите свой цвет",
          "admin.nav": "Уголок администратора",
          "admin.eyebrow": "Модерация",
          "admin.title": "Уголок <span>администратора</span>",
          "admin.sub": "Все пользователи — выдавайте бан или мут, либо снимайте ограничение досрочно.",
          "admin.loading": "Загрузка...",
          "admin.loadFail": "Не удалось загрузить пользователей.",
          "admin.empty": "Пользователей пока нет.",
          "admin.lastSeen.never": "Никогда не заходил на сайт",
          "admin.lastSeen.justNow": "Сейчас на сайте",
          "admin.lastSeen.minutesAgo": "Был(а) на сайте {n} мин. назад",
          "admin.lastSeen.hoursAgo": "Был(а) на сайте {n} ч. назад",
          "admin.lastSeen.daysAgo": "Был(а) на сайте {n} дн. назад",
          "admin.lastSeen.onDate": "Был(а) на сайте {date}",
          "admin.badge.admin": "Администратор", "admin.badge.banned": "Бан", "admin.badge.muted": "Мут",
          "admin.badge.ok": "Активен",
          "admin.status.bannedUntil": "Бан до: {date}",
          "admin.status.mutedUntil": "Мут до: {date}",
          "admin.action.ban": "Забанить", "admin.action.unban": "Снять бан",
          "admin.action.mute": "Замутить", "admin.action.unmute": "Снять мут",
          "admin.actionFail": "Не удалось выполнить действие.",
          "admin.confirm.unban": "Снять бан этого пользователя досрочно?",
          "admin.confirm.unmute": "Снять мут этого пользователя досрочно?",
          "admin.mod.title": "Ограничить пользователя",
          "admin.mod.titleBan": "Забанить @{username}",
          "admin.mod.titleMute": "Замутить @{username}",
          "admin.mod.minutes": "Срок (в минутах)",
          "admin.mod.reason": "Причина (необязательно)",
          "admin.mod.reasonPh": "Причина нарушения...",
          "admin.mod.confirm": "Подтвердить",
          "admin.mod.errMinutes": "Укажите корректный срок (минимум 1 минута).",
          "ban.title": "Ваш аккаунт заблокирован",
          "ban.until": "Бан истекает: {date}.",
          "ban.reason": "Причина: {reason}",
          "mute.banner": "Вы временно в муте — нельзя комментировать, писать сообщения и загружать новые работы.",
          "mute.bannerReason": "Вы в муте до {date}. Причина: {reason}",
          "mute.bannerNoReason": "Вы в муте до {date} — нельзя комментировать, писать сообщения и загружать новые работы.",
          "notif.banReason": "Администратор забанил вас до {date}. Причина: {reason}",
          "notif.banNoReason": "Администратор забанил вас до {date}.",
          "notif.muteReason": "Администратор замутил вас до {date} (нельзя комментировать/писать сообщения/загружать работы). Причина: {reason}",
          "notif.muteNoReason": "Администратор замутил вас до {date} (нельзя комментировать/писать сообщения/загружать работы).",
          "notif.unban": "Администратор досрочно снял ваш бан. Вы снова можете пользоваться аккаунтом.",
          "notif.unmute": "Администратор досрочно снял ваш мут. Вы снова можете комментировать, писать сообщения и загружать работы.",
          "notif.banExpired": "Срок вашего бана истёк. Вы снова можете пользоваться аккаунтом.",
          "notif.muteExpired": "Срок вашего мута истёк. Вы снова можете комментировать, писать сообщения и загружать работы.",
          "nav.cart": "Корзина",
          "search.placeholder": "Поиск...", "filter.type.all": "Все типы", "filter.sort.new": "Новые", "filter.sort.top": "Популярные", "filter.price.min": "Цена от", "filter.price.max": "Цена до", "filter.onlyFollowing": "Только те, на кого я подписан",
          "search.clearAria": "Очистить",
          "search.closeAria": "Закрыть",
          "cart.eyebrow": "Покупки",
          "cart.title": "Ваша <span>корзина</span>",
          "cart.sub": "Работы, которые вы добавили в корзину, находятся здесь — измените количество и оформите заказ.",
          "profile.stat.followers": "Подписчики",
          "profile.stat.following": "Подписки",
          "profile.stat.likes": "Лайки",
          "profile.stat.comments": "Комментарии", "profile.stat.views": "Просмотры",
          "admin.reportsLabel": "Жалобы",
          "admin.usersLabel": "Пользователи",
          "report.action": "Пожаловаться",
          "report.reasonLabel": "Причина",
          "report.reasonPh": "Почему вы жалуетесь? (необязательно)",
          "report.submitBtn": "Отправить",
          "report.sentAlert": "Ваша жалоба принята. Мы её рассмотрим.",
          "admin.stat.users": "Пользователи",
          "admin.stat.todayHint": "+{count} сегодня",
          "admin.stat.works": "Работы",
          "admin.stat.likes": "Лайки",
          "admin.stat.comments": "Комментарии",
          "admin.stat.openReports": "Открытые жалобы",
          "admin.stat.banMute": "Бан/Мут",
          "admin.report.typeWork": "Работа",
          "admin.report.typeUser": "Пользователь",
          "admin.report.subjectWork": "Работа: «{title}»",
          "admin.report.subjectUser": "Пользователь: @{username}",
          "admin.report.gone": "(уже удалено)",
          "admin.report.reporter": "Заявитель: @{username} ({fullname})",
          "admin.report.resolved": "✓ Рассмотрено",
          "admin.report.resolvedDeleted": " · изображение удалено",
          "admin.report.resolveBtn": "Отметить как рассмотренное",
          "admin.report.deleteWorkBtn": "Удалить изображение",
          "admin.report.deleteConfirm": "Вы хотите безвозвратно удалить изображение этой работы? Это действие нельзя отменить.",
          "admin.report.empty": "Пока жалоб нет.",
          "follow.subscribeBtn": "Подписаться",
          "follow.unsubscribeBtn": "Отписаться",
          "follow.unfollowConfirm": "Вы хотите отписаться? Вы больше не будете получать уведомления о новых работах этого пользователя.",
          "follow.stats": "{followers} подписчиков · {following} подписок",
          "follow.short": "Подписан",
          "follow.shortAdd": "+ Подписаться",
          "notif.follow": "{name} подписался(ась) на вас",
          "save.aria": "Сохранить",
          "share.aria": "Поделиться", "share.linkCopied": "Ссылка скопирована: {url}", "share.copyPrompt": "Скопируйте ссылку:",
          /* ---- video call feature (previously missing from this language) ---- */
          "call.startTitle": "Видеозвонок",
          "call.incoming": "Входящий видеозвонок...",
          "call.decline": "Отклонить",
          "call.accept": "Принять",
          "call.calling": "Вызов...",
          "call.connecting": "Соединение...",
          "call.peerCameraOff": "Камера выключена",
          "call.toggleMic": "Микрофон",
          "call.toggleCam": "Камера",
          "call.end": "Завершить звонок",
          "call.startFail": "Не удалось совершить звонок. Попробуйте ещё раз.",
          "call.noCamera": "Камера не найдена, подключение только по аудио...",
          "call.noMediaAccess": "Доступ к микрофону/камере был запрещён.",
          "call.wasDeclined": "Звонок отклонён",
          "call.wasMissed": "Нет ответа",
          "call.wasBusy": "Пользователь занят",
          "call.ended": "Звонок завершён",
          "call.msg.ended": "Видеозвонок",
          "call.msg.noAnswer": "Нет ответа",
          "call.msg.missed": "Пропущенный звонок",
          "call.msg.declined": "Отклонённый звонок",
          "call.msg.cancelled": "Отменённый звонок",
          "call.msg.busy": "Пользователь был занят",
          "profile.edit.callPrivacyTitle": "Выберите, кто может звонить вам по видео:",
          "profile.edit.callPrivacyEveryone": "Все",
          "profile.edit.callPrivacySelected": "Только выбранные люди",
          "profile.edit.callPrivacyNobody": "Никто",
          "profile.edit.callPrivacyAddPh": "Введите имя пользователя...",
          "profile.edit.callPrivacyAdd": "Добавить",
          "profile.edit.callPrivacyEmpty": "Пока никто не добавлен.",
          "profile.edit.callPrivacyRemove": "Удалить",
          "profile.edit.callPrivacyAddSelfErr": "Вы не можете добавить самого себя.",
          "profile.edit.callPrivacyAddNotFound": "Такой пользователь не найден.",
          "feedThumb.aria": "Посмотреть изображение в полном размере",
          "notif.someone": "Кто-то",
      }
      };

      let currentLang = localStorage.getItem('madein_lang') || 'en';
      if (!I18N[currentLang]) currentLang = 'en';

      function t(key, vars) {
        const dict = I18N[currentLang] || I18N.uz;
        let str = dict[key];
        if (str === undefined) str = (I18N.uz[key] !== undefined) ? I18N.uz[key] : key;
        if (vars) Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
        return str;
      }

      /* Applies the current interface language to every static element
         marked with data-i18n / data-i18n-ph / data-i18n-title.
         This never touches user-authored content (names, bios, work
         titles/descriptions, comments, chat messages), since those live in
         separate elements that have no data-i18n attribute at all. */
      function applyI18n() {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = I18N[currentLang]._dir || 'ltr';
        document.querySelectorAll('[data-i18n]').forEach(el => {
          el.textContent = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
          el.innerHTML = t(el.getAttribute('data-i18n-html'));
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
          el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
          el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
          el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        const langSelect = document.getElementById('langSelect');
        if (langSelect) langSelect.value = currentLang;
        /* re-render any already-built dynamic UI (labels/buttons only —
           the underlying user content in WORKS/FEED is left untouched
           and simply redrawn with the new chrome around it) */
        if (typeof renderGrids === 'function' && typeof CURRENT_USER !== 'undefined') {
          try { renderGrids(); renderProfileHeader(); updateAdminNavVisibility(); } catch (e) { /* not ready yet */ }
        }
        if (typeof FEED !== 'undefined' && FEED.length) {
          try {
            const list = document.getElementById('feedList');
            if (list) { list.innerHTML = ''; appendFeedItems(FEED); }
          } catch (e) { /* not ready yet */ }
        }
        /* Suhbatlar ro'yxati "Video qo'ng'iroq" kabi tizim xabarlarini
           o'z ichiga olishi mumkin — til almashtirilganda shularni ham
           yangi tilda qayta chizish uchun ro'yxatni qayta yuklaymiz */
        if (typeof loadConversations === 'function' && typeof CURRENT_USER !== 'undefined' && CURRENT_USER && !IS_GUEST) {
          const convList = document.getElementById('conversationsList');
          if (convList && convList.children.length) {
            try { loadConversations(); } catch (e) { /* not ready yet */ }
          }
        }
      }

      function setLanguage(lang) {
        if (!I18N[lang]) return;
        currentLang = lang;
        localStorage.setItem('madein_lang', lang);
        applyI18n();
      }

      /* ===================== API HELPER =====================
         Talks to the real backend (server.js) instead of window.storage,
         so this works once deployed to any normal web host. */
      async function api(path, opts) {
        opts = opts || {};
        opts.credentials = 'include';
        const res = await fetch(path, opts);
        let data = null;
        try { data = await res.json(); } catch (e) { /* no body */ }
        if (res.status === 403 && data && data.banned) {
          handleBannedNow(data);
        }
        if (!res.ok) {
          const err = new Error(translateApiError(data));
          err.code = data && data.code;
          err.status = res.status;
          throw err;
        }
        return data;
      }

      /* Server har bir xatolikda barqaror "code" qaytaradi (masalan
         "userNotFound", "cartEmpty"...) — shu kod orqali xabar joriy sayt
         tiliga tarjima qilinadi. Shu bois xatolik xabarlari hech qachon
         faqat o'zbekcha qolib ketmaydi, til qanday bo'lsa ham tarjima
         ko'rsatiladi. Agar kod uchun tarjima topilmasa (yoki server umuman
         kod yubormasa), serverning o'z (o'zbekcha) matniga, undan keyin esa
         umumiy "server xatoligi" xabariga tushiladi. */
      function translateApiError(data) {
        if (data && data.code) {
          const key = 'err.' + data.code;
          const translated = t(key, data.params);
          if (translated !== key) return translated;
        }
        return (data && data.error) || t('common.serverError');
      }

      /* Ishlatilayotgan sessiya davomida admin foydalanuvchini ban qilib qo'ysa,
         keyingi so'rov shuni aniqlab, taqiqlangan ekranni ko'rsatadi */
      function handleBannedNow(data) {
        stopUnreadPolling();
        $('#mainApp').classList.add('hidden');
        $('#authScreen').classList.add('hidden');
        showBannedScreen({ bannedUntil: data.until, banReason: data.reason });
      }
      function apiJSON(path, method, body) {
        return api(path, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      /* ===================== STATE ===================== */
      let CURRENT_USER = null; // { username, fullname, email, bio, joined, theme }
      let IS_GUEST = false;    // true when browsing without an account (registration postponed)
      let WORKS = [];          // current user's own works (profile view)
      let FEED = [];           // public feed items (home view)
      let feedOffset = 0;
      let feedHasMore = true;
      let feedLoading = false;
      let feedQuery = { q: '', type: '', sort: 'new', following: false, minPrice: '', maxPrice: '' };
      let currentTheme = { mode: 'tungi', custom: '#e2543f' };
      let pendingDeleteId = null;
      let uploadMediaItems = []; // { type: 'image'|'video', blob, previewUrl }
      const MAX_UPLOAD_IMAGES = 3;
      const MAX_UPLOAD_VIDEO_SECONDS = 10; // + kichik tolerantlik pastda tekshiriladi

      const $ = (sel) => document.querySelector(sel);
      const $$ = (sel) => Array.from(document.querySelectorAll(sel));

      /* ===================== INIT ===================== */
      async function init() {
        applyI18n();
        try {
          const data = await api('/api/me');
          if (data && data.user) {
            CURRENT_USER = data.user;
            if (CURRENT_USER.moderation && CURRENT_USER.moderation.bannedUntil) {
              showBannedScreen(CURRENT_USER.moderation);
            } else {
              await enterApp();
            }
          } else {
            $('#authScreen').classList.remove('hidden');
          }
        } catch (e) {
          $('#authScreen').classList.remove('hidden');
        }
        document.getElementById('loadingScreen').classList.add('fade-out');
        bindAuthEvents();
        bindAppEvents();
      }

      function showBannedScreen(moderation) {
        const untilStr = moderation.bannedUntil ? new Date(moderation.bannedUntil).toLocaleString(I18N[currentLang]._locale) : '';
        $('#bannedUntilText').textContent = t('ban.until', { date: untilStr });
        $('#bannedReasonText').textContent = moderation.banReason ? t('ban.reason', { reason: moderation.banReason }) : '';
        $('#bannedScreen').classList.remove('hidden');
      }

      /* ===================== AUTH ===================== */
      function bindAuthEvents() {
        $$('#authTabs .tab').forEach(tab => {
          tab.addEventListener('click', () => {
            $$('#authTabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const isReg = tab.dataset.tab === 'register';
            $('#authTabs').classList.toggle('reg', isReg);
            $('#authCard').classList.toggle('reg-mode', isReg);
            $('#loginForm').classList.toggle('active', !isReg);
            $('#loginForm').classList.toggle('hidden', isReg);
            $('#registerForm').classList.toggle('active', isReg);
            $('#registerForm').classList.toggle('hidden', !isReg);
          });
        });

        /* live password strength meter */
        const pwInput = $('#regPassword');
        const pwStrengthWrap = $('#pwStrength');
        const pwBar = $('#pwStrengthBar');
        const pwLabel = $('#pwStrengthLabel');
        pwInput.addEventListener('input', () => {
          const val = pwInput.value;
          if (!val) {
            pwStrengthWrap.classList.remove('show');
            pwBar.style.width = '0%';
            pwBar.className = 'pw-strength-bar';
            return;
          }
          let score = 0;
          if (val.length >= 4) score++;
          if (val.length >= 8) score++;
          if (/[0-9]/.test(val)) score++;
          if (/[a-zA-Z]/.test(val) && /[0-9]/.test(val)) score++;
          if (/[^a-zA-Z0-9]/.test(val)) score++;
          pwStrengthWrap.classList.add('show');
          if (score <= 1) {
            pwBar.style.width = '30%'; pwBar.className = 'pw-strength-bar';
            pwLabel.textContent = t('auth.pwWeak');
          } else if (score <= 3) {
            pwBar.style.width = '65%'; pwBar.className = 'pw-strength-bar mid';
            pwLabel.textContent = t('auth.pwMedium');
          } else {
            pwBar.style.width = '100%'; pwBar.className = 'pw-strength-bar strong';
            pwLabel.textContent = t('auth.pwStrong');
          }
          checkPwMatch();
        });

        /* live password match indicator */
        const pw2Input = $('#regPassword2');
        const pw2Wrap = pw2Input.closest('.input-wrap');
        const pwMatchLabel = $('#pwMatchLabel');
        function checkPwMatch() {
          const v1 = pwInput.value, v2 = pw2Input.value;
          pw2Wrap.classList.remove('pw-match', 'pw-nomatch');
          if (!v2) {
            pwMatchLabel.classList.remove('show', 'ok', 'no');
            return;
          }
          pwMatchLabel.classList.add('show');
          if (v1 === v2) {
            pw2Wrap.classList.add('pw-match');
            pwMatchLabel.classList.add('ok');
            pwMatchLabel.classList.remove('no');
            pwMatchLabel.textContent = t('auth.pwMatch');
          } else {
            pw2Wrap.classList.add('pw-nomatch');
            pwMatchLabel.classList.add('no');
            pwMatchLabel.classList.remove('ok');
            pwMatchLabel.textContent = t('auth.pwNoMatch');
          }
        }
        pw2Input.addEventListener('input', checkPwMatch);

        $('#loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const uname = $('#loginUsername').value.trim().toLowerCase();
          const pass = $('#loginPassword').value;
          const errEl = $('#loginError');
          errEl.classList.remove('show');
          try {
            const data = await apiJSON('/api/login', 'POST', { username: uname, password: pass });
            CURRENT_USER = data.user;
            await enterApp();
          } catch (err) {
            errEl.textContent = err.message || t('auth.loginErrorDefault');
            errEl.classList.add('show');
            $('#authCard').classList.add('shake');
            setTimeout(() => $('#authCard').classList.remove('shake'), 400);
          }
        });

        $('#registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const fullname = $('#regFullname').value.trim();
          const uname = $('#regUsername').value.trim().toLowerCase().replace(/\s+/g, '_');
          const email = $('#regEmail').value.trim();
          const passField = $('#regPassword');
          const pass2Field = $('#regPassword2');
          const pass = passField.value;
          const pass2 = pass2Field.value;
          const errEl = $('#registerError');
          const submitBtn = $('#registerSubmitBtn');
          errEl.classList.remove('show');
          $$('#registerForm .field').forEach(f => f.classList.remove('invalid'));

          function invalidateField(input) {
            const field = input.closest('.field');
            if (field) {
              field.classList.remove('invalid');
              void field.offsetWidth;
              field.classList.add('invalid');
            }
          }

          if (pass.length < 4) {
            errEl.textContent = t('auth.regErrorShort');
            errEl.classList.add('show');
            invalidateField(passField);
            return;
          }
          if (pass !== pass2) {
            errEl.textContent = t('auth.regErrorMismatch');
            errEl.classList.add('show');
            invalidateField(pass2Field);
            return;
          }

          submitBtn.classList.add('loading');
          submitBtn.disabled = true;
          try {
            const data = await apiJSON('/api/register', 'POST', { username: uname, password: pass, fullname, email });
            CURRENT_USER = data.user;
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            await new Promise(r => setTimeout(r, 450));
            await enterApp();
          } catch (err) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            errEl.textContent = err.message || t('auth.regErrorDefault');
            errEl.classList.add('show');
            $('#authCard').classList.add('shake');
            setTimeout(() => $('#authCard').classList.remove('shake'), 400);
          }
        });

        $('#guestBtn').addEventListener('click', () => {
          IS_GUEST = true;
          CURRENT_USER = null;
          enterApp();
        });
      }

      /* Bring the person back to the auth screen (e.g. a guest who decides to
         register), landing on the requested tab. */
      function goToAuth(tab) {
        closeGateModal();
        $('#mainApp').classList.add('hidden');
        $('#authScreen').classList.remove('hidden');
        const wantReg = tab === 'register';
        $$('#authTabs .tab').forEach(t => t.classList.toggle('active', (t.dataset.tab === 'register') === wantReg));
        $('#authTabs').classList.toggle('reg', wantReg);
        $('#authCard').classList.toggle('reg-mode', wantReg);
        $('#loginForm').classList.toggle('active', !wantReg);
        $('#loginForm').classList.toggle('hidden', wantReg);
        $('#registerForm').classList.toggle('active', wantReg);
        $('#registerForm').classList.toggle('hidden', !wantReg);
      }

      /* Gate modal — shown when a guest attempts something that needs an account. */
      function openGateModal() { $('#gateModal').classList.remove('hidden'); }
      function closeGateModal() { $('#gateModal').classList.add('hidden'); }
      function guarded(fn) {
        return (...args) => {
          if (IS_GUEST) { openGateModal(); return; }
          return fn(...args);
        };
      }

      async function enterApp() {
        $('#authScreen').classList.add('hidden');
        $('#mainApp').classList.remove('hidden');
        $('#avatarMenu').classList.toggle('hidden', IS_GUEST);
        $('#navRegisterBtn').classList.toggle('hidden', !IS_GUEST);
        $('#guestBanner').classList.toggle('hidden', !IS_GUEST);
        updateAdminNavVisibility();
        updateMuteBanner();

        if (IS_GUEST) {
          WORKS = [];
        } else {
          try {
            const data = await api('/api/works');
            WORKS = data.works || [];
          } catch (e) { WORKS = []; }
        }

        currentTheme = (CURRENT_USER && CURRENT_USER.theme) || { mode: 'tungi', custom: '#e2543f' };
        applyTheme(currentTheme);

        renderProfileHeader();
        renderGrids();

        feedOffset = 0;
        feedHasMore = true;
        FEED = [];
        $('#feedList').innerHTML = '';
        setupFeedObserver();
        loadFeedPage();
        maybeOpenSharedWork();

        if (!IS_GUEST) {
          refreshUnreadBadge();
          refreshCartBadge(CURRENT_USER.cartCount || 0);
          startUnreadPolling();
          checkNotifications();
        } else {
          $$('.msg-badge').forEach(b => b.classList.add('hidden'));
          $$('.cart-badge').forEach(b => b.classList.add('hidden'));
        }
      }

      /* Ulashilgan havola (?asar=ID) orqali kirilganda tegishli asarni to'liq hajmda ochadi */
      async function maybeOpenSharedWork() {
        const id = new URLSearchParams(location.search).get('asar');
        if (!id) return;
        for (let tries = 0; tries < 6 && feedHasMore && !ALL_ITEMS_BY_ID[id]; tries++) {
          await loadFeedPage();
        }
        const item = ALL_ITEMS_BY_ID[id];
        if (item) openImageViewer(workImages(item), 0);
      }

      function updateMuteBanner() {
        const moderation = CURRENT_USER && CURRENT_USER.moderation;
        const mutedUntil = moderation && moderation.mutedUntil;
        const banner = $('#muteBanner');
        if (!mutedUntil) { banner.classList.add('hidden'); return; }
        const untilStr = new Date(mutedUntil).toLocaleString(I18N[currentLang]._locale);
        $('#muteBannerText').textContent = moderation.muteReason
          ? t('mute.bannerReason', { date: untilStr, reason: moderation.muteReason })
          : t('mute.bannerNoReason', { date: untilStr });
        banner.classList.remove('hidden');
      }

      /* Server faqat type/until/reason kabi xom ma'lumot qaytaradi — matnni
         foydalanuvchi hozir tanlagan tilda shu yerda tuzamiz */
      function notificationText(n) {
        const untilStr = n.until ? new Date(n.until).toLocaleString(I18N[currentLang]._locale) : '';
        switch (n.type) {
          case 'ban':
            return n.reason ? t('notif.banReason', { date: untilStr, reason: n.reason }) : t('notif.banNoReason', { date: untilStr });
          case 'mute':
            return n.reason ? t('notif.muteReason', { date: untilStr, reason: n.reason }) : t('notif.muteNoReason', { date: untilStr });
          case 'unban': return t('notif.unban');
          case 'unmute': return t('notif.unmute');
          case 'ban-expired': return t('notif.banExpired');
          case 'mute-expired': return t('notif.muteExpired');
          case 'follow': return t('notif.follow', { name: n.from || t('notif.someone') });
          case 'order-received': return t('notif.orderReceived', { name: n.from || t('notif.someone'), count: n.itemsCount || 1 });
          case 'order-placed': return t('notif.orderPlaced');
          default: return n.text || '';
        }
      }

      /* Ban/mut/unban/unmut haqidagi yangi bildirishnomalarni foydalanuvchiga ko'rsatadi */
      async function checkNotifications() {
        try {
          const data = await api('/api/notifications');
          const unread = (data.items || []).filter(n => !n.read);
          if (unread.length) {
            alert(unread.map(notificationText).join('\n\n'));
            await api('/api/notifications/read', { method: 'POST' });
            try {
              const me = await api('/api/me');
              if (me && me.user) {
                CURRENT_USER = me.user;
                updateMuteBanner();
                updateAdminNavVisibility();
              }
            } catch (e) { /* non-critical */ }
          }
        } catch (e) { /* non-critical */ }
      }

      /* ===================== NAVBAR / VIEWS ===================== */
      function bindAppEvents() {
        $$('.nav-links button[data-view]').forEach(btn => {
          btn.addEventListener('click', () => {
            if (IS_GUEST && (btn.dataset.view === 'profile' || btn.dataset.view === 'messages' || btn.dataset.view === 'cart')) { openGateModal(); return; }
            switchView(btn.dataset.view);
          });
        });
        $('#gotoProfileBtn').addEventListener('click', () => { switchView('profile'); $('#avatarDropdown').classList.remove('open'); });
        bindCallEvents();
        $('#avatarBtn').addEventListener('click', () => $('#avatarDropdown').classList.toggle('open'));
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.avatar-menu')) $('#avatarDropdown').classList.remove('open');
        });
        $('#logoutBtn').addEventListener('click', async () => {
          try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
          CURRENT_USER = null;
          IS_GUEST = false;
          WORKS = [];
          FEED = [];
          feedOffset = 0;
          feedHasMore = true;
          feedQuery = { q: '', type: '', sort: 'new', following: false, minPrice: '', maxPrice: '' };
          Object.keys(ALL_ITEMS_BY_ID).forEach(k => delete ALL_ITEMS_BY_ID[k]);
          $('#feedList').innerHTML = '';
          $('#feedSearchInput').value = '';
          $('#feedSearchClear').classList.remove('show');
          closeSearchOverlay();
          closeCommentsModal();
          closeChatModal();
          stopUnreadPolling();
          $$('.msg-badge').forEach(b => b.classList.add('hidden'));
          $('#mainApp').classList.add('hidden');
          $('#authScreen').classList.remove('hidden');
          $('#loginForm').reset(); $('#registerForm').reset();
        });

        /* Guests get nudged toward the auth screen instead of performing
           account-only actions; registration stays fully optional/postponable. */
        $('#navRegisterBtn').addEventListener('click', () => goToAuth('register'));
        $('#guestBannerBtn').addEventListener('click', () => goToAuth('register'));
        $('#gateModalLater').addEventListener('click', closeGateModal);
        $('#gateModalRegister').addEventListener('click', () => goToAuth('register'));
        $('#gateModal').addEventListener('click', (e) => { if (e.target === $('#gateModal')) closeGateModal(); });

        $('#openUploadBtn').addEventListener('click', guarded(openUploadModal));
        $('#openUploadBtn2').addEventListener('click', guarded(openUploadModal));
        $('#closeUploadModal').addEventListener('click', closeUploadModal);
        $('#uploadModal').addEventListener('click', (e) => { if (e.target === $('#uploadModal')) closeUploadModal(); });

        /* Lenta: qidiruv, kategoriya, saralash, faqat kuzatuvchilarim.
           Qidiruv endi navbar'da joylashgan, shuning uchun boshqa
           sahifada turib yozsa ham foydalanuvchini bosh sahifaga o'tkazadi. */
        let feedSearchTimer = null;
        $('#feedSearchInput').addEventListener('focus', () => {
          if (!$('#homeView').classList.contains('active')) switchView('home');
        });
        $('#feedSearchInput').addEventListener('input', (e) => {
          $('#feedSearchClear').classList.toggle('show', !!e.target.value);
          if (!$('#homeView').classList.contains('active')) switchView('home');
          clearTimeout(feedSearchTimer);
          feedSearchTimer = setTimeout(() => {
            feedQuery.q = e.target.value.trim();
            resetAndReloadFeed();
          }, 350);
        });
        $('#feedSearchClear').addEventListener('click', () => {
          $('#feedSearchInput').value = '';
          $('#feedSearchClear').classList.remove('show');
          feedQuery.q = '';
          resetAndReloadFeed();
        });

        $('#feedTypeSelect').addEventListener('change', (e) => {
          feedQuery.type = e.target.value;
          resetAndReloadFeed();
        });
        $('#feedSortSelect').addEventListener('change', (e) => {
          feedQuery.sort = e.target.value;
          resetAndReloadFeed();
        });
        $('#feedFollowingToggle').addEventListener('change', (e) => {
          if (e.target.checked && IS_GUEST) { e.target.checked = false; openGateModal(); return; }
          feedQuery.following = e.target.checked;
          resetAndReloadFeed();
        });
        let feedPriceTimer = null;
        function onFeedPriceInput() {
          clearTimeout(feedPriceTimer);
          feedPriceTimer = setTimeout(() => {
            feedQuery.minPrice = $('#feedMinPrice').value.trim();
            feedQuery.maxPrice = $('#feedMaxPrice').value.trim();
            resetAndReloadFeed();
          }, 400);
        }
        $('#feedMinPrice').addEventListener('input', onFeedPriceInput);
        $('#feedMaxPrice').addEventListener('input', onFeedPriceInput);

        /* Mobilda qidiruv maydoni faqat lupa bo'lib turadi; bosilganda
           butun ekran kengligida ochiladi, X tugmasi bosilsa yopiladi */
        $('#navSearchWrap').addEventListener('click', (e) => {
          if (!$('#navSearchWrap').classList.contains('search-open')) {
            openSearchOverlay();
          }
        });
        $('#navSearchCloseBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          closeSearchOverlay();
        });
        document.addEventListener('click', (e) => {
          if (!$('#navSearchWrap').classList.contains('search-open')) return;
          if (!e.target.closest('#navSearchWrap') && !e.target.closest('#feedFilterBar')) closeSearchOverlay();
        });
        /* Shikoyat modali */
        $('#closeReportModal').addEventListener('click', closeReportModal);
        $('#reportModal').addEventListener('click', (e) => { if (e.target === $('#reportModal')) closeReportModal(); });
        $('#reportForm').addEventListener('submit', submitReportForm);

        $('#uploadFile').addEventListener('change', handleFileSelect);
        $('#workType').addEventListener('change', () => {
          const isOther = $('#workType').value === 'boshqa';
          $('#workTypeOther').classList.toggle('hidden', !isOther);
          $('#workTypeOther').required = isOther;
        });
        $('#workStatus').addEventListener('change', () => {
          $('#priceField').classList.toggle('hidden', $('#workStatus').value !== 'sale');
        });
        $$('input[name="stockMode"]').forEach(r => r.addEventListener('change', () => {
          $('#workStockQty').classList.toggle('hidden', $('#stockModeOrder').checked);
        }));
        $('#uploadForm').addEventListener('submit', handleUploadSubmit);

        $('#closeLightbox').addEventListener('click', closeLightbox);
        $('#lightbox').addEventListener('click', (e) => { if (e.target === $('#lightbox')) closeLightbox(); });
        $('#deleteWorkBtn').addEventListener('click', handleDeleteWork);
        $('#editStatusBtn').addEventListener('click', openStatusEditor);
        $('#cancelStatusBtn').addEventListener('click', closeStatusEditor);
        $('#lightboxStatusSelect').addEventListener('change', () => {
          $('#lightboxPriceField').classList.toggle('hidden', $('#lightboxStatusSelect').value !== 'sale');
        });
        $('#saveStatusBtn').addEventListener('click', handleSaveStatus);

        $('#lightboxImg').addEventListener('click', (e) => {
          const img = e.target.closest('img');
          if (!img) return;
          const imgs = Array.from($('#lightboxImg').querySelectorAll('img'));
          const idx = imgs.indexOf(img);
          openImageViewer(LIGHTBOX_IMAGES.length ? LIGHTBOX_IMAGES : imgs.map(i => i.src), idx);
        });
        $('#closeImageViewer').addEventListener('click', closeImageViewer);
        $('#imageViewerModal').addEventListener('click', (e) => { if (e.target === $('#imageViewerModal')) closeImageViewer(); });
        $('#imageViewerPrev').addEventListener('click', () => imageViewerStep(-1));
        $('#imageViewerNext').addEventListener('click', () => imageViewerStep(1));
        $('#closeVideoViewer').addEventListener('click', closeVideoViewer);
        $('#videoViewerModal').addEventListener('click', (e) => { if (e.target === $('#videoViewerModal')) closeVideoViewer(); });
        document.addEventListener('keydown', (e) => {
          if (!$('#imageViewerModal').classList.contains('open')) return;
          if (e.key === 'Escape') closeImageViewer();
          if (e.key === 'ArrowLeft') imageViewerStep(-1);
          if (e.key === 'ArrowRight') imageViewerStep(1);
        });

        $('#closeCommentsModal').addEventListener('click', closeCommentsModal);
        $('#commentsModal').addEventListener('click', (e) => { if (e.target === $('#commentsModal')) closeCommentsModal(); });

        $('#backFromChat').addEventListener('click', closeChatModal);

        $('#closeAdminModModal').addEventListener('click', closeAdminModModal);
        $('#adminModModal').addEventListener('click', (e) => { if (e.target === $('#adminModModal')) closeAdminModModal(); });
        $('#adminModForm').addEventListener('submit', submitAdminModForm);
        $('#chatForm').addEventListener('submit', submitChatMessage);
        $('#chatInput').addEventListener('input', (e) => {
          $('#chatSubmitBtn').classList.toggle('active', e.target.value.trim().length > 0);
        });
        $('#emojiToggleBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          buildEmojiPicker();
          $('#emojiPicker').classList.toggle('hidden');
        });
        $('#emojiPicker').addEventListener('click', (e) => {
          const btn = e.target.closest('.emoji-item');
          if (!btn) return;
          insertEmojiIntoChatInput(btn.textContent);
        });
        $('#chatAttachBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (IS_GUEST) { openGateModal(); return; }
          $('#chatAttachMenu').classList.toggle('hidden');
        });
        $('#chatAttachMenu').querySelectorAll('.chat-attach-menu-item').forEach((btn) => {
          btn.addEventListener('click', () => {
            $('#chatAttachMenu').classList.add('hidden');
            if (btn.dataset.attach === 'media') $('#chatMediaInput').click();
            else $('#chatFileInput').click();
          });
        });
        document.addEventListener('click', (e) => {
          const menu = $('#chatAttachMenu');
          if (menu && !menu.classList.contains('hidden') && !e.target.closest('.chat-attach-wrap')) {
            menu.classList.add('hidden');
          }
        });
        $('#chatMediaInput').addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          for (const f of files) {
            const kind = f.type.startsWith('video/') ? 'video' : 'photo';
            await uploadChatMedia(f, kind, {});
          }
        });
        $('#chatFileInput').addEventListener('change', async (e) => {
          const f = e.target.files && e.target.files[0];
          e.target.value = '';
          if (f) await uploadChatMedia(f, 'file', {});
        });
        bindRecordButton($('#chatVoiceBtn'), 'voice');
        bindRecordButton($('#chatCircleBtn'), 'circle');
        $('#chatRecordCancel').addEventListener('click', () => cancelChatRecording());
        $('#chatRecordSend').addEventListener('click', () => stopChatRecording(true));
        document.addEventListener('click', (e) => {
          const picker = $('#emojiPicker');
          if (!picker.classList.contains('hidden') && !e.target.closest('.emoji-picker-wrap')) {
            picker.classList.add('hidden');
          }
        });
        $('#commentForm').addEventListener('submit', (e) => {
          e.preventDefault();
          if (IS_GUEST) { openGateModal(); return; }
          submitComment(e);
        });
        $('#commentInput').addEventListener('input', (e) => {
          $('#commentSubmitBtn').classList.toggle('active', e.target.value.trim().length > 0);
        });

        $('#editProfileBtn').addEventListener('click', guarded(openEditProfile));
        $('#cancelEditBtn').addEventListener('click', () => $('#editProfileCard').classList.add('hidden'));
        $('#saveProfileBtn').addEventListener('click', saveProfile);
        $('#saveCredentialsBtn').addEventListener('click', saveCredentials);
        $$('input[name="callPrivacyMode"]').forEach(r => r.addEventListener('change', updateCallPrivacySelectedVisibility));
        $('#callPrivacyAddBtn').addEventListener('click', addCallPrivacyAllowedUser);
        $('#callPrivacyAddInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCallPrivacyAllowedUser(); } });
        $('#bannedLogoutBtn').addEventListener('click', async () => {
          try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
          location.reload();
        });
        $('#changeAvatarBtn').addEventListener('click', () => $('#avatarFileInput').click());
        $('#avatarFileInput').addEventListener('change', handleAvatarFileSelect);
        $('#backFromUserProfile').addEventListener('click', () => switchView('home'));

        /* language selector — changes only the site's own interface text;
           everyone else's names, bios, work titles/descriptions and
           comments keep showing exactly as they wrote them */
        const langSelect = $('#langSelect');
        if (langSelect) {
          langSelect.value = currentLang;
          langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
        }

        /* theme panel */
        $('#themeFab').addEventListener('click', () => $('#themePanel').classList.toggle('open'));
        document.addEventListener('click', (e) => {
          if (!e.target.closest('#themePanel') && !e.target.closest('#themeFab')) $('#themePanel').classList.remove('open');
        });
        $$('.theme-opt').forEach(opt => {
          opt.addEventListener('click', async () => {
            currentTheme.mode = opt.dataset.theme;
            applyTheme(currentTheme);
            await persistTheme();
          });
        });
        $('#customColorInput').addEventListener('input', async (e) => {
          currentTheme.mode = 'custom';
          currentTheme.custom = e.target.value;
          applyTheme(currentTheme);
          await persistTheme();
        });
      }

      async function persistTheme() {
        try {
          await apiJSON('/api/theme', 'PUT', currentTheme);
          if (CURRENT_USER) CURRENT_USER.theme = currentTheme;
        } catch (e) { /* non-critical */ }
      }

      function switchView(view) {
        $$('.nav-links button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        $('#homeView').classList.toggle('active', view === 'home');
        $('#profileView').classList.toggle('active', view === 'profile');
        $('#messagesView').classList.toggle('active', view === 'messages');
        $('#userProfileView').classList.toggle('active', view === 'userProfile');
        $('#chatView').classList.toggle('active', view === 'chat');
        $('#adminView').classList.toggle('active', view === 'admin');
        $('#cartView').classList.toggle('active', view === 'cart');
        if (view === 'profile') {
          renderProfileHeader();
          renderGridInto('#profileGrid', WORKS);
        }
        if (view === 'messages') {
          loadConversations();
        }
        if (view === 'admin') {
          loadAdminUsers();
          loadAdminStats();
          loadAdminReports();
        }
        if (view === 'cart') {
          loadCart();
        }
      }

      /* ===================== ADMINISTRATOR BURCHAGI ===================== */
      let adminModTarget = null; // { username, type: 'ban' | 'mute' }

      async function loadAdminUsers() {
        const list = $('#adminUsersList');
        list.innerHTML = `<p class="view-sub">${t('admin.loading')}</p>`;
        try {
          const data = await api('/api/admin/users');
          renderAdminUsers(data.items || []);
        } catch (e) {
          list.innerHTML = `<p class="view-sub">${e.message || t('admin.loadFail')}</p>`;
        }
      }

      function renderAdminUsers(items) {
        const list = $('#adminUsersList');
        if (!items.length) {
          list.innerHTML = `<p class="view-sub">${t('admin.empty')}</p>`;
          return;
        }
        list.innerHTML = items.map(u => {
          const badges = [];
          if (u.isAdmin) badges.push(`<span class="admin-badge admin">${t('admin.badge.admin')}</span>`);
          if (u.bannedUntil) badges.push(`<span class="admin-badge banned">${t('admin.badge.banned')}</span>`);
          if (u.mutedUntil) badges.push(`<span class="admin-badge muted">${t('admin.badge.muted')}</span>`);
          if (!u.bannedUntil && !u.mutedUntil && !u.isAdmin) badges.push(`<span class="admin-badge ok">${t('admin.badge.ok')}</span>`);

          let statusLines = '';
          if (u.bannedUntil) {
            statusLines += `<div class="admin-status-line">${t('admin.status.bannedUntil', { date: new Date(u.bannedUntil).toLocaleString(I18N[currentLang]._locale) })}${u.banReason ? ' — ' + escapeHtml(u.banReason) : ''}</div>`;
          }
          if (u.mutedUntil) {
            statusLines += `<div class="admin-status-line">${t('admin.status.mutedUntil', { date: new Date(u.mutedUntil).toLocaleString(I18N[currentLang]._locale) })}${u.muteReason ? ' — ' + escapeHtml(u.muteReason) : ''}</div>`;
          }

          const isSelf = u.username === (CURRENT_USER && CURRENT_USER.username);
          /* Sayt bo'yicha faqat bitta administrator bo'ladi, shuning uchun
             admin o'zini emas, faqat oddiy foydalanuvchilarni moderatsiya
             qila oladi (boshqa admin bo'lishi mumkin emas). */
          const canModerate = !isSelf && !u.isAdmin;
          let actions = '';
          if (canModerate) {
            actions += u.bannedUntil
              ? `<button type="button" class="btn btn-ghost" data-admin-action="unban" data-username="${u.username}">${t('admin.action.unban')}</button>`
              : `<button type="button" class="btn btn-ghost" data-admin-action="ban" data-username="${u.username}">${t('admin.action.ban')}</button>`;
            actions += u.mutedUntil
              ? `<button type="button" class="btn btn-ghost" data-admin-action="unmute" data-username="${u.username}">${t('admin.action.unmute')}</button>`
              : `<button type="button" class="btn btn-ghost" data-admin-action="mute" data-username="${u.username}">${t('admin.action.mute')}</button>`;
          }

          return `
            <div class="admin-user-row">
              <div class="admin-user-avatar admin-user-clickable" data-username="${u.username}">${avatarInner(u.avatar, u.fullname || u.username)}</div>
              <div class="admin-user-info">
                <div class="admin-user-name admin-user-clickable" data-username="${u.username}">${escapeHtml(u.fullname || u.username)}</div>
                <div class="admin-user-uname"><span class="p-online-dot admin-online-dot ${u.isOnline ? 'online' : ''}" title="${u.isOnline ? t('profile.online') : t('profile.offline')}"></span>@${escapeHtml(u.username)} · ${fmtDate(u.joined)}</div>
                <div class="admin-status-line admin-lastseen">${u.isOnline ? t('profile.online') : fmtLastSeen(u.lastSeenAt)}</div>
                ${badges.join('')}
                ${statusLines}
              </div>
              <div class="admin-user-actions">${actions}</div>
            </div>`;
        }).join('');

        list.querySelectorAll('.admin-user-clickable').forEach(el => {
          el.addEventListener('click', () => openUserProfile(el.dataset.username));
        });

        list.querySelectorAll('[data-admin-action]').forEach(btn => {
          btn.addEventListener('click', () => handleAdminAction(btn.dataset.adminAction, btn.dataset.username));
        });
      }

      async function handleAdminAction(action, username) {
        if (action === 'ban' || action === 'mute') {
          openAdminModModal(username, action);
          return;
        }
        if (action === 'unban' || action === 'unmute') {
          if (!confirm(t('admin.confirm.' + action))) return;
          try {
            await api('/api/admin/users/' + encodeURIComponent(username) + '/' + action, { method: 'POST' });
            loadAdminUsers();
          } catch (e) {
            alert(e.message || t('admin.actionFail'));
          }
        }
      }

      function openAdminModModal(username, type) {
        adminModTarget = { username, type };
        $('#adminModModalTitle').textContent = type === 'ban'
          ? t('admin.mod.titleBan', { username })
          : t('admin.mod.titleMute', { username });
        $('#adminModMinutes').value = 60;
        $('#adminModReason').value = '';
        $('#adminModError').textContent = '';
        $('#adminModModal').classList.add('open');
      }
      function closeAdminModModal() {
        $('#adminModModal').classList.remove('open');
        adminModTarget = null;
      }

      async function submitAdminModForm(e) {
        e.preventDefault();
        if (!adminModTarget) return;
        const minutes = parseInt($('#adminModMinutes').value, 10);
        const reason = $('#adminModReason').value.trim();
        const errEl = $('#adminModError');
        errEl.textContent = '';
        if (!minutes || minutes < 1) {
          errEl.textContent = t('admin.mod.errMinutes');
          return;
        }
        try {
          await apiJSON(
            '/api/admin/users/' + encodeURIComponent(adminModTarget.username) + '/' + adminModTarget.type,
            'POST',
            { minutes, reason }
          );
          closeAdminModModal();
          loadAdminUsers();
        } catch (err) {
          errEl.textContent = err.message || t('admin.actionFail');
        }
      }

      /* ===================== ADMIN: STATISTIKA VA SHIKOYATLAR ===================== */
      async function loadAdminStats() {
        const grid = $('#adminStatsGrid');
        try {
          const s = await api('/api/admin/stats');
          grid.innerHTML = [
            [t('admin.stat.users'), s.usersCount, t('admin.stat.todayHint', { count: s.todayUsers })],
            [t('admin.stat.works'), s.worksCount, t('admin.stat.todayHint', { count: s.todayWorks })],
            [t('admin.stat.likes'), s.likesCount, ''],
            [t('admin.stat.comments'), s.commentsCount, ''],
            [t('admin.stat.openReports'), s.openReports, ''],
            [t('admin.stat.banMute'), s.bannedCount + ' / ' + s.mutedCount, '']
          ].map(([label, value, hint]) => `
        <div class="admin-stat-card">
          <div class="admin-stat-value">${value}</div>
          <div class="admin-stat-label">${label}</div>
          ${hint ? `<div class="admin-stat-hint">${hint}</div>` : ''}
        </div>`).join('');
        } catch (e) {
          grid.innerHTML = `<p class="view-sub">${t('common.serverError')}</p>`;
        }
      }

      function reportItemHTML(r) {
        const date = fmtDate(r.createdAt);
        const subject = r.type === 'work' ? t('admin.report.subjectWork', { title: escapeHtml(r.targetTitle || '') }) : t('admin.report.subjectUser', { username: escapeHtml(r.targetId) });
        const goneNote = !r.targetExists ? ' <span class="admin-report-gone">' + t('admin.report.gone') + '</span>' : '';
        const canDeleteWork = r.type === 'work' && r.targetExists && r.status !== 'resolved';
        return `
      <div class="admin-report-card ${r.status === 'resolved' ? 'resolved' : ''}" data-id="${r.id}">
        <div class="admin-report-head">
          <span class="admin-report-type">${r.type === 'work' ? '🖼️ ' + t('admin.report.typeWork') : '👤 ' + t('admin.report.typeUser')}</span>
          <span class="admin-report-date">${date}</span>
        </div>
        <div class="admin-report-body">
          ${r.type === 'work' && r.targetImage ? `<img class="admin-report-thumb" src="${r.targetImage}" alt="" loading="lazy">` : ''}
          <div class="admin-report-main">
            <div class="admin-report-subject">${subject}${goneNote}</div>
            <div class="admin-report-reporter">${t('admin.report.reporter', { username: escapeHtml(r.reporter), fullname: escapeHtml(r.reporterFullname || r.reporter) })}</div>
            ${r.reason ? `<div class="admin-report-reason">"${escapeHtml(r.reason)}"</div>` : ''}
          </div>
        </div>
        <div class="admin-report-actions">
          ${r.status === 'resolved'
            ? `<div class="admin-report-status">${t('admin.report.resolved')}${r.action === 'deleted' ? t('admin.report.resolvedDeleted') : ''}</div>`
            : `
          <button class="btn btn-ghost btn-sm admin-report-resolve" data-id="${r.id}">${t('admin.report.resolveBtn')}</button>
          ${canDeleteWork ? `<button class="btn btn-ghost btn-sm admin-report-delete-work" data-workid="${r.targetId}" data-id="${r.id}">${t('admin.report.deleteWorkBtn')}</button>` : ''}`}
        </div>
      </div>`;
      }

      async function loadAdminReports() {
        const list = $('#adminReportsList');
        list.innerHTML = `<p class="view-sub">${t('admin.loading')}</p>`;
        try {
          const data = await api('/api/admin/reports');
          const items = data.items || [];
          if (!items.length) {
            list.innerHTML = `<p class="view-sub">${t('admin.report.empty')}</p>`;
            return;
          }
          list.innerHTML = items.map(reportItemHTML).join('');
          list.querySelectorAll('.admin-report-resolve').forEach(btn => {
            btn.addEventListener('click', async () => {
              try {
                await apiJSON('/api/admin/reports/' + btn.dataset.id + '/resolve', 'POST');
                loadAdminReports();
                loadAdminStats();
              } catch (e) { /* jim tarzda o'tkazib yuboriladi */ }
            });
          });
          list.querySelectorAll('.admin-report-thumb').forEach(img => {
            img.addEventListener('click', () => openImageViewer([img.src], 0));
          });
          list.querySelectorAll('.admin-report-delete-work').forEach(btn => {
            btn.addEventListener('click', async () => {
              if (!confirm(t('admin.report.deleteConfirm'))) return;
              btn.disabled = true;
              try {
                await api('/api/admin/works/' + encodeURIComponent(btn.dataset.workid), { method: 'DELETE' });
                loadAdminReports();
                loadAdminStats();
              } catch (e) {
                alert(e.message || t('admin.actionFail'));
                btn.disabled = false;
              }
            });
          });
        } catch (e) {
          list.innerHTML = `<p class="view-sub">${t('common.serverError')}</p>`;
        }
      }

      /* ===================== THEME ===================== */
      function hexToHsl(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
          }
          h /= 6;
        }
        return [h * 360, s * 100, l * 100];
      }
      function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return '#' + toHex(r) + toHex(g) + toHex(b);
      }

      function applyTheme(theme) {
        document.body.dataset.theme = theme.mode;
        $$('.theme-opt').forEach(o => o.classList.toggle('active', o.dataset.theme === theme.mode));
        if (theme.mode === 'custom') {
          const hex = theme.custom || '#e2543f';
          const [h, s, l] = hexToHsl(hex);
          const accent2 = hslToHex((h + 40) % 360, Math.min(s + 5, 100), Math.min(l + 12, 78));
          document.body.style.setProperty('--accent', hex);
          document.body.style.setProperty('--accent-2', accent2);
          $('#customColorInput').value = hex;
          $('#customSwatch').style.background = hex;
        } else {
          document.body.style.removeProperty('--accent');
          document.body.style.removeProperty('--accent-2');
        }
      }

      /* ===================== PROFILE ===================== */
      function initials(name) {
        if (!name) return '?';
        return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
      }
      function avatarInner(avatarUrl, name) {
        return avatarUrl ? `<img src="${avatarUrl}" alt="">` : initials(name);
      }
      function fmtDate(iso) {
        try {
          const locale = (I18N[currentLang] && I18N[currentLang]._locale) || 'uz-UZ';
          return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { return ''; }
      }

      /* Admin uchun: foydalanuvchi oxirgi marta qachon saytda bo'lganini o'qilishi oson shaklda ko'rsatadi */
      function fmtLastSeen(ts) {
        if (!ts) return t('admin.lastSeen.never');
        const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (diffSec < 90) return t('admin.lastSeen.justNow');
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return t('admin.lastSeen.minutesAgo', { n: diffMin });
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return t('admin.lastSeen.hoursAgo', { n: diffHr });
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 30) return t('admin.lastSeen.daysAgo', { n: diffDay });
        try {
          const locale = (I18N[currentLang] && I18N[currentLang]._locale) || 'uz-UZ';
          return t('admin.lastSeen.onDate', { date: new Date(ts).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) });
        } catch (e) { return ''; }
      }

      const CURRENCY_LABELS = { UZS: "so'm", USD: 'USD', EUR: 'EUR', RUB: 'RUB' };
      function fmtPrice(price, currency) {
        const locale = (I18N[currentLang] && I18N[currentLang]._locale) || 'uz-UZ';
        const label = CURRENCY_LABELS[currency] || "so'm";
        return Number(price).toLocaleString(locale) + ' ' + label;
      }

      /* Sotuvdagi asar uchun zaxira/buyurtma belgisini (badge) chizadi */
      function stockBadgeHTML(w) {
        if (w.stockMode === 'order') {
          return `<span class="stock-badge order">${t('stock.order')}</span>`;
        }
        if (w.stockMode === 'fixed' && typeof w.stockQty === 'number') {
          if (w.stockQty <= 0) return `<span class="stock-badge out">${t('stock.out')}</span>`;
          if (w.stockQty <= 3) return `<span class="stock-badge low">${t('stock.left', { n: w.stockQty })}</span>`;
          return `<span class="stock-badge">${t('stock.left', { n: w.stockQty })}</span>`;
        }
        return '';
      }

      function renderProfileHeader() {
        const u = CURRENT_USER;
        if (!u) return;
        $('#navUsername').textContent = u.username;
        $('#avatarInitials').innerHTML = avatarInner(u.avatar, u.fullname || u.username);
        $('#profileAvatar').innerHTML = avatarInner(u.avatar, u.fullname || u.username);
        $('#profileFullname').textContent = u.fullname || u.username;
        $('#profileUsernameTag').textContent = '@' + u.username;
        $('#profileMeta').textContent = (u.email ? u.email + ' · ' : '') + t('profile.joined') + ': ' + fmtDate(u.joined);
        $('#statTotal').textContent = WORKS.length;
        $('#statSale').textContent = WORKS.filter(w => w.status === 'sale').length;
        $('#statExpo').textContent = WORKS.filter(w => w.status === 'expo').length;
        $('#statFollowers').textContent = u.followersCount || 0;
        $('#statFollowing').textContent = u.followingCount || 0;
        $('#statLikes').textContent = WORKS.reduce((sum, w) => sum + (Array.isArray(w.likes) ? w.likes.length : 0), 0);
        $('#statComments').textContent = WORKS.reduce((sum, w) => sum + (Array.isArray(w.comments) ? w.comments.length : 0), 0);
        $('#statViews').textContent = WORKS.reduce((sum, w) => sum + (Number(w.views) || 0), 0);
      }

      function openEditProfile() {
        const u = CURRENT_USER;
        $('#editFullname').value = u.fullname || '';
        $('#editEmail').value = u.email || '';
        $('#editBio').value = u.bio || '';
        $('#editPhone').value = u.phone || '';
        $('#editSocial').value = u.social || '';
        $('#editUsername').value = u.username || '';
        $('#editNewPassword').value = '';
        $('#editNewPassword2').value = '';
        $('#editCurrentPassword').value = '';
        $('#credentialsMsg').textContent = '';
        $('#credentialsMsg').classList.remove('field-hint-ok');
        const privacy = u.privacy || { phone: true, social: true, email: false };
        $('#privacyPhone').checked = !!privacy.phone;
        $('#privacySocial').checked = !!privacy.social;
        $('#privacyEmail').checked = !!privacy.email;
        const callPrivacy = u.callPrivacy || { mode: 'everyone', allowed: [] };
        CALL_PRIVACY_ALLOWED = Array.isArray(callPrivacy.allowed) ? callPrivacy.allowed.slice() : [];
        const modeInput = document.querySelector('input[name="callPrivacyMode"][value="' + (callPrivacy.mode || 'everyone') + '"]');
        if (modeInput) modeInput.checked = true;
        else $('#callPrivacyEveryone').checked = true;
        renderCallPrivacyAllowedList();
        updateCallPrivacySelectedVisibility();
        $('#editAvatarPreview').innerHTML = avatarInner(u.avatar, u.fullname || u.username);
        $('#editProfileCard').classList.remove('hidden');
      }

      let CALL_PRIVACY_ALLOWED = []; // "Faqat tanlanganlar" rejimida ruxsat etilgan foydalanuvchi nomlari

      function renderCallPrivacyAllowedList() {
        const wrap = $('#callPrivacyAllowedList');
        if (!CALL_PRIVACY_ALLOWED.length) {
          wrap.innerHTML = `<div class="field-hint">${t('profile.edit.callPrivacyEmpty')}</div>`;
          return;
        }
        wrap.innerHTML = CALL_PRIVACY_ALLOWED.map(uname => `
          <span class="call-allowed-chip" data-username="${escapeHtml(uname)}">
            @${escapeHtml(uname)}
            <button type="button" data-remove="${escapeHtml(uname)}" aria-label="${t('profile.edit.callPrivacyRemove')}">✕</button>
          </span>`).join('');
        wrap.querySelectorAll('button[data-remove]').forEach(btn => {
          btn.addEventListener('click', () => {
            CALL_PRIVACY_ALLOWED = CALL_PRIVACY_ALLOWED.filter(u => u !== btn.dataset.remove);
            renderCallPrivacyAllowedList();
          });
        });
      }

      function updateCallPrivacySelectedVisibility() {
        const mode = (document.querySelector('input[name="callPrivacyMode"]:checked') || {}).value || 'everyone';
        $('#callPrivacySelectedWrap').classList.toggle('hidden', mode !== 'selected');
      }

      async function addCallPrivacyAllowedUser() {
        const input = $('#callPrivacyAddInput');
        const msgEl = $('#callPrivacyAddMsg');
        msgEl.textContent = '';
        const uname = input.value.trim().toLowerCase();
        if (!uname) return;
        if (CURRENT_USER && uname === CURRENT_USER.username) {
          msgEl.textContent = t('profile.edit.callPrivacyAddSelfErr');
          return;
        }
        if (CALL_PRIVACY_ALLOWED.includes(uname)) {
          input.value = '';
          return;
        }
        try {
          await api('/api/users/' + encodeURIComponent(uname));
          CALL_PRIVACY_ALLOWED.push(uname);
          renderCallPrivacyAllowedList();
          input.value = '';
        } catch (e) {
          msgEl.textContent = t('profile.edit.callPrivacyAddNotFound');
        }
      }

      function updateAdminNavVisibility() {
        const isAdmin = !!(CURRENT_USER && CURRENT_USER.isAdmin);
        $('#navAdminBtn').classList.toggle('hidden', !isAdmin);
        $('#navAdminBtnMobile').classList.toggle('hidden', !isAdmin);
        $('#navAdminBtn').textContent = t('admin.nav');
        $$('#navAdminBtnMobile span').forEach(s => { if (!s.classList.contains('tab-icon')) s.textContent = t('admin.nav'); });
        $('#adminViewTitle').innerHTML = t('admin.title');
      }
      async function saveProfile() {
        try {
          const data = await apiJSON('/api/profile', 'PUT', {
            fullname: $('#editFullname').value.trim(),
            email: $('#editEmail').value.trim(),
            bio: $('#editBio').value.trim(),
            phone: $('#editPhone').value.trim(),
            social: $('#editSocial').value.trim(),
            privacy: {
              phone: $('#privacyPhone').checked,
              social: $('#privacySocial').checked,
              email: $('#privacyEmail').checked
            },
            callPrivacy: {
              mode: (document.querySelector('input[name="callPrivacyMode"]:checked') || {}).value || 'everyone',
              allowed: CALL_PRIVACY_ALLOWED
            }
          });
          CURRENT_USER = data.user;
          $('#editProfileCard').classList.add('hidden');
          renderProfileHeader();
        } catch (e) { /* keep the edit card open so the person can retry */ }
      }

      /* Login (username) va/yoki parolni serverga yuboradi. Xatoliklar server
         tomonidan qisqa kod shaklida qaytadi va shu yerda joriy sayt tiliga
         tarjima qilinadi — shu bois xabarlar hech qachon faqat o'zbekcha
         qolib ketmaydi. */
      async function saveCredentials() {
        const msgEl = $('#credentialsMsg');
        msgEl.textContent = '';
        msgEl.classList.remove('field-hint-ok');

        const newUsername = $('#editUsername').value.trim().toLowerCase();
        const newPassword = $('#editNewPassword').value;
        const newPassword2 = $('#editNewPassword2').value;
        const currentPassword = $('#editCurrentPassword').value;

        const usernameChanged = newUsername && CURRENT_USER && newUsername !== CURRENT_USER.username;
        const passwordChanged = !!newPassword || !!newPassword2;

        if (!usernameChanged && !passwordChanged) {
          msgEl.textContent = t('account.err.noChanges');
          return;
        }
        if (passwordChanged && newPassword !== newPassword2) {
          msgEl.textContent = t('account.err.mismatch');
          return;
        }
        if (!currentPassword) {
          msgEl.textContent = t('account.err.currentPasswordRequired');
          return;
        }

        try {
          const body = { currentPassword };
          if (usernameChanged) body.newUsername = newUsername;
          if (passwordChanged) body.newPassword = newPassword;
          const data = await apiJSON('/api/profile/credentials', 'PUT', body);
          CURRENT_USER = data.user;
          $('#editUsername').value = CURRENT_USER.username || '';
          $('#editNewPassword').value = '';
          $('#editNewPassword2').value = '';
          $('#editCurrentPassword').value = '';
          msgEl.textContent = t('account.saved');
          msgEl.classList.add('field-hint-ok');
          renderProfileHeader();
        } catch (e) {
          msgEl.textContent = e.message || t('common.serverError');
        }
      }

      async function handleAvatarFileSelect(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        try {
          const data = await api('/api/profile/avatar', { method: 'POST', body: fd });
          CURRENT_USER = data.user;
          $('#editAvatarPreview').innerHTML = avatarInner(CURRENT_USER.avatar, CURRENT_USER.fullname || CURRENT_USER.username);
          renderProfileHeader();
        } catch (err) {
          alert(err.message || t('profile.avatarUploadFail'));
        }
        e.target.value = '';
      }

      /* ===================== PUBLIC USER PROFILE ===================== */
      let UP_WORKS = [];
      let UP_USERNAME = null;

      async function openUserProfile(username) {
        if (!username) return;
        if (CURRENT_USER && username === CURRENT_USER.username) { switchView('profile'); return; }
        UP_USERNAME = username;
        switchView('userProfile');
        $('#upFullname').textContent = username;
        $('#upUsernameTag').textContent = '@' + username;
        $('#upAvatar').innerHTML = '?';
        $('#upBio').textContent = '';
        $('#upContact').innerHTML = '';
        $('#upGrid').innerHTML = '<div class="feed-spinner" style="margin:30px auto;"></div>';
        try {
          const data = await api('/api/users/' + encodeURIComponent(username));
          renderUserProfile(data.profile, data.works || []);
        } catch (e) {
          $('#upGrid').innerHTML = `<div class="empty-state"><h3>${t('userProfile.notFound.title')}</h3><p>${t('userProfile.notFound.desc')}</p></div>`;
        }
      }

      function renderUserProfile(profile, works) {
        UP_WORKS = works;
        $('#upAvatar').innerHTML = avatarInner(profile.avatar, profile.fullname || profile.username);
        $('#upFullname').textContent = profile.fullname || profile.username;
        $('#upUsernameTag').textContent = '@' + profile.username;
        $('#upMeta').textContent = t('profile.joined') + ': ' + fmtDate(profile.joined);
        $('#upOnlineStatus').innerHTML = `<span class="p-online-dot ${profile.isOnline ? 'online' : ''}"></span><span>${profile.isOnline ? t('profile.online') : t('profile.offline')}</span>`;
        $('#upBio').textContent = profile.bio || '';
        $('#upStatTotal').textContent = works.length;
        $('#upStatSale').textContent = works.filter(w => w.status === 'sale').length;
        $('#upStatExpo').textContent = works.filter(w => w.status === 'expo').length;
        const upStats = profile.stats || {};
        $('#upStatFollowers').textContent = profile.followersCount || 0;
        $('#upStatLikes').textContent = upStats.totalLikes || 0;
        $('#upStatViews').textContent = upStats.totalViews || 0;
        $('#upFollowStats').textContent = t('follow.stats', { followers: profile.followersCount || 0, following: profile.followingCount || 0 });

        const contactBits = [];
        if (!profile.isSelf) {
          contactBits.push(`<button class="btn ${profile.isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm" id="upFollowBtn" data-username="${escapeHtml(profile.username)}" data-following="${profile.isFollowing ? '1' : '0'}">${profile.isFollowing ? t('follow.unsubscribeBtn') : t('follow.subscribeBtn')}</button>`);
        }
        if (profile.phone) contactBits.push(`<div class="user-profile-contact-item">📞 ${escapeHtml(profile.phone)}</div>`);
        if (profile.social) {
          const href = /^https?:\/\//i.test(profile.social) ? profile.social : 'https://' + profile.social;
          contactBits.push(`<div class="user-profile-contact-item">🔗 <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.social)}</a></div>`);
        }
        if (profile.email) contactBits.push(`<div class="user-profile-contact-item">✉️ ${escapeHtml(profile.email)}</div>`);
        if (!CURRENT_USER || profile.username !== CURRENT_USER.username) {
          contactBits.push(`<button class="btn btn-primary btn-sm" id="upContactSellerBtn">${t('userProfile.contactBtn')}</button>`);
          contactBits.push(`<button class="report-link" id="upReportBtn">${t('report.action')}</button>`);
        }
        $('#upContact').innerHTML = contactBits.join('');
        const msgBtn = $('#upContactSellerBtn');
        if (msgBtn) msgBtn.addEventListener('click', guarded(() => openChat(profile.username)));
        const followBtn = $('#upFollowBtn');
        if (followBtn) followBtn.addEventListener('click', guarded(() => toggleFollow(profile.username, profile.isFollowing)));
        const reportBtn = $('#upReportBtn');
        if (reportBtn) reportBtn.addEventListener('click', guarded(() => openReportModal('user', profile.username, profile.fullname || profile.username)));

        renderGridInto('#upGrid', works);
      }

      /* Foydalanuvchiga obuna bo'lish / bekor qilish, so'ng profilni qayta chizish */
      async function toggleFollow(username, isFollowing) {
        if (isFollowing && !confirm(t('follow.unfollowConfirm'))) return;
        try {
          await apiJSON('/api/users/' + encodeURIComponent(username) + '/follow', 'POST');
          const data = await api('/api/users/' + encodeURIComponent(username));
          renderUserProfile(data.profile, data.works || []);
        } catch (e) { /* jim tarzda o'tkazib yuboriladi */ }
      }

      /* Lenta kartochkasidagi obuna tugmasi: bosilganda serverga so'rov yuboradi
         va ushbu foydalanuvchiga tegishli barcha tugmalarni (bir necha asar
         bo'lishi mumkin) bir vaqtda yangilaydi */
      async function toggleFeedFollow(btn) {
        const username = btn.dataset.username;
        if (btn.disabled) return;
        const wasFollowing = btn.classList.contains('following');
        if (wasFollowing && !confirm(t('follow.unfollowConfirm'))) return;
        btn.disabled = true;
        try {
          const data = await apiJSON('/api/users/' + encodeURIComponent(username) + '/follow', 'POST');
          const following = !!data.following;
          document.querySelectorAll('.feed-follow-btn[data-username="' + CSS.escape(username) + '"]').forEach(b => {
            b.classList.toggle('following', following);
            b.textContent = following ? t('follow.short') : t('follow.shortAdd');
          });
          Object.values(ALL_ITEMS_BY_ID).forEach(item => {
            if (item.username === username) item.isFollowing = following;
          });
          if (CURRENT_USER) {
            const prev = CURRENT_USER.followingCount || 0;
            CURRENT_USER.followingCount = Math.max(0, prev + (following ? 1 : -1));
            if ($('#profileView').classList.contains('active')) renderProfileHeader();
          }
        } catch (e) { /* jim tarzda o'tkazib yuboriladi */ }
        btn.disabled = false;
      }

      /* ===================== GALLERY RENDER =====================
         typeLabels/status text are the site's own vocabulary (categories,
         not user text), so they translate along with the interface. */
      function typeLabel(w) {
        // Eski chaqiruvlar bilan moslik uchun oddiy satr (masalan 'rasm') ham qabul qilinadi
        const type = (w && typeof w === 'object') ? w.type : w;
        if (type === 'boshqa' && w && typeof w === 'object' && w.typeCustom) {
          return w.typeCustom;
        }
        const key = 'upload.type.' + type;
        return I18N.uz[key] !== undefined ? t(key) : t('lightbox.workTagFallback');
      }

      function workImages(w) {
        if (Array.isArray(w.images) && w.images.length) return w.images;
        return w.image ? [w.image] : [];
      }
      // Kartalarda tez yuklanish uchun kichik nusxa (agar mavjud bo'lmasa, to'liq rasm)
      function workThumbs(w) {
        if (Array.isArray(w.thumbs) && w.thumbs.length) return w.thumbs;
        return workImages(w);
      }

      function collageHTML(images, alt, videoSrc, posterSrc) {
        if (videoSrc) {
          return `<div class="collage n-1 collage-video">
            <video src="${videoSrc}"${posterSrc ? ` poster="${posterSrc}"` : ''} autoplay muted loop playsinline preload="auto"></video>
            <div class="collage-count" aria-hidden="true">${videoIconSVG()}</div>
          </div>`;
        }
        const imgs = images && images.length ? images.slice(0, 3) : [];
        const badge = imgs.length > 1
          ? `<div class="collage-count" aria-hidden="true">${multiImageIconSVG()} ${imgs.length}</div>`
          : '';
        return `<div class="collage n-${imgs.length}">${imgs.map(src =>
          `<img src="${src}" alt="${escapeHtml(alt)}" loading="lazy">`).join('')}${badge}</div>`;
      }
      function multiImageIconSVG() {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"></rect><path d="M7 21h11a2 2 0 0 0 2-2V8"></path></svg>`;
      }
      function videoIconSVG() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="15" height="14" rx="2"></rect><path d="M17 10l5-3v10l-5-3z"></path></svg>`;
      }

      function workCardHTML(w) {
        return `
      <div class="work-card" data-id="${w.id}">
        <div class="work-thumb">
          ${collageHTML(workThumbs(w), w.title, w.video, w.poster)}
          <div class="work-tag">${typeLabel(w)}</div>
          <div class="work-status ${w.status}">${w.status === 'sale' ? t('feed.sale') : t('feed.expo')}</div>
        </div>
        <div class="work-body">
          <div class="work-title">${escapeHtml(w.title)}</div>
          <div class="work-meta">
            <span>${fmtDate(w.createdAt)}</span>
            ${w.status === 'sale' && w.price ? `<span class="work-price">${fmtPrice(w.price, w.currency)}</span>` : ''}
          </div>
        </div>
      </div>`;
      }
      function escapeHtml(s) {
        const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
      }

      function renderGrids() {
        renderGridInto('#profileGrid', WORKS);
      }

      function renderGridInto(sel, works) {
        const el = $(sel);
        if (!el) return;
        if (!works.length) {
          el.innerHTML = `
        <div class="empty-state">
          <div class="empty-stamp">🖌️</div>
          <h3>${t('feed.empty.title')}</h3>
          <p>${t('profile.empty.desc')}</p>
        </div>`;
          return;
        }
        const sorted = [...works].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        el.innerHTML = sorted.map(w => workCardHTML(w)).join('');
        el.querySelectorAll('.work-card').forEach(card => {
          card.addEventListener('click', () => openLightbox(card.dataset.id, works));
        });
        /* staggered reveal */
        const cards = el.querySelectorAll('.work-card');
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('reveal'), i * 40);
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        cards.forEach(c => io.observe(c));
      }

      /* ===================== PUBLIC FEED (barcha foydalanuvchilar) ===================== */
      function likeIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.5 5.8 4c2-.3 3.9.7 5 2.3l1.2 1.6 1.2-1.6c1.1-1.6 3-2.6 5-2.3 3.8.5 5.4 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z"/></svg>`;
      }

      function commentIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
      }

      function messageIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H7l-3 3V4z"/></svg>`;
      }

      function cartIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.4l1.1 3M6 6l1.9 8.6a1.6 1.6 0 0 0 1.6 1.3h7.3a1.6 1.6 0 0 0 1.6-1.2L20 8H6z"/></svg>`;
      }

      function shareIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.7"/><circle cx="6" cy="12" r="2.7"/><circle cx="18" cy="19" r="2.7"/><line x1="8.4" y1="10.6" x2="15.6" y2="6.4"/><line x1="8.4" y1="13.4" x2="15.6" y2="17.6"/></svg>`;
      }

      function feedCardHTML(w) {
        return `
      <article class="feed-card" data-id="${w.id}">
        <div class="feed-head" data-username="${escapeHtml(w.username)}" role="button" tabindex="0">
          <div class="feed-avatar">${avatarInner(w.avatar, w.fullname || w.username)}</div>
          <div class="feed-head-text">
            <div class="feed-fullname">${escapeHtml(w.fullname || w.username)}</div>
            <div class="feed-username">@${escapeHtml(w.username)}</div>
          </div>
          ${CURRENT_USER && w.username !== CURRENT_USER.username ? `
          <button type="button" class="feed-follow-btn ${w.isFollowing ? 'following' : ''}" data-username="${escapeHtml(w.username)}" aria-label="${t('follow.subscribeBtn')}">${w.isFollowing ? t('follow.short') : t('follow.shortAdd')}</button>` : ''}
        </div>
        <div class="feed-thumb" data-id="${w.id}" role="button" tabindex="0" aria-label="${t('feedThumb.aria')}">
          ${collageHTML(workThumbs(w), w.title, w.video, w.poster)}
          <div class="feed-status ${w.status}">${w.status === 'sale' ? t('feed.sale') : t('feed.expo')}</div>
        </div>
        <div class="feed-actions">
          <button class="like-btn ${w.likedByMe ? 'liked' : ''}" data-id="${w.id}" aria-label="${t('feed.likeAria')}">
            ${likeIconSVG()}
            <span class="like-count">${w.likesCount}</span>
          </button>
          <button class="comment-btn" data-id="${w.id}" aria-label="${t('feed.commentAria')}">
            ${commentIconSVG()}
            <span class="comment-count">${w.commentsCount || 0}</span>
          </button>
          ${w.status === 'sale' && (!CURRENT_USER || w.username !== CURRENT_USER.username) ? `
          <button class="cart-btn ${w.inCart ? 'in-cart' : ''}" data-id="${w.id}" aria-label="${t('cart.addAria')}">
            ${cartIconSVG()}
          </button>` : ''}
          <button class="share-btn" data-id="${w.id}" data-title="${escapeHtml(w.title)}" aria-label="${t('share.aria')}">
            ${shareIconSVG()}
          </button>
          ${w.status === 'sale' && (!CURRENT_USER || w.username !== CURRENT_USER.username) ? `
          <button class="contact-seller-btn" data-username="${escapeHtml(w.username)}" data-workid="${w.id}" data-worktitle="${escapeHtml(w.title)}" aria-label="${t('feed.contactAria')}">
            ${messageIconSVG()}
            <span>${t('feed.contactLabel')}</span>
          </button>` : ''}
        </div>
        <div class="feed-body">
          <div class="feed-title">${escapeHtml(w.title)}</div>
          <div class="feed-meta">
            <span>${fmtDate(w.createdAt)}</span>
            ${w.status === 'sale' && w.price ? (
              (!CURRENT_USER || w.username !== CURRENT_USER.username)
                ? `<button type="button" class="feed-price feed-price-buy" aria-label="${t('buyNow.aria')}">${fmtPrice(w.price, w.currency)}</button>`
                : `<span class="feed-price">${fmtPrice(w.price, w.currency)}</span>`
            ) : ''}
            ${w.status === 'sale' ? stockBadgeHTML(w) : ''}
          </div>
          <button class="report-link" data-type="work" data-id="${w.id}" data-title="${escapeHtml(w.title)}">${t('report.action')}</button>
        </div>
      </article>`;
      }

      const feedRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            feedRevealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });

      function appendFeedItems(items) {
        const list = $('#feedList');
        const frag = document.createElement('div');
        frag.innerHTML = items.map(w => feedCardHTML(w)).join('');
        Array.from(frag.children).forEach(card => {
          list.appendChild(card);
          bindFeedCardEvents(card);
          feedRevealObserver.observe(card);
        });
        if (!list.children.length) {
          list.innerHTML = `
        <div class="empty-state">
          <div class="empty-stamp">🖼️</div>
          <h3>${t('feed.empty.title')}</h3>
          <p>${t('feed.empty.desc')}</p>
        </div>`;
        }
      }

      /* Feed/saqlanganlar kartochkasidagi barcha bosish hodisalarini ulaydi */
      function bindFeedCardEvents(card) {
        const id = card.dataset.id;
        card.querySelector('.like-btn').addEventListener('click', () => toggleLike(id));
        card.querySelector('.comment-btn').addEventListener('click', () => openCommentsModal(id));
        const headEl = card.querySelector('.feed-head');
        if (headEl) headEl.addEventListener('click', () => openUserProfile(headEl.dataset.username));
        const followBtn = card.querySelector('.feed-follow-btn');
        if (followBtn) {
          followBtn.addEventListener('click', guarded((e) => {
            e.stopPropagation();
            toggleFeedFollow(followBtn);
          }));
        }
        const contactBtn = card.querySelector('.contact-seller-btn');
        if (contactBtn) {
          contactBtn.addEventListener('click', guarded(() => openChat(contactBtn.dataset.username, {
            id: contactBtn.dataset.workid,
            title: contactBtn.dataset.worktitle
          })));
        }
        const thumb = card.querySelector('.feed-thumb');
        if (thumb) {
          thumb.addEventListener('click', () => {
            const src = ALL_ITEMS_BY_ID[id];
            if (src && src.video) {
              openVideoViewer(src.video, src.poster, src);
            } else {
              const images = src ? workImages(src) : Array.from(thumb.querySelectorAll('img')).map(i => i.src);
              openImageViewer(images, 0);
            }
            api('/api/works/' + id + '/view', { method: 'POST' }).then(res => {
              if (src) src.viewsCount = res.viewsCount;
            }).catch(() => {});
          });
        }
        const cartBtn = card.querySelector('.cart-btn');
        if (cartBtn) cartBtn.addEventListener('click', guarded(() => toggleCart(id)));
        const buyBtn = card.querySelector('.feed-price-buy');
        if (buyBtn) {
          buyBtn.addEventListener('click', guarded((e) => {
            e.stopPropagation();
            buyNow(id);
          }));
        }
        const shareBtn = card.querySelector('.share-btn');
        if (shareBtn) shareBtn.addEventListener('click', () => shareWork(shareBtn.dataset.id, shareBtn.dataset.title));
        const reportLink = card.querySelector('.report-link');
        if (reportLink) reportLink.addEventListener('click', guarded(() => openReportModal('work', reportLink.dataset.id, reportLink.dataset.title)));
      }

      /* Lenta va korzinka ro'yxatidagi barcha asarlarni id bo'yicha tez topish uchun */
      const ALL_ITEMS_BY_ID = {};
      function indexItems(items) { (items || []).forEach(w => { ALL_ITEMS_BY_ID[w.id] = w; }); }

      /* Asarni savatga qo'shish/savatdan olib tashlash (lentadagi tezkor tugma) */
      async function toggleCart(id) {
        const btns = document.querySelectorAll(`.cart-btn[data-id="${id}"]`);
        try {
          const data = await apiJSON('/api/works/' + id + '/cart-toggle', 'POST');
          btns.forEach(btn => btn.classList.toggle('in-cart', data.inCart));
          const item = ALL_ITEMS_BY_ID[id];
          if (item) item.inCart = data.inCart;
          refreshCartBadge(data.cartCount);
        } catch (e) {
          alert((e && e.message) || t('common.serverError'));
        }
      }

      /* Bosh betdagi lentada narxga bosilganda darhol (savatsiz) sotib olish */
      async function buyNow(id) {
        const item = ALL_ITEMS_BY_ID[id];
        const label = item ? `${item.title} — ${fmtPrice(item.price, item.currency)}` : '';
        if (!confirm(t('buyNow.confirm', { item: label }))) return;
        try {
          await apiJSON('/api/works/' + id + '/buy-now', 'POST');
          alert(t('buyNow.success'));
          if (item) item.inCart = false;
          document.querySelectorAll(`.cart-btn[data-id="${id}"]`).forEach(btn => btn.classList.remove('in-cart'));
        } catch (e) {
          alert((e && e.message) || t('buyNow.fail'));
        }
      }

      /* Asar havolasini ulashish (mavjud bo'lsa tizim ulashish oynasi, aks holda nusxalash) */
      async function shareWork(id, title) {
        const url = location.origin + location.pathname + '?asar=' + encodeURIComponent(id);
        if (navigator.share) {
          try { await navigator.share({ title: title || 'Madein.net', url }); return; } catch (e) { /* bekor qilindi */ }
        }
        try {
          await navigator.clipboard.writeText(url);
          alert(t('share.linkCopied', { url }));
        } catch (e) {
          prompt(t('share.copyPrompt'), url);
        }
      }

      /* ===================== SHIKOYAT (REPORT) ===================== */
      let reportTarget = null; // { type: 'work' | 'user', id, title }
      function openReportModal(type, id, title) {
        reportTarget = { type, id, title };
        $('#reportModalSubject').textContent = title ? ('"' + title + '"') : '';
        $('#reportReasonInput').value = '';
        $('#reportModalError').textContent = '';
        $('#reportModal').classList.add('open');
      }
      function closeReportModal() { $('#reportModal').classList.remove('open'); reportTarget = null; }
      async function submitReportForm(e) {
        e.preventDefault();
        if (!reportTarget) return;
        const reason = $('#reportReasonInput').value.trim();
        try {
          const path = reportTarget.type === 'work'
            ? '/api/works/' + reportTarget.id + '/report'
            : '/api/users/' + reportTarget.id + '/report';
          await apiJSON(path, 'POST', { reason });
          closeReportModal();
          alert(t('report.sentAlert'));
        } catch (e2) {
          $('#reportModalError').textContent = (e2 && e2.message) || t('common.serverError');
        }
      }

      /* ===================== SAQLANGAN ASARLAR RO'YXATI ===================== */
      /* ===================== KORZINKA (SAVAT) ===================== */
      function cartItemHTML(w) {
        const thumb = (workThumbs(w) || [])[0] || w.poster || '';
        const atLimit = typeof w.limit === 'number' && w.qty >= w.limit;
        return `
      <div class="cart-item" data-id="${w.id}">
        <div class="cart-item-thumb">${thumb ? `<img src="${thumb}" alt="${escapeHtml(w.title)}">` : ''}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(w.title)}</div>
          <div class="cart-item-seller">@${escapeHtml(w.username)}</div>
          <div class="cart-item-price">${fmtPrice(w.price, w.currency)}</div>
          ${stockBadgeHTML(w)}
        </div>
        <div class="cart-item-qty">
          <button type="button" class="cart-qty-btn cart-qty-dec" aria-label="${t('cart.decreaseAria')}">−</button>
          <span class="cart-qty-value">${w.qty}</span>
          <button type="button" class="cart-qty-btn cart-qty-inc" ${atLimit ? 'disabled' : ''} aria-label="${t('cart.increaseAria')}">+</button>
        </div>
        <div class="cart-item-linetotal">${fmtPrice(w.lineTotal, w.currency)}</div>
        <button type="button" class="cart-remove-btn" aria-label="${t('cart.removeAria')}">${trashIconSVG()}</button>
      </div>`;
      }

      function trashIconSVG() {
        return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>`;
      }

      function renderCartSummary(totalsByCurrency) {
        const currencies = Object.keys(totalsByCurrency || {});
        if (!currencies.length) return '';
        return `
        <div class="cart-summary">
          ${currencies.map(cur => `
          <div class="cart-summary-row">
            <span>${t('cart.subtotal')}${currencies.length > 1 ? ' (' + cur + ')' : ''}</span>
            <b>${fmtPrice(totalsByCurrency[cur], cur)}</b>
          </div>`).join('')}
          <button type="button" class="btn btn-primary cart-checkout-btn" id="cartCheckoutBtn">${t('cart.checkout')}</button>
        </div>`;
      }

      async function loadCart() {
        const list = $('#cartList');
        const summaryWrap = $('#cartSummaryWrap');
        summaryWrap.innerHTML = '';
        list.innerHTML = `<p class="view-sub">${t('cart.loading')}</p>`;
        try {
          const data = await api('/api/cart');
          const items = data.items || [];
          indexItems(items);
          refreshCartBadge(data.count || 0);
          if (!items.length) {
            list.innerHTML = `
          <div class="empty-state">
            <div class="empty-stamp">🛒</div>
            <h3>${t('cart.empty.title')}</h3>
            <p>${t('cart.empty.desc')}</p>
          </div>`;
            return;
          }
          list.innerHTML = items.map(w => cartItemHTML(w)).join('');
          summaryWrap.innerHTML = renderCartSummary(data.totalsByCurrency);
          $$('#cartList .cart-item').forEach(bindCartItemEvents);
          const checkoutBtn = $('#cartCheckoutBtn');
          if (checkoutBtn) checkoutBtn.addEventListener('click', guarded(checkoutCart));
        } catch (e) {
          list.innerHTML = `<p class="view-sub">${t('common.serverError')}</p>`;
        }
      }

      function bindCartItemEvents(row) {
        const id = row.dataset.id;
        row.querySelector('.cart-qty-inc').addEventListener('click', () => stepCartQty(id, 1));
        row.querySelector('.cart-qty-dec').addEventListener('click', () => stepCartQty(id, -1));
        row.querySelector('.cart-remove-btn').addEventListener('click', () => removeCartItem(id));
      }

      async function stepCartQty(id, delta) {
        const item = ALL_ITEMS_BY_ID[id];
        if (!item) return;
        const nextQty = (item.qty || 1) + delta;
        if (nextQty <= 0) return removeCartItem(id);
        try {
          await apiJSON('/api/cart/' + id, 'PUT', { qty: nextQty });
          loadCart();
        } catch (e) {
          alert((e && e.message) || t('common.serverError'));
        }
      }

      async function removeCartItem(id) {
        try {
          await apiJSON('/api/cart/' + id, 'DELETE');
          loadCart();
        } catch (e) { /* jim tarzda o'tkazib yuboriladi */ }
      }

      async function checkoutCart() {
        if (!confirm(t('cart.checkoutConfirm'))) return;
        try {
          await apiJSON('/api/cart/checkout', 'POST');
          alert(t('cart.orderPlaced'));
          loadCart();
        } catch (e) {
          alert((e && e.message) || t('cart.orderFail'));
        }
      }

      /* Navbar/tabbardagi korzinka belgisini (nechta mahsulot borligini) yangilaydi */
      function refreshCartBadge(n) {
        $$('.cart-badge').forEach(badge => {
          badge.textContent = n > 99 ? '99+' : String(n);
          badge.classList.toggle('hidden', !n);
        });
      }

      function feedQueryString() {
        const p = new URLSearchParams();
        p.set('offset', feedOffset);
        p.set('limit', 8);
        if (feedQuery.q) p.set('q', feedQuery.q);
        if (feedQuery.type) p.set('type', feedQuery.type);
        if (feedQuery.sort && feedQuery.sort !== 'new') p.set('sort', feedQuery.sort);
        if (feedQuery.following) p.set('following', '1');
        if (feedQuery.minPrice !== '') p.set('minPrice', feedQuery.minPrice);
        if (feedQuery.maxPrice !== '') p.set('maxPrice', feedQuery.maxPrice);
        return p.toString();
      }

      /* Qidiruv/filtr o'zgarganda lentani noldan yuklaydi */
      function openSearchOverlay() {
        $('#navSearchWrap').classList.add('search-open');
        $('#feedFilterBar').classList.add('mobile-open');
        setTimeout(() => $('#feedSearchInput').focus(), 0);
      }
      function closeSearchOverlay() {
        $('#navSearchWrap').classList.remove('search-open');
        $('#feedFilterBar').classList.remove('mobile-open');
      }

      function resetAndReloadFeed() {
        FEED = [];
        feedOffset = 0;
        feedHasMore = true;
        $('#feedList').innerHTML = '';
        $('#feedEnd').classList.add('hidden');
        loadFeedPage();
      }

      async function loadFeedPage() {
        if (feedLoading || !feedHasMore) return;
        feedLoading = true;
        $('#feedSentinel').classList.remove('hidden');
        try {
          const data = await api('/api/feed?' + feedQueryString());
          const items = data.items || [];
          FEED = FEED.concat(items);
          indexItems(items);
          feedOffset += items.length;
          feedHasMore = !!data.hasMore;
          appendFeedItems(items);
        } catch (e) { /* keep hasMore as-is, allow retry on next scroll */ }
        feedLoading = false;
        $('#feedSentinel').classList.toggle('hidden', !feedHasMore);
        $('#feedEnd').classList.toggle('hidden', feedHasMore || !FEED.length);
      }

      let feedScrollObserver = null;
      function setupFeedObserver() {
        if (feedScrollObserver) feedScrollObserver.disconnect();
        feedScrollObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) loadFeedPage();
          });
        }, { rootMargin: '400px' });
        feedScrollObserver.observe($('#feedSentinel'));
      }

      async function toggleLike(id) {
        if (IS_GUEST) { openGateModal(); return; }
        const item = ALL_ITEMS_BY_ID[id] || FEED.find(w => w.id === id);
        if (!item) return;
        const btns = document.querySelectorAll(`.like-btn[data-id="${id}"]`);

        /* optimistik yangilash — bosilgan zahoti javob beradi */
        const wasLiked = item.likedByMe;
        item.likedByMe = !wasLiked;
        item.likesCount += wasLiked ? -1 : 1;
        btns.forEach(btn => updateLikeBtn(btn, item));

        try {
          const res = await apiJSON('/api/works/' + id + '/like', 'POST');
          item.likedByMe = res.liked;
          item.likesCount = res.likesCount;
          btns.forEach(btn => updateLikeBtn(btn, item));
        } catch (e) {
          /* xatolik bo'lsa, orqaga qaytaramiz */
          item.likedByMe = wasLiked;
          item.likesCount += wasLiked ? 1 : -1;
          btns.forEach(btn => updateLikeBtn(btn, item));
        }
      }

      function updateLikeBtn(btn, item) {
        if (!btn) return;
        btn.classList.toggle('liked', item.likedByMe);
        btn.querySelector('.like-count').textContent = item.likesCount;
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
      }

      /* ===================== KOMENTLAR ===================== */
      let activeCommentsWorkId = null;

      function commentCountEls(id) {
        return $$(`.comment-btn[data-id="${id}"] .comment-count`);
      }
      function setCommentCount(id, n) {
        commentCountEls(id).forEach(el => el.textContent = n);
        const item = ALL_ITEMS_BY_ID[id] || FEED.find(w => w.id === id);
        if (item) item.commentsCount = n;
      }

      function commentItemHTML(c) {
        const canDelete = CURRENT_USER && (c.username === CURRENT_USER.username);
        return `
      <div class="comment-item" data-id="${c.id}">
        <div class="comment-avatar">${initials(c.fullname || c.username)}</div>
        <div class="comment-body">
          <div class="comment-line"><b>${escapeHtml(c.fullname || c.username)}</b>${escapeHtml(c.text)}</div>
          <div class="comment-foot">
            <span class="comment-time">${fmtDate(c.createdAt)}</span>
            ${canDelete ? `<button class="comment-delete" data-id="${c.id}">${t('comments.delete')}</button>` : ''}
          </div>
        </div>
      </div>`;
      }

      function renderComments(items) {
        const list = $('#commentsList');
        if (!items.length) {
          list.innerHTML = `<div class="comments-empty">${t('comments.empty')}</div>`;
          return;
        }
        list.innerHTML = items.map(c => commentItemHTML(c)).join('');
        list.querySelectorAll('.comment-delete').forEach(btn => {
          btn.addEventListener('click', () => deleteComment(btn.dataset.id));
        });
      }

      async function openCommentsModal(workId) {
        activeCommentsWorkId = workId;
        $('#commentInput').value = '';
        $('#commentSubmitBtn').classList.remove('active');
        $('#commentsList').innerHTML = `<div class="comments-empty">${t('comments.loading')}</div>`;
        $('#commentsModal').classList.add('open');
        try {
          const data = await api('/api/works/' + workId + '/comments');
          renderComments(data.items || []);
        } catch (e) {
          $('#commentsList').innerHTML = `<div class="comments-empty">${t('comments.loadFail')}</div>`;
        }
      }

      function closeCommentsModal() {
        $('#commentsModal').classList.remove('open');
        activeCommentsWorkId = null;
      }

      async function submitComment(e) {
        e.preventDefault();
        const input = $('#commentInput');
        const text = input.value.trim();
        if (!text || !activeCommentsWorkId) return;
        const workId = activeCommentsWorkId;
        $('#commentSubmitBtn').disabled = true;
        try {
          const data = await apiJSON('/api/works/' + workId + '/comments', 'POST', { text });
          const list = $('#commentsList');
          const emptyEl = list.querySelector('.comments-empty');
          if (emptyEl) list.innerHTML = '';
          list.insertAdjacentHTML('beforeend', commentItemHTML(data.comment));
          const newBtn = list.lastElementChild.querySelector('.comment-delete');
          if (newBtn) newBtn.addEventListener('click', () => deleteComment(newBtn.dataset.id));
          list.scrollTop = list.scrollHeight;
          setCommentCount(workId, data.commentsCount);
          input.value = '';
          $('#commentSubmitBtn').classList.remove('active');
        } catch (e) { /* jim, foydalanuvchi qayta urinishi mumkin */ }
        $('#commentSubmitBtn').disabled = false;
      }

      async function deleteComment(commentId) {
        if (!activeCommentsWorkId) return;
        const workId = activeCommentsWorkId;
        try {
          const data = await api('/api/works/' + workId + '/comments/' + commentId, { method: 'DELETE' });
          const el = $('#commentsList').querySelector(`.comment-item[data-id="${commentId}"]`);
          if (el) el.remove();
          if (!$('#commentsList').children.length) {
            $('#commentsList').innerHTML = `<div class="comments-empty">${t('comments.empty')}</div>`;
          }
          setCommentCount(workId, data.commentsCount);
        } catch (e) { /* jim */ }
      }

      /* ===================== XABARLAR (sotuvchi bilan aloqa) ===================== */
      let CHAT_WITH = null; // username of the person we're currently chatting with
      let CHAT_RETURN_VIEW = 'messages'; // "← Orqaga" bosilganda qaysi sahifaga qaytish kerak
      let unreadPollTimer = null;

      const EMOJI_LIST = [
        '😀','😁','😂','🤣','😊','😍','😘','😉','😎','🤩',
        '🙂','🙃','😇','🥳','😅','😜','🤪','😏','😌','😴',
        '🤔','🤗','🙄','😐','😢','😭','😡','😱','🥺','😳',
        '👍','👎','👏','🙌','🙏','💪','👌','✌️','🤝','👋',
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💯',
        '🔥','✨','⭐','🎉','🎊','🎁','🌸','🌹','☀️','🌙'
      ];
      let emojiPickerBuilt = false;
      function buildEmojiPicker() {
        if (emojiPickerBuilt) return;
        emojiPickerBuilt = true;
        $('#emojiPicker').innerHTML = EMOJI_LIST.map(e => `<button type="button" class="emoji-item">${e}</button>`).join('');
      }
      function toggleEmojiPicker(force) {
        buildEmojiPicker();
        $('#emojiPicker').classList.toggle('hidden', force === undefined ? undefined : !force);
      }
      function insertEmojiIntoChatInput(emoji) {
        const input = $('#chatInput');
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
        const pos = start + emoji.length;
        input.focus();
        input.setSelectionRange(pos, pos);
        $('#chatSubmitBtn').classList.toggle('active', input.value.trim().length > 0);
      }

      function startUnreadPolling() {
        stopUnreadPolling();
        unreadPollTimer = setInterval(() => {
          refreshUnreadBadge();
          checkNotifications();
        }, 20000);
        startCallPolling();
      }
      function stopUnreadPolling() {
        if (unreadPollTimer) { clearInterval(unreadPollTimer); unreadPollTimer = null; }
        stopCallPolling();
      }

      /* ===================== VIDEO QO'NG'IROQ (WebRTC) =====================
         Server WebSocket ishlatmagani uchun, offer/answer/ICE ma'lumotlari
         qisqa intervalli so'rovlar (polling) orqali almashtiriladi. */
      const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];

      let CALL = null;            // { id, role, otherUser, status }
      let callPC = null;          // RTCPeerConnection
      let callLocalStream = null;
      let callPollTimer = null;         // umumiy holat (current-call) so'rovi — doim ishlaydi
      let callActivePollTimer = null;   // faol qo'ng'iroqda holat/kandidatlarni tez-tez so'raydi
      let callMicOn = true;
      let callCamOn = true;
      let callStartedAt = null;
      let callTimerInterval = null;
      let callAppliedCandidateCount = 0;
      let callOfferSent = false;
      let callHandlingId = null; // qayta ishlanayotgan call id (bir vaqtda bitta oqim)

      function startCallPolling() {
        stopCallPollingLoop();
        callPollTimer = setInterval(pollCurrentCall, 3000);
        pollCurrentCall();
      }
      function stopCallPollingLoop() {
        if (callPollTimer) { clearInterval(callPollTimer); callPollTimer = null; }
      }
      function stopCallPolling() {
        stopCallPollingLoop();
        stopActiveCallPolling();
        hideIncomingBanner();
        closeCallOverlay();
      }

      /* Har 3 soniyada — meni kutayotgan/faol qo'ng'iroq bormi, tekshiradi.
         Agar shu paytgacha qo'ng'iroqda bo'lmasak-yu, yangi 'ringing' qo'ng'iroq
         paydo bo'lsa (kimdir chaqiryapti) — kirish bannerini ko'rsatamiz. */
      async function pollCurrentCall() {
        if (IS_GUEST || !CURRENT_USER) return;
        if (CALL) return; // allaqachon faol oqim bor — bu yerda aralashmaymiz
        try {
          const data = await api('/api/calls/current');
          const call = data && data.call;
          if (!call) { hideIncomingBanner(); return; }
          if (call.status === 'ringing' && call.role === 'callee') {
            showIncomingBanner(call);
          }
        } catch (e) { /* jim o'tkazamiz — internet uzilishi va h.k. */ }
      }

      function showIncomingBanner(call) {
        if (INCOMING_CALL && INCOMING_CALL.id === call.id) return;
        INCOMING_CALL = call;
        $('#incallName').textContent = call.otherUser.fullname || call.otherUser.username;
        $('#incallAvatar').innerHTML = avatarInner(call.otherUser.avatar, call.otherUser.fullname || call.otherUser.username);
        $('#incallBanner').classList.add('open', 'ringing');
        startRingtone();
      }
      function hideIncomingBanner() {
        INCOMING_CALL = null;
        $('#incallBanner').classList.remove('open', 'ringing');
        stopRingtone();
      }
      let INCOMING_CALL = null;

      /* ---------- Kiruvchi qo'ng'iroq uchun sintez qilingan ring tovushi ----------
         Tashqi audio fayl talab qilinmaydi — Web Audio API orqali klassik
         ikki tonli "ring-ring" signal generatsiya qilinadi va banner ochiq
         turgan vaqtda har 2 soniyada takrorlanadi. */
      let ringAudioCtx = null;
      let ringIntervalId = null;
      let ringActiveOscillators = [];

      function ensureRingAudioCtx() {
        if (!ringAudioCtx) {
          try { ringAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
          catch (e) { ringAudioCtx = null; }
        }
        return ringAudioCtx;
      }

      function playRingtoneBeep() {
        const ctx = ensureRingAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
        const now = ctx.currentTime;
        [440, 480].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
          gain.gain.setValueAtTime(0.16, now + 0.85);
          gain.gain.linearRampToValueAtTime(0, now + 1.0);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.05);
          ringActiveOscillators.push(osc);
          osc.onended = () => { ringActiveOscillators = ringActiveOscillators.filter((n) => n !== osc); };
        });
      }

      function startRingtone() {
        if (ringIntervalId) return;
        playRingtoneBeep();
        ringIntervalId = setInterval(playRingtoneBeep, 2000);
        if (navigator.vibrate) { try { navigator.vibrate([500, 300, 500, 300]); } catch (e) {} }
      }

      function stopRingtone() {
        if (ringIntervalId) { clearInterval(ringIntervalId); ringIntervalId = null; }
        ringActiveOscillators.forEach((n) => { try { n.stop(); } catch (e) {} });
        ringActiveOscillators = [];
        if (navigator.vibrate) { try { navigator.vibrate(0); } catch (e) {} }
      }

      /* ---------- Qo'ng'iroqni boshlash (chaqiruvchi) ---------- */
      async function startCall(username) {
        if (IS_GUEST) { openGateModal(); return; }
        if (!username || CALL) return;
        try {
          const data = await apiJSON('/api/calls/start', 'POST', { to: username });
          await beginCallFlow(data.call, 'caller');
        } catch (e) {
          alert(e.message || t('call.startFail'));
        }
      }

      /* ---------- Kiruvchi qo'ng'iroqni qabul qilish ---------- */
      async function acceptIncomingCall() {
        if (!INCOMING_CALL) return;
        const call = INCOMING_CALL;
        hideIncomingBanner();
        await beginCallFlow(call, 'callee');
      }
      async function declineIncomingCall() {
        if (!INCOMING_CALL) return;
        const id = INCOMING_CALL.id;
        hideIncomingBanner();
        try { await apiJSON('/api/calls/' + id + '/decline', 'POST', {}); } catch (e) { /* ignore */ }
      }

      /* ---------- Umumiy oqim: peer connection ochish, media olish ---------- */
      async function beginCallFlow(call, role) {
        CALL = Object.assign({}, call, { role });
        callHandlingId = call.id;
        callOfferSent = false;
        callAppliedCandidateCount = 0;
        callMicOn = true;
        callCamOn = true;

        openCallOverlay(CALL);

        const callAudioConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
        try {
          callLocalStream = await navigator.mediaDevices.getUserMedia({ audio: callAudioConstraints, video: true });
        } catch (e) {
          setCallStatusText(t('call.noCamera'));
          try { callLocalStream = await navigator.mediaDevices.getUserMedia({ audio: callAudioConstraints, video: false }); }
          catch (e2) { alert(t('call.noMediaAccess')); await endCallCleanup(); return; }
        }
        $('#callLocalVideo').srcObject = callLocalStream;
        updateLocalCamPreview();

        callPC = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        callLocalStream.getTracks().forEach(tr => callPC.addTrack(tr, callLocalStream));

        callPC.ontrack = (ev) => {
          const remoteVideo = $('#callRemoteVideo');
          if (remoteVideo.srcObject !== ev.streams[0]) remoteVideo.srcObject = ev.streams[0];
          remoteVideo.classList.remove('hidden');
          $('#callPlaceholder').classList.add('hidden');
        };
        callPC.onicecandidate = (ev) => {
          if (ev.candidate && CALL) {
            apiJSON('/api/calls/' + CALL.id + '/candidate', 'POST', { candidate: ev.candidate.toJSON() }).catch(() => {});
          }
        };
        callPC.onconnectionstatechange = () => {
          if (!callPC) return;
          if (['failed', 'closed'].includes(callPC.connectionState)) {
            if (CALL && CALL.status !== 'ended') endCall();
          }
        };

        if (role === 'caller') {
          setCallStatusText(t('call.calling'));
          const offer = await callPC.createOffer();
          await callPC.setLocalDescription(offer);
          await apiJSON('/api/calls/' + CALL.id + '/offer', 'POST', { sdp: offer });
          callOfferSent = true;
        } else {
          setCallStatusText(t('call.connecting'));
        }

        startActiveCallPolling();
      }

      function startActiveCallPolling() {
        stopActiveCallPolling();
        callActivePollTimer = setInterval(pollActiveCall, 1200);
        pollActiveCall();
      }
      function stopActiveCallPolling() {
        if (callActivePollTimer) { clearInterval(callActivePollTimer); callActivePollTimer = null; }
      }

      async function pollActiveCall() {
        if (!CALL || !callPC) return;
        const id = CALL.id;
        try {
          const data = await api('/api/calls/' + id);
          const call = data.call;
          if (!call) return;

          if (CALL.role === 'callee' && call.status === 'ringing' && call.offer && !callPC.currentRemoteDescription) {
            await callPC.setRemoteDescription(new RTCSessionDescription(call.offer));
            const answer = await callPC.createAnswer();
            await callPC.setLocalDescription(answer);
            await apiJSON('/api/calls/' + id + '/answer', 'POST', { sdp: answer });
          }

          if (CALL.role === 'caller' && call.status === 'accepted' && call.answer && !callPC.currentRemoteDescription) {
            await callPC.setRemoteDescription(new RTCSessionDescription(call.answer));
          }

          if (call.status === 'accepted' && CALL.status !== 'accepted') {
            setCallStatusText('');
            startCallTimer();
          }
          CALL.status = call.status;

          // Kandidatlarni qo'llash
          try {
            const cdata = await api('/api/calls/' + id + '/candidates');
            const items = cdata.items || [];
            for (let i = callAppliedCandidateCount; i < items.length; i++) {
              try { await callPC.addIceCandidate(new RTCIceCandidate(items[i])); } catch (e) { /* ignore */ }
            }
            callAppliedCandidateCount = items.length;
          } catch (e) { /* ignore */ }

          // Narigi tomon kamerasi holati
          $('#callPeerCamOffFlag').classList.toggle('hidden', !call.cameraOff);

          if (['declined', 'missed', 'ended', 'cancelled', 'busy'].includes(call.status)) {
            const msgKey = call.status === 'declined' ? 'call.wasDeclined'
              : call.status === 'missed' ? 'call.wasMissed'
              : call.status === 'busy' ? 'call.wasBusy'
              : 'call.ended';
            setCallStatusText(t(msgKey));
            const durationSec = callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0;
            const otherUsername = CALL.otherUser && CALL.otherUser.username;
            if (otherUsername) appendLiveCallMessage(otherUsername, call.status, durationSec);
            setTimeout(() => { if (CALL && CALL.id === id) endCallCleanup(); }, 900);
          }
        } catch (e) {
          // qo'ng'iroq topilmadi yoki tarmoq xatosi — jim o'tkazamiz, keyingi pollga qoldiramiz
        }
      }

      function setCallStatusText(text) {
        $('#callStatusText').textContent = text;
        $('#callStatusText').classList.toggle('hidden', !text);
      }

      function startCallTimer() {
        callStartedAt = Date.now();
        if (callTimerInterval) clearInterval(callTimerInterval);
        callTimerInterval = setInterval(() => {
          const s = Math.floor((Date.now() - callStartedAt) / 1000);
          const mm = String(Math.floor(s / 60)).padStart(2, '0');
          const ss = String(s % 60).padStart(2, '0');
          $('#callTimer').textContent = mm + ':' + ss;
        }, 500);
      }
      function stopCallTimer() {
        if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
        $('#callTimer').textContent = '00:00';
      }

      function openCallOverlay(call) {
        $('#callOverlay').classList.add('open');
        $('#callTopName').textContent = call.otherUser.fullname || call.otherUser.username;
        $('#callPeerName').textContent = call.otherUser.fullname || call.otherUser.username;
        $('#callPeerAvatar').innerHTML = avatarInner(call.otherUser.avatar, call.otherUser.fullname || call.otherUser.username);
        $('#callPlaceholder').classList.remove('hidden');
        $('#callRemoteVideo').classList.add('hidden');
        $('#callRemoteVideo').srcObject = null;
        $('#callPeerCamOffFlag').classList.add('hidden');
        $('#callMicBtn').classList.remove('active-off');
        $('#callCamBtn').classList.remove('active-off');
        $('#callLocalOffFlag').classList.add('hidden');
        stopCallTimer();
      }

      function closeCallOverlay() {
        $('#callOverlay').classList.remove('open');
        stopCallTimer();
      }

      function updateLocalCamPreview() {
        $('#callLocalOffFlag').classList.toggle('hidden', callCamOn);
        $('#callLocalVideo').classList.toggle('hidden', !callCamOn);
      }

      async function toggleCallMic() {
        if (!callLocalStream) return;
        callMicOn = !callMicOn;
        callLocalStream.getAudioTracks().forEach(tr => tr.enabled = callMicOn);
        $('#callMicBtn').classList.toggle('active-off', !callMicOn);
      }

      /* Kamerani o'chirish/yoqish — mikrofon ishlashda davom etadi,
         narigi tomonga "kamera o'chirilgan" belgisi yuboriladi */
      async function toggleCallCam() {
        if (!callLocalStream) return;
        callCamOn = !callCamOn;
        callLocalStream.getVideoTracks().forEach(tr => tr.enabled = callCamOn);
        $('#callCamBtn').classList.toggle('active-off', !callCamOn);
        updateLocalCamPreview();
        if (CALL) {
          try { await apiJSON('/api/calls/' + CALL.id + '/camera', 'POST', { off: !callCamOn }); } catch (e) { /* ignore */ }
        }
      }

      async function endCall() {
        if (!CALL) return;
        const id = CALL.id;
        try {
          const endpoint = (CALL.status === 'ringing' && CALL.role === 'caller') ? 'cancel' : 'end';
          await apiJSON('/api/calls/' + id + '/' + endpoint, 'POST', {});
        } catch (e) { /* ignore */ }
        await endCallCleanup();
      }

      async function endCallCleanup() {
        stopActiveCallPolling();
        stopCallTimer();
        if (callPC) { try { callPC.close(); } catch (e) {} callPC = null; }
        if (callLocalStream) { callLocalStream.getTracks().forEach(tr => tr.stop()); callLocalStream = null; }
        closeCallOverlay();
        CALL = null;
        callHandlingId = null;
      }

      function bindCallEvents() {
        $('#chatCallBtn').addEventListener('click', guarded(() => { if (CHAT_WITH) startCall(CHAT_WITH); }));
        $('#incallAcceptBtn').addEventListener('click', () => acceptIncomingCall());
        $('#incallDeclineBtn').addEventListener('click', () => declineIncomingCall());
        $('#callMicBtn').addEventListener('click', () => toggleCallMic());
        $('#callCamBtn').addEventListener('click', () => toggleCallCam());
        $('#callEndBtn').addEventListener('click', () => endCall());
      }

      async function refreshUnreadBadge() {
        if (IS_GUEST || !CURRENT_USER) return;
        try {
          const data = await api('/api/conversations/unread-count');
          const n = (data && data.count) || 0;
          $$('.msg-badge').forEach(badge => {
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.classList.toggle('hidden', n === 0);
          });
        } catch (e) { /* non-critical */ }
      }

      function fmtChatTime(iso) {
        const d = new Date(iso);
        return d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      }

      /* Suhbatlar ro'yxatidagi so'nggi qo'ng'iroq holatini joriy sayt
         tilida ko'rsatadi (server faqat holat kodini yuboradi, matnni
         emas — shu bois bu yerda tarjima qilinadi). */
      function callStatusPreviewText(status) {
        switch (status) {
          case 'missed': return t('call.msg.missed');
          case 'declined': return t('call.msg.declined');
          case 'cancelled': return t('call.msg.cancelled');
          case 'busy': return t('call.msg.busy');
          case 'ended':
          default: return t('call.msg.ended');
        }
      }

      /* Suhbatlar ro'yxatidagi so'nggi media xabar önizlemesini joriy sayt
         tilida ko'rsatadi (server faqat xabar TURINI yuboradi, tayyor
         emoji+matnni emas — aks holda matn doim o'zbekcha ko'rinib qolardi). */
      function messageTypePreviewText(type, fileName) {
        switch (type) {
          case 'photo': return t('chat.preview.photo');
          case 'video': return t('chat.preview.video');
          case 'circle': return t('chat.preview.circle');
          case 'voice': return t('chat.preview.voice');
          case 'file': return '📎 ' + (fileName || t('chat.preview.file'));
          default: return '';
        }
      }

      function conversationItemHTML(c) {
        const previewText = c.lastCallStatus
          ? ('📞 ' + callStatusPreviewText(c.lastCallStatus))
          : (c.lastMessageType && c.lastMessageType !== 'text' ? messageTypePreviewText(c.lastMessageType, c.lastFileName) : (c.lastMessage || ''));
        return `
      <div class="conversation-item ${c.unread ? 'unread' : ''}" data-username="${escapeHtml(c.username)}">
        <div class="conversation-avatar">${avatarInner(c.avatar, c.fullname || c.username)}</div>
        <div class="conversation-body">
          <div class="conversation-name">${escapeHtml(c.fullname || c.username)}</div>
          <div class="conversation-preview">${escapeHtml(c.lastFrom === (CURRENT_USER && CURRENT_USER.username) ? t('messages.you') + ': ' + previewText : previewText)}</div>
        </div>
        <div class="conversation-meta">
          <div class="conversation-time">${c.updatedAt ? fmtChatTime(c.updatedAt) : ''}</div>
          ${c.unread ? '<div class="conversation-dot"></div>' : ''}
        </div>
      </div>`;
      }

      async function loadConversations() {
        const list = $('#conversationsList');
        try {
          const data = await api('/api/conversations');
          const items = data.items || [];
          if (!items.length) {
            list.innerHTML = `
          <div class="empty-state">
            <div class="empty-stamp">💬</div>
            <h3>${t('messages.empty.title')}</h3>
            <p>${t('messages.empty.desc')}</p>
          </div>`;
            return;
          }
          list.innerHTML = items.map(c => conversationItemHTML(c)).join('');
          list.querySelectorAll('.conversation-item').forEach(el => {
            el.addEventListener('click', () => openChat(el.dataset.username));
          });
        } catch (e) {
          list.innerHTML = `<div class="empty-state"><h3>${t('messages.loadFail.title')}</h3><p>${t('messages.loadFail.desc')}</p></div>`;
        }
      }

      function chatBubbleHTML(m) {
        const mine = m.from === (CURRENT_USER && CURRENT_USER.username);
        if (m.type === 'call') return chatCallBubbleHTML(m, mine);
        if (m.type === 'photo') return chatMediaBubbleHTML(m, mine, `<img src="${escapeHtml(m.url)}" class="chat-media-img" loading="lazy" alt="">`);
        if (m.type === 'video') return chatMediaBubbleHTML(m, mine, `<video src="${escapeHtml(m.url)}" ${m.poster ? `poster="${escapeHtml(m.poster)}"` : ''} class="chat-media-video" controls playsinline preload="metadata"></video>`);
        if (m.type === 'circle') return chatCircleBubbleHTML(m, mine);
        if (m.type === 'voice') return chatVoiceBubbleHTML(m, mine);
        if (m.type === 'file') return chatFileBubbleHTML(m, mine);
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <div class="chat-bubble">
          ${m.workTitle ? `<div style="font-size:11.5px;opacity:.8;margin-bottom:3px;">🖼️ ${escapeHtml(m.workTitle)}</div>` : ''}
          ${escapeHtml(m.text)}
          <span class="chat-bubble-time">${fmtChatTime(m.createdAt)}</span>
        </div>
      </div>`;
      }

      /* Rasm/video (odatdagi, doira emas) xabar balonchasi */
      function chatMediaBubbleHTML(m, mine, innerHTML) {
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <div class="chat-bubble chat-bubble-media">
          ${innerHTML}
          ${m.text ? `<div class="chat-media-caption">${escapeHtml(m.text)}</div>` : ''}
          <span class="chat-bubble-time chat-bubble-time-media">${fmtChatTime(m.createdAt)}</span>
        </div>
      </div>`;
      }

      /* Telegramdagi kabi doiraviy video xabar ("krujok") balonchasi.
         Andoza (native) <video controls> ishlatilganda, brauzer boshqaruv
         panelini doira shakliga moslab chizib berolmaydi — pastki
         burchaklardagi tugmalar (jumladan "play" tugmasining o'zi) doira
         tashqarisida kesilib, deyarli bosib bo'lmaydigan holga kelardi.
         Aynan shu sabab foydalanuvchiga "ishlamayapti" bo'lib ko'rinardi.
         Shuning uchun native boshqaruvlar butunlay olib tashlanadi va
         o'rniga markazda oddiy "play" tugmasi + progress halqasi chiziladi. */
      function chatCircleBubbleHTML(m, mine) {
        const dur = fmtCallDuration(m.duration || 0);
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <div class="chat-circle-msg" data-circle-msg>
          <div class="chat-circle-wrap">
            <video src="${escapeHtml(m.url)}" ${m.poster ? `poster="${escapeHtml(m.poster)}"` : ''} class="chat-circle-video" playsinline preload="metadata"></video>
            <svg class="chat-circle-ring" viewBox="0 0 100 100" data-circle-ring>
              <circle cx="50" cy="50" r="47" />
            </svg>
            <button type="button" class="chat-circle-play" data-circle-toggle aria-label="${escapeHtml(t('chat.circleAria'))}">
              <svg class="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" hidden><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
            </button>
          </div>
          <div class="chat-circle-foot">
            <span class="chat-circle-duration" data-circle-duration>${dur}</span>
            <span class="chat-circle-time">${fmtChatTime(m.createdAt)}</span>
          </div>
        </div>
      </div>`;
      }

      /* Ovozli xabar balonchasi — Telegramdagi kabi: doiraviy "play" tugmasi +
         waveform ko'rinishidagi progress + davomiylik. Haqiqiy audio signalidan
         "waveform" chizish uchun har bir xabarni Web Audio API bilan qayta
         dekodlash kerak bo'lardi (qo'shimcha tarmoq so'rovi va ishlamay qolish
         xavfi bilan); buning o'rniga xabar ID'siga bog'liq psevdo-tasodifiy,
         lekin barqaror (har safar bir xil ko'rinadigan) panellar ishlatiladi —
         faqat TASHQI ko'rinish uchun. Ijro jarayonining o'zi (progress, vaqt)
         to'liq haqiqiy <audio> elementidan olinadi. */
      function seededRandom01(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return function () {
          s = (s * 16807) % 2147483647;
          return (s - 1) / 2147483646;
        };
      }
      function hashSeedStr(str) {
        str = String(str || '');
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
        return Math.abs(h) || 1;
      }
      function voiceBarHeights(seed, count) {
        const rand = seededRandom01(hashSeedStr(seed));
        const heights = [];
        let prev = 0.5;
        for (let i = 0; i < count; i++) {
          const v = prev * 0.45 + rand() * 0.55;
          prev = v;
          heights.push(0.24 + v * 0.76);
        }
        return heights;
      }
      function voiceBarsHTML(seed) {
        return voiceBarHeights(seed, 27).map(h =>
          `<span class="voice-bar" style="height:${Math.round(h * 100)}%"></span>`
        ).join('');
      }

      function chatVoiceBubbleHTML(m, mine) {
        const totalDur = fmtCallDuration(m.duration || 0);
        const bars = voiceBarsHTML(m.id || m.createdAt);
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <div class="chat-bubble chat-voice-msg">
          <audio class="chat-voice-audio" src="${escapeHtml(m.url)}" preload="metadata"></audio>
          <div class="voice-row">
            <button type="button" class="voice-play-btn" data-voice-toggle aria-label="${escapeHtml(t('chat.voiceAria'))}">
              <svg class="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" hidden><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
            </button>
            <div class="voice-track" data-voice-track>
              <div class="voice-bars">${bars}</div>
              <div class="voice-bars-progress" data-voice-progress><div class="voice-bars">${bars}</div></div>
            </div>
          </div>
          <div class="voice-foot">
            <span class="voice-duration" data-voice-duration>${totalDur}</span>
            <span class="chat-bubble-time">${fmtChatTime(m.createdAt)}</span>
          </div>
        </div>
      </div>`;
      }

      /* Bir vaqtda faqat bitta ovozli xabar ijro etilishi uchun (Telegram/
         WhatsApp'dagi kabi) — yangisi bosilganda avvalgisi to'xtaydi. */
      let currentPlayingVoiceAudio = null;

      /* SVG elementlarda ".hidden" JS xossasini o'rnatish ba'zi brauzerlarda
         "hidden" atributiga aks etmaydi (bu faqat oddiy HTML elementlar uchun
         ishonchli ishlaydi). Play/pauza ikonalari <svg> bo'lgani uchun
         atributni to'g'ridan-to'g'ri o'zimiz boshqaramiz. */
      function setSvgHidden(el, hide) {
        if (!el) return;
        if (hide) el.setAttribute('hidden', '');
        else el.removeAttribute('hidden');
      }

      function resetVoiceButton(bubble) {
        if (!bubble) return;
        const btn = bubble.querySelector('[data-voice-toggle]');
        if (!btn) return;
        setSvgHidden(btn.querySelector('.i-play'), false);
        setSvgHidden(btn.querySelector('.i-pause'), true);
      }

      function bindVoicePlayers(container) {
        container.querySelectorAll('.chat-voice-msg').forEach((bubble) => {
          if (bubble.dataset.bound) return;
          bubble.dataset.bound = '1';

          const audio = bubble.querySelector('.chat-voice-audio');
          const btn = bubble.querySelector('[data-voice-toggle]');
          const track = bubble.querySelector('[data-voice-track]');
          const progress = bubble.querySelector('[data-voice-progress]');
          const durationEl = bubble.querySelector('[data-voice-duration]');
          const iPlay = btn.querySelector('.i-play');
          const iPause = btn.querySelector('.i-pause');
          const totalDurText = durationEl.textContent;

          function setProgress(ratio) {
            progress.style.width = (Math.max(0, Math.min(1, ratio)) * 100) + '%';
          }

          btn.addEventListener('click', () => {
            if (audio.paused) {
              if (currentPlayingVoiceAudio && currentPlayingVoiceAudio !== audio) {
                currentPlayingVoiceAudio.pause();
              }
              audio.play().catch(() => {});
              currentPlayingVoiceAudio = audio;
            } else {
              audio.pause();
            }
          });

          audio.addEventListener('play', () => {
            setSvgHidden(iPlay, true);
            setSvgHidden(iPause, false);
          });
          audio.addEventListener('pause', () => {
            setSvgHidden(iPlay, false);
            setSvgHidden(iPause, true);
          });
          audio.addEventListener('timeupdate', () => {
            if (audio.duration) setProgress(audio.currentTime / audio.duration);
            durationEl.textContent = fmtCallDuration(Math.floor(audio.currentTime));
          });
          audio.addEventListener('ended', () => {
            setProgress(0);
            durationEl.textContent = totalDurText;
            if (currentPlayingVoiceAudio === audio) currentPlayingVoiceAudio = null;
          });
          audio.addEventListener('loadedmetadata', () => {
            if (!totalDurText || totalDurText === '0:00') {
              durationEl.textContent = fmtCallDuration(Math.floor(audio.duration || 0));
            }
          });

          track.addEventListener('click', (e) => {
            if (!audio.duration) return;
            const rect = track.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
            setProgress(ratio);
          });
        });
      }

      /* Bir vaqtda faqat bitta "krujok" video ijro etilishi uchun */
      let currentPlayingCircleVideo = null;

      function bindCircleVideos(container) {
        container.querySelectorAll('[data-circle-msg]').forEach((wrap) => {
          if (wrap.dataset.bound) return;
          wrap.dataset.bound = '1';

          const video = wrap.querySelector('.chat-circle-video');
          const btn = wrap.querySelector('[data-circle-toggle]');
          const ring = wrap.querySelector('[data-circle-ring] circle');
          const durationEl = wrap.querySelector('[data-circle-duration]');
          const iPlay = btn.querySelector('.i-play');
          const iPause = btn.querySelector('.i-pause');
          const totalDurText = durationEl.textContent;
          const circumference = 2 * Math.PI * 47;
          ring.style.strokeDasharray = String(circumference);
          ring.style.strokeDashoffset = '0';

          function toggle() {
            if (video.paused) {
              if (currentPlayingCircleVideo && currentPlayingCircleVideo !== video) {
                currentPlayingCircleVideo.pause();
                currentPlayingCircleVideo.currentTime = 0;
              }
              if (currentPlayingVoiceAudio) { currentPlayingVoiceAudio.pause(); }
              video.play().catch(() => {});
              currentPlayingCircleVideo = video;
            } else {
              video.pause();
            }
          }

          btn.addEventListener('click', toggle);
          video.addEventListener('click', toggle);

          video.addEventListener('play', () => { setSvgHidden(iPlay, true); setSvgHidden(iPause, false); wrap.classList.add('playing'); });
          video.addEventListener('pause', () => { setSvgHidden(iPlay, false); setSvgHidden(iPause, true); wrap.classList.remove('playing'); });
          video.addEventListener('timeupdate', () => {
            if (video.duration) {
              ring.style.strokeDashoffset = String(circumference * (1 - video.currentTime / video.duration));
              durationEl.textContent = fmtCallDuration(Math.floor(video.currentTime));
            }
          });
          video.addEventListener('ended', () => {
            ring.style.strokeDashoffset = String(circumference);
            durationEl.textContent = totalDurText;
            if (currentPlayingCircleVideo === video) currentPlayingCircleVideo = null;
          });
          video.addEventListener('loadedmetadata', () => {
            if (!totalDurText || totalDurText === '0:00') {
              durationEl.textContent = fmtCallDuration(Math.floor(video.duration || 0));
            }
          });
        });
      }

      function fmtFileSize(bytes) {
        bytes = Number(bytes) || 0;
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }

      /* Istalgan turdagi biriktirilgan fayl balonchasi (yuklab olish havolasi) */
      function chatFileBubbleHTML(m, mine) {
        const size = m.fileSize ? fmtFileSize(m.fileSize) : '';
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <a href="${escapeHtml(m.url)}" download="${escapeHtml(m.fileName || '')}" target="_blank" rel="noopener" class="chat-bubble chat-file-msg">
          <div class="chat-file-icon">📎</div>
          <div class="chat-file-info">
            <div class="chat-file-name">${escapeHtml(m.fileName || 'Fayl')}</div>
            <div class="chat-file-size">${size}</div>
          </div>
          <span class="chat-bubble-time">${fmtChatTime(m.createdAt)}</span>
        </a>
      </div>`;
      }

      const callMsgIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
      const callMsgMissedIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7 17 13"/><path d="M17 7l6 6"/><path d="M15.5 15.5a19.5 19.5 0 0 1-6.4-4.7 19.5 19.5 0 0 1-4.6-8A2 2 0 0 1 6.5 1h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L10.5 8.87a12 12 0 0 0 4.6 4.6l1.23-1.23a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7"/></svg>`;

      function fmtCallDuration(sec) {
        sec = Math.max(0, sec | 0);
        const mm = Math.floor(sec / 60), ss = sec % 60;
        return mm + ':' + String(ss).padStart(2, '0');
      }

      /* Telegramdagi kabi qo'ng'iroq xabari balonchasi — holatga qarab
         matn/rang o'zgaradi, bosilganda o'sha odamga qayta qo'ng'iroq qilinadi */
      function chatCallBubbleHTML(m, mine) {
        const missedLike = ['missed', 'declined', 'cancelled', 'busy'].includes(m.callStatus);
        const statusClass = m.callStatus === 'missed' ? 'missed' : (m.callStatus === 'declined' ? 'declined' : '');
        let title, sub;
        if (m.callStatus === 'ended') {
          title = t('call.msg.ended') || "Video qo'ng'iroq";
          sub = fmtCallDuration(m.callDuration || 0);
        } else if (m.callStatus === 'missed') {
          title = mine ? (t('call.msg.noAnswer') || 'Javob berilmadi') : (t('call.msg.missed') || "O'tkazib yuborilgan qo'ng'iroq");
          sub = fmtChatTime(m.createdAt);
        } else if (m.callStatus === 'declined') {
          title = t('call.msg.declined') || "Rad etilgan qo'ng'iroq";
          sub = fmtChatTime(m.createdAt);
        } else if (m.callStatus === 'cancelled') {
          title = t('call.msg.cancelled') || "Bekor qilingan qo'ng'iroq";
          sub = fmtChatTime(m.createdAt);
        } else if (m.callStatus === 'busy') {
          title = t('call.msg.busy') || 'Band edi';
          sub = fmtChatTime(m.createdAt);
        } else {
          title = t('call.msg.ended') || "Video qo'ng'iroq";
          sub = fmtChatTime(m.createdAt);
        }
        const otherUsername = mine ? (CHAT_WITH || '') : m.from;
        return `
      <div class="chat-bubble-row ${mine ? 'me' : ''}">
        <div class="chat-bubble chat-call-msg-wrap" data-call-redial="${escapeHtml(otherUsername)}">
          <div class="chat-call-msg ${statusClass}">
            <div class="chat-call-msg-icon">${missedLike ? callMsgMissedIconSVG : callMsgIconSVG}</div>
            <div class="chat-call-msg-text">
              <span class="chat-call-msg-title">${title}</span>
              <span class="chat-call-msg-sub">${sub}</span>
            </div>
          </div>
        </div>
      </div>`;
      }

      /* Qo'ng'iroq xabarini bosganda — o'sha odamga qayta qo'ng'iroq qilamiz */
      function bindCallMsgRedial(container) {
        container.querySelectorAll('[data-call-redial]').forEach((el) => {
          if (el.dataset.bound) return;
          el.dataset.bound = '1';
          el.addEventListener('click', () => {
            const u = el.dataset.callRedial;
            if (u) startCall(u);
          });
        });
      }

      /* Faol qo'ng'iroq tugaganda — ochiq turgan chatga darhol qo'ng'iroq
         xabarini qo'shamiz (Telegramdagi kabi jonli ko'rinish uchun;
         server tomonida ham saqlanadi, shuning uchun keyingi ochishda ham ko'rinadi) */
      function appendLiveCallMessage(otherUsername, status, durationSec) {
        if (CHAT_WITH !== otherUsername || !CURRENT_USER) return;
        const list = $('#chatMessagesList');
        if (!list) return;
        const empty = list.querySelector('.comments-empty');
        if (empty) list.innerHTML = '';
        const msg = {
          from: CURRENT_USER.username,
          type: 'call',
          callStatus: status,
          callDuration: durationSec || 0,
          createdAt: new Date().toISOString()
        };
        list.insertAdjacentHTML('beforeend', chatBubbleHTML(msg));
        bindCallMsgRedial(list);
        bindVoicePlayers(list);
        bindCircleVideos(list);
        list.scrollTop = list.scrollHeight;
      }

      async function openChat(username, workRef) {
        const activeSection = document.querySelector('main > .view.active');
        if (activeSection && activeSection.id !== 'chatView') {
          CHAT_RETURN_VIEW = activeSection.id.replace(/View$/, '') || 'home';
        }
        CHAT_WITH = username;
        $('#chatWithName').textContent = username;
        $('#chatViewAvatar').innerHTML = initials(username);
        $('#chatMessagesList').innerHTML = '<div class="feed-spinner" style="margin:20px auto;"></div>';
        const workRefEl = $('#chatWorkRef');
        if (workRef && workRef.title) {
          workRefEl.textContent = t('chat.workRefPrefix') + ": " + workRef.title;
          workRefEl.classList.remove('hidden');
          workRefEl.dataset.workid = workRef.id || '';
          workRefEl.dataset.worktitle = workRef.title || '';
        } else {
          workRefEl.classList.add('hidden');
          workRefEl.dataset.workid = '';
          workRefEl.dataset.worktitle = '';
        }
        $('#emojiPicker').classList.add('hidden');
        $('#chatAttachMenu').classList.add('hidden');
        cancelChatRecording();
        switchView('chat');
        $('#chatInput').value = '';
        $('#chatSubmitBtn').classList.remove('active');

        try {
          const data = await api('/api/conversations/' + encodeURIComponent(username) + '/messages');
          const other = data.otherUser;
          $('#chatWithName').textContent = (other && other.fullname) || username;
          $('#chatViewAvatar').innerHTML = avatarInner(other && other.avatar, (other && other.fullname) || username);
          renderChatMessages(data.items || []);
          refreshUnreadBadge();
        } catch (e) {
          $('#chatMessagesList').innerHTML = `<div class="comments-empty">${t('chat.loadFail')}</div>`;
        }
      }

      function renderChatMessages(items) {
        const list = $('#chatMessagesList');
        if (!items.length) {
          list.innerHTML = `<div class="comments-empty">${t('chat.empty')}</div>`;
        } else {
          list.innerHTML = items.map(m => chatBubbleHTML(m)).join('');
          bindCallMsgRedial(list);
          bindVoicePlayers(list);
          bindCircleVideos(list);
        }
        list.scrollTop = list.scrollHeight;
      }

      function closeChatModal() {
        cancelChatRecording();
        switchView(CHAT_RETURN_VIEW || 'messages');
        CHAT_WITH = null;
        $('#emojiPicker').classList.add('hidden');
        $('#chatAttachMenu').classList.add('hidden');
      }

      async function submitChatMessage(e) {
        e.preventDefault();
        if (IS_GUEST) { openGateModal(); return; }
        if (!CHAT_WITH) return;
        const input = $('#chatInput');
        const text = input.value.trim();
        if (!text) return;
        const workRefEl = $('#chatWorkRef');
        const payload = { text };
        if (workRefEl && !workRefEl.classList.contains('hidden')) {
          payload.workId = workRefEl.dataset.workid || undefined;
          payload.workTitle = workRefEl.dataset.worktitle || undefined;
        }
        input.value = '';
        try {
          const data = await apiJSON('/api/conversations/' + encodeURIComponent(CHAT_WITH) + '/messages', 'POST', payload);
          const list = $('#chatMessagesList');
          const empty = list.querySelector('.comments-empty');
          if (empty) list.innerHTML = '';
          list.insertAdjacentHTML('beforeend', chatBubbleHTML(data.message));
          list.scrollTop = list.scrollHeight;
        } catch (err) {
          input.value = text;
          alert(err.message || t('chat.sendFail'));
        }
      }

      /* ===================== CHATDA MEDIA YUBORISH (rasm/video/fayl) ===================== */
      async function uploadChatMedia(file, type, extra) {
        if (!CHAT_WITH) return;
        if (IS_GUEST) { openGateModal(); return; }
        extra = extra || {};
        const list = $('#chatMessagesList');
        const empty = list.querySelector('.comments-empty');
        if (empty) list.innerHTML = '';
        const tempId = 'tmp' + Date.now() + Math.random().toString(36).slice(2, 7);
        list.insertAdjacentHTML('beforeend', `
      <div class="chat-bubble-row me" id="${tempId}">
        <div class="chat-bubble chat-bubble-uploading"><div class="feed-spinner" style="width:18px;height:18px;margin:0;border-width:2px;"></div></div>
      </div>`);
        list.scrollTop = list.scrollHeight;

        const fd = new FormData();
        // MUHIM: 'type' maydoni 'file' maydonidan oldin qo'shilishi kerak
        // (server shu tartibga tayanadi — qarang: server.js chatUpload fileFilter)
        fd.append('type', type);
        if (extra.duration) fd.append('duration', String(extra.duration));
        if (type === 'file') fd.append('fileName', file.name);
        fd.append('file', file);

        try {
          const data = await api('/api/conversations/' + encodeURIComponent(CHAT_WITH) + '/messages/media', { method: 'POST', body: fd });
          const el = document.getElementById(tempId);
          if (el) el.remove();
          list.insertAdjacentHTML('beforeend', chatBubbleHTML(data.message));
          bindVoicePlayers(list);
          bindCircleVideos(list);
          list.scrollTop = list.scrollHeight;
          loadConversations().catch(() => {});
        } catch (err) {
          const el = document.getElementById(tempId);
          if (el) el.remove();
          alert(err.message || t('chat.mediaSendFail'));
        }
      }

      /* ===================== OVOZLI / "KRUJOK" VIDEO XABARLARNI YOZIB OLISH =====================
         Mikrofon (yoki old kamera) tugmasi bosilganda yozib olish boshlanadi;
         pastdagi panelda "Yuborish" yoki "Bekor qilish" tugmalari orqali
         yakunlanadi. */
      let chatMediaRecorder = null;
      let chatRecordedChunks = [];
      let chatRecordStream = null;
      let chatRecordType = null;   // 'voice' | 'circle'
      let chatRecordStartAt = 0;
      let chatRecordTimer = null;
      let chatRecordingActive = false;
      let chatRecordToken = 0; // ruxsat so'rovi kutilayotganda foydalanuvchi bekor qilsa/qayta bossa, eskirgan natijani e'tiborsiz qoldirish uchun

      function bindRecordButton(btn, kind) {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          startChatRecording(kind);
        });
      }

      async function startChatRecording(kind) {
        if (chatRecordingActive) return;
        if (IS_GUEST) { openGateModal(); return; }
        if (!CHAT_WITH) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
          alert(t('chat.micDenied'));
          return;
        }

        // Darhol "band" deb belgilaymiz, shu bilan tugma tez-tez bosilsa ham
        // bir nechta ruxsat so'rovi yuborilmaydi. Panel ham darhol ko'rinadi,
        // ruxsat kutilayotganda ham foydalanuvchi "bekor qilish"ni bosa oladi.
        chatRecordingActive = true;
        chatRecordType = kind;
        const myToken = ++chatRecordToken;
        $('#chatForm').classList.add('hidden');
        $('#chatRecordingBar').classList.remove('hidden');
        $('#chatRecordingTime').textContent = '0:00';
        $('#chatRecordingHint').textContent = kind === 'circle' ? t('chat.recordingCircle') : t('chat.recordingVoice');

        const constraints = kind === 'voice'
          ? { audio: true }
          : { audio: true, video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } } };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          if (myToken === chatRecordToken) {
            chatRecordingActive = false;
            hideChatRecordingBar();
            alert(t('chat.micDenied'));
          }
          return;
        }
        // Ruxsat kelguncha foydalanuvchi bekor qilgan yoki chatdan chiqib ketgan
        // bo'lsa — bu oqimni darhol to'xtatamiz, hech narsa yozib olinmaydi.
        if (myToken !== chatRecordToken) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }

        chatRecordStream = stream;
        chatRecordedChunks = [];
        let mime = '';
        if (kind === 'voice') {
          mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        } else {
          mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
        }
        try {
          chatMediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        } catch (e) {
          chatMediaRecorder = new MediaRecorder(stream);
        }
        chatMediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chatRecordedChunks.push(e.data); };
        chatMediaRecorder.start();
        chatRecordStartAt = Date.now();
        chatRecordTimer = setInterval(() => {
          const sec = Math.floor((Date.now() - chatRecordStartAt) / 1000);
          $('#chatRecordingTime').textContent = fmtCallDuration(sec);
          const limit = kind === 'circle' ? 60 : 300;
          if (sec >= limit) stopChatRecording(true);
        }, 200);
      }

      function hideChatRecordingBar() {
        chatRecordingActive = false;
        chatRecordType = null;
        $('#chatForm').classList.remove('hidden');
        $('#chatRecordingBar').classList.add('hidden');
        $('#chatRecordingTime').textContent = '0:00';
      }

      function stopChatRecording(send) {
        chatRecordToken++; // kutilayotgan har qanday ruxsat so'rovini ham bekor qilamiz
        if (!chatMediaRecorder) { hideChatRecordingBar(); return; }
        clearInterval(chatRecordTimer);
        const kind = chatRecordType;
        const startedAt = chatRecordStartAt;
        const rec = chatMediaRecorder;
        const stream = chatRecordStream;
        const chunks = chatRecordedChunks;
        chatMediaRecorder = null;
        rec.onstop = async () => {
          if (stream) stream.getTracks().forEach((tr) => tr.stop());
          const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
          hideChatRecordingBar();
          if (send && chunks.length) {
            // MUHIM: rec.mimeType ko'pincha kodek parametri bilan keladi,
            // masalan "video/webm;codecs=vp9,opus" — bunda VERGUL bor.
            // Ba'zi serverlar (jumladan bizniki, busboy orqali) bunday
            // vergulli Content-Type qiymatini to'g'ri tahlil qilolmay,
            // uni "text/plain"ga aylantirib qo'yadi — natijada video/ovozli
            // xabar serverda "noma'lum fayl turi" sifatida rad etilardi.
            // Serverga faylning ASOSIY turi (masalan "video/webm") kifoya,
            // kodek nomi kerak emas — shu sabab bu yerda ";" dan keyingi
            // qism butunlay olib tashlanadi.
            const rawType = rec.mimeType || (kind === 'voice' ? 'audio/webm' : 'video/webm');
            const cleanType = rawType.split(';')[0].trim() || (kind === 'voice' ? 'audio/webm' : 'video/webm');
            const blob = new Blob(chunks, { type: cleanType });
            const fname = (kind === 'voice' ? 'voice_' : 'circle_') + Date.now() + '.webm';
            const file = new File([blob], fname, { type: blob.type });
            await uploadChatMedia(file, kind, { duration: durationSec });
          }
        };
        try { rec.stop(); } catch (e) { hideChatRecordingBar(); }
      }

      function cancelChatRecording() {
        chatRecordToken++; // ruxsat kutilayotgan bo'lsa ham shu yerda to'xtatiladi
        if (!chatMediaRecorder) { hideChatRecordingBar(); return; }
        clearInterval(chatRecordTimer);
        const rec = chatMediaRecorder;
        const stream = chatRecordStream;
        chatMediaRecorder = null;
        rec.onstop = () => { if (stream) stream.getTracks().forEach((tr) => tr.stop()); };
        try { rec.stop(); } catch (e) {}
        hideChatRecordingBar();
      }

      function prependToFeed(work) {
        const item = {
          id: work.id,
          title: work.title,
          type: work.type,
          status: work.status,
          price: work.price,
          currency: work.currency,
          desc: work.desc,
          image: work.image,
          images: workImages(work),
          video: work.video || null,
          poster: work.poster || null,
          mediaType: work.mediaType || (work.video ? 'video' : 'image'),
          createdAt: work.createdAt,
          username: CURRENT_USER.username,
          fullname: CURRENT_USER.fullname || CURRENT_USER.username,
          avatar: CURRENT_USER.avatar || null,
          likesCount: 0,
          likedByMe: false,
          inCart: false,
          commentsCount: 0
        };
        FEED.unshift(item);
        indexItems([item]);
        feedOffset += 1;
        const list = $('#feedList');
        const emptyState = list.querySelector('.empty-state');
        if (emptyState) list.innerHTML = '';
        const frag = document.createElement('div');
        frag.innerHTML = feedCardHTML(item);
        const card = frag.firstElementChild;
        list.insertBefore(card, list.firstChild);
        bindFeedCardEvents(card);
        card.classList.add('reveal');
      }

      /* ===================== UPLOAD ===================== */
      function openUploadModal() {
        $('#uploadForm').reset();
        uploadMediaItems.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
        uploadMediaItems = [];
        renderUploadPreview();
        $('#priceField').classList.toggle('hidden', $('#workStatus').value !== 'sale');
        $('#workTypeOther').classList.add('hidden');
        $('#workTypeOther').required = false;
        $('#workStockQty').classList.remove('hidden');
        $('#uploadError').classList.remove('show');
        $('#uploadModal').classList.add('open');
      }
      function closeUploadModal() { $('#uploadModal').classList.remove('open'); }

      /* Joriy tanlovda video bormi — bo'lsa, boshqa fayl qo'shib bo'lmaydi */
      function uploadHasVideo() { return uploadMediaItems.some(item => item.type === 'video'); }

      function renderUploadPreview() {
        const wrap = $('#uploadMultiPreview');
        const dropText = $('#uploadDropText');
        const fileInput = $('#uploadFile');

        if (!uploadMediaItems.length) {
          wrap.classList.add('hidden');
          wrap.innerHTML = '';
          dropText.textContent = t('upload.dropDefault');
          fileInput.disabled = false;
          return;
        }

        wrap.classList.remove('hidden');
        wrap.innerHTML = uploadMediaItems.map((item, i) => `
          <div class="thumb">
            ${item.type === 'video'
              ? `<video src="${item.previewUrl}" muted playsinline preload="metadata"></video><span class="thumb-video-badge">${videoIconSVG()}</span>`
              : `<img src="${item.previewUrl}" alt="">`}
            <button type="button" class="remove-thumb" data-idx="${i}" aria-label="${t('upload.removeAria')}">✕</button>
          </div>`).join('') +
          (!uploadHasVideo() && uploadMediaItems.length < MAX_UPLOAD_IMAGES
            ? `<div class="thumb empty">+</div>`.repeat(MAX_UPLOAD_IMAGES - uploadMediaItems.length)
            : '');

        wrap.querySelectorAll('.remove-thumb').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = Number(btn.dataset.idx);
            const [removed] = uploadMediaItems.splice(idx, 1);
            if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            renderUploadPreview();
          });
        });

        if (uploadHasVideo()) {
          dropText.textContent = t('upload.dropFull');
          fileInput.disabled = true;
        } else {
          dropText.textContent = uploadMediaItems.length < MAX_UPLOAD_IMAGES
            ? t('upload.dropChosen', { n: uploadMediaItems.length, max: MAX_UPLOAD_IMAGES })
            : t('upload.dropFull');
          // to'liq bo'lganda inputni bosish orqali qayta ochilmasin (foydalanuvchi avval o'chirsin)
          fileInput.disabled = uploadMediaItems.length >= MAX_UPLOAD_IMAGES;
        }
      }

      function resizeToBlob(file) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1600; // backend stores real files, so we can keep more detail than the old base64 approach
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
                else { width = Math.round(width * maxDim / height); height = maxDim; }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width; canvas.height = height;
              canvas.getContext('2d').drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      /* Videoning davomiyligini brauzerda o'qiydi (soniyalarda).
         Aniqlab bo'lmasa (masalan format qo'llab-quvvatlanmasa) null qaytaradi. */
      function readVideoDuration(file) {
        return new Promise((resolve) => {
          const url = URL.createObjectURL(file);
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          videoEl.onloadedmetadata = () => {
            const dur = isFinite(videoEl.duration) ? videoEl.duration : null;
            URL.revokeObjectURL(url);
            resolve(dur);
          };
          videoEl.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
          videoEl.src = url;
        });
      }

      async function handleFileSelect(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const errEl = $('#uploadError');
        errEl.classList.remove('show');

        // Bitta video tanlangan bo'lsa — u yagona fayl bo'lishi kerak
        const videoFile = files.find(f => f.type.startsWith('video/'));
        if (videoFile) {
          if (files.length > 1 || uploadMediaItems.length) {
            errEl.textContent = t('upload.errVideoWithImages');
            errEl.classList.add('show');
            e.target.value = '';
            return;
          }
          const duration = await readVideoDuration(videoFile);
          if (duration !== null && duration > MAX_UPLOAD_VIDEO_SECONDS + 0.5) {
            errEl.textContent = t('upload.errVideoTooLong');
            errEl.classList.add('show');
            e.target.value = '';
            return;
          }
          // duration === null: brauzer darhol o'qiy olmadi (masalan noodatiy kodek) —
          // baribir yuklashga ruxsat beramiz, chunki server tomonida ham
          // davomiylik qat'iy tekshiriladi (yakuniy hakam — server)
          uploadMediaItems = [{ type: 'video', blob: videoFile, previewUrl: URL.createObjectURL(videoFile) }];
          renderUploadPreview();
          e.target.value = '';
          return;
        }

        if (uploadHasVideo()) {
          errEl.textContent = t('upload.errVideoWithImages');
          errEl.classList.add('show');
          e.target.value = '';
          return;
        }

        const room = MAX_UPLOAD_IMAGES - uploadMediaItems.length;
        const chosen = files.slice(0, room);
        const blobs = await Promise.all(chosen.map(resizeToBlob));
        uploadMediaItems.push(...blobs.map(blob => ({ type: 'image', blob, previewUrl: URL.createObjectURL(blob) })));
        renderUploadPreview();
        e.target.value = ''; // xuddi shu fayllarni qayta tanlash imkonini saqlab qolish
      }

      async function handleUploadSubmit(e) {
        e.preventDefault();
        const errEl = $('#uploadError');
        errEl.classList.remove('show');
        if (!uploadMediaItems.length) {
          errEl.textContent = t('upload.errNoImage');
          errEl.classList.add('show');
          return;
        }
        const fd = new FormData();
        uploadMediaItems.forEach((item, i) => {
          if (item.type === 'video') {
            const ext = (item.blob.name && item.blob.name.match(/\.\w+$/)) ? item.blob.name.match(/\.\w+$/)[0] : '.mp4';
            fd.append('images', item.blob, `asar-video${ext}`);
          } else {
            fd.append('images', item.blob, `asar-${i + 1}.jpg`);
          }
        });
        fd.append('title', $('#workTitle').value.trim());
        fd.append('type', $('#workType').value);
        fd.append('typeCustom', $('#workType').value === 'boshqa' ? $('#workTypeOther').value.trim() : '');
        fd.append('status', $('#workStatus').value);
        fd.append('price', $('#workStatus').value === 'sale' ? (Number($('#workPrice').value) || 0) : 0);
        fd.append('currency', $('#workCurrency').value);
        fd.append('stockMode', $('#stockModeOrder').checked ? 'order' : 'fixed');
        fd.append('stockQty', $('#workStockQty').value);
        fd.append('desc', $('#workDesc').value.trim());
        try {
          const data = await api('/api/works', { method: 'POST', body: fd });
          WORKS.push(data.work);
          closeUploadModal();
          renderGrids();
          renderProfileHeader();
          prependToFeed(data.work);
        } catch (err) {
          errEl.textContent = err.message || t('upload.errGeneric');
          errEl.classList.add('show');
        }
      }

      /* ===================== LIGHTBOX ===================== */
      let LIGHTBOX_IMAGES = [];

      function openLightbox(id, sourceWorks) {
        const list = sourceWorks || WORKS;
        const w = list.find(x => x.id === id);
        if (!w) return;
        const isMine = list === WORKS;
        pendingDeleteId = isMine ? id : null;
        $('#deleteWorkBtn').classList.toggle('hidden', !isMine);
        $('#editStatusBtn').classList.toggle('hidden', !isMine);
        closeStatusEditor();
        LIGHTBOX_IMAGES = workImages(w);
        $('#lightboxImg').innerHTML = collageHTML(LIGHTBOX_IMAGES, w.title, w.video, w.poster);
        $('#lightboxImg').className = 'lightbox-collage';
        if (w.video) {
          const videoEl = $('#lightboxImg').querySelector('video');
          if (videoEl) { videoEl.controls = true; videoEl.loop = false; }
        }
        $('#lightboxTitle').textContent = w.title;
        $('#lightboxDesc').textContent = w.desc || t('lightbox.noDesc');
        $('#lightboxType').textContent = typeLabel(w);
        $('#lightboxStatus').textContent = w.status === 'sale' ? (w.price ? fmtPrice(w.price, w.currency) : t('feed.sale')) : t('upload.status.expo');
        $('#lightboxDate').textContent = fmtDate(w.createdAt);
        const stockChip = $('#lightboxStock');
        if (w.status === 'sale' && w.stockMode) {
          stockChip.textContent = w.stockMode === 'order'
            ? t('stock.order')
            : (typeof w.stockQty === 'number' ? (w.stockQty <= 0 ? t('stock.out') : t('stock.left', { n: w.stockQty })) : '');
          stockChip.classList.toggle('hidden', !stockChip.textContent);
        } else {
          stockChip.classList.add('hidden');
        }
        $('#lightbox').classList.add('open');
        api('/api/works/' + id + '/view', { method: 'POST' }).then(res => {
          w.views = res.viewsCount;
        }).catch(() => {});
      }
      function closeLightbox() {
        $('#lightbox').classList.remove('open');
        pendingDeleteId = null;
        $('#deleteWorkBtn').classList.remove('hidden');
        closeStatusEditor();
      }

      function openStatusEditor() {
        if (!pendingDeleteId) return;
        const w = WORKS.find(x => x.id === pendingDeleteId);
        if (!w) return;
        $('#lightboxStatusSelect').value = w.status === 'sale' ? 'sale' : 'expo';
        $('#lightboxPriceInput').value = w.price || '';
        $('#lightboxPriceField').classList.toggle('hidden', w.status !== 'sale');
        $('#editStatusMsg').textContent = '';
        $('#editStatusForm').classList.remove('hidden');
      }

      function closeStatusEditor() {
        $('#editStatusForm').classList.add('hidden');
        $('#editStatusMsg').textContent = '';
      }

      async function handleSaveStatus() {
        if (!pendingDeleteId) return;
        const status = $('#lightboxStatusSelect').value;
        const price = $('#lightboxPriceInput').value;
        const msgEl = $('#editStatusMsg');
        msgEl.textContent = '';
        try {
          const data = await apiJSON('/api/works/' + pendingDeleteId + '/status', 'PATCH', { status, price });
          const updated = data.work;
          const wIdx = WORKS.findIndex(x => x.id === pendingDeleteId);
          if (wIdx !== -1) WORKS[wIdx] = { ...WORKS[wIdx], ...updated };
          const fIdx = FEED.findIndex(x => x.id === pendingDeleteId);
          if (fIdx !== -1) FEED[fIdx] = { ...FEED[fIdx], ...updated };
          $('#lightboxStatus').textContent = updated.status === 'sale' ? (updated.price ? fmtPrice(updated.price, updated.currency) : t('feed.sale')) : t('upload.status.expo');
          closeStatusEditor();
          renderGrids();
        } catch (e) {
          msgEl.textContent = (e && e.message) || t('upload.errGeneric');
        }
      }


      /* ===================== TO'LIQ HAJMDAGI RASM KO'RUVCHI ===================== */
      let IMAGE_VIEWER_IMAGES = [];
      let IMAGE_VIEWER_INDEX = 0;

      function openImageViewer(images, index) {
        if (!images || !images.length) return;
        IMAGE_VIEWER_IMAGES = images;
        IMAGE_VIEWER_INDEX = Math.max(0, Math.min(index || 0, images.length - 1));
        renderImageViewer();
        $('#imageViewerModal').classList.add('open');
      }
      function renderImageViewer() {
        $('#imageViewerImg').src = IMAGE_VIEWER_IMAGES[IMAGE_VIEWER_INDEX];
        const multi = IMAGE_VIEWER_IMAGES.length > 1;
        $('#imageViewerPrev').classList.toggle('hidden', !multi);
        $('#imageViewerNext').classList.toggle('hidden', !multi);
        $('#imageViewerCounter').classList.toggle('hidden', !multi);
        if (multi) $('#imageViewerCounter').textContent = (IMAGE_VIEWER_INDEX + 1) + ' / ' + IMAGE_VIEWER_IMAGES.length;
      }
      function closeImageViewer() { $('#imageViewerModal').classList.remove('open'); }
      function imageViewerStep(delta) {
        if (!IMAGE_VIEWER_IMAGES.length) return;
        IMAGE_VIEWER_INDEX = (IMAGE_VIEWER_INDEX + delta + IMAGE_VIEWER_IMAGES.length) % IMAGE_VIEWER_IMAGES.length;
        renderImageViewer();
      }

      /* ===================== TO'LIQ HAJMDAGI VIDEO KO'RUVCHI ===================== */
      function openVideoViewer(src, poster, work) {
        if (!src) return;
        const v = $('#videoViewerVideo');
        v.poster = poster || '';
        v.src = src;
        const contactBtn = $('#videoViewerContactBtn');
        const canContact = work && work.status === 'sale' && (!CURRENT_USER || work.username !== CURRENT_USER.username);
        if (canContact) {
          contactBtn.innerHTML = `${messageIconSVG()}<span>${t('feed.contactLabel')}</span>`;
          contactBtn.setAttribute('aria-label', t('feed.contactAria'));
          contactBtn.classList.remove('hidden');
          contactBtn.onclick = guarded(() => openChat(work.username, { id: work.id, title: work.title }));
        } else {
          contactBtn.classList.add('hidden');
          contactBtn.onclick = null;
        }
        $('#videoViewerModal').classList.add('open');
      }
      function closeVideoViewer() {
        $('#videoViewerModal').classList.remove('open');
        const v = $('#videoViewerVideo');
        v.pause();
        v.src = '';
        v.removeAttribute('poster');
      }

      async function handleDeleteWork() {
        if (!pendingDeleteId) return;
        try {
          await api('/api/works/' + pendingDeleteId, { method: 'DELETE' });
          WORKS = WORKS.filter(w => w.id !== pendingDeleteId);
          FEED = FEED.filter(w => w.id !== pendingDeleteId);
          const feedCard = document.querySelector(`.feed-card[data-id="${pendingDeleteId}"]`);
          if (feedCard) feedCard.remove();
          closeLightbox();
          renderGrids();
          renderProfileHeader();
        } catch (e) {
          closeLightbox();
        }
      }

      init();
    })();
