const express = require('express');
const path = require('path');

// Adjust path to point to public directory in project root
const staticMiddleware = express.static(path.join(__dirname, '../public'));

module.exports = staticMiddleware;
