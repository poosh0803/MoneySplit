const express = require('express');
const router = express.Router();

// GET /latest - returns the latest split with participants
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
      id: split.id,
      title: split.title,
      created_at: split.created_at,
      participants: participantsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
