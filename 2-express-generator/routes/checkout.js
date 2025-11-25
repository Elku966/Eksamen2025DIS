// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();

// GET /checkout → formular
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

 //POST /checkout → fake “gem” og redirect til /gennemfoert
router.post('/', (req, res) => {
  console.log('Modtog booking-data (FAKE lokalt):', req.body);

  const eventFromQuery = req.query.event;
  const eventFromBody =
    req.body.activity || req.body.event || req.body.eventName;
  const eventName = eventFromQuery || eventFromBody || 'Din aktivitet';

  // Redirect videre til gennemført-siden
  // res.redirect(`/gennemfoert?event=${encodeURIComponent(eventName)}`);
  res.status(200).json(req.body)
});

router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'gennemfoert.html'));
});

module.exports = router;
