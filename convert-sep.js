const sharp = require("sharp");

sharp("public/images/shared/separator-footer.png")
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 85 })
  .toFile("public/images/shared/separator-footer.webp")
  .then(() => console.log("ok"))
  .catch((e) => console.log("GAGAL", e.message));