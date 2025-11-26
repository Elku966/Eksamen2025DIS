const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../utils/db'); // DATABASE
const { sendOrderConfirmation } = require('../utils/sms'); // SMS FUNKTION

//
// GET /checkout  → booking-siden
//
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

//
// POST /checkout  → modtag booking-data fra formularen
//
router.post('/', (req, res) => {
  console.log("Booking modtaget:", req.body);

  // GEM BOOKINGDATA I SESSION
  req.session.bookingData = {
    navn: req.body.navn,
    dato: req.body.dato,
    tid: req.body.tid,
    aktivitet: req.body.aktivitet,
    antal: req.body.antal,
    totalPris: req.body.totalPris,
    telefon: req.body.telefon,
    bemærkning: req.body.bemærkning,
    smsPaamindelse: req.body.smsPaamindelse
  };

  // GEM I DATABASE
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
        console.error("DB fejl:", err.message);
        return res.json({ success: false });
      }

      console.log("Booking gemt i database!");

      // ⭐ RETURNER DEN DATA SOM FRONTEND BRUGER TIL REDIRECT ⭐
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
// GET /checkout/betaling → betalingssiden
//
router.get('/betaling', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betaling.html'));
});

//
// POST /checkout/betal → efter betaling
//
router.post('/betal', async (req, res) => {
  console.log("Betaling modtaget:", req.body);

  // Fake betaling OK
  const paymentSuccess = true;

  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  // HENT DATA FRA SESSION
  const booking = req.session.bookingData;

  if (!booking) {
    return res.json({ success: false, message: "Ingen booking fundet." });
  }

  // SEND SMS BEKRÆFTELSE
  if (booking.telefon) {
    await sendOrderConfirmation({
      navn: booking.navn,
      dato: booking.dato,
      tid: booking.tid,
      aktivitet: booking.aktivitet,
      telefon: booking.telefon
    });
  }

  // SEND RESPONSE
  res.json({
    success: true,
    aktivitet: booking.aktivitet,
    antal: booking.antal,
    dato: booking.dato,
    tid: booking.tid
  });
});

//
// GET /checkout/gennemfoert  → takkesiden
//
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;