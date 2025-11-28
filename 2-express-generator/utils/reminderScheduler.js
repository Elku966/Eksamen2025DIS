// utils/reminderScheduler.js
const db = require('./db');
const { sendOrderConfirmation } = require('./sms');

let schedulerStarted = false;

// Middleware der starter scheduler én gang når serveren rammes første gang
function reminderSchedulerMiddleware(req, res, next) {
  if (!schedulerStarted) {
    schedulerStarted = true;
    console.log('⏰ Reminder-scheduler startet (TEST MODE: sender reminder for events < 24t)...');
    startScheduler();
  }
  next();
}

function startScheduler() {
  setInterval(() => {
    const now = new Date();
    const nowISO = now.toISOString();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const sql = `
      SELECT id, navn, aktivitet, dato, tid, telefon
      FROM orders
      WHERE sms_paamindelse = 1
        AND payment_confirmed = 1
        AND reminder_sent = 0
        AND datetime(dato || ' ' || tid) <= datetime(?)
        AND datetime(dato || ' ' || tid) >= datetime(?)
    `;

    db.all(sql, [in24h, nowISO], (err, rows) => {
      if (err) {
        console.error('Reminder DB-fejl:', err.message);
        return;
      }

      if (!rows || rows.length === 0) return;

      rows.forEach((o) => {
        console.log('🔔 Reminder sendes til:', o.telefon);

        sendOrderConfirmation({
          navn: o.navn,
          aktivitet: o.aktivitet,
          dato: o.dato,
          tid: o.tid,
          telefon: '+45' + o.telefon
        }).then(() => {
          db.run(`UPDATE orders SET reminder_sent = 1 WHERE id = ?`, [o.id]);
          console.log('✅ Reminder markeret som sendt for', o.id);
        }).catch(err => {
          console.error('SMS fejl:', err.message);
        });
      });
    });

  }, 30 * 1000); // Tjek hvert 30 sekunder
}

module.exports = { reminderSchedulerMiddleware };
