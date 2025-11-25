// routes/gennemfoert.js
const express = require('express');
const path = require('path');
const router = express.Router();

// GET /gennemfoert → takkeside
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;
