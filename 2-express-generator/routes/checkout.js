var express = require('express');
var path = require('path');
var router = express.Router();
const db = require('../db'); // 👈 Tilføjet

// GET /checkout → viser bookingformular
router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

// GET /checkout/gennemfoert → viser bekræftelsesside
router.get('/gennemfoert', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

// POST /checkout → GEM booking i database
router.post('/', function (req, res) {
  const {
    navn,
    dato,
    tid,
    aktivitet,
    antal,
    totalPris,
    telefon,
    bemærkning,
    smsPaamindelse
  } = req.body;

  if (!navn || !dato || !tid || !aktivitet || !antal || !totalPris || !telefon) {
    return res.status(400).send('Mangler data.');
  }

  const personsInt = parseInt(antal, 10) || 1;
  const numericPrice = parseFloat(String(totalPris).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const wantsSmsInt = smsPaamindelse ? 1 : 0;
  const eventDatetime = `${dato}T${tid}`;

  const sql = `
    INSERT INTO bookings (
      name, phone, activity, persons, total_price,
      event_date, event_time, event_datetime, wants_sms, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    navn,
    telefon,
    aktivitet,
    personsInt,
    numericPrice,
    dato,
    tid,
    eventDatetime,
    wantsSmsInt,
    bemærkning || null
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('DB FEJL:', err);
      return res.status(500).json({ success: false });
    }

    console.log('Booking gemt! ID:', this.lastID);
    return res.json({ success: true, bookingId: this.lastID });
  });
});

module.exports = router;