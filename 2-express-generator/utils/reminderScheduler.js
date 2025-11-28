// utils/reminderScheduler.js
const db = require('./db');
const { sendReminder } = require('./sms');

const CHECK_INTERVAL_MS = 5000; // tjek hver 5. sekund (fint til test)
let schedulerStarted = false;

// dato: '2025-11-28', tid: '16:00'
function parseBookingDateTime(dato, tid) {
  try {
    const iso = `${dato}T${tid}:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (err) {
    console.error('Kunne ikke parse dato/tid', dato, tid, err);
    return null;
  }
}

function checkReminders() {
  const now = new Date();

  db.all(
    `SELECT id, navn, aktivitet, dato, tid, telefon
     FROM orders
     WHERE sms_paamindelse = 1
       AND reminder_sent = 0`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Fejl ved hentning af reminders:', err.message);
        return;
      }

      rows.forEach((row) => {
        const eventTime = parseBookingDateTime(row.dato, row.tid);
        if (!eventTime) return;

        const timeDifference = eventTime - now;
        const HOURS24 = 24 * 60 * 60 * 1000;

        // 🧪 TEST-MODE:
        // Hvis eventet ligger inden for de næste 24 timer,
        // sender vi påmindelsen MED DET SAMME.
        if (timeDifference <= HOURS24 && timeDifference > 0) {
          console.log(
            `TEST-MODE: event er inden for 24 timer. Sender reminder for order ${row.id} MED DET SAMME`
          );

          // "Lås" rækken så kun én server sender SMS
          db.run(
            `UPDATE orders
             SET reminder_sent = 1
             WHERE id = ? AND reminder_sent = 0`,
            [row.id],
            function (updateErr) {
              if (updateErr) {
                console.error(
                  'Fejl ved opdatering af reminder_sent:',
                  updateErr.message
                );
                return;
              }

              // Hvis 0 rækker ændret → en anden proces tog den
              if (this.changes === 0) return;

              // Send selve SMS'en
              sendReminder({
                navn: row.navn,
                aktivitet: row.aktivitet,
                dato: row.dato,
                tid: row.tid,
                telefon: row.telefon
              })
                .then(() => {
                  console.log('Reminder-SMS sendt for order', row.id);
                })
                .catch((smsErr) => {
                  console.error('Fejl ved afsendelse af reminder-SMS:', smsErr.message);
                });
            }
          );
        }
      });
    }
  );
}

function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log(
    '🔔 Reminder-scheduler startet (TEST-MODE: alle events inden for 24 timer får reminder med det samme)...'
  );
  checkReminders();
  setInterval(checkReminders, CHECK_INTERVAL_MS);
}

// Middleware som du bruger i app.js med app.use(reminderSchedulerMiddleware)
function reminderSchedulerMiddleware(req, res, next) {
  startScheduler(); // sikrer at den kun starter én gang
  next();
}

module.exports = { reminderSchedulerMiddleware };
