const express = require('express');
const router = express.Router();

// Helper to format payment instructions as a string
function formatInstructions(title, participants) {
  let lines = [`Split: ${title}`];
  for (const p of participants) {
    lines.push(`${p.name}: paid $${p.paid} (${p.balance >= 0 ? '+' : ''}${p.balance})`);
  }
  return lines.join('\n');
}

// GET /discord?id=...  (id can be 'latest', empty, or a split id)
router.get('/', async (req, res) => {
  let splitId = req.query.id;
  try {
    let split;
    if (!splitId || splitId === 'latest') {
      const splitRes = await req.pool.query('SELECT id, title FROM splits ORDER BY created_at DESC LIMIT 1');
      if (splitRes.rows.length === 0) return res.send('Invalid owo');
      split = splitRes.rows[0];
    } else {
      const splitRes = await req.pool.query('SELECT id, title FROM splits WHERE id = $1', [splitId]);
      if (splitRes.rows.length === 0) return res.send('Invalid owo');
      split = splitRes.rows[0];
    }
    const participantsRes = await req.pool.query(
      'SELECT person_name AS name, paid, balance FROM split_participants WHERE split_id = $1',
      [split.id]
    );
    if (participantsRes.rows.length === 0) return res.send('Invalid owo');
    const resultStr = formatInstructions(split.title, participantsRes.rows);
    res.send(resultStr);
  } catch (err) {
    console.error('Error in /discord:', err);
    res.send('Invalid owo: ' + (err && err.message ? err.message : err));
  }
});

module.exports = router;
