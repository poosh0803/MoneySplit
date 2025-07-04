import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://moneysplit:moneysplitpw@localhost:5432/moneysplit'
});

import peopleRouter from './routes/people.js';
import splitsRouter from './routes/splits.js';
import splitRouter from './routes/split.js';

app.use('/api/people', (req, res, next) => {
  req.pool = pool;
  next();
}, peopleRouter);

app.use('/api/splits', (req, res, next) => {
  req.pool = pool;
  next();
}, splitsRouter);

app.use('/api/split', (req, res, next) => {
  req.pool = pool;
  next();
}, splitRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
