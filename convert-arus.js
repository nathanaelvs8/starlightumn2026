/**
 * Bikin ulang garis arus Mini Gerda (public/images/mini-gerda/arus.webp)
 * dari PNG aslinya, RESOLUSI PENUH.
 *
 * Jalanin: node convert-arus.js
 *
 * Kenapa resolusi penuh: arusnya dipasang 300% lebar layar di laptop
 * (ZOOM di src/lib/gerdaLayout.ts) dan 600% di HP (ZOOM_HP). Waktu
 * diubah ke WebP tanggal 5 Sep (commit 7b5c62a), gambarnya ikut dikecilin
 * ke 1920px — jadi di layar ditarik 2-3x lebih gede dari aslinya dan
 * garisnya blur. Sekarang lebarnya tetap 4926px (sama kayak ARUS_RATIO).
 *
 * PNG aslinya udah dihapus dari folder, jadi diambil dari riwayat git
 * (commit terakhir yang masih punya arus.png).
 */

const { execSync } = require("child_process");
const sharp = require("sharp");

const COMMIT_ASLI = "917aadf";
const OUT = "public/images/mini-gerda/arus.webp";

(async () => {
  const png = execSync(`git show ${COMMIT_ASLI}:public/images/mini-gerda/arus.png`, {
    maxBuffer: 64 * 1024 * 1024,
  });
  const meta = await sharp(png).metadata();
  await sharp(png).webp({ quality: 80, alphaQuality: 85 }).toFile(OUT);
  const hasil = await sharp(OUT).metadata();
  console.log(`${OUT}  ${meta.width}x${meta.height} → ${hasil.width}x${hasil.height}`);
})();
