const express = require('express');
const router = express.Router();

// Get all people
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.pool.query('SELECT id, name, phone FROM people ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a new person
router.post('/', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Missing name or phone' });
  try {
    await req.pool.query('INSERT INTO people (name, phone) VALUES ($1, $2)', [name, phone]);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a person by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.pool.query('DELETE FROM people WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Person not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
