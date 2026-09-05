const sharp = require("sharp");

sharp("public/images/home/band-1-hero.png")
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile("public/images/home/band-1-hero.webp")
  .then(() => console.log("ok"))
  .catch((e) => console.log("GAGAL", e.message));