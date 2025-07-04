document.addEventListener('DOMContentLoaded', () => {
  async function loadPeople() {
    const res = await fetch('/api/people');
    if (!res.ok) {
      document.getElementById('noPeople').textContent = 'Failed to load people.';
      return;
    }
    const data = await res.json();
    const peopleList = document.getElementById('peopleList');
    if (!data || !data.length) {
      document.getElementById('noPeople').textContent = 'No people found. Add one!';
      peopleList.innerHTML = '';
      return;
    }
    document.getElementById('noPeople').textContent = '';
    peopleList.innerHTML = data.map(p =>
      `<tr class="hover:bg-gray-50">
        <td class="px-4 py-2">${p.name}</td>
        <td class="px-4 py-2">${p.phone}</td>
        <td class="px-4 py-2 text-right">
          <button data-id="${p.id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors">Delete</button>
        </td>
      </tr>`
    ).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this person?')) return;
        const id = this.getAttribute('data-id');
        const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadPeople();
        } else {
          alert('Failed to delete person.');
        }
      });
    });
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
      alert('Failed to add person.');
    }
  });

  loadPeople();
});