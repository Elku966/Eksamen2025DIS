const createError = require('http-errors');
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const app = express();

// Session (MemoryStore – ingen Redis)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'very-secret-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,            // bag load balancer kunne du sætte den til true
      maxAge: 1000 * 60 * 60    // 1 time
    }
  })
);

// Routers
const indexRouter = require('./routes/index');
const checkoutRouter = require('./routes/checkout');
const usersRouter = require('./routes/users');



// ----- Middleware -----
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());



// Statisk frontend (public-mappen)
app.use(express.static(path.join(__dirname, 'public')));

// ----- Health check til load balancer -----
app.get('/health', (req, res) => {
  res.send('OK');
});

// ----- Routes -----
app.use('/', indexRouter);
app.use('/checkout', checkoutRouter);
app.use('/users', usersRouter);

// ----- 404 og fejl-håndtering -----
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send('Error');
});

module.exports = app;