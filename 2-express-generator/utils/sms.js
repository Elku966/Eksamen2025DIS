const twilio = require('twilio');

const { //Henter Twilio nøgler fra .env filen
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

//Normalisere telefonnumre til E.164 (DK)
function normalizeNumber(telefon) {
  let toNumber = (telefon || '').toString().trim();

  //Fjern mellemrum
  toNumber = toNumber.replace(/\s+/g, '');

  //Hvis 8 cifre, tilføj +45
  if (/^\d{8}$/.test(toNumber)) {
    return '+45' + toNumber;
  }

  //Hvis nummeret starter med 0xxxxxxx så skriv +45xxxxxxx
  if (toNumber.startsWith('0')) {
    return '+45' + toNumber.slice(1);
  }

  //Hvis nummeret allerede starter med + så behold
  if (toNumber.startsWith('+')) {
    return toNumber;
  }

  return toNumber;
}

//Ordrebekræftelse med adresse efter betaling
async function sendOrderConfirmation({ navn, aktivitet, dato, tid, telefon, lokation }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) { //Sikrer at alle Twilio env variabler er tilgængelige
      console.error('Twilio ENV mangler! Tjek .env');
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); //Opret klient
    const toNumber = normalizeNumber(telefon); //Normaliser telefonnummer 
    const lokationTekst = lokation ? ` på ${lokation}` : ''; //Adressetekst kun hvis lokation findes

    const smsText = //SMS indholdet
      `Hej ${navn}! Tak for din booking til ${aktivitet} ` +
      `d. ${dato} kl. ${tid}${lokationTekst}. Vi glæder os til at se dig. ` +
      `Du har en skøn oplevelse i vente!`;

    const msg = await client.messages.create({ //Send SMS via Twilio API
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


//Påmindelse 24 timer før - funktionen kaldes kun hvis brugeren har sat flueben
async function sendReminder({ navn, aktivitet, dato, tid, telefon, lokation }) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio ENV mangler! Tjek .env');
      return false;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const toNumber = normalizeNumber(telefon);
    const lokationTekst = lokation ? ` (${lokation})` : '';

    const smsText =
      `Hej ${navn}! Dette er en venlig påmindelse om din oplevelse: ${aktivitet} ` +
      `i morgen d. ${dato} kl. ${tid}${lokationTekst} hos Understory. ` +
      `Vi glæder os til at se dig 🌿`;

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
