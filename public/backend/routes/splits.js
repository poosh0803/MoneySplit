const express = require('express');
const router = express.Router();

// Get all splits
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.pool.query('SELECT id, title, created_at FROM splits ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Save a new split (with transactions and finalStatus)
router.post('/', async (req, res) => {
  const { title, participants, transactions, finalStatus } = req.body;
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Invalid participants' });
  }
  try {
    // Insert split
    const splitRes = await req.pool.query(
      'INSERT INTO splits (title) VALUES ($1) RETURNING id',
      [title || 'Untitled']
    );
    const splitId = splitRes.rows[0].id;
    // Calculate average for correct balance
    const total = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const avg = total / participants.length;
    // Insert participants with correct balance and person_id
    for (const p of participants) {
      const balance = (parseFloat(p.amount) || 0) - avg;
      // Lookup person_id by name
      let personId = null;
      try {
        const personRes = await req.pool.query('SELECT id FROM people WHERE name = $1', [p.name]);
        if (personRes.rows.length > 0) {
          personId = personRes.rows[0].id;
        }
      } catch {}
      await req.pool.query(
        'INSERT INTO split_participants (split_id, person_id, person_name, paid, balance, description) VALUES ($1, $2, $3, $4, $5, $6)',
        [splitId, personId, p.name, p.amount, balance, p.description || '']
      );
    }
    // Optionally, store transactions and finalStatus in a new table or as JSON (not implemented here)
    res.status(201).json({ ok: true, splitId });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get participants for a specific split
router.get('/:id', async (req, res) => {
  const splitId = req.params.id;
  try {
    const splitRes = await req.pool.query('SELECT id, title, created_at FROM splits WHERE id = $1', [splitId]);
    if (splitRes.rows.length === 0) return res.status(404).json({ error: 'Split not found' });
    const split = splitRes.rows[0];
    const participantsRes = await req.pool.query(
      'SELECT person_name AS name, paid, balance, description FROM split_participants WHERE split_id = $1',
      [splitId]
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

// Delete a split by id
router.delete('/:id', async (req, res) => {
  const splitId = req.params.id;
  try {
    await req.pool.query('DELETE FROM split_participants WHERE split_id = $1', [splitId]);
    await req.pool.query('DELETE FROM splits WHERE id = $1', [splitId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
