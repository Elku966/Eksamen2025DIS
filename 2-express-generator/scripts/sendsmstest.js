// scripts/sendSmsTest.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const twilio = require('twilio'); //tilføjet

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TEST_TO_NUMBER
} = process.env;

(async () => {
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const msg = await client.messages.create({
      to: TEST_TO_NUMBER,
      from: TWILIO_PHONE_NUMBER,
      body: '🚀 Test: Twilio virker fra mit projekt!'
    });

    console.log('✅ SMS sendt! SID:', msg.sid);
  } catch (err) {
    console.error('❌ Fejl:', err.message);
  }
})();
