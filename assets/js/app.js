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
    
    // Handle trunk codecs
    const trunkCodecCheckboxes = trunkForm.querySelectorAll('input[name="trunkCodecs[]"]:checked:not(:disabled)');
    if (trunkCodecCheckboxes.length > 0) {
    const existingInput = trunkForm.querySelector('input[name="codecs"]');
    if (existingInput) {
        existingInput.remove();
    }
    
    const codecs = Array.from(trunkCodecCheckboxes).map(cb => cb.value);
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'codecs';
    hiddenInput.value = JSON.stringify(codecs);
    trunkForm.appendChild(hiddenInput);
    
    trunkCodecCheckboxes.forEach(cb => cb.disabled = true);
    }
    });
  }

  // Initialize trunk auth type toggle
  const trunkAuthTypeRadios = document.querySelectorAll('input[name="trunkAuthType"]');
  if (trunkAuthTypeRadios.length > 0) {
    // Set initial state based on checked radio button
    const ipBasedFields = document.getElementById('ipBasedFields');
    const registrationFields = document.getElementById('registrationFields');
    if (ipBasedFields && registrationFields) {
      toggleTrunkAuthType();
    }
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

function editClient(id, label, username, authType, password, reghook, codecs, dialplan) {
  editingClientId = id;
  
  document.getElementById('clientForm').classList.remove('hidden');
  document.getElementById('clientFormTitle').textContent = 'Edit Client';
  
  const form = document.getElementById('addClientForm');
  form.action = '/api/clients/' + id + '?_method=PUT';
  document.getElementById('clientFormMethod').value = 'PUT';
  document.getElementById('clientId').value = id;
  
  document.getElementById('clientLabel').value = label;
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

function toggleTrunkAuthType() {
  const authTypeElement = document.querySelector('input[name="trunkAuthType"]:checked');
  if (!authTypeElement) {
    console.log('No trunkAuthType radio button is checked');
    return;
  }

  const authType = authTypeElement.value;
  const ipBasedFields = document.getElementById('ipBasedFields');
  const authenticationFields = document.getElementById('authenticationFields');
  const registrationFields = document.getElementById('registrationFields');
  const authTypeHidden = document.getElementById('authTypeHidden');

  console.log('toggleTrunkAuthType called - authType:', authType);
  console.log('ipBasedFields:', ipBasedFields);
  console.log('authenticationFields:', authenticationFields);
  console.log('registrationFields:', registrationFields);

  if (!ipBasedFields || !authenticationFields || !registrationFields) {
    console.log('One or more field containers not found');
    return;
  }

  // Update hidden field for form submission
  if (authTypeHidden) {
    authTypeHidden.value = authType;
  }

  // Hide all fields first
  ipBasedFields.classList.add('hidden');
  authenticationFields.classList.add('hidden');
  registrationFields.classList.add('hidden');

  // Show the selected fields
  if (authType === 'ip') {
    console.log('Showing IP-based fields');
    ipBasedFields.classList.remove('hidden');
  } else if (authType === 'authentication') {
    console.log('Showing authentication fields');
    authenticationFields.classList.remove('hidden');
  } else if (authType === 'registration') {
    console.log('Showing registration fields');
    registrationFields.classList.remove('hidden');
  }
}

function editTrunkFromData(button) {
  const id = button.dataset.trunkId;
  const label = button.dataset.trunkLabel;
  const authType = button.dataset.trunkAuthtype;
  const inbound = JSON.parse(button.dataset.trunkInbound);
  const outbound = JSON.parse(button.dataset.trunkOutbound);
  const codecs = JSON.parse(button.dataset.trunkCodecs);
  const dialplan = JSON.parse(button.dataset.trunkDialplan);
  const regUsername = button.dataset.trunkRegUsername;
  const regPassword = button.dataset.trunkRegPassword;
  const regServer = button.dataset.trunkRegServer;
  const authUsername = button.dataset.trunkAuthUsername;
  const authPassword = button.dataset.trunkAuthPassword;

  editTrunk(id, label, authType, inbound, outbound, codecs, dialplan, regUsername, regPassword, regServer, authUsername, authPassword);
}

function editTrunk(id, label, authType, inbound, outbound, codecs, dialplan, regUsername, regPassword, regServer, authUsername, authPassword) {
  editingTrunkId = id;

  document.getElementById('trunkForm').classList.remove('hidden');
  document.getElementById('trunkFormTitle').textContent = 'Edit Trunk';

  const form = document.getElementById('addTrunkForm');
  form.action = '/api/trunks/' + id + '?_method=PUT';
  document.getElementById('trunkFormMethod').value = 'PUT';
  document.getElementById('trunkId').value = id;

  document.getElementById('trunkLabel').value = label;

  // Set authentication type
  let authTypeRadio;
  if (authType === 'registration') {
    authTypeRadio = document.getElementById('trunkAuthTypeRegistration');
  } else if (authType === 'authentication') {
    authTypeRadio = document.getElementById('trunkAuthTypeAuthentication');
  } else {
    authTypeRadio = document.getElementById('trunkAuthTypeIp');
  }
  authTypeRadio.checked = true;
  toggleTrunkAuthType();

  // Set IP-based fields
  inboundIps = inbound || [];
  updateInboundDisplay();

  document.getElementById('outboundHost').value = outbound.host || '';
  document.getElementById('outboundUsername').value = outbound.username || '';
  document.getElementById('outboundPassword').value = outbound.password || '';

  // Set authentication fields
  document.getElementById('authenticationUsername').value = authUsername || '';
  document.getElementById('authenticationPassword').value = authPassword || '';

  // Set registration fields
  document.getElementById('registrationUsername').value = regUsername || '';
  document.getElementById('registrationPassword').value = regPassword || '';
  document.getElementById('registrationServer').value = regServer || '';

  document.querySelectorAll('.trunk-codec-checkbox').forEach(cb => {
    cb.checked = codecs.includes(cb.value);
  });

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

  // Reset to IP-based authentication (default)
  document.getElementById('trunkAuthTypeIp').checked = true;
  document.getElementById('authTypeHidden').value = 'ip';
  toggleTrunkAuthType();
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