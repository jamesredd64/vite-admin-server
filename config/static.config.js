const path = require('path');

const staticConfig = {
  imagesDir: path.join(__dirname, '../public/images'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

module.exports = { staticConfig };