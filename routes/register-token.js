// const express = require('express');
// const router = express.Router();
// const { v4: uuidv4 } = require('uuid');
// const tokenStore = require('../utils/tokenStore.js');

// router.get('/register-token', (req, res) => {
//   const token = uuidv4();
//   tokenStore.addToken(token);
//   res.status(200).json({ token });
// });

// router.post('/register-token', (req, res) => {
//   const token = uuidv4();
//   tokenStore.addToken(token);
//   res.status(200).json({ token });
// });

module.exports = router;
