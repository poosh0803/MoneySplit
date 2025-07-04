import { Router } from 'express';
const router = Router();

// Get all splits
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.pool.query('SELECT id, title, created_at FROM splits ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
