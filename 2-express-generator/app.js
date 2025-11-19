var session = require('express-session');
var cookieParser = require('cookie-parser');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var indexRouter = require('./routes/index');
var checkoutRouter = require('./routes/checkout');

var app = express();

// ⭐ TILFØJET – force domain (så intet sender brugeren til localhost)
app.use((req, res, next) => {
  const host = req.headers.host;

  // Skift til dit eget domæne
  const correctDomain = "naee.dev";

  // Hvis forespørgslen kommer fra localhost, IP eller andet host:
  if (host !== correctDomain) {
    return res.redirect(`https://${correctDomain}${req.originalUrl}`);
  }

  next();
});

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(session({
    secret: 'hemmeligkode123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/checkout', checkoutRouter);
app.use('/', indexRouter);

module.exports = app;
