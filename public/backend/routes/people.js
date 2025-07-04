import { Router } from 'express';
const router = Router();

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

export default router;
