var express = require('express');
var path = require('path');
var router = express.Router();

// /checkout → viser checkout.html
router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

// POST /checkout/start → gem booking info i session
router.post('/start', function(req, res) {
    req.session.booking = {
        navn: req.body.navn,
        dato: req.body.dato,
        tid: req.body.tid,
        aktivitet: req.body.aktivitet,
        antal: req.body.antal,
        totalPris: req.body.totalPris,
        telefon: req.body.telefon,
        bemærkning: req.body.bemærkning
    };

    console.log("Booking gemt i session:", req.session.booking);
    res.redirect('/checkout/gennemfoert');
});

// API til at hente session-data (bruges af gennemfoert.html)
router.get('/api/booking', function(req, res) {
    res.json(req.session.booking || {});
});


// /checkout/gennemfoert → viser gennemfoert.html
router.get('/gennemfoert', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;