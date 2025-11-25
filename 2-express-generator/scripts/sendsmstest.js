const path = require('path');

// ✔ Indlæs .env korrekt og log resultatet
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log("DEBUG ENV:", {
  SID: process.env.TWILIO_ACCOUNT_SID,
  TOKEN: process.env.TWILIO_AUTH_TOKEN,
  FROM: process.env.TWILIO_PHONE_NUMBER
});

const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

// Funktion til at sende ordrebekræftelse
async function sendOrderConfirmation({ navn, dato, tid, aktivitet, telefon }) {
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const smsText =
      `Hej ${navn}! Tak for din booking til ${aktivitet} d. ${dato} kl. ${tid}. ` +
      `Vi glæder os til at se dig! Du har en skøn oplevelse i vente 💆🏽‍♀️🧘🏽✨`;

    const msg = await client.messages.create({
      to: telefon,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Ordrebekræftelse sendt! SID:', msg.sid);
    return true;

  } catch (err) {
    console.error('TWILIO FEJL:', err); // fuld fejlvisning
    return false;
  }
}

// ---- TESTKALD ----
sendOrderConfirmation({
  navn: "Aya",
  dato: "2025-11-20",
  tid: "14:30",
  aktivitet: "Yoga undervisning",
  telefon: "+4542404941"
});