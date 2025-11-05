var express = require('express');
var path = require('path');
var router = express.Router();

// Brug __dirname korrekt til at pege på checkout.html i /public
router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html'));
});

module.exports = router;