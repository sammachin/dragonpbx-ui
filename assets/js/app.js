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
  
  // Handle client codec serialization on form submit
  const clientForm = document.getElementById('addClientForm');
  if (clientForm) {
    clientForm.addEventListener('submit', function(e) {
      if (!checkUnaddedInputs(e, ['dialplanDigits', 'dialplanUrl'])) return;

      const authTypeInput = clientForm.querySelector('input[name="authType"]:checked');
      const authType = authTypeInput ? authTypeInput.value : 'standard';

      if (authType === 'standard') {
        const codecs = getSelectedCodecs('codecSelected');
        const existingInput = clientForm.querySelector('input[name="codecs"]');
        if (existingInput) existingInput.remove();

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'codecs';
        hiddenInput.value = JSON.stringify(codecs);
        clientForm.appendChild(hiddenInput);
      }
    });
  }
  
  // Handle trunk form outbound JSON building
  const trunkForm = document.getElementById('addTrunkForm');
  if (trunkForm) {
    trunkForm.addEventListener('submit', function(e) {
      if (!checkUnaddedInputs(e, ['trunkDialplanDigits', 'trunkDialplanUrl', 'inboundIp'])) return;

      const outboundData = {
        host: document.getElementById('outboundHost').value.trim()
      };
      
      const username = document.getElementById('outboundUsername').value.trim();
      const password = document.getElementById('outboundPassword').value.trim();
      
      if (username) outboundData.username = username;
      if (password) outboundData.password = password;
      
      document.getElementById('outboundHidden').value = JSON.stringify(outboundData);
    
    // Handle trunk codecs
    const codecs = getSelectedCodecs('trunkCodecSelected');
    const existingInput = trunkForm.querySelector('input[name="codecs"]');
    if (existingInput) existingInput.remove();

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'codecs';
    hiddenInput.value = JSON.stringify(codecs);
    trunkForm.appendChild(hiddenInput);
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

    setSelectedCodecs('codecAvailable', 'codecSelected', codecs || [], 'addCodec', 'removeCodec', 'moveCodecUp', 'moveCodecDown');

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
  resetCodecPanels('codecAvailable', 'codecSelected', 'addCodec');
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
    
    document.getElementById('codecAvailable').closest('.mb-3').classList.remove('opacity-50', 'pointer-events-none');
  } else {
    standardFields.classList.add('hidden');
    reghookFields.classList.remove('hidden');
    passwordField.required = false;
    reghookField.required = true;

    document.getElementById('codecAvailable').closest('.mb-3').classList.add('opacity-50', 'pointer-events-none');
    resetCodecPanels('codecAvailable', 'codecSelected', 'addCodec');
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

  setSelectedCodecs('trunkCodecAvailable', 'trunkCodecSelected', codecs || [], 'addTrunkCodec', 'removeTrunkCodec', 'moveTrunkCodecUp', 'moveTrunkCodecDown');

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
  resetCodecPanels('trunkCodecAvailable', 'trunkCodecSelected', 'addTrunkCodec');

  // Reset to IP-based authentication (default)
  document.getElementById('trunkAuthTypeIp').checked = true;
  document.getElementById('authTypeHidden').value = 'ip';
  toggleTrunkAuthType();
}

// ========== UNADDED INPUT WARNING ==========

function checkUnaddedInputs(e, fieldIds) {
  // Clear previous warnings
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('ring-2', 'ring-red-500', 'bg-red-50');
  });

  const unadded = fieldIds.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  });

  if (unadded.length > 0) {
    unadded.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
      }
    });
    // Scroll the first highlighted field into view
    const firstEl = document.getElementById(unadded[0]);
    if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Prevent submit, paint highlights, then ask user
    e.preventDefault();
    requestAnimationFrame(() => {
      if (confirm('You have unadded entries in the form. Submit anyway?')) {
        e.target.submit();
      }
    });
    return false;
  }
  return true;
}

// ========== CODEC SELECTION FUNCTIONS ==========

function getSelectedCodecs(selectedContainerId) {
  const container = document.getElementById(selectedContainerId);
  return Array.from(container.querySelectorAll('[data-codec]')).map(el => el.dataset.codec);
}

