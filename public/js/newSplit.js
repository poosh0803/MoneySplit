// Fetches all people from the backend and updates the global allPeople array
async function fetchAllPeople() {
  try {
    const res = await fetch('/api/people');
    if (!res.ok) throw new Error('Failed to fetch people');
    const data = await res.json();
    window.allPeople = data.map(p => p.name);
  } catch (e) {
    window.allPeople = [];
    console.error('Could not load people:', e);
  }
}

window.allPeople = [];

function createMainTableRow(name, amount = '0', description = '') {
  return `
    <tr>
      <td class="py-2 px-3 border-b border-gray-200 font-medium break-words max-w-[200px]">${name}</td>
      <td class="py-2 px-3 border-b border-gray-200">
        <input type="text" class="participant-description-input w-full border border-gray-300 rounded px-2 py-1 text-sm" 
               data-name="${name}" value="${description}" placeholder="What did they pay for?">
      </td>
      <td class="py-2 px-3 border-b border-gray-200">
        <div class="flex items-center">
          <span class="text-gray-500 mr-1">$</span>
          <input type="number" step="0.01" class="participant-amount-input flex-1 border border-gray-300 rounded px-2 py-1" 
                 data-name="${name}" value="${amount}" placeholder="0.00">
        </div>
      </td>
    </tr>
  `;
}

function createParticipantRow(name, isChecked = false) {
  return `
    <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded participant-row" data-name="${name}" style="cursor:pointer; flex-wrap:wrap;">
      <input type="checkbox" class="participant-checkbox" data-name="${name}" ${isChecked ? 'checked' : ''}>
      <span class="font-medium break-words max-w-[200px]">${name}</span>
    </div>
  `;
}

function getCurrentParticipants() {
  const participants = [];
  const inputs = document.querySelectorAll('.participant-amount-input');
  inputs.forEach(input => {
    const name = input.dataset.name;
    const descriptionInput = document.querySelector(`.participant-description-input[data-name="${name}"]`);
    participants.push({
      name: name,
      amount: input.value || '0',
      description: descriptionInput ? descriptionInput.value : ''
    });
  });
  return participants;
}

function addParticipant() {
  const modal = document.getElementById('participantModal');
  const listDiv = document.getElementById('participantList');
  const currentParticipants = getCurrentParticipants();
  const existingParticipants = new Set(currentParticipants.map(p => p.name));
  const listHTML = allPeople.map(person => {
    const isParticipating = existingParticipants.has(person);
    return createParticipantRow(person, isParticipating);
  }).join('');
  listDiv.innerHTML = listHTML;
  // Add row click event to toggle checkbox
  listDiv.querySelectorAll('.participant-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.tagName.toLowerCase() !== 'input') {
        const checkbox = this.querySelector('.participant-checkbox');
        checkbox.checked = !checkbox.checked;
      }
    });
  });
  modal.classList.remove('hidden');
}

