const express = require('express');
const router = express.Router();

// Helper to compute payment instructions, final contributions, and descriptions
function computeInstructions(participants) {
  // participants: [{name, paid, balance, description}]
  const owe = {};
  let total = 0;
  participants.forEach(p => {
    owe[p.name] = parseFloat(p.paid);
    total += parseFloat(p.paid);
  });
  const names = Object.keys(owe);
  const pp = total / names.length;
  const transactions = [];
  // Clone balances for calculation
  const balances = {};
  names.forEach(name => {
    balances[name] = +(owe[name] - pp).toFixed(2);
  });
  // Greedy settle
  let debtors = names.filter(n => balances[n] < 0);
  let creditors = names.filter(n => balances[n] > 0);
  while (debtors.length && creditors.length) {
    let d = debtors[0], c = creditors[0];
    let amount = Math.min(-balances[d], balances[c]);
    amount = +amount.toFixed(2);
    if (amount > 0.009) {
      transactions.push(`${d} pays $${amount.toFixed(2)} to ${c}`);
      balances[d] += amount;
      balances[c] -= amount;
    }
    debtors = names.filter(n => balances[n] < -0.009);
    creditors = names.filter(n => balances[n] > 0.009);
  }
  let paymentInstructions = [];
  if (transactions.length === 0) {
    paymentInstructions.push('Everyone has paid equally - no payments needed!');
  } else {
    paymentInstructions = transactions;
  }
  // Final contribution: everyone gets the average (like newsplit's final status)
  let finalContribution = names.map(name =>
    `${name}: contributed $${owe[name].toFixed(2)} → final contribution $${pp.toFixed(3)}`
  );
  // Descriptions object
  let descriptions = {};
  names.forEach(name => {
    const p = participants.find(x => x.name === name);
    descriptions[name] = (p && p.description) ? p.description : 'money';
  });
  return { paymentInstructions, finalContribution, descriptions };
}

// GET /discord?id=...  (id can be 'latest', empty, or a split id)
router.get('/', async (req, res) => {
  let splitId = req.query.id;
  try {
    let split;
    if (!splitId || splitId === 'latest') {
      const splitRes = await req.pool.query('SELECT id, title FROM splits ORDER BY created_at DESC LIMIT 1');
      if (splitRes.rows.length === 0) return res.json({ error: 'Invalid owo' });
      split = splitRes.rows[0];
    } else {
      const splitRes = await req.pool.query('SELECT id, title FROM splits WHERE id = $1', [splitId]);
      if (splitRes.rows.length === 0) return res.json({ error: 'Invalid owo' });
      split = splitRes.rows[0];
    }
    const participantsRes = await req.pool.query(
      'SELECT person_name AS name, paid, balance, description FROM split_participants WHERE split_id = $1',
      [split.id]
    );
    if (participantsRes.rows.length === 0) return res.json({ error: 'Invalid owo' });
    const { paymentInstructions, finalContribution, descriptions } = computeInstructions(participantsRes.rows);
    res.json({ paymentInstructions, finalContribution, descriptions });
  } catch (err) {
    console.error('Error in /discord:', err);
    res.json({ error: 'Invalid owo', details: err && err.message ? err.message : err });
  }
});

module.exports = router;
