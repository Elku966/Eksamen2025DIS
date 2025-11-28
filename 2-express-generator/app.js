var express = require('express');
var path = require('path');
var logger = require('morgan');
require('dotenv').config();
const session = require('express-session');

// 🔴 NYT: Redis-session store
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

// Opret Redis-klient med REDIS_URL fra .env
const redisClient = new Redis(process.env.REDIS_URL);

// Routers
var indexRouter = require('./routes/index');
var checkoutRouter = require('./routes/checkout');
var gennemfoertRouter = require('./routes/gennemfoert');


var app = express();

// SESSION via Redis (deles mellem droplets)
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'understory-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,          // true hvis I kører HTTPS
    maxAge: 1000 * 60 * 60  // 1 time
  }
}));


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
