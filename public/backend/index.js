const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const peopleRouter = require('./routes/people');
const splitsRouter = require('./routes/splits');
const discordRouter = require('./routes/discord');
const newSplitRouter = require('./routes/newSplit');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://moneysplit:moneysplitpw@localhost:5432/moneysplit'
});

app.use('/people', (req, res, next) => {
  req.pool = pool;
  next();
}, peopleRouter);

app.use('/splits', (req, res, next) => {
  req.pool = pool;
  next();
}, splitsRouter);

app.use('/newSplit', (req, res, next) => {
  req.pool = pool;
  next();
}, newSplitRouter);

app.use('/discord', (req, res, next) => {
  req.pool = pool;
  next();
}, discordRouter);

// Mount /newSplit/latest to the GET / route of newSplitRouter
app.get('/newSplit/latest', (req, res, next) => {
  req.url = '/'; // force to root route of newSplitRouter
  req.pool = pool;
  newSplitRouter.handle(req, res, next);
});

module.exports = app;
