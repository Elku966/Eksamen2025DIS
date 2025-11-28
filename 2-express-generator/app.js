var express = require('express');
var path = require('path');
var logger = require('morgan');
require('dotenv').config();
const session = require('express-session');




app.use(session({
  secret: process.env.SESSION_SECRET || 'very-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,            // true hvis du KUN vil tillade HTTPS (behind load balancer)
    maxAge: 1000 * 60 * 60    // 1 time
  }
}));


// Routers
var indexRouter = require('./routes/index');
var checkoutRouter = require('./routes/checkout');
var gennemfoertRouter = require('./routes/gennemfoert');


var app = express();

// SESSION via Redis (deles mellem droplets)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'hemmelig-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 // 1 time
    }
  })
);


// ---------- Middleware ----------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Routes ----------
app.use('/checkout', checkoutRouter);
app.use('/gennemfoert', gennemfoertRouter);
app.use('/', indexRouter);

app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });  

module.exports = app;
