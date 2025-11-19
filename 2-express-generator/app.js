var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

// Routers
var indexRouter = require('./routes/index');
var checkoutRouter = require('./routes/checkout');

// DB og cron-job (Twilio)
require('./db');
require('./reminderJob');

var app = express();

//FORCE DOMAIN – men skån localhost / interne kald (fx health checks)
app.use((req, res, next) => {
  const host = req.headers.host;
  const correctDomain = 'naee.dev';

  // Hvis der ikke er et host-header, eller det er localhost/127.x eller intern IP,
  // så skal vi IKKE redirecte (det kan fx være curl, health checks osv.)
  if (
    !host ||
    host.startsWith('localhost') ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||   // typisk intern netværks-IP
    host.startsWith('0.0.0.0')
  ) {
    return next();
  }

  // Hvis host allerede er korrekt domæne, fortsæt bare
  if (host === correctDomain) {
    return next();
  }

  // Ellers redirect til korrekt domæne (https)
  return res.redirect(`https://${correctDomain}${req.originalUrl}`);
});

// ---------- Middleware ----------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Routes ----------
app.use('/checkout', checkoutRouter);
app.use('/', indexRouter);

module.exports = app;