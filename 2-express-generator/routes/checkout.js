var express = require('express');
var path = require('path');
var router = express.Router();

// /checkout → viser checkout.html
router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

// /checkout/gennemfoert → viser gennemfoert.html
router.get('/gennemfoert', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;