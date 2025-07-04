const express = require('express');
const router = express.Router();

// Get latest split
router.get('/', async (req, res) => {
  try {
    const splitRes = await req.pool.query('SELECT id, title, created_at FROM splits ORDER BY created_at DESC LIMIT 1');
    if (splitRes.rows.length === 0) return res.json({});
    const split = splitRes.rows[0];
    const participantsRes = await req.pool.query(
      'SELECT person_name AS name, paid, balance, description FROM split_participants WHERE split_id = $1',
      [split.id]
    );
    res.json({
      title: split.title,
      created_at: split.created_at,
      result: participantsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new split
router.post('/', async (req, res) => {
  const { participants } = req.body;
  const title = req.body.title || 'Untitled';
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Invalid participants' });
  }
  const total = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avg = total / participants.length;
  const result = participants.map(p => ({
    name: p.name,
    paid: p.amount,
    balance: +(p.amount - avg).toFixed(2),
    description: p.description || ''
  }));

  try {
    const splitRes = await req.pool.query(
      'INSERT INTO splits (title) VALUES ($1) RETURNING id',
      [title]
    );
    const splitId = splitRes.rows[0].id;
    for (const p of result) {
      await req.pool.query(
        'INSERT INTO split_participants (split_id, person_name, paid, balance, description) VALUES ($1, $2, $3, $4, $5)',
        [splitId, p.name, p.paid, p.balance, p.description]
      );
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;