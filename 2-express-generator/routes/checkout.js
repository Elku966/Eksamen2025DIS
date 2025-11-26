const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../utils/db');
const { sendOrderConfirmation } = require('../utils/sms');

//
// GET /checkout — vis booking form
//
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

//
// POST /checkout — modtag booking-data
//
router.post('/', (req, res) => {
  console.log("Booking modtaget:", req.body);

  // GEM SESSION
  req.session.bookingData = { ...req.body };

  // GEM I DB
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

      // SEND TIL FRONTEND → redirect til betaling
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
// GET /checkout/betaling — betalingssiden
//
router.get('/betaling', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betaling.html'));
});

//
// POST /checkout/betal — når brugeren trykker "Gennemfør betaling"
//
router.post('/betal', async (req, res) => {
  console.log("Betaling modtaget:", req.body);

  const booking = req.session.bookingData;

  if (!booking) {
    return res.json({ success: false, message: "Session tom" });
  }

  // Fake betaling OK
  const paymentSuccess = true;

  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  // SEND SMS
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
// GET /checkout/gennemfoert — takkeside
//
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;