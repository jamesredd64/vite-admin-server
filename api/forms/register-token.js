const { v4: uuidv4 } = require('uuid');
const tokenStore = require('../../utils/tokenStore.js');

function handler(req, res) {
  if (req.method === 'GET' || req.method === 'POST') {
    const token = uuidv4();
    tokenStore.addToken(token);
    res.status(200).json({ token });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

module.exports = handler;

