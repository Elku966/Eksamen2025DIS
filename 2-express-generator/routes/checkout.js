// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// GET /checkout → formular
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

// GET /checkout/gennemfoert → takkeside
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

// POST /checkout → GEM BOOKING
router.post('/', (req, res) => {
  console.log('🚀 FIK POST /checkout med body:', req.body);

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
    console.log('❌ Mangler felter i req.body');
    return res.status(400).json({ success: false, error: 'Mangler felter' });
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
      console.error('💥 DB FEJL ved INSERT:', err);
      return res.status(500).json({ success: false, error: 'DB fejl' });
    }

    console.log('✅ Booking gemt med id:', this.lastID);
    res.json({ success: true, bookingId: this.lastID });
  });
});

module.exports = router;
