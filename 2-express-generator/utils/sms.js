const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

async function sendOrderConfirmation({ navn, aktivitet, dato, tid, telefon }) {
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const smsText =
      `Hej ${navn}! Tak for din booking til ${aktivitet} ` +
      `d. ${dato} kl. ${tid}. Vi glæder os til at se dig. Du har en skøn oplevelse i vente!`;

    const msg = await client.messages.create({
      to: telefon,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Ordrebekræftelse sendt! SID:', msg.sid);
    return true;

  } catch (err) {
    console.error('Fejl ved ordrebekræftelse:', err.message);
    return false;
  }
}

module.exports = { sendOrderConfirmation };