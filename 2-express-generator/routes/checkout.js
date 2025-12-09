//Importerer nødvendige moduler 
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt'); //Til hashing af CVC
const router = express.Router();

const db = require('../utils/db'); //Forbindelse til database 
const { sendOrderConfirmation, sendReminder } = require('../utils/sms'); //SMS funktioner

//GET /checkout - viser checkoutsiden
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

//POST /checkout - modtager booking-data fra formularen
router.post('/', (req, res) => {
  console.log('--- POST /checkout ---');
  console.log('Body:', req.body);

  //Gemmer booking data midlertidigt i sessionen, så betalingssiden kan få adgang til dem
  req.session.bookingData = {
    navn: req.body.navn,
    dato: req.body.dato,
    tid: req.body.tid,
    aktivitet: req.body.aktivitet,
    lokation: req.body.lokation,    
    antal: req.body.antal,
    totalPris: req.body.totalPris,
    telefon: req.body.telefon,
    bemærkning: req.body.bemærkning,
    smsPaamindelse: req.body.smsPaamindelse,
  };

  console.log('Session efter /checkout (bookingData sat):', req.session);

  //Gem bookingen i databasen under tabellen orders
  db.run(
    `INSERT INTO orders 
      (navn, aktivitet, dato, tid, antal, total_pris, telefon, bemærkning, sms_paamindelse, payment_confirmed, lokation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      0,                        //Betaling er ikke godkendt endnu
      req.body.lokation || null
    ],
    function (err) {
      if (err) {
        console.error('DB fejl (orders):', err.message);
        return res.json({ success: false });
      }
      console.log('Booking gemt i database! Order id:', this.lastID);

      //Gem order-id i session, så betalingen kan kobles til ordren
      req.session.orderId = this.lastID;

      console.log('Session efter at orderId er sat:', req.session);

      return res.json({ success: true });
    }
  );
});


//GET /checkout/betaling - viser betalingssiden
router.get('/betaling', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betaling.html'));
});


//POST /checkout/betal - når brugeren trykker “Gennemfør betaling”
router.post('/betal', async (req, res) => {
  console.log('--- POST /checkout/betal ---');
  console.log('Body:', req.body);
  console.log('Session ved start af /checkout/betal:', req.session);

  //Simuleret betaling
  const paymentSuccess = true;
  if (!paymentSuccess) {
    return res.json({ success: false });
  }

  //Hent bookingdata og ordre-id fra sessionen
  const booking = req.session.bookingData;
  const orderId = req.session.orderId;

  console.log('booking fra session:', booking);
  console.log('orderId fra session:', orderId);

  //Hvis sessionen mangler info kan betalingen ikke gennemføres 
  if (!booking || !orderId) {
    console.warn('Ingen booking eller orderId fundet i sessionen!');
    return res.json({ success: false, message: 'Ingen booking fundet.' });
  }

  //Læs kortdata fra betalingsformen
  const cardholderName = req.body.kortnavn;
  const cardNumber     = req.body.kortnummer;
  const cardExpiry     = req.body.udløb; 
  const cvc            = req.body.cvc;

  //Hvis noget mangler stop betalingen 
  if (!cardholderName || !cardNumber || !cardExpiry || !cvc) {
    console.warn('Manglende betalingsfelter!');
    return res.json({
      success: false,
      message: 'Udfyld alle betalingsfelter.',
    });
  }

  try {
    //Hash CVC før lagring
    const cvcHash = await bcrypt.hash(cvc, 10);

    //Gem kun de sidste 4 cifre af kortnummeret
    const last4 = cardNumber.slice(-4);

    //Gem betalingen i databasen i tabellen payments
    db.run(
      `INSERT INTO payments
        (order_id, cardholder_name, card_last4, card_expiry, cvc_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, cardholderName, last4, cardExpiry, cvcHash],
      async (err) => {
        if (err) {
          console.error('Payment DB fejl:', err.message);
          return res.json({ success: false });
        }

        console.log('Payment gemt i database for order', orderId);

        //Marker orderen som betalt
        db.run(
          `UPDATE orders
           SET payment_confirmed = 1
           WHERE id = ?`,
          [orderId],
          (updateErr) => {
            if (updateErr) {
              console.error(
                'Fejl ved opdatering af payment_confirmed:',
                updateErr.message
              );
            }
          }
        );

        //Send ordrebekræftelse via SMS
        if (booking.telefon) {
          try {
            await sendOrderConfirmation({
              navn: booking.navn,
              dato: booking.dato,
              tid: booking.tid,
              aktivitet: booking.aktivitet,
              lokation: booking.lokation,  // 👈 NY
              telefon: booking.telefon,
            });
          } catch (smsErr) {
            console.error('SMS fejl (ordrebekræftelse):', smsErr);
          }
        }

        //Tjek om eventet ligger indenfor 24 timer - send reminder nu 
        try {
          if (booking.smsPaamindelse) {
            const eventTime = new Date(`${booking.dato}T${booking.tid}:00`);
            const now = new Date();
            const diffMs = eventTime - now;
            const ONE_DAY = 24 * 60 * 60 * 1000; //24 timer i milliskunder 

            if (diffMs > 0 && diffMs <= ONE_DAY) {
              console.log('Event indenfor 24 timer → sender reminder nu');

              await sendReminder({
                navn: booking.navn,
                dato: booking.dato,
                tid: booking.tid,
                aktivitet: booking.aktivitet,
                lokation: booking.lokation, 
                telefon: booking.telefon,
              });

              //Marker at reminder er sendt i databasen
              db.run(
                `UPDATE orders SET reminder_sent = 1 WHERE id = ?`,
                [orderId]
              );
            } else {
              console.log(
                'Event er ikke indenfor 24 timer → ingen reminder nu'
              );
            }
          }
        } catch (remErr) {
          console.error('Fejl i 24-timers reminder-logik:', remErr);
        }

        return res.json({ success: true });
      }
    );
  } catch (err) {
    console.error('Fejl ved hashing / betaling:', err);
    return res.json({ success: false });
  }
});

//GET /checkout/gennemfoert  - gennemført siden
router.get('/gennemfoert', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/gennemfoert.html'));
});

module.exports = router;
