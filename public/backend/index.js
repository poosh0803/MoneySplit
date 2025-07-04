const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const peopleRouter = require('./routes/people');
const splitsRouter = require('./routes/splits');
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

module.exports = app;
