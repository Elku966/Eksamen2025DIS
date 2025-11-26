// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../utils/db');
const { sendOrderConfirmation } = require('../utils/sms');

// GET /checkout → vis booking-formularen
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

// POST /checkout → gem i DB + session, send JSON tilbage
router.post('/', (req, res) => {
  console.log("Booking modtaget:", req.body);

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

  // totalPris kommer fx som "249 kr." → lav til tal
  const totalTal = parseInt(String(totalPris).replace(/[^\d]/g, ''), 10) || 0;

  // gem i session til betaling/SMS
  req.session.bookingData = {
    navn,
    dato,
    tid,
    aktivitet,
    antal,
    totalPris: totalTal,
    telefon,
    bemærkning,
    smsPaamindelse
  };

  db.run(
    `INSERT INTO orders
       (navn, aktivitet, dato, tid, antal, total_pris, telefon, bemærkning, sms_paamindelse)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      navn,
      aktivitet,
      dato,
      tid,
      antal,
      totalTal,
      telefon,
      bemærkning || '',
      smsPaamindelse ? 1 : 0
    ],
    function (err) {
      if (err) {
        console.error("DB fejl:", err.message);
        return res.status(500).json({ success: false, error: 'db' });
      }

      console.log("Booking gemt i database med id:", this.lastID);

      // JSON som checkout.html forventer
      return res.json({
        success: true,
        aktivitet,
        antal,
        dato,
        tid
      });
    }
  );
});

// POST /checkout/betal → fake betaling + SMS, send JSON tilbage
router.post('/betal', async (req, res) => {
  console.log("Betaling modtaget:", req.body);

  const paymentSuccess = true; // her kunne du lave rigtig betaling

  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  const booking = req.session ? req.session.bookingData : null;

  if (booking && booking.telefon) {
    try {
      await sendOrderConfirmation({
        navn: booking.navn,
        dato: booking.dato,
        tid: booking.tid,
        aktivitet: booking.aktivitet,
        telefon: booking.telefon
      });
    } catch (err) {
      // SMS må ikke crashe flowet
      console.error("SMS-fejl (ignoreret):", err.message);
    }
  }

  // meget simpelt og altid gyldigt JSON
  return res.json({
    success: true
  });
});

// GET /checkout/gennemfoert → takkesiden
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;
