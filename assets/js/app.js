/**
 * app.js
 * Client-side JavaScript for form handling
 */

// Global variables for form state
let dialplanData = {};
let editingClientId = null;
let trunkDialplanData = {};
let editingTrunkId = null;
let inboundIps = [];
let currentDomainId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Get domain ID from page if available
  const domainIdElement = document.querySelector('[data-domain-id]');
  if (domainIdElement) {
    currentDomainId = domainIdElement.getAttribute('data-domain-id');
  }
  
  // Handle codec checkbox conversion to JSON
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const authTypeInput = form.querySelector('input[name="authType"]:checked');
      const authType = authTypeInput ? authTypeInput.value : 'standard';
      
      if (authType === 'standard') {
        const codecCheckboxes = form.querySelectorAll('input[name="codecs[]"]:checked:not(:disabled)');
        if (codecCheckboxes.length > 0) {
          const existingInput = form.querySelector('input[name="codecs"]');
          if (existingInput) {
            existingInput.remove();
          }
          
          const codecs = Array.from(codecCheckboxes).map(cb => cb.value);
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'codecs';
          hiddenInput.value = JSON.stringify(codecs);
          form.appendChild(hiddenInput);
          
          codecCheckboxes.forEach(cb => cb.disabled = true);
        }
      }
    });
  });
  
  // Handle trunk form outbound JSON building
  const trunkForm = document.getElementById('addTrunkForm');
  if (trunkForm) {
    trunkForm.addEventListener('submit', function(e) {
      const outboundData = {
        host: document.getElementById('outboundHost').value.trim()
      };
      
      const username = document.getElementById('outboundUsername').value.trim();
      const password = document.getElementById('outboundPassword').value.trim();
      
      if (username) outboundData.username = username;
      if (password) outboundData.password = password;
      
      document.getElementById('outboundHidden').value = JSON.stringify(outboundData);
    });
  }
});

// ========== CLIENT DIALPLAN FUNCTIONS ==========

function addDialplanEntry() {
  const digits = document.getElementById('dialplanDigits').value.trim();
  const url = document.getElementById('dialplanUrl').value.trim();
  
  if (!digits || !url) {
    alert('Please enter both digits and URL');
    return;
  }
  
  dialplanData[digits] = url;
  updateDialplanDisplay();
  
  document.getElementById('dialplanDigits').value = '';
  document.getElementById('dialplanUrl').value = '';
}

function removeDialplanEntry(digits) {
  delete dialplanData[digits];
  updateDialplanDisplay();
}

function updateDialplanDisplay() {
  const container = document.getElementById('dialplanEntries');
  const hidden = document.getElementById('dialplanHidden');
  
  if (!container || !hidden) return;
  
  container.innerHTML = '';
  
  Object.entries(dialplanData).forEach(([digits, url]) => {
    const entry = document.createElement('div');
    entry.className = 'flex items-center gap-2 bg-gray-50 p-2 rounded';
    entry.innerHTML = `
      <span class="font-semibold text-sm">${escapeHtml(digits)}</span>
      <span class="text-gray-400">→</span>
      <span class="flex-1 text-sm text-gray-600 break-all">${escapeHtml(url)}</span>
      <button type="button" onclick="removeDialplanEntry('${escapeHtml(digits)}')" class="text-red-600 hover:text-red-800">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(entry);
  });
  
  hidden.value = JSON.stringify(dialplanData);
}

// ========== CLIENT FORM FUNCTIONS ==========

function editClient(id, username, authType, password, reghook, codecs, dialplan) {
  editingClientId = id;
  
  document.getElementById('clientForm').classList.remove('hidden');
  document.getElementById('clientFormTitle').textContent = 'Edit Client';
  
  const form = document.getElementById('addClientForm');
  form.action = '/api/clients/' + id + '?_method=PUT';
  document.getElementById('clientFormMethod').value = 'PUT';
  document.getElementById('clientId').value = id;
  
  document.getElementById('clientUsername').value = username;
  
  document.querySelector(`input[name="authType"][value="${authType}"]`).checked = true;
  toggleAuthFields();
  
  if (authType === 'standard') {
    document.getElementById('passwordField').value = password;
    
    document.querySelectorAll('.codec-checkbox').forEach(cb => {
      cb.checked = codecs.includes(cb.value);
    });
    
    dialplanData = dialplan || {};
    updateDialplanDisplay();
  } else {
    document.getElementById('reghookField').value = reghook;
  }
  
  document.getElementById('clientForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleClientForm() {
  const form = document.getElementById('clientForm');
  form.classList.toggle('hidden');
  
  if (!form.classList.contains('hidden')) {
    resetClientForm();
  }
}

function cancelClientEdit() {
  document.getElementById('clientForm').classList.add('hidden');
  resetClientForm();
}

function resetClientForm() {
  editingClientId = null;
  document.getElementById('clientFormTitle').textContent = 'New Client';
  
  if (currentDomainId) {
    document.getElementById('addClientForm').action = '/api/domains/' + currentDomainId + '/clients';
  }
  
  document.getElementById('clientFormMethod').value = '';
  document.getElementById('clientId').value = '';
  document.getElementById('addClientForm').reset();
  dialplanData = {};
  updateDialplanDisplay();
  toggleAuthFields();
}

function toggleAuthFields() {
  const authType = document.querySelector('input[name="authType"]:checked');
  if (!authType) return;
  
  const authTypeValue = authType.value;
  const standardFields = document.getElementById('standardAuthFields');
  const reghookFields = document.getElementById('reghookAuthFields');
  const passwordField = document.getElementById('passwordField');
  const reghookField = document.getElementById('reghookField');
  
  if (authTypeValue === 'standard') {
    standardFields.classList.remove('hidden');
    reghookFields.classList.add('hidden');
    passwordField.required = true;
    reghookField.required = false;
    
    document.querySelectorAll('.codec-checkbox').forEach(cb => cb.disabled = false);
  } else {
    standardFields.classList.add('hidden');
    reghookFields.classList.remove('hidden');
    passwordField.required = false;
    reghookField.required = true;
    
    document.querySelectorAll('.codec-checkbox').forEach(cb => {
      cb.disabled = true;
      cb.checked = false;
    });
  }
}

// ========== TRUNK DIALPLAN FUNCTIONS ==========

function addTrunkDialplanEntry() {
  const digits = document.getElementById('trunkDialplanDigits').value.trim();
  const url = document.getElementById('trunkDialplanUrl').value.trim();
  
  if (!digits || !url) {
    alert('Please enter both digits and URL');
    return;
  }
  
  trunkDialplanData[digits] = url;
  updateTrunkDialplanDisplay();
  
  document.getElementById('trunkDialplanDigits').value = '';
  document.getElementById('trunkDialplanUrl').value = '';
}

function removeTrunkDialplanEntry(digits) {
  delete trunkDialplanData[digits];
  updateTrunkDialplanDisplay();
}

function updateTrunkDialplanDisplay() {
  const container = document.getElementById('trunkDialplanEntries');
  const hidden = document.getElementById('trunkDialplanHidden');
  
  if (!container || !hidden) return;
  
  container.innerHTML = '';
  
  Object.entries(trunkDialplanData).forEach(([digits, url]) => {
    const entry = document.createElement('div');
    entry.className = 'flex items-center gap-2 bg-gray-50 p-2 rounded';
    entry.innerHTML = `
      <span class="font-semibold text-sm">${escapeHtml(digits)}</span>
      <span class="text-gray-400">→</span>
      <span class="flex-1 text-sm text-gray-600 break-all">${escapeHtml(url)}</span>
      <button type="button" onclick="removeTrunkDialplanEntry('${escapeHtml(digits)}')" class="text-red-600 hover:text-red-800">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(entry);
  });
  
  hidden.value = JSON.stringify(trunkDialplanData);
}

