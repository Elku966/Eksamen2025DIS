const path = require('path');

//Indlæs miljø variabler fra .env filen
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log("DEBUG ENV:", { //Bruges til debugging af miljø variabler 
  SID: process.env.TWILIO_ACCOUNT_SID,
  TOKEN: process.env.TWILIO_AUTH_TOKEN,
  FROM: process.env.TWILIO_PHONE_NUMBER
});

const twilio = require('twilio');

//Henter Twilio loginoplysninger fra miiljø variabler, de bruges til at autoficere hver SMS anmodning
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

//Funktion til at sende ordrebekræftelse til kunde via SMS 
async function sendOrderConfirmation({ navn, dato, tid, aktivitet, telefon }) {
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); //Opretter Twilio klient med loginoplysninger

    const smsText = //Beskeden kunden modtager 
      `Hej ${navn}! Tak for din booking til ${aktivitet} d. ${dato} kl. ${tid}. ` +
      `Vi glæder os til at se dig! Du har en skøn oplevelse i vente 💆🏽‍♀️🧘🏽✨`;

      //Sender SMS via Twilio API
    const msg = await client.messages.create({
      to: telefon,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Ordrebekræftelse sendt! SID:', msg.sid);
    return true;

  } catch (err) { //Hvis SMS fejler logges hele fejlen til debugging 
    console.error('TWILIO FEJL:', err); 
    return false;
  }
};