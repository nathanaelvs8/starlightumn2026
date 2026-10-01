/**
 * Rasi bintang, hasil convert-rasi.js dari public/images/division/bintang.webp.
 * JANGAN diedit tangan — ganti gambarnya, terus jalanin ulang scriptnya.
 *
 * Tiap rasi:
 *   x, y, w, h  kotaknya di gambar asli (1920x682)
 *   bintang     [x, y, jenis] relatif ke pojok kiri-atas kotak;
 *               jenis 0 = bintang, 1 = bintang paling nyala,
 *               2 = titik sambungan (garis ketemu garis) — nggak digambar
 *   garis       [indeks bintang, indeks bintang], urut dari kiri
 *               merambat ke tetangga — urutan waktu digambar
 */
export type Rasi = {
  x: number;
  y: number;
  w: number;
  h: number;
  bintang: [number, number, number][];
  garis: [number, number][];
};

export const RASI: Rasi[] = [{"x":122,"y":447,"w":78,"h":121,"bintang":[[10,0,1],[0,121,0],[42,57,0],[78,11,0]],"garis":[[1,0],[0,2],[2,3]]},{"x":319,"y":177,"w":95,"h":106,"bintang":[[56,99,1],[19,106,0],[0,29,0],[95,57,0],[58,27,0],[28,0,0]],"garis":[[2,5],[5,1],[5,4],[1,0],[4,0],[4,3]]},{"x":496,"y":421,"w":84,"h":146,"bintang":[[0,51,0],[24,36,0],[64,54,0],[27,74,0],[0,0,0],[2,74,0],[84,146,0]],"garis":[[0,3],[0,4],[0,5],[3,1],[4,1],[5,6],[6,2]]},{"x":633,"y":89,"w":54,"h":108,"bintang":[[0,29,0],[54,108,0],[19,107,0],[25,0,0],[51,28,0]],"garis":[[0,2],[0,3],[2,4],[3,4],[4,1]]},{"x":782,"y":316,"w":92,"h":145,"bintang":[[20,18,1],[39,84,1],[0,145,0],[92,0,0]],"garis":[[2,0],[0,1],[1,3]]},{"x":1115,"y":486,"w":68,"h":88,"bintang":[[29,48,0],[68,88,0],[0,18,0],[58,0,0]],"garis":[[2,0],[0,1],[0,3],[1,3]]},{"x":1152,"y":244,"w":78,"h":63,"bintang":[[1,0,1],[0,28,1],[78,4,0],[60,24,0],[18,63,0]],"garis":[[1,0],[1,3],[1,4],[3,2],[3,4]]},{"x":1426,"y":99,"w":55,"h":129,"bintang":[[30,0,0],[0,101,0],[22,129,0],[55,88,0]],"garis":[[1,0],[1,2],[0,3],[2,3]]},{"x":1515,"y":462,"w":56,"h":90,"bintang":[[53,90,1],[56,63,1],[0,0,0],[29,46,0],[30,2,0]],"garis":[[2,3],[3,1],[3,4],[1,0]]},{"x":1695,"y":315,"w":66,"h":69,"bintang":[[66,12,0],[14,69,0],[0,0,0],[36,44,2]],"garis":[[2,1],[2,3],[1,3],[3,0]]}];
