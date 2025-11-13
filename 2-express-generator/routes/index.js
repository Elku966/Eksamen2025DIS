
var express = require('express');
var path = require('path');          // 👈 tilføj
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // Send den statiske HTML-fil fra /public
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;

