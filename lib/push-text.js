/**
 * lib/push-text.js — push-bildirishnomalar uchun 7 tilli matnlar va ularni
 * tayyorlovchi funksiyalar (server.js'dan ajratildi).
 *
 * Bu yerdagi hammasi TOZA (pure): faqat argument (notif/lang/status) qabul
 * qilib, tayyor matn qaytaradi — `db`ga yoki tarmoqqa MUTLAQO bog'liq emas.
 * Haqiqiy yuborish (`sendPush`, webpush chaqiruvi, obunalarni o'chirish va h.k.)
 * hamon server.js'da qoladi, chunki u `db`ga bog'liq holat bilan ishlaydi.
 */

const PUSH_I18N = {
  uz: {
    someone: 'Foydalanuvchi',
    orderReceivedTitle: 'Yangi buyurtma',
    orderReceivedBody: (n) => `Sizga ${n.itemsCount || 1} ta mahsulot uchun yangi buyurtma tushdi`,
    orderPlacedTitle: 'Buyurtma qabul qilindi',
    orderPlacedBody: 'Buyurtmangiz muvaffaqiyatli rasmiylashtirildi',
    orderStatusTitle: 'Buyurtma holati yangilandi',
    orderStatus: { confirmed: 'Sotuvchi buyurtmangizni tasdiqladi', shipped: "Buyurtmangiz jo'natildi", completed: 'Buyurtmangiz yakunlandi', cancelled: 'Buyurtmangiz bekor qilindi', default: (s) => 'Buyurtmangiz holati yangilandi: ' + s },
    banTitle: 'Hisobingiz bloklandi', banBodyDefault: 'Hisobingiz vaqtincha bloklandi',
    unbanTitle: 'Hisobingiz tiklandi', unbanBody: 'Blok bekor qilindi, endi tizimga kirishingiz mumkin',
    muteTitle: 'Vaqtincha cheklov', muteBodyDefault: 'Komment/xabar yozish vaqtincha cheklandi',
    unmuteTitle: 'Cheklov bekor qilindi', unmuteBody: 'Endi komment/xabar yozishingiz mumkin',
    followTitle: 'Yangi obunachi', followBody: (n) => `${n} sizga obuna bo'ldi`,
    likeTitle: 'Yangi like', likeBody: (n, t) => `${n} "${t}" asaringizni yoqtirdi`,
    commentTitle: 'Yangi komment', commentBody: (n, t) => `${n} "${t}" asaringizga izoh qoldirdi`,
    reviewTitle: 'Yangi sharh', reviewBody: (n, t, r) => `${n} "${t}" asaringizga ${r}★ baho bilan sharh qoldirdi`,
    resetEmailSubject: 'Parolni tiklash — Madein.net',
    resetEmailBody: "Parolingizni tiklash uchun so'rov yubordingiz. Yangi parol o'rnatish uchun quyidagi havolani bosing:",
    resetEmailExpiry: 'Havola 1 soat davomida amal qiladi. Agar bu so\'rovni siz yubormagan bo\'lsangiz, bu xatni e\'tiborsiz qoldiring.',
    mediaLabels: { photo: 'Rasm', video: 'Video', circle: 'Video xabar', voice: 'Ovozli xabar', file: 'Fayl', default: 'Xabar' }
  },
  en: {
    someone: 'Someone',
    orderReceivedTitle: 'New order',
    orderReceivedBody: (n) => `You received a new order for ${n.itemsCount || 1} item(s)`,
    orderPlacedTitle: 'Order placed',
    orderPlacedBody: 'Your order was placed successfully',
    orderStatusTitle: 'Order status updated',
    orderStatus: { confirmed: 'The seller confirmed your order', shipped: 'Your order has shipped', completed: 'Your order is complete', cancelled: 'Your order was cancelled', default: (s) => 'Your order status changed: ' + s },
    banTitle: 'Your account was banned', banBodyDefault: 'Your account has been temporarily banned',
    unbanTitle: 'Your account was restored', unbanBody: 'The ban was lifted, you can log in now',
    muteTitle: 'Temporary restriction', muteBodyDefault: 'Posting comments/messages has been temporarily restricted',
    unmuteTitle: 'Restriction lifted', unmuteBody: 'You can now post comments/messages again',
    followTitle: 'New follower', followBody: (n) => `${n} started following you`,
    likeTitle: 'New like', likeBody: (n, t) => `${n} liked your work "${t}"`,
    commentTitle: 'New comment', commentBody: (n, t) => `${n} commented on your work "${t}"`,
    reviewTitle: 'New review', reviewBody: (n, t, r) => `${n} left a ${r}★ review on your work "${t}"`,
    resetEmailSubject: 'Password reset — Madein.net',
    resetEmailBody: 'You requested a password reset. Click the link below to set a new password:',
    resetEmailExpiry: 'This link is valid for 1 hour. If you did not request this, you can ignore this email.',
    mediaLabels: { photo: 'Photo', video: 'Video', circle: 'Video message', voice: 'Voice message', file: 'File', default: 'Message' }
  },
  zh: {
    someone: '有人',
    orderReceivedTitle: '新订单',
    orderReceivedBody: (n) => `您收到了 ${n.itemsCount || 1} 件商品的新订单`,
    orderPlacedTitle: '订单已提交',
    orderPlacedBody: '您的订单已成功提交',
    orderStatusTitle: '订单状态已更新',
    orderStatus: { confirmed: '卖家已确认您的订单', shipped: '您的订单已发货', completed: '您的订单已完成', cancelled: '您的订单已取消', default: (s) => '您的订单状态已更新：' + s },
    banTitle: '您的账户已被封禁', banBodyDefault: '您的账户已被暂时封禁',
    unbanTitle: '您的账户已恢复', unbanBody: '封禁已解除，您现在可以登录',
    muteTitle: '临时限制', muteBodyDefault: '发表评论/消息的权限已被暂时限制',
    unmuteTitle: '限制已解除', unmuteBody: '您现在可以发表评论/消息了',
    followTitle: '新关注者', followBody: (n) => `${n} 关注了您`,
    likeTitle: '新点赞', likeBody: (n, t) => `${n} 点赞了您的作品《${t}》`,
    commentTitle: '新评论', commentBody: (n, t) => `${n} 评论了您的作品《${t}》`,
    reviewTitle: '新评价', reviewBody: (n, t, r) => `${n} 给您的作品《${t}》打了 ${r}★ 评价`,
    resetEmailSubject: '密码重置 — Madein.net',
    resetEmailBody: '您请求重置密码。请点击下面的链接设置新密码：',
    resetEmailExpiry: '此链接有效期为1小时。如果这不是您本人的请求，请忽略此邮件。',
    mediaLabels: { photo: '照片', video: '视频', circle: '视频消息', voice: '语音消息', file: '文件', default: '消息' }
  },
  hi: {
    someone: 'किसी ने',
    orderReceivedTitle: 'नया ऑर्डर',
    orderReceivedBody: (n) => `आपको ${n.itemsCount || 1} वस्तु(ओं) के लिए नया ऑर्डर मिला`,
    orderPlacedTitle: 'ऑर्डर दिया गया',
    orderPlacedBody: 'आपका ऑर्डर सफलतापूर्वक दिया गया',
    orderStatusTitle: 'ऑर्डर की स्थिति अपडेट हुई',
    orderStatus: { confirmed: 'विक्रेता ने आपके ऑर्डर की पुष्टि की', shipped: 'आपका ऑर्डर भेज दिया गया है', completed: 'आपका ऑर्डर पूरा हो गया', cancelled: 'आपका ऑर्डर रद्द कर दिया गया', default: (s) => 'आपके ऑर्डर की स्थिति बदल गई: ' + s },
    banTitle: 'आपका खाता प्रतिबंधित कर दिया गया', banBodyDefault: 'आपका खाता अस्थायी रूप से प्रतिबंधित है',
    unbanTitle: 'आपका खाता बहाल कर दिया गया', unbanBody: 'प्रतिबंध हटा दिया गया, अब आप लॉग इन कर सकते हैं',
    muteTitle: 'अस्थायी प्रतिबंध', muteBodyDefault: 'टिप्पणी/संदेश लिखना अस्थायी रूप से सीमित कर दिया गया है',
    unmuteTitle: 'प्रतिबंध हटाया गया', unmuteBody: 'अब आप फिर से टिप्पणी/संदेश लिख सकते हैं',
    followTitle: 'नया फ़ॉलोअर', followBody: (n) => `${n} ने आपको फ़ॉलो करना शुरू किया`,
    likeTitle: 'नया लाइक', likeBody: (n, t) => `${n} ने आपकी कृति "${t}" को पसंद किया`,
    commentTitle: 'नई टिप्पणी', commentBody: (n, t) => `${n} ने आपकी कृति "${t}" पर टिप्पणी की`,
    reviewTitle: 'नई समीक्षा', reviewBody: (n, t, r) => `${n} ने आपकी कृति "${t}" को ${r}★ रेटिंग दी`,
    resetEmailSubject: 'पासवर्ड रीसेट — Madein.net',
    resetEmailBody: 'आपने पासवर्ड रीसेट का अनुरोध किया है। नया पासवर्ड सेट करने के लिए नीचे दिए गए लिंक पर क्लिक करें:',
    resetEmailExpiry: 'यह लिंक 1 घंटे के लिए मान्य है। यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।',
    mediaLabels: { photo: 'फ़ोटो', video: 'वीडियो', circle: 'वीडियो संदेश', voice: 'ध्वनि संदेश', file: 'फ़ाइल', default: 'संदेश' }
  },
  es: {
    someone: 'Alguien',
    orderReceivedTitle: 'Nuevo pedido',
    orderReceivedBody: (n) => `Recibiste un nuevo pedido de ${n.itemsCount || 1} artículo(s)`,
    orderPlacedTitle: 'Pedido realizado',
    orderPlacedBody: 'Tu pedido se realizó con éxito',
    orderStatusTitle: 'Estado del pedido actualizado',
    orderStatus: { confirmed: 'El vendedor confirmó tu pedido', shipped: 'Tu pedido ha sido enviado', completed: 'Tu pedido se ha completado', cancelled: 'Tu pedido fue cancelado', default: (s) => 'El estado de tu pedido cambió: ' + s },
    banTitle: 'Tu cuenta fue suspendida', banBodyDefault: 'Tu cuenta ha sido suspendida temporalmente',
    unbanTitle: 'Tu cuenta fue restaurada', unbanBody: 'Se levantó la suspensión, ya puedes iniciar sesión',
    muteTitle: 'Restricción temporal', muteBodyDefault: 'Publicar comentarios/mensajes se ha restringido temporalmente',
    unmuteTitle: 'Restricción levantada', unmuteBody: 'Ya puedes publicar comentarios/mensajes de nuevo',
    followTitle: 'Nuevo seguidor', followBody: (n) => `${n} empezó a seguirte`,
    likeTitle: 'Nuevo me gusta', likeBody: (n, t) => `A ${n} le gustó tu obra "${t}"`,
    commentTitle: 'Nuevo comentario', commentBody: (n, t) => `${n} comentó en tu obra "${t}"`,
    reviewTitle: 'Nueva reseña', reviewBody: (n, t, r) => `${n} dejó una reseña de ${r}★ en tu obra "${t}"`,
    resetEmailSubject: 'Restablecer contraseña — Madein.net',
    resetEmailBody: 'Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace para establecer una nueva:',
    resetEmailExpiry: 'Este enlace es válido durante 1 hora. Si no solicitaste esto, puedes ignorar este correo.',
    mediaLabels: { photo: 'Foto', video: 'Video', circle: 'Mensaje de video', voice: 'Mensaje de voz', file: 'Archivo', default: 'Mensaje' }
  },
  ar: {
    someone: 'شخص ما',
    orderReceivedTitle: 'طلب جديد',
    orderReceivedBody: (n) => `تلقيت طلبًا جديدًا لـ ${n.itemsCount || 1} من العناصر`,
    orderPlacedTitle: 'تم تقديم الطلب',
    orderPlacedBody: 'تم تقديم طلبك بنجاح',
    orderStatusTitle: 'تم تحديث حالة الطلب',
    orderStatus: { confirmed: 'أكد البائع طلبك', shipped: 'تم شحن طلبك', completed: 'تم إكمال طلبك', cancelled: 'تم إلغاء طلبك', default: (s) => 'تم تحديث حالة طلبك: ' + s },
    banTitle: 'تم حظر حسابك', banBodyDefault: 'تم حظر حسابك مؤقتًا',
    unbanTitle: 'تمت استعادة حسابك', unbanBody: 'تم رفع الحظر، يمكنك الآن تسجيل الدخول',
    muteTitle: 'قيد مؤقت', muteBodyDefault: 'تم تقييد كتابة التعليقات/الرسائل مؤقتًا',
    unmuteTitle: 'تم رفع القيد', unmuteBody: 'يمكنك الآن كتابة التعليقات/الرسائل مجددًا',
    followTitle: 'متابع جديد', followBody: (n) => `بدأ ${n} بمتابعتك`,
    likeTitle: 'إعجاب جديد', likeBody: (n, t) => `أعجب ${n} بعملك "${t}"`,
    commentTitle: 'تعليق جديد', commentBody: (n, t) => `علّق ${n} على عملك "${t}"`,
    reviewTitle: 'تقييم جديد', reviewBody: (n, t, r) => `ترك ${n} تقييمًا ${r}★ على عملك "${t}"`,
    resetEmailSubject: 'إعادة تعيين كلمة المرور — Madein.net',
    resetEmailBody: 'لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط أدناه لتعيين كلمة مرور جديدة:',
    resetEmailExpiry: 'هذا الرابط صالح لمدة ساعة واحدة. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.',
    mediaLabels: { photo: 'صورة', video: 'فيديو', circle: 'رسالة فيديو', voice: 'رسالة صوتية', file: 'ملف', default: 'رسالة' }
  },
  ru: {
    someone: 'Кто-то',
    orderReceivedTitle: 'Новый заказ',
    orderReceivedBody: (n) => `Вам поступил новый заказ на ${n.itemsCount || 1} товар(ов)`,
    orderPlacedTitle: 'Заказ оформлен',
    orderPlacedBody: 'Ваш заказ успешно оформлен',
    orderStatusTitle: 'Статус заказа обновлён',
    orderStatus: { confirmed: 'Продавец подтвердил ваш заказ', shipped: 'Ваш заказ отправлен', completed: 'Ваш заказ завершён', cancelled: 'Ваш заказ отменён', default: (s) => 'Статус вашего заказа изменён: ' + s },
    banTitle: 'Ваш аккаунт заблокирован', banBodyDefault: 'Ваш аккаунт временно заблокирован',
    unbanTitle: 'Ваш аккаунт восстановлен', unbanBody: 'Блокировка снята, теперь вы можете войти',
    muteTitle: 'Временное ограничение', muteBodyDefault: 'Написание комментариев/сообщений временно ограничено',
    unmuteTitle: 'Ограничение снято', unmuteBody: 'Теперь вы снова можете писать комментарии/сообщения',
    followTitle: 'Новый подписчик', followBody: (n) => `${n} подписался(ась) на вас`,
    likeTitle: 'Новый лайк', likeBody: (n, t) => `${n} понравилась ваша работа «${t}»`,
    commentTitle: 'Новый комментарий', commentBody: (n, t) => `${n} прокомментировал(а) вашу работу «${t}»`,
    reviewTitle: 'Новый отзыв', reviewBody: (n, t, r) => `${n} оставил(а) отзыв ${r}★ на вашу работу «${t}»`,
    resetEmailSubject: 'Сброс пароля — Madein.net',
    resetEmailBody: 'Вы запросили сброс пароля. Перейдите по ссылке ниже, чтобы задать новый пароль:',
    resetEmailExpiry: 'Ссылка действительна 1 час. Если вы не запрашивали это, просто проигнорируйте это письмо.',
    mediaLabels: { photo: 'Фото', video: 'Видео', circle: 'Видеосообщение', voice: 'Голосовое сообщение', file: 'Файл', default: 'Сообщение' }
  }
};

