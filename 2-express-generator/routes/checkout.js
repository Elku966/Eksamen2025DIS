var express = require('express');
var router = express.Router();
var path = require('path');



// GET /checkout (vis checkout-side)
router.get('/', function (req, res, next) {
  // fx:
  res.send('Checkout side');
  // eller: res.render('checkout');
});

// GET /checkout/gennemfoert (tak-side)
router.get('/gennemfoert', function (req, res, next) {
  // fx:
  res.send('Tak, dit køb er gennemført!');
  // eller: res.render('gennemfoert');
});

// GET /checkout/gennemfoert
router.get('/gennemfoert', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
  });
  
  
  // GET /checkout/gennemfoert
  router.get('/gennemfoert', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../public/stylesheets/gennemfoert.html'));
  });
module.exports = router;

