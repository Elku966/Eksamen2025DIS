// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../utils/db');
const { sendOrderConfirmation } = require('../utils/sms');

//
// GET /checkout  → booking side
//
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

//
// POST /checkout  → modtag booking data FRA FORMULAR
//
router.post('/', (req, res) => {
  console.log("Booking modtaget:", req.body);

  // ⭐ GEM I SESSION ⭐
  req.session.bookingData = { ...req.body };

  // ⭐ GEM I DATABASE ⭐
  db.run(
    `INSERT INTO orders
      (navn, aktivitet, dato, tid, antal, total_pris, telefon, bemærkning, sms_paamindelse)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.navn,
      req.body.aktivitet,
      req.body.dato,
      req.body.tid,
      req.body.antal,
      parseInt(req.body.totalPris),
      req.body.telefon,
      req.body.bemærkning,
      req.body.smsPaamindelse ? 1 : 0
    ],
    (err) => {
      if (err) {
        console.error("DB FEJL:", err.message);
        return res.json({ success: false, error: "db" });
      }

      console.log("Booking gemt!");

      // ⭐ SEND JSON TIL FRONTEND (TIL REDIRECT) ⭐
      return res.json({
        success: true,
        aktivitet: req.body.aktivitet,
        antal: req.body.antal,
        dato: req.body.dato,
        tid: req.body.tid
      });
    }
  );
});

//
// GET /checkout/betaling  → betalingsside
//
router.get('/betaling', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betaling.html'));
});

//
// POST /checkout/betal  → når brugeren indsender kortinfo
//
router.post('/betal', async (req, res) => {
  console.log("Betaling modtaget:", req.body);

  const booking = req.session.bookingData;

  if (!booking) {
    console.log("Ingen session-data!");
    return res.json({ success: false });
  }

  // Fake betalingssuccess
  const paymentSuccess = true;

  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  // SEND SMS HVIS TELEFONNUMMER FINDES
  if (booking.telefon) {
    await sendOrderConfirmation({
      navn: booking.navn,
      dato: booking.dato,
      tid: booking.tid,
      aktivitet: booking.aktivitet,
      telefon: booking.telefon
    });
  }

  return res.json({
    success: true,
    aktivitet: booking.aktivitet,
    antal: booking.antal,
    dato: booking.dato,
    tid: booking.tid
  });
});

//
// GET /checkout/gennemfoert  → takkeside
//
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;