function pushTextFor(lang) {
  return PUSH_I18N[lang] || PUSH_I18N.uz;
}

/* Bildirishnoma turiga qarab push xabarnoma matnini FOYDALANUVCHI TANLAGAN
   TILDA tayyorlaydi (u.lang — /api/language orqali saqlanadi, ro'yxatdan
   o'tishda ham boshlang'ich qiymat sifatida yuboriladi). */
function pushContentFor(notif, lang) {
  const T = pushTextFor(lang);
  const who = notif.from || T.someone;
  switch (notif.type) {
    case 'order-received':
      return { title: T.orderReceivedTitle, body: T.orderReceivedBody(notif), url: '/' };
    case 'order-placed':
      return { title: T.orderPlacedTitle, body: T.orderPlacedBody, url: '/' };
    case 'order-status':
      return { title: T.orderStatusTitle, body: orderStatusText(notif.status, lang), url: '/' };
    case 'ban':
      return { title: T.banTitle, body: notif.reason || T.banBodyDefault, url: '/' };
    case 'unban':
      return { title: T.unbanTitle, body: T.unbanBody, url: '/' };
    case 'mute':
      return { title: T.muteTitle, body: notif.reason || T.muteBodyDefault, url: '/' };
    case 'unmute':
      return { title: T.unmuteTitle, body: T.unmuteBody, url: '/' };
    case 'follow':
      return { title: T.followTitle, body: T.followBody(who), url: '/' };
    case 'like':
      return { title: T.likeTitle, body: T.likeBody(who, notif.workTitle || ''), url: '/' };
    case 'comment':
      return { title: T.commentTitle, body: T.commentBody(who, notif.workTitle || ''), url: '/' };
    case 'review':
      return { title: T.reviewTitle, body: T.reviewBody(who, notif.workTitle || '', notif.rating || ''), url: '/' };
    default:
      return null;
  }
}

function orderStatusText(status, lang) {
  const os = pushTextFor(lang).orderStatus;
  return os[status] || os.default(status);
}


module.exports = { PUSH_I18N, pushTextFor, pushContentFor, orderStatusText };