function saveParticipants() {
  const checkboxes = document.querySelectorAll('.participant-checkbox:checked');
  const currentParticipants = getCurrentParticipants();
  const participantData = {};
  currentParticipants.forEach(p => {
    participantData[p.name] = {
      amount: p.amount,
      description: p.description
    };
  });
  const tableBody = document.getElementById('participantsTable');
  const selectedParticipants = [];
  checkboxes.forEach(checkbox => {
    const name = checkbox.dataset.name;
    const data = participantData[name] || { amount: '0', description: '' };
    selectedParticipants.push({ 
      name, 
      amount: data.amount, 
      description: data.description 
    });
  });
  if (selectedParticipants.length === 0) {
    document.getElementById('noParticipants').style.display = 'block';
    tableBody.innerHTML = '';
  } else {
    document.getElementById('noParticipants').style.display = 'none';
    const tableHTML = selectedParticipants.map(p => 
      createMainTableRow(p.name, p.amount, p.description)
    ).join('');
    tableBody.innerHTML = tableHTML;
  }
  document.getElementById('participantModal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAllPeople();
  document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);
  document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('participantModal').classList.add('hidden');
  });
  document.getElementById('saveParticipants').addEventListener('click', saveParticipants);
  document.getElementById('participantModal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });
  document.getElementById('noParticipants').style.display = 'block';
  document.getElementById('caseForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const participants = getCurrentParticipants().map(p => ({
      name: p.name,
      amount: parseFloat(p.amount) || 0
    }));
    if (participants.length === 0) {
      alert('Please add at least one participant');
      return;
    }
    const owe = {};
    let total = 0;
    participants.forEach(person => {
      owe[person.name] = person.amount;
      total += person.amount;
    });
    const pp = total / Object.keys(owe).length;
    const transactions = [];
    for (let i = 0; i < Object.keys(owe).length; i++) {
      const minPerson = Object.keys(owe).reduce((a, b) => owe[a] < owe[b] ? a : b);
      const maxPerson = Object.keys(owe).reduce((a, b) => owe[a] > owe[b] ? a : b);
      const pay = Math.round(Math.min(pp - owe[minPerson], Math.abs(owe[maxPerson] - pp)) * 1000) / 1000;
      if (pay !== 0) {
        owe[minPerson] += pay;
        owe[maxPerson] -= pay;
        transactions.push(`${minPerson} pays $${pay.toFixed(2)} to ${maxPerson}`);
      }
    }
    let resultHTML = '<h3 class="font-semibold text-orange-600 mb-2">Payment Instructions:</h3>';
    if (transactions.length === 0) {
      resultHTML += '<li class="text-gray-600">Everyone has paid equally - no payments needed!</li>';
    } else {
      resultHTML += '<ul class="list-disc pl-6 space-y-1">' +
        transactions.map(transaction => {
          // transaction is like "Alice pays $10.00 to Bob"
          const match = transaction.match(/^(.*?) pays \$(.*?) to (.*)$/);
          if (match) {
            const from = match[1];
            const amount = match[2];
            const to = match[3];
            return `<li><span class='font-semibold text-red-700'>${from}</span> pays <span class='font-bold text-green-700'>$${amount}</span> to <span class='font-semibold text-green-700'>${to}</span></li>`;
          }
          return `<li>${transaction}</li>`;
        }).join('') + '</ul>';
    }
    // Calculate avg for correct balance
    const avg = total / participants.length;
    resultHTML += '<h3 class="font-semibold text-orange-600 mt-4 mb-2">Final Status:</h3>';
    resultHTML += participants.map(p => {
      const description = p.description ? ` (${p.description})` : '';
      const finalBalance = (p.amount - avg);
      const color = finalBalance < 0 ? 'text-red-600' : 'text-green-600';
      return `<li class="py-1 break-words max-w-[300px]"><strong>${p.name}</strong>${description}: contributed $${Number(p.amount).toFixed(2)} → final balance <span class="${color}">$${finalBalance.toFixed(2)}</span></li>`;
    }).join('');
    // Always add Save button under Final Status
    resultHTML += '<div class="mt-4 flex justify-end"><button id="saveFinalStatusBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button></div>';
    document.getElementById('resultList').innerHTML = resultHTML;
    document.getElementById('latest').classList.remove('hidden');
    // Attach event listener for Save button
    document.getElementById('saveFinalStatusBtn').addEventListener('click', async function() {
      const caseTitle = document.getElementById('caseTitle').value;
      // Prepare participantsData with correct balance
      const participantsData = getCurrentParticipants().map(p => ({
        name: p.name,
        amount: parseFloat(p.amount) || 0,
        description: p.description || '',
        balance: (parseFloat(p.amount) || 0) - avg
      }));
      const splitData = {
        title: caseTitle,
        participants: participantsData,
        transactions: transactions,
        finalStatus: participantsData.map(p => ({
          name: p.name,
          contributed: p.amount,
          description: p.description,
          balance: p.balance
        }))
      };
      try {
        const res = await fetch('/api/splits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(splitData)
        });
        if (!res.ok) throw new Error('Failed to save split');
        alert('Split saved successfully!');
      } catch (err) {
        alert('Error saving split: ' + err.message);
      }
    });
  });
});
