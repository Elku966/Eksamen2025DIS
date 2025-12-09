
require('dotenv').config(); //Indelæser miljø variabler fra .env filen 

//Importerer nødvendige moduler
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const responseTime = require('response-time');


const app = express();

//Måling af svartid
app.use(responseTime());

//Session håndtering
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'very-secret-session-key', //Hemmelig nøgle
    resave: false, //Gem ikke sessions hvis den ikke ændres
    saveUninitialized: false, //opret ikke tomme sessions
    cookie: {
      secure: false,            
      maxAge: 1000 * 60 * 60 //Session varer 1 time
    }
  })
);

//Importerer routers
const indexRouter = require('./routes/index');
const checkoutRouter = require('./routes/checkout');

//Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


//Gør alle mapper i frontenten tilgængelige i browseren 
app.use(express.static(path.join(__dirname, 'public')));

//Health check til load balancer
app.get('/health', (req, res) => {
  res.send('OK');
});

//Routes
app.use('/', indexRouter);
app.use('/checkout', checkoutRouter);

//Fejl-håndtering 
app.use(function (req, res, next) {
  next(createError(404));
});

//Generel fejl-håndtering
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send('Error');
});

module.exports = app;
