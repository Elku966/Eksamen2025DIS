// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// GET /checkout → formular
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});