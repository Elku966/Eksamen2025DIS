// routes/checkout.js
const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../utils/db');            // ← DATABASE TILFØJET ✔
const { sendOrderConfirmation } = require('../utils/sms'); // SMS-FUNKTION

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

  // GEM BOOKINGDATA I SESSION, så betalingssiden kan hente det
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

  // 🟢 GEM I DATABASE
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
      parseInt(req.body.totalPris),              // ← vigtigt
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
      return res.json({ success: true });
    }
  );
});

//
// GET /checkout/betaling  → betalingssiden
//
router.get('/betaling', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betaling.html'));
});

//
// POST /checkout/betal  → når brugeren trykker “Gennemfør betaling”
//
router.post('/betal', async (req, res) => {
  console.log("Betaling modtaget:", req.body);

  // Simuleret betaling
  const paymentSuccess = true;

  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  // HENT BOOKINGDATA FRA SESSION
  const booking = req.session.bookingData;

  if (!booking) {
    return res.json({ success: false, message: "Ingen booking fundet." });
  }

  // SEND SMS ORDREBEKRÆFTELSE
  if (booking.telefon) {
    console.log("Sender SMS-ordrebekræftelse med:");
    console.log(booking);

    await sendOrderConfirmation({
      navn: booking.navn,
      dato: booking.dato,
      tid: booking.tid,
      aktivitet: booking.aktivitet,
      telefon: booking.telefon
    });
  }

  res.json({ success: true });
});

//
// GET /checkout/gennemfoert  → takkesiden
//
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;