// ========== TRUNK INBOUND IP FUNCTIONS ==========

function addInboundEntry() {
  const ip = document.getElementById('inboundIp').value.trim();
  const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  
  if (!ip) {
    return;
  }
  
  if (!cidrPattern.test(ip)) {
    alert('Please enter a valid CIDR notation (e.g., 192.168.1.0/24)');
    return;
  }
  
  if (inboundIps.includes(ip)) {
    alert('This IP is already added');
    return;
  }
  
  inboundIps.push(ip);
  updateInboundDisplay();
  
  document.getElementById('inboundIp').value = '';
}

function removeInboundEntry(ip) {
  inboundIps = inboundIps.filter(i => i !== ip);
  updateInboundDisplay();
}

function updateInboundDisplay() {
  const container = document.getElementById('inboundEntries');
  const hidden = document.getElementById('inboundHidden');
  
  if (!container || !hidden) return;
  
  container.innerHTML = '';
  
  inboundIps.forEach(ip => {
    const entry = document.createElement('div');
    entry.className = 'flex items-center gap-2 bg-green-50 p-2 rounded';
    entry.innerHTML = `
      <span class="flex-1 text-sm font-mono text-green-700">${escapeHtml(ip)}</span>
      <button type="button" onclick="removeInboundEntry('${escapeHtml(ip)}')" class="text-red-600 hover:text-red-800">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(entry);
  });
  
  hidden.value = JSON.stringify(inboundIps);
}

// ========== TRUNK FORM FUNCTIONS ==========

function editTrunk(id, inbound, outbound, dialplan) {
  editingTrunkId = id;
  
  document.getElementById('trunkForm').classList.remove('hidden');
  document.getElementById('trunkFormTitle').textContent = 'Edit Trunk';
  
  const form = document.getElementById('addTrunkForm');
  form.action = '/api/trunks/' + id + '?_method=PUT';
  document.getElementById('trunkFormMethod').value = 'PUT';
  document.getElementById('trunkId').value = id;
  
  inboundIps = inbound || [];
  updateInboundDisplay();
  
  document.getElementById('outboundHost').value = outbound.host || '';
  document.getElementById('outboundUsername').value = outbound.username || '';
  document.getElementById('outboundPassword').value = outbound.password || '';
  
  trunkDialplanData = dialplan || {};
  updateTrunkDialplanDisplay();
  
  document.getElementById('trunkForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleTrunkForm() {
  const form = document.getElementById('trunkForm');
  form.classList.toggle('hidden');
  
  if (!form.classList.contains('hidden')) {
    resetTrunkForm();
  }
}

function cancelTrunkEdit() {
  document.getElementById('trunkForm').classList.add('hidden');
  resetTrunkForm();
}

function resetTrunkForm() {
  editingTrunkId = null;
  document.getElementById('trunkFormTitle').textContent = 'New Trunk';
  
  if (currentDomainId) {
    document.getElementById('addTrunkForm').action = '/api/domains/' + currentDomainId + '/trunks';
  }
  
  document.getElementById('trunkFormMethod').value = '';
  document.getElementById('trunkId').value = '';
  document.getElementById('addTrunkForm').reset();
  trunkDialplanData = {};
  inboundIps = [];
  updateTrunkDialplanDisplay();
  updateInboundDisplay();
}

// ========== UTILITY FUNCTIONS ==========

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}