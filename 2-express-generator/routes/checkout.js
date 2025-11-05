var express = require('express');
var router = express.Router();

// GET /checkout
router.get('/', function (req, res, next) {
  // Du kan enten render en view:
  // res.render('checkout', { title: 'Checkout' });

  // eller bare sende noget tekst for at teste:
  res.send('Checkout side virker!');
});

module.exports = router;

