// utils/sms.js
const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

// Normaliserer telefonnumre til E.164 (DK)
function normalizeNumber(telefon) {
  let toNumber = (telefon || '').toString().trim();

  toNumber = toNumber.replace(/\s+/g, '');

  if (/^\d{8}$/.test(toNumber)) {
    return '+45' + toNumber;
  }

  if (toNumber.startsWith('0')) {
    return '+45' + toNumber.slice(1);
  }

  if (toNumber.startsWith('+')) {
    return toNumber;
  }

  return toNumber;
}

// Ordrebekræftelse med adresse efter betaling
async function sendOrderConfirmation({ navn, aktivitet, dato, tid, telefon, lokation }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio ENV mangler! Tjek .env / DO env vars:', {
        SID: TWILIO_ACCOUNT_SID,
        TOKEN: !!TWILIO_AUTH_TOKEN,
        FROM: TWILIO_PHONE_NUMBER
      });
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const toNumber = normalizeNumber(telefon);
    const lokationTekst = lokation ? ` på ${lokation}` : '';

    const smsText =
      `Hej ${navn}! Tak for din booking til ${aktivitet} ` +
      `d. ${dato} kl. ${tid}${lokationTekst}. Vi glæder os til at se dig. ` +
      `Du har en skøn oplevelse i vente!`;

    console.log('Twilio: forsøger at sende SMS', {
      to: toNumber,
      from: TWILIO_PHONE_NUMBER,
      preview: smsText.slice(0, 60) + '...'
    });

    const msg = await client.messages.create({
      to: toNumber,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Ordrebekræftelse sendt! SID:', msg.sid);
    return true;

  } catch (err) {
    console.error('Fejl ved ordrebekræftelse:', {
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo
    });
    return false;
  }
}

// Påmindelse 24 timer før – funktionen kaldes kun hvis brugeren har sat flueben
async function sendReminder({ navn, aktivitet, dato, tid, telefon, lokation }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio ENV mangler! Tjek .env / DO env vars:', {
        SID: TWILIO_ACCOUNT_SID,
        TOKEN: !!TWILIO_AUTH_TOKEN,
        FROM: TWILIO_PHONE_NUMBER
      });
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const toNumber = normalizeNumber(telefon);
    const lokationTekst = lokation ? ` (${lokation})` : '';

    const smsText =
      `Hej ${navn}! Dette er en venlig påmindelse om din oplevelse: ${aktivitet} ` +
      `i morgen d. ${dato} kl. ${tid}${lokationTekst} hos Understory. ` +
      `Vi glæder os til at se dig 🌿`;

    console.log('Twilio: forsøger at sende reminder-SMS', {
      to: toNumber,
      from: TWILIO_PHONE_NUMBER
    });

    const msg = await client.messages.create({
      to: toNumber,
      from: TWILIO_PHONE_NUMBER,
      body: smsText
    });

    console.log('Påmindelses-SMS sendt! SID:', msg.sid);
    return true;

  } catch (err) {
    console.error('Fejl ved påmindelses-SMS:', {
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo
    });
    return false;
  }
}

module.exports = { sendOrderConfirmation, sendReminder };
