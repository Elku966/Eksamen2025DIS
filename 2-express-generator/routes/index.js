var express = require('express');
var path = require('path');
var router = express.Router();

//Når brugeren går ind på "/", så sender vi index.html tilbage
//Det betyder at dette er vores forside–route
router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;