function createSelectedItem(codec, removeFn, upFn, downFn) {
  const item = document.createElement('div');
  item.dataset.codec = codec;
  item.className = 'flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-sm';
  item.innerHTML = `
    <span class="flex-1 font-medium text-blue-800">${escapeHtml(codec)}</span>
    <button type="button" onclick="${upFn}('${escapeHtml(codec)}')" class="text-gray-400 hover:text-gray-700 px-1" title="Move up"><i class="fas fa-chevron-up text-xs"></i></button>
    <button type="button" onclick="${downFn}('${escapeHtml(codec)}')" class="text-gray-400 hover:text-gray-700 px-1" title="Move down"><i class="fas fa-chevron-down text-xs"></i></button>
    <button type="button" onclick="${removeFn}('${escapeHtml(codec)}')" class="text-red-400 hover:text-red-600 px-1" title="Remove"><i class="fas fa-times text-xs"></i></button>
  `;
  return item;
}

function setSelectedCodecs(availableId, selectedId, codecs, addFn, removeFn, upFn, downFn) {
  const available = document.getElementById(availableId);
  const selected = document.getElementById(selectedId);

  // Show all available items
  available.querySelectorAll('[data-codec]').forEach(el => el.classList.remove('hidden'));

  // Clear selected
  selected.innerHTML = '';

  // Add each codec to selected and hide from available
  codecs.forEach(codec => {
    const availItem = available.querySelector(`[data-codec="${codec}"]`);
    if (availItem) availItem.classList.add('hidden');
    selected.appendChild(createSelectedItem(codec, removeFn, upFn, downFn));
  });
}

function resetCodecPanels(availableId, selectedId, addFn) {
  document.getElementById(availableId).querySelectorAll('[data-codec]').forEach(el => el.classList.remove('hidden'));
  document.getElementById(selectedId).innerHTML = '';
}

// Client codec functions
function addCodec(codec) {
  const available = document.getElementById('codecAvailable');
  const selected = document.getElementById('codecSelected');
  const item = available.querySelector(`[data-codec="${codec}"]`);
  if (item) item.classList.add('hidden');
  selected.appendChild(createSelectedItem(codec, 'removeCodec', 'moveCodecUp', 'moveCodecDown'));
}

function removeCodec(codec) {
  const available = document.getElementById('codecAvailable');
  const selected = document.getElementById('codecSelected');
  const item = selected.querySelector(`[data-codec="${codec}"]`);
  if (item) item.remove();
  const availItem = available.querySelector(`[data-codec="${codec}"]`);
  if (availItem) availItem.classList.remove('hidden');
}

function moveCodecUp(codec) {
  const container = document.getElementById('codecSelected');
  const item = container.querySelector(`[data-codec="${codec}"]`);
  if (item && item.previousElementSibling) {
    container.insertBefore(item, item.previousElementSibling);
  }
}

function moveCodecDown(codec) {
  const container = document.getElementById('codecSelected');
  const item = container.querySelector(`[data-codec="${codec}"]`);
  if (item && item.nextElementSibling) {
    container.insertBefore(item.nextElementSibling, item);
  }
}

// Trunk codec functions
function addTrunkCodec(codec) {
  const available = document.getElementById('trunkCodecAvailable');
  const selected = document.getElementById('trunkCodecSelected');
  const item = available.querySelector(`[data-codec="${codec}"]`);
  if (item) item.classList.add('hidden');
  selected.appendChild(createSelectedItem(codec, 'removeTrunkCodec', 'moveTrunkCodecUp', 'moveTrunkCodecDown'));
}

function removeTrunkCodec(codec) {
  const available = document.getElementById('trunkCodecAvailable');
  const selected = document.getElementById('trunkCodecSelected');
  const item = selected.querySelector(`[data-codec="${codec}"]`);
  if (item) item.remove();
  const availItem = available.querySelector(`[data-codec="${codec}"]`);
  if (availItem) availItem.classList.remove('hidden');
}

function moveTrunkCodecUp(codec) {
  const container = document.getElementById('trunkCodecSelected');
  const item = container.querySelector(`[data-codec="${codec}"]`);
  if (item && item.previousElementSibling) {
    container.insertBefore(item, item.previousElementSibling);
  }
}

function moveTrunkCodecDown(codec) {
  const container = document.getElementById('trunkCodecSelected');
  const item = container.querySelector(`[data-codec="${codec}"]`);
  if (item && item.nextElementSibling) {
    container.insertBefore(item.nextElementSibling, item);
  }
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