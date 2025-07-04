const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3300;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Backend API (PostgreSQL) ---
const backend = require('./public/backend/index');
app.use('/api', backend);
// --- End Backend API ---

// API route to calculate split
app.post('/api/split', (req, res) => {
  const { participants } = req.body;

  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const total = participants.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const avg = total / participants.length;

  const result = participants.map(p => {
    const balance = parseFloat(p.amount) - avg;
    return {
      name: p.name,
      paid: parseFloat(p.amount),
      balance: parseFloat(balance.toFixed(2))
    };
  });

  res.json({ total: total.toFixed(2), average: avg.toFixed(2), result });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
