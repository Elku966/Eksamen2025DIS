// routes/checkout.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');            // ← til hashing af CVC
const router = express.Router();

const db = require('../utils/db');           // DB
const { sendOrderConfirmation } = require('../utils/sms'); // SMS-funktion

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

  // GEM I DATABASE (orders)
  db.run(
    `INSERT INTO orders 
      (navn, aktivitet, dato, tid, antal, total_pris, telefon, bemærkning, sms_paamindelse, payment_confirmed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.navn,
      req.body.aktivitet,
      req.body.dato,
      req.body.tid,
      req.body.antal,
      parseInt(req.body.totalPris, 10),
      req.body.telefon,
      req.body.bemærkning,
      req.body.smsPaamindelse ? 1 : 0,
      0                       // 👈 betaling er IKKE godkendt endnu
    ],
    function (err) {
      if (err) {
        console.error("DB fejl (orders):", err.message);
        return res.json({ success: false });
      }
  
      console.log("Booking gemt i database! Order id:", this.lastID);
      req.session.orderId = this.lastID;
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

  // HENT BOOKINGDATA + orderId FRA SESSION
  const booking = req.session.bookingData;
  const orderId = req.session.orderId;

  if (!booking || !orderId) {
    return res.json({ success: false, message: "Ingen booking fundet." });
  }

  // 💳 Læs kortdata fra betalingsformen
  // Sørg for at name="..." i betaling.html matcher disse navne:
  const cardholderName = req.body.kortnavn;      // fx <input name="kortnavn">
  const cardNumber     = req.body.kortnummer;    // fx <input name="kortnummer">
  const cardExpiry     = req.body.udløb;   // fx <input name="udloebsdato">
  const cvc            = req.body.cvc;           // fx <input name="cvc">

  if (!cardholderName || !cardNumber || !cardExpiry || !cvc) {
    return res.json({ success: false, message: "Udfyld alle betalingsfelter." });
  }

  try {
    // 🔐 Hash CVC
    const cvcHash = await bcrypt.hash(cvc, 10);

    // Gem kun sidste 4 cifre af kortnummer
    const last4 = cardNumber.slice(-4);

    // GEM I DATABASE (payments)
    db.run(
      `INSERT INTO payments
        (order_id, cardholder_name, card_last4, card_expiry, cvc_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, cardholderName, last4, cardExpiry, cvcHash],
      async (err) => {
        if (err) {
          console.error("Payment DB fejl:", err.message);
          return res.json({ success: false });
        }

        console.log("Payment gemt i database for order", orderId);

        // SEND SMS ORDREBEKRÆFTELSE – samme som før
        if (booking.telefon) {
          console.log("Sender SMS-ordrebekræftelse med:");
          console.log(booking);

          try {
            await sendOrderConfirmation({
              navn: booking.navn,
              dato: booking.dato,
              tid: booking.tid,
              aktivitet: booking.aktivitet,
              telefon: booking.telefon
            });
          } catch (smsErr) {
            console.error("SMS fejl:", smsErr);
            // men betalingen er stadig ok
          }
        }

        return res.json({ success: true });
      }
    );
  } catch (err) {
    console.error("Fejl ved hashing / betaling:", err);
    return res.json({ success: false });
  }
});

//
// GET /checkout/gennemfoert  → takkesiden
//
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;
