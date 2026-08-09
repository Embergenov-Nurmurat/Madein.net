/**
 * lib/media.js — fayl tizimi va video/rasm ishlov berish bilan bog'liq
 * funksiyalar (server.js'dan ajratildi).
 *
 * Bu yerdagi funksiyalar `db`ga MUTLAQO bog'liq emas — faqat fayl yo'llari
 * (path) bilan ishlaydi. `ffmpeg.setFfmpegPath()` server.js'da chaqiriladi;
 * fluent-ffmpeg modul keshi umumiy bo'lgani uchun bu yerga alohida
 * qo'shishning hojati yo'q — qaysi fayl birinchi require qilishidan
 * qat'iy nazar, sozlama umumiy singletonga ta'sir qiladi.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { detectImageSignature } = require('./utils');

/* Fayl HAQIQATDA rasmligini uning birinchi baytlaridan ("magic
   number"/signature) tekshiradi — mijoz yuborgan Content-Type sarlavhasi
   (mimetype) soxtalashtirilishi mumkin bo'lgani uchun, bu qo'shimcha,
   soxtalashtirib bo'lmaydigan tekshiruv qatlami hisoblanadi. */
function verifyImageFileOrDelete(filepath, declaredMime) {
  let fd;
  try {
    fd = fs.openSync(filepath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    const actual = detectImageSignature(buf);
    return actual !== null; // fayl ichidan haqiqatan ham tanilgan rasm signaturasi topildimi
  } catch (e) {
    return false;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch (e) {}
  }
}

/**
 * Yuklangan videoni (mov/hevc va h.k. bo'lishi mumkin) barcha brauzerlarda
 * ishlaydigan H.264/AAC MP4 formatiga qayta kodlaydi. iPhone'dan
 * "High Efficiency" sozlamasida yuklangan HEVC videolar Chrome/Firefox'da
 * dekodlanmay, ekran butunlay qora bo'lib qolishining oldini oladi.
 */
function transcodeVideoToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',       // eski/mobil dekoderlar bilan ham mos
        '-profile:v main',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',   // brauzerda tezroq boshlanishi uchun
        '-vf', "scale='min(1280,iw)':-2"
      ])
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .save(outputPath);
  });
}

/**
 * Video ichidan bitta kadrni JPEG "poster" rasm sifatida ajratib oladi —
 * shunda video hali yuklanmasdan/ijro etilmasdan oldin ham qora ekran
 * emas, balki haqiqiy kadr ko'rinadi (feed va profil kartochkalarida).
 */
function extractVideoPoster(inputPath, outputDir, filename) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .screenshots({
        timestamps: ['0.1'],
        filename,
        folder: outputDir,
        size: '640x?'
      });
  });
}

/* Video xabarni ("krujok") kvadrat shaklga markazdan kesib, keyin
   barcha brauzerlarda ishlaydigan H.264/AAC MP4 ga kodlaydi. Doira
   ko'rinishini interfeys taraf (CSS border-radius) hosil qiladi. */
function transcodeCircleVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-profile:v main',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=480:480"
      ])
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .save(outputPath);
  });
}

/**
 * MP4/MOV faylning davomiyligini (soniyalarda) ffmpeg'siz, faylning
 * ISO-BMFF "box" tuzilmasini o'qib chiqadi (moov > mvhd). Bu formatlar
 * (mp4, mov, m4v) bir xil konteyner tuzilmasidan foydalanadi.
 * Agar aniqlab bo'lmasa, null qaytaradi (chaqiruvchi tomon buni xatolik
 * sifatida emas, "tekshirib bo'lmadi" sifatida talqin qilishi kerak).
 */
function getMp4DurationSeconds(absPath) {
  try {
    const fd = fs.openSync(absPath, 'r');
    try {
      const fileSize = fs.fstatSync(fd).size;
      const headerBuf = Buffer.alloc(8);

      function findBox(startOffset, endOffset, targetType) {
        let offset = startOffset;
        while (offset + 8 <= endOffset) {
          fs.readSync(fd, headerBuf, 0, 8, offset);
          let size = headerBuf.readUInt32BE(0);
          const type = headerBuf.toString('ascii', 4, 8);
          let headerLen = 8;
          if (size === 1) {
            // 64-bit kengaytirilgan hajm
            const bigBuf = Buffer.alloc(8);
            fs.readSync(fd, bigBuf, 0, 8, offset + 8);
            size = Number(bigBuf.readBigUInt64BE(0));
            headerLen = 16;
          } else if (size === 0) {
            size = endOffset - offset; // oxirigacha
          }
          if (type === targetType) return { offset, size, headerLen };
          offset += size;
        }
        return null;
      }

      const moov = findBox(0, fileSize, 'moov');
      if (!moov) return null;
      const mvhd = findBox(moov.offset + moov.headerLen, moov.offset + moov.size, 'mvhd');
      if (!mvhd) return null;

      const bodyOffset = mvhd.offset + mvhd.headerLen;
      const versionBuf = Buffer.alloc(1);
      fs.readSync(fd, versionBuf, 0, 1, bodyOffset);
      const version = versionBuf[0];

      let timescale, duration;
      if (version === 1) {
        const buf = Buffer.alloc(28);
        fs.readSync(fd, buf, 0, 28, bodyOffset + 4);
        timescale = buf.readUInt32BE(16);
        duration = Number(buf.readBigUInt64BE(20));
      } else {
        const buf = Buffer.alloc(16);
        fs.readSync(fd, buf, 0, 16, bodyOffset + 4);
        timescale = buf.readUInt32BE(8);
        duration = buf.readUInt32BE(12);
      }
      if (!timescale) return null;
      return duration / timescale;
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    return null;
  }
}

/**
 * Yuklangan rasmni siqadi (katta rasmlarni kichraytiradi, JPEG sifatini
 * pasaytiradi) va lentada tez ko'rsatish uchun kichik "thumbnail" nusxasini
 * yaratadi. Asl fayl o'rniga siqilgan versiya yoziladi — disk va trafik
 * tejaladi, lekin sifat ko'zga sezilarli darajada pasaymaydi.
 */
async function compressAndThumbnail(absPath) {
  const ext = path.extname(absPath);
  const base = absPath.slice(0, -ext.length);
  const thumbPath = base + '-thumb.jpg';

  // Asl rasmni max 1600px eniga siqib, joyida qayta yozamiz
  const buf = await sharp(absPath)
    .rotate() // EXIF orientatsiyasini to'g'irlaydi
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(absPath, buf);

  // Lenta/kolleja uchun kichik nusxa
  await sharp(buf)
    .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(thumbPath);

  return path.basename(thumbPath);
}

module.exports = {
  verifyImageFileOrDelete,
  transcodeVideoToMp4,
  extractVideoPoster,
  transcodeCircleVideo,
  getMp4DurationSeconds,
  compressAndThumbnail
};
