var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var indexRouter = require('./routes/index');
var checkoutRouter = require('./routes/checkout');

var app = express();

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/checkout', checkoutRouter);
app.use('/', indexRouter);

module.exports = app;


// Force domain (så intet redirecter til localhost)
app.use((req, res, next) => {
  const host = req.headers.host;

  // Skift dette til dit rigtige domæne
  const correctDomain = "naee.dev";   //<--- RET DETTE

  // Hvis host ikke er dit domæne, men fx 'localhost:3000', '127.0.0.1' osv:
  if (host !== correctDomain) {
    return res.redirect(`https://${correctDomain}${req.originalUrl}`);
  }

  next();
});
