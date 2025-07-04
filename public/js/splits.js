// Splits page logic

async function loadSplits() {
  const res = await fetch('/api/splits');
  if (!res.ok) {
    document.getElementById('noSplits').textContent = 'Failed to load splits.';
    return;
  }
  const data = await res.json();
  if (!data || !data.length) {
    document.getElementById('noSplits').textContent = 'No splits found.';
    document.getElementById('splitsList').innerHTML = '';
    return;
  }
  document.getElementById('noSplits').textContent = '';
  document.getElementById('splitsList').innerHTML = data.map(s =>
    `<tr class="hover:bg-gray-50">
      <td class="px-4 py-2">
        <button class="split-info text-left text-orange-700 hover:underline" data-id="${s.id}" data-title="${s.title}" data-created="${s.created_at}">${s.title}</button>
      </td>
      <td class="px-4 py-2">${new Date(s.created_at).toLocaleString()}</td>
      <td class="px-2 py-2 text-center">
        <button class="delete-split text-red-500 hover:text-red-700 text-lg font-bold" title="Delete" data-id="${s.id}">&times;</button>
      </td>
    </tr>`
  ).join('');

  // Add info popup event listeners
  document.querySelectorAll('.split-info').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.getAttribute('data-id');
      const title = this.getAttribute('data-title');
      const created = this.getAttribute('data-created');
      // Fetch split participants for the correct split id
      let details = '';
      try {
        const res = await fetch(`/api/splits/${id}`);
        if (res.ok) {
          const split = await res.json();
          if (split && split.result) {
            details = '<div class="mb-2 font-medium">Participants:</div>' +
              '<table class="min-w-full mb-2 text-sm"><thead><tr>' +
              '<th class="px-2 py-1 text-left">Name</th>' +
              '<th class="px-2 py-1 text-left">Paid</th>' +
              '<th class="px-2 py-1 text-left">Balance</th>' +
              '<th class="px-2 py-1 text-left">Description</th>' +
              '</tr></thead><tbody>' +
              split.result.map(p => {
                const color = p.balance < 0 ? 'text-red-600' : 'text-green-600';
                return `<tr><td class="px-2 py-1">${p.name}</td><td class="px-2 py-1">$${Number(p.paid).toFixed(2)}</td><td class="px-2 py-1 font-semibold ${color}">${p.balance < 0 ? 'owes' : 'gets'} $${Math.abs(Number(p.balance)).toFixed(2)}</td><td class="px-2 py-1">${p.description || ''}</td></tr>`;
              }).join('') +
              '</tbody></table>';
            // Add payment instructions
            let balances = split.result.map(p => ({ name: p.name, balance: Number(p.balance) }));
            let d = balances.filter(p => p.balance < -0.01).map(p => ({ ...p }));
            let c = balances.filter(p => p.balance > 0.01).map(p => ({ ...p }));
            let i = 0, j = 0;
            let debts = [];
            while (i < d.length && j < c.length) {
              let pay = Math.min(Math.abs(d[i].balance), c[j].balance);
              debts.push(`<li><span class='font-semibold text-red-700'>${d[i].name}</span> pays <span class='font-bold text-green-700'>$${pay.toFixed(2)}</span> to <span class='font-semibold text-green-700'>${c[j].name}</span></li>`);
              d[i].balance += pay;
              c[j].balance -= pay;
              if (Math.abs(d[i].balance) < 0.01) i++;
              if (c[j].balance < 0.01) j++;
            }
            details += '<div class="mt-4 mb-2 text-sm text-gray-700 font-medium">Payment Instructions:</div>';
            if (debts.length > 0) {
              details += `<ul class='list-disc pl-6 space-y-1'>${debts.join('')}</ul>`;
            } else {
              details += '<div class="text-gray-600">Everyone has paid equally - no payments needed!</div>';
            }
          }
        }
      } catch {}
      showSplitInfo(title, created, details);
    });
  });

  // Add delete event listeners
  document.querySelectorAll('.delete-split').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this split?')) return;
      try {
        const res = await fetch(`/api/splits/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete split');
        loadSplits();
      } catch (err) {
        alert('Error deleting split: ' + err.message);
      }
    });
  });
}

function showSplitInfo(title, created, detailsHtml) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closeSplitModal">&times;</button>
      <h3 class="text-lg font-semibold text-orange-600 mb-2">Split Info</h3>
      <div class="mb-2"><span class="font-medium">Title:</span> ${title}</div>
      <div class="mb-2"><span class="font-medium">Created:</span> ${new Date(created).toLocaleString()}</div>
      ${detailsHtml || '<div class="text-gray-500">No participant details available.</div>'}
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeSplitModal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

document.addEventListener('DOMContentLoaded', loadSplits);
