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
        <td class="px-4 py-2 max-w-[160px] truncate">
          <button class="person-info text-left text-orange-700 hover:underline" data-id="${p.id}" data-name="${p.name}" data-phone="${p.phone}" title="${p.name}">${p.name.length > 20 ? p.name.slice(0, 17) + '…' : p.name}</button>
        </td>
        <td class="px-4 py-2 max-w-[100px] truncate">${p.phone}</td>
        <td class="px-4 py-2 text-right">
          <button data-id="${p.id}" data-name="${p.name}" data-phone="${p.phone}" class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 transition-colors">Edit</button>
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

    // Add edit event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        const phone = this.getAttribute('data-phone');
        showEditPersonModal(id, name, phone);
      });
    });

    // Add info popup event listeners
    document.querySelectorAll('.person-info').forEach(btn => {
      btn.addEventListener('click', function() {
        const name = this.getAttribute('data-name');
        const phone = this.getAttribute('data-phone');
        showPersonInfo(name, phone);
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

// Popup for person info
function showPersonInfo(name, phone) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closePersonModal">&times;</button>
      <h3 class="text-lg font-semibold text-orange-600 mb-2">Person Info</h3>
      <div class="mb-2"><span class="font-medium">Name:</span> ${name}</div>
      <div class="mb-2"><span class="font-medium">Phone:</span> ${phone}</div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closePersonModal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// Edit person modal
function showEditPersonModal(id, name, phone) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closeEditModal">&times;</button>
      <h3 class="text-lg font-semibold text-blue-600 mb-2">Edit Person</h3>
      <form id="editPersonForm">
        <div class="mb-2">
          <label class="block text-sm font-medium">Name</label>
          <input type="text" id="editPersonName" class="w-full border border-gray-300 p-2 rounded" value="${name}" required>
        </div>
        <div class="mb-2">
          <label class="block text-sm font-medium">Phone Number</label>
          <input type="text" id="editPersonPhone" class="w-full border border-gray-300 p-2 rounded" value="${phone}" required>
        </div>
        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeEditModal').onclick = () => {
    modal.remove();
    location.reload();
  };
  modal.onclick = e => { if (e.target === modal) { modal.remove(); location.reload(); } };
  document.getElementById('editPersonForm').onsubmit = async function(e) {
    e.preventDefault();
    const newName = document.getElementById('editPersonName').value.trim();
    const newPhone = document.getElementById('editPersonPhone').value.trim();
    if (!newName || !newPhone) return;
    const res = await fetch(`/api/people/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, phone: newPhone })
    });
    if (res.ok) {
      modal.remove();
      location.reload();
    } else {
      alert('Failed to update person.');
    }
  };
}