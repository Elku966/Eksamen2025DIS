// utils/reminderScheduler.js
const db = require('./db');
const { sendReminder } = require('./sms');

// 🚨 LIGE NU: 30 sekunder før eventet (til test)
// Når I er færdige med at teste, skift til 24 timer:
// const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 30 * 1000;

// Hvor tit vi tjekker (hver 5. sekund – fint til test)
const CHECK_INTERVAL_MS = 5000;

let schedulerStarted = false;

function parseBookingDateTime(dato, tid) {
  // Forventer dato i format 'YYYY-MM-DD' og tid 'HH:MM'
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

        const reminderTime = new Date(eventTime.getTime() - DAY_MS);

        // Hvis vi er efter reminderTime men før eventTime → send påmindelse
        if (now >= reminderTime && now < eventTime) {
          // Prøv at "låse" posten, så kun én server sender SMS
          db.run(
            `UPDATE orders
             SET reminder_sent = 1
             WHERE id = ? AND reminder_sent = 0`,
            [row.id],
            function (updateErr) {
              if (updateErr) {
                console.error('Fejl ved opdatering af reminder_sent:', updateErr.message);
                return;
              }

              // Hvis 0 rækker blev ændret, har en anden proces allerede taget den
              if (this.changes === 0) return;

              console.log('👉 Sender påmindelses-SMS for order id', row.id);

              sendReminder({
                navn: row.navn,
                aktivitet: row.aktivitet,
                dato: row.dato,
                tid: row.tid,
                telefon: row.telefon
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

  console.log('🔔 Reminder-scheduler startet (tjekker hvert 5. sekund)...');
  checkReminders();                       // tjek én gang ved opstart
  setInterval(checkReminders, CHECK_INTERVAL_MS);
}

// 👉 Express-middleware som du kan bruge med app.use(...)
function reminderSchedulerMiddleware(req, res, next) {
  startScheduler();  // sørger for kun at starte én gang
  next();
}

module.exports = { reminderSchedulerMiddleware };
