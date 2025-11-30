const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

// Lille hjælp til at normalisere telefonnumre til E.164 (DK)
function normalizeNumber(telefon) {
  let toNumber = (telefon || '').toString().trim();

  // Fjern mellemrum
  toNumber = toNumber.replace(/\s+/g, '');

  // Hvis 8 cifre → antag dansk
  if (/^\d{8}$/.test(toNumber)) {
    return '+45' + toNumber;
  }

  // Hvis starter med 0xxxxxxx → +45xxxxxxx
  if (toNumber.startsWith('0')) {
    return '+45' + toNumber.slice(1);
  }

  // Hvis allerede starter med + → behold
  if (toNumber.startsWith('+')) {
    return toNumber;
  }

  return toNumber;
}

async function sendOrderConfirmation({ navn, aktivitet, dato, tid, telefon }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio ENV mangler! Tjek .env');
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const toNumber = normalizeNumber(telefon);

    const smsText =
      `Hej ${navn}! Tak for din booking til ${aktivitet} ` +
      `d. ${dato} kl. ${tid}. Vi glæder os til at se dig. Du har en skøn oplevelse i vente!`;

    const msg = await client.messages.create({
      to: toNumber,
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

async function sendReminder({ navn, aktivitet, dato, tid, telefon }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio ENV mangler! Tjek .env');
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const toNumber = normalizeNumber(telefon);

    const smsText =
      `Hej ${navn}! Dette er en påmindelse om din booking: ${aktivitet} ` +
      `i morgen d. ${dato} kl. ${tid}. Vi ser frem til at byde dig velkommen og give dig en uforglemmelig oplevelse!`;

    const msg = await client.messages.create({
      to: toNumber,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Påmindelses-SMS sendt! SID:', msg.sid);
    return true;

  } catch (err) {
    console.error('Fejl ved påmindelses-SMS:', err.message);
    return false;
  }
}

module.exports = { sendOrderConfirmation, sendReminder };
