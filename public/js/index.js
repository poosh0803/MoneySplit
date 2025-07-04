async function loadLatestSplit() {
  // Fetch latest split from backend
  const res = await fetch('/api/newSplit/latest');
  if (!res.ok) {
    document.getElementById('noSplit').textContent = 'Failed to load latest split.';
    return;
  }
  const data = await res.json();
  if (!data || !data.result || !data.title) {
    document.getElementById('noSplit').textContent = 'No split found. Create one!';
    document.getElementById('latestTitle').textContent = '';
    document.getElementById('resultList').innerHTML = '';
    return;
  }
  document.getElementById('latestTitle').innerHTML = `
    <span class="text-lg font-bold text-orange-700">${data.title}</span>
    <span class="ml-2 text-gray-500 text-xs">${data.created_at ? '(' + new Date(data.created_at).toLocaleString() + ')' : ''}</span>
  `;
  // Payment instructions
  let paymentInstructions = '';
  if (data.result && data.result.length > 1) {
    // Calculate payment instructions like newSplit
    const debtors = data.result.filter(p => p.balance < 0).map(p => ({ ...p }));
    const creditors = data.result.filter(p => p.balance > 0).map(p => ({ ...p }));
    paymentInstructions = '<div class="mt-4 mb-2 text-sm text-gray-700 font-medium">Payment Instructions:</div>';
    let debts = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      let pay = Math.min(Math.abs(debtors[i].balance), creditors[j].balance);
      debts.push(`<li><span class='font-semibold text-red-700'>${debtors[i].name}</span> pays <span class='font-semibold text-green-700'>$${pay.toFixed(2)}</span> to <span class='font-semibold text-green-700'>${creditors[j].name}</span></li>`);
      debtors[i].balance += pay;
      creditors[j].balance -= pay;
      if (Math.abs(debtors[i].balance) < 0.01) i++;
      if (creditors[j].balance < 0.01) j++;
    }
    if (debts.length > 0) {
      paymentInstructions += `<ul class='list-disc pl-6 space-y-1'>${debts.join('')}</ul>`;
    } else {
      paymentInstructions += '<div class="text-gray-600">Everyone has paid equally - no payments needed!</div>';
    }
  }
  const resultHTML = `
    <table class="min-w-full divide-y divide-gray-200 mt-2">
      <thead>
        <tr>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${data.result.map(p => {
          const color = p.balance < 0 ? 'text-red-600' : 'text-green-600';
          return `<tr class="hover:bg-gray-50">
            <td class="px-4 py-2">
              <button class="person-info text-left text-orange-700 hover:underline" data-name="${p.name}" data-paid="${p.paid}" data-balance="${p.balance}">${p.name}</button>
            </td>
            <td class="px-4 py-2">$${Number(p.paid).toFixed(2)}</td>
            <td class="px-4 py-2 font-semibold ${color}">${p.balance < 0 ? 'owes' : 'gets'} $${Math.abs(p.balance)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${paymentInstructions}
    <h3 class="font-semibold text-orange-600 mt-4 mb-2">Final Status:</h3>
    <ul>
      ${data.result.map(p => {
        const color = p.balance < 0 ? 'text-red-600' : 'text-green-600';
        const desc = p.description ? ` (${p.description})` : '';
        return `<li class="py-1 break-words max-w-[300px]"><strong>${p.name}</strong>${desc}: contributed $${Number(p.paid).toFixed(2)} → final balance <span class="${color}">$${Number(p.balance).toFixed(2)}</span></li>`;
      }).join('')}
    </ul>
  `;
  document.getElementById('resultList').innerHTML = resultHTML;
  // Add info popup event listeners
  document.querySelectorAll('.person-info').forEach(btn => {
    btn.addEventListener('click', function() {
      const name = this.getAttribute('data-name');
      // Try to find the person in data.result for more info
      const person = data.result.find(p => p.name === name);
      if (person) {
        showPersonInfo(person.name, person.paid, person.balance);
      } else {
        showPersonInfo(name, '', '');
      }
    });
  });
  // Add payment instruction popup event listeners
  document.querySelectorAll('.pay-info').forEach(btn => {
    btn.addEventListener('click', function() {
      const from = this.getAttribute('data-from');
      const to = this.getAttribute('data-to');
      const amount = this.getAttribute('data-amount');
      showPayInfo(from, to, amount);
    });
  });
  document.getElementById('noSplit').textContent = '';
}

document.addEventListener('DOMContentLoaded', loadLatestSplit);

// Popup for person info
function showPersonInfo(name, paid, balance) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closePersonModal">&times;</button>
      <h3 class="text-lg font-semibold text-orange-600 mb-2">Person Info</h3>
      <div class="mb-2"><span class="font-medium">Name:</span> ${name}</div>
      <div class="mb-2"><span class="font-medium">Paid:</span> $${Number(paid).toFixed(2)}</div>
      <div class="mb-2"><span class="font-medium">Balance:</span> $${Number(balance).toFixed(2)}</div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closePersonModal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// Popup for payment instruction
function showPayInfo(from, to, amount) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closePayModal">&times;</button>
      <h3 class="text-lg font-semibold text-blue-600 mb-2">Payment Detail</h3>
      <div class="mb-2"><span class="font-medium">From:</span> ${from}</div>
      <div class="mb-2"><span class="font-medium">To:</span> ${to}</div>
      <div class="mb-2"><span class="font-medium">Amount:</span> $${Number(amount).toFixed(2)}</div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closePayModal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}
