document.addEventListener('DOMContentLoaded', () => {
  async function loadPeople() {
    const res = await fetch('/api/people');
    if (!res.ok) {
      document.getElementById('noPeople').textContent = 'Failed to load people.';
      return;
    }
    const data = await res.json();
    if (!data || !data.length) {
      document.getElementById('noPeople').textContent = 'No people found. Add one!';
      document.getElementById('peopleList').innerHTML = '';
      return;
    }
    document.getElementById('noPeople').textContent = '';
    document.getElementById('peopleList').innerHTML = data.map(p =>
      `<li><strong>${p.name}</strong> (${p.phone})</li>`
    ).join('');
  }

  document.getElementById('personForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('personName').value.trim();
    const phone = document.getElementById('personPhone').value.trim();
    if (!name || !phone) return;
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    if (res.ok) {
      document.getElementById('personForm').reset();
      loadPeople();
    } else {
      let msg = 'Failed to add person.';
      try {
        const err = await res.json();
        if (err && err.error) msg += ' ' + err.error;
      } catch {}
      alert(msg);
      // Optionally log for debugging
      console.error('Add person error:', res.status, res.statusText);
    }
  });

  loadPeople();
});