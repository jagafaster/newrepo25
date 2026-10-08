/**
 * app.js — Main application: UI initialization, event listeners,
 *          tab navigation, rendering, modal handling, state management.
 */

// ── Central State ────────────────────────────────────────────────────────────
let vmConfig = {
  subscription: 'sub-students',
  resourceGroup: { mode: 'new', name: 'student-vm-rg' },
  vmName: '',
  region: '',
  availability: { type: 'none', zone: '' },
  securityType: 'trustedlaunch',
  image: '',
  architecture: 'x64',
  spot: { enabled: false, evictionType: 'deallocate', maxPrice: '' },
  size: '',
  administrator: {
    authType: 'ssh',
    username: '',
    password: '',
    confirmPassword: '',
    sshKey: ''
  },
  inboundPorts: [],
  disks: {
    osDisk: { type: 'premium-ssd', deleteWithVm: true, caching: 'readwrite' },
    dataDisks: []
  },
  networking: {
    vnet: { mode: 'new', name: 'student-vnet', addressSpace: '10.0.0.0/16' },
    subnet: { name: 'web-subnet', range: '10.0.1.0/24' },
    publicIp: { mode: 'new', name: '', sku: 'Standard', assignment: 'Static' },
    nic: { name: '' },
    nsg: { mode: 'basic', customRules: [] },
    nsgName: '',
    loadBalancing: 'none'
  },
  management: {
    defenderForCloud: true,
    bootDiagnostics: true,
    osGuestDiagnostics: false,
    autoShutdown: { enabled: false, time: '19:00', timezone: 'India Standard Time' },
    identity: { systemAssigned: false, userAssigned: '' }
  },
  monitoring: {
    azureMonitor: true,
    metrics: true,
    alerts: false,
    logCollection: false
  },
  advanced: {
    extensions: [],
    customData: '',
    hostGroup: '',
    host: '',
    proximityPlacementGroup: '',
    encryptionAtHost: false
  },
  tags: []
};

// ── App State ────────────────────────────────────────────────────────────────
let appState = {
  currentTab: 'basics',
  practiceMode: false,
  challengeMode: false,
  currentChallenge: null,
  sidebarCollapsed: false,
  activeModal: null,
  diskCounter: 0,
  nsgRuleCounter: 0,
  pendingDisk: null,
  pendingExtension: null
};

const TABS = ['basics', 'disks', 'networking', 'management', 'monitoring', 'advanced', 'tags', 'review'];

// ── DOM Ready ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Show the VM list as default landing page
  showPageSection('vm-list-page');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-target="vm-list"]')?.classList.add('active');
  bindHeaderEvents();
  bindSidebarEvents();
  bindTabNavigation();
  bindModalEvents();
  bindSimulatorMenu();
  updateBreadcrumb();
  navigateToTab('basics');
  updateCostEstimate();
}

// ── Header Events ────────────────────────────────────────────────────────────
function bindHeaderEvents() {
  // Search focus
  const search = document.getElementById('header-search');
  if (search) {
    search.addEventListener('focus', () => search.parentElement.classList.add('focused'));
    search.addEventListener('blur',  () => search.parentElement.classList.remove('focused'));
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') search.blur();
    });
  }

  // Practice mode toggle
  document.getElementById('toggle-practice')?.addEventListener('click', () => {
    appState.practiceMode = !appState.practiceMode;
    document.getElementById('toggle-practice').classList.toggle('active', appState.practiceMode);
    renderHints();
    showToast(appState.practiceMode ? '💡 Practice Mode ON — hints are now visible.' : 'Practice Mode OFF.');
  });

  // Challenge mode button
  document.getElementById('toggle-challenge')?.addEventListener('click', () => {
    openModal('challenge-picker-modal');
  });
}

// ── Sidebar Events ────────────────────────────────────────────────────────────
function bindSidebarEvents() {
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    appState.sidebarCollapsed = !appState.sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed', appState.sidebarCollapsed);
    document.getElementById('main-wrapper').classList.toggle('sidebar-collapsed', appState.sidebarCollapsed);
  });

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      if (target === 'vm-create') {
        showPageSection('create-vm-page');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        navigateToTab(appState.currentTab || 'basics');
        updateBreadcrumb('Create a virtual machine');
      } else if (target === 'vm-list') {
        showPageSection('vm-list-page');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updateBreadcrumb('Virtual machines');
      } else {
        showToast('⚙️ Feature available in simulator preview.');
      }
    });
  });
}

function showPageSection(sectionId) {
  document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
  const el = document.getElementById(sectionId);
  if (el) el.style.display = 'block';
}

// ── Tab Navigation ─────────────────────────────────────────────────────────
function bindTabNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToTab(btn.dataset.tab);
    });
  });

  document.getElementById('btn-prev')?.addEventListener('click', () => {
    const idx = TABS.indexOf(appState.currentTab);
    if (idx > 0) navigateToTab(TABS[idx - 1]);
  });

  document.getElementById('btn-next')?.addEventListener('click', () => {
    const idx = TABS.indexOf(appState.currentTab);
    if (idx < TABS.length - 1) navigateToTab(TABS[idx + 1]);
  });

  document.getElementById('btn-review')?.addEventListener('click', () => {
    navigateToTab('review');
  });

  document.getElementById('btn-create')?.addEventListener('click', startDeployment);
}

function navigateToTab(tabId) {
  appState.currentTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
    btn.classList.toggle('completed', TABS.indexOf(btn.dataset.tab) < TABS.indexOf(tabId));
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.style.display = panel.id === `tab-${tabId}` ? 'block' : 'none';
  });

  // Re-render the current tab
  const renders = {
    basics:     renderBasicsTab,
    disks:      renderDisksTab,
    networking: renderNetworkingTab,
    management: renderManagementTab,
    monitoring: renderMonitoringTab,
    advanced:   renderAdvancedTab,
    tags:       renderTagsTab,
    review:     renderReviewTab
  };
  if (renders[tabId]) renders[tabId]();

  renderHints();
  updateNavButtons();
  updateBreadcrumb();

  // Update challenge progress
  if (appState.challengeMode && appState.currentChallenge) {
    renderChallengeProgress();
  }
}

function updateNavButtons() {
  const idx = TABS.indexOf(appState.currentTab);
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const reviewBtn = document.getElementById('btn-review');
  const createBtn = document.getElementById('btn-create');

  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.style.display = (appState.currentTab === 'review') ? 'none' : 'inline-flex';
  if (nextBtn) nextBtn.disabled = idx >= TABS.length - 1;
  if (reviewBtn) reviewBtn.style.display = (appState.currentTab !== 'review') ? 'inline-flex' : 'none';
  if (createBtn) createBtn.style.display = (appState.currentTab === 'review') ? 'inline-flex' : 'none';
}

function updateBreadcrumb(extra) {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  const base = 'Home / Virtual machines';
  if (appState.currentTab === 'review' || extra === 'Create a virtual machine') {
    bc.innerHTML = `${base} / <strong>Create a virtual machine</strong>`;
  } else {
    bc.innerHTML = `${base} / Create a virtual machine`;
  }
}

// ── BASICS TAB ────────────────────────────────────────────────────────────────
function renderBasicsTab() {
  // Subscription
  syncSelect('field-subscription', vmConfig.subscription, v => { vmConfig.subscription = v; });

  // Resource group mode
  syncRadio('rg-mode', vmConfig.resourceGroup.mode, v => {
    vmConfig.resourceGroup.mode = v;
    renderRgSection();
  });
  renderRgSection();

  // VM name
  syncInput('field-vmname', vmConfig.vmName, v => {
    vmConfig.vmName = v;
    autoUpdateNetworkNames();
    if (appState.challengeMode) renderChallengeProgress();
  });

  // Region
  syncSelect('field-region', vmConfig.region, v => {
    vmConfig.region = v;
    if (appState.challengeMode) renderChallengeProgress();
  });

  // Availability
  syncRadio('availability-type', vmConfig.availability.type, v => {
    vmConfig.availability.type = v;
    renderAvailabilityExtras();
    if (appState.challengeMode) renderChallengeProgress();
  });
  renderAvailabilityExtras();

  // Security type
  syncRadio('security-type', vmConfig.securityType, v => { vmConfig.securityType = v; });

  // Architecture
  syncRadio('architecture', vmConfig.architecture, v => {
    vmConfig.architecture = v;
    updateImageFilter();
    updateSizeDisplay();
    if (appState.challengeMode) renderChallengeProgress();
  });

  // Image display
  updateImageDisplay();

  // Size display
  updateSizeDisplay();

  // Spot VM
  const spotCb = document.getElementById('spot-enabled');
  if (spotCb) {
    spotCb.checked = vmConfig.spot.enabled;
    spotCb.onchange = () => {
      vmConfig.spot.enabled = spotCb.checked;
      renderSpotExtras();
    };
  }
  renderSpotExtras();

  // Auth section
  renderAuthSection();

  // Inbound ports
  renderInboundPorts();

  // Attach image picker button
  document.getElementById('btn-see-images')?.addEventListener('click', () => openImagePickerModal());
  document.getElementById('btn-see-sizes')?.addEventListener('click', () => openSizePickerModal());
}

function renderRgSection() {
  const mode = vmConfig.resourceGroup.mode;
  const newRg = document.getElementById('rg-new-section');
  const existRg = document.getElementById('rg-existing-section');
  if (!newRg || !existRg) return;
  newRg.style.display = (mode === 'new') ? 'block' : 'none';
  existRg.style.display = (mode === 'existing') ? 'block' : 'none';

  if (mode === 'new') {
    syncInput('field-rg-name', vmConfig.resourceGroup.name, v => {
      vmConfig.resourceGroup.name = v;
      autoUpdateNetworkNames();
    });
  } else {
    syncSelect('field-rg-existing', vmConfig.resourceGroup.name, v => {
      vmConfig.resourceGroup.name = v;
    });
  }
}

function renderAvailabilityExtras() {
  const zoneSection = document.getElementById('zone-selector-section');
  const scalesetNote = document.getElementById('scaleset-note');
  if (zoneSection) zoneSection.style.display = (vmConfig.availability.type === 'zone') ? 'block' : 'none';
  if (scalesetNote) scalesetNote.style.display = (vmConfig.availability.type === 'scaleset') ? 'block' : 'none';

  if (vmConfig.availability.type === 'zone') {
    syncRadio('zone-number', vmConfig.availability.zone, v => {
      vmConfig.availability.zone = v;
      if (appState.challengeMode) renderChallengeProgress();
    });
  }
}

function renderSpotExtras() {
  const section = document.getElementById('spot-extras');
  if (!section) return;
  section.style.display = vmConfig.spot.enabled ? 'block' : 'none';
  if (vmConfig.spot.enabled) {
    syncRadio('eviction-type', vmConfig.spot.evictionType, v => { vmConfig.spot.evictionType = v; });
    syncInput('field-max-price', vmConfig.spot.maxPrice, v => { vmConfig.spot.maxPrice = v; });
  }
}

function renderAuthSection() {
  const imageData = DATA.images.find(i => i.id === vmConfig.image);
  const os = imageData ? imageData.os : 'Linux';
  const authSection = document.getElementById('auth-section');
  if (!authSection) return;

  if (os === 'Windows') {
    vmConfig.administrator.authType = 'password';
    authSection.querySelector('.auth-type-selector')?.style && (authSection.querySelector('.auth-type-selector').style.display = 'none');
  } else {
    authSection.querySelector('.auth-type-selector') && (authSection.querySelector('.auth-type-selector').style.display = 'block');
    syncRadio('auth-type', vmConfig.administrator.authType, v => {
      vmConfig.administrator.authType = v;
      renderAuthFields();
    });
  }
  renderAuthFields();
}

function renderAuthFields() {
  const sshSection = document.getElementById('ssh-key-section');
  const passSection = document.getElementById('password-section');
  if (!sshSection || !passSection) return;

  const isSSH = vmConfig.administrator.authType === 'ssh';
  sshSection.style.display = isSSH ? 'block' : 'none';
  passSection.style.display = isSSH ? 'none' : 'block';

  syncInput('field-username', vmConfig.administrator.username, v => { vmConfig.administrator.username = v; });
  if (isSSH) {
    syncTextarea('field-ssh-key', vmConfig.administrator.sshKey, v => { vmConfig.administrator.sshKey = v; });
  } else {
    syncInput('field-password', vmConfig.administrator.password, v => { vmConfig.administrator.password = v; });
    syncInput('field-confirm-password', vmConfig.administrator.confirmPassword, v => {
      vmConfig.administrator.confirmPassword = v;
    });
  }
}

function renderInboundPorts() {
  const portCheckboxes = document.querySelectorAll('.inbound-port-cb');
  portCheckboxes.forEach(cb => {
    const port = cb.value;
    cb.checked = vmConfig.inboundPorts.includes(port);
    cb.onchange = () => {
      if (cb.checked) {
        if (!vmConfig.inboundPorts.includes(port)) vmConfig.inboundPorts.push(port);
      } else {
        vmConfig.inboundPorts = vmConfig.inboundPorts.filter(p => p !== port);
      }
      if (appState.challengeMode) renderChallengeProgress();
    };
  });

  // Inbound ports warning
  const portWarning = document.getElementById('inbound-port-warning');
  if (portWarning) {
    portWarning.style.display = vmConfig.inboundPorts.length > 0 ? 'flex' : 'none';
  }
}

function updateImageDisplay() {
  const imageData = DATA.images.find(i => i.id === vmConfig.image);
  const el = document.getElementById('selected-image-display');
  if (!el) return;
  if (imageData) {
    el.innerHTML = `
      <div class="selected-image-card">
        <span class="os-badge ${imageData.os.toLowerCase()}">${imageData.os}</span>
        <strong>${imageData.name}</strong>
        <div class="image-meta">
          <span>Publisher: ${imageData.publisher}</span>
          <span>Offer: ${imageData.offer}</span>
          <span>SKU: ${imageData.sku}</span>
          <span>Version: ${imageData.version}</span>
        </div>
      </div>`;
  } else {
    el.innerHTML = `<div class="placeholder-select">No image selected — click <strong>See all images</strong> to choose.</div>`;
  }
}

function updateSizeDisplay() {
  const sizeData = DATA.vmSizes.find(s => s.name === vmConfig.size);
  const el = document.getElementById('selected-size-display');
  if (!el) return;
  if (sizeData && sizeData.architecture.includes(vmConfig.architecture)) {
    const cost = Simulator.calculateCost(sizeData.name);
    el.innerHTML = `
      <div class="selected-size-card">
        <strong>${sizeData.name}</strong>
        <span class="size-family">${sizeData.family}</span>
        <div class="size-specs">
          <span>🖥 ${sizeData.vcpus} vCPUs</span>
          <span>🧠 ${sizeData.ram} GiB RAM</span>
          <span>💽 ${sizeData.tempStorage > 0 ? sizeData.tempStorage + ' GiB temp' : 'No temp storage'}</span>
          <span class="simulated-price">≈ ₹${cost.hourly}/hr (simulated)</span>
        </div>
      </div>`;
  } else {
    if (vmConfig.size) {
      el.innerHTML = `<div class="placeholder-select warning-text">⚠ Selected size not available for ${vmConfig.architecture}. Please choose another.</div>`;
    } else {
      el.innerHTML = `<div class="placeholder-select">No size selected — click <strong>See all sizes</strong>.</div>`;
    }
  }
  updateCostEstimate();
}

function updateImageFilter() {
  // When architecture changes, validate image compatibility
  if (vmConfig.image) {
    const img = DATA.images.find(i => i.id === vmConfig.image);
    if (img && !img.architecture.includes(vmConfig.architecture)) {
      vmConfig.image = '';
      updateImageDisplay();
      showToast(`⚠ Selected image is not available for ${vmConfig.architecture}. Please choose another image.`);
    }
  }
}

function autoUpdateNetworkNames() {
  const baseName = vmConfig.vmName || 'student-vm';
  if (!vmConfig.networking.publicIp.name) {
    vmConfig.networking.publicIp.name = `${baseName}-ip`;
  }
  if (!vmConfig.networking.nic.name) {
    vmConfig.networking.nic.name = `${baseName}-nic`;
  }
  if (!vmConfig.networking.nsgName) {
    vmConfig.networking.nsgName = `${baseName}-nsg`;
  }
}

// ── DISKS TAB ────────────────────────────────────────────────────────────────
function renderDisksTab() {
  // OS Disk type
  syncRadio('os-disk-type', vmConfig.disks.osDisk.type, v => {
    vmConfig.disks.osDisk.type = v;
    if (appState.challengeMode) renderChallengeProgress();
  });

  // Delete with VM
  const dwv = document.getElementById('os-disk-delete-with-vm');
  if (dwv) {
    dwv.checked = vmConfig.disks.osDisk.deleteWithVm;
    dwv.onchange = () => { vmConfig.disks.osDisk.deleteWithVm = dwv.checked; };
  }

  // Host caching
  syncSelect('os-disk-caching', vmConfig.disks.osDisk.caching, v => { vmConfig.disks.osDisk.caching = v; });

  // Data disks table
  renderDataDisksTable();

  document.getElementById('btn-add-disk')?.addEventListener('click', () => openDiskModal());
}

function renderDataDisksTable() {
  const tbody = document.getElementById('data-disks-tbody');
  if (!tbody) return;

  if (vmConfig.disks.dataDisks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-table-msg">No data disks attached. Click "+ Create and attach a new disk" to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = vmConfig.disks.dataDisks.map((disk, i) => `
    <tr>
      <td>${disk.name}</td>
      <td>${disk.type}</td>
      <td>${disk.size} GiB</td>
      <td>${disk.caching}</td>
      <td><input type="checkbox" ${disk.deleteWithVm ? 'checked' : ''} onchange="vmConfig.disks.dataDisks[${i}].deleteWithVm = this.checked"></td>
      <td>
        <button class="btn-icon" onclick="editDisk(${i})" title="Edit disk">✏️</button>
        <button class="btn-icon btn-danger" onclick="removeDisk(${i})" title="Remove disk">🗑</button>
      </td>
    </tr>
  `).join('');
}

function removeDisk(index) {
  vmConfig.disks.dataDisks.splice(index, 1);
  renderDataDisksTable();
  if (appState.challengeMode) renderChallengeProgress();
}

function editDisk(index) {
  appState.pendingDisk = { ...vmConfig.disks.dataDisks[index], _editIndex: index };
  openDiskModal(appState.pendingDisk);
}

// ── NETWORKING TAB ───────────────────────────────────────────────────────────
function renderNetworkingTab() {
  // VNet
  syncRadio('vnet-mode', vmConfig.networking.vnet.mode, v => {
    vmConfig.networking.vnet.mode = v;
    renderVnetSection();
  });
  renderVnetSection();

  // Public IP
  syncRadio('pip-mode', vmConfig.networking.publicIp.mode, v => {
    vmConfig.networking.publicIp.mode = v;
    renderPipSection();
    if (appState.challengeMode) renderChallengeProgress();
  });
  renderPipSection();

  // NSG mode
  syncRadio('nsg-mode', vmConfig.networking.nsg.mode, v => {
    vmConfig.networking.nsg.mode = v;
    renderNsgSection();
  });
  renderNsgSection();

  // Load balancing
  syncRadio('lb-mode', vmConfig.networking.loadBalancing, v => {
    vmConfig.networking.loadBalancing = v;
    renderLbSection();
  });
  renderLbSection();

  // NIC name
  syncInput('field-nic-name', vmConfig.networking.nic.name, v => { vmConfig.networking.nic.name = v; });

  // NSG name
  syncInput('field-nsg-name', vmConfig.networking.nsgName, v => { vmConfig.networking.nsgName = v; });
}

function renderVnetSection() {
  const newVnet = document.getElementById('vnet-new-section');
  const existVnet = document.getElementById('vnet-existing-section');
  if (!newVnet || !existVnet) return;

  const mode = vmConfig.networking.vnet.mode;
  newVnet.style.display = (mode === 'new') ? 'block' : 'none';
  existVnet.style.display = (mode === 'existing') ? 'block' : 'none';

  if (mode === 'new') {
    syncInput('field-vnet-name', vmConfig.networking.vnet.name, v => { vmConfig.networking.vnet.name = v; });
    syncInput('field-vnet-address', vmConfig.networking.vnet.addressSpace, v => {
      vmConfig.networking.vnet.addressSpace = v;
      // Re-validate subnet
      Validation.showFieldError('field-subnet-range', Validation.validateField('subnet', vmConfig));
      if (appState.challengeMode) renderChallengeProgress();
    });
    syncInput('field-subnet-name', vmConfig.networking.subnet.name, v => { vmConfig.networking.subnet.name = v; });
    syncInput('field-subnet-range', vmConfig.networking.subnet.range, v => {
      vmConfig.networking.subnet.range = v;
      const err = Validation.validateField('subnet', vmConfig);
      Validation.showFieldError('field-subnet-range', err);
      if (appState.challengeMode) renderChallengeProgress();
    });
  } else {
    syncSelect('field-vnet-existing', vmConfig.networking.vnet.name, v => {
      vmConfig.networking.vnet.name = v;
      const vnet = DATA.existingVnets.find(n => n.name === v);
      if (vnet) {
        vmConfig.networking.vnet.addressSpace = vnet.addressSpace;
        renderExistingSubnetSelect(vnet.subnets);
      }
    });
    renderExistingSubnetSelect(null);
  }
}

function renderExistingSubnetSelect(subnets) {
  const subnetEl = document.getElementById('field-subnet-existing');
  if (!subnetEl) return;
  const list = subnets || ['default', 'web-subnet', 'app-subnet', 'database-subnet'];
  subnetEl.innerHTML = list.map(s => `<option value="${s}" ${vmConfig.networking.subnet.name === s ? 'selected' : ''}>${s}</option>`).join('');
  subnetEl.onchange = () => {
    vmConfig.networking.subnet.name = subnetEl.value;
  };
}

function renderPipSection() {
  const mode = vmConfig.networking.publicIp.mode;
  const newPip = document.getElementById('pip-new-section');
  const noPipWarning = document.getElementById('no-pip-warning');

  if (newPip) newPip.style.display = (mode === 'new') ? 'block' : 'none';
  if (noPipWarning) noPipWarning.style.display = (mode === 'none') ? 'flex' : 'none';

  if (mode === 'new') {
    syncInput('field-pip-name', vmConfig.networking.publicIp.name, v => { vmConfig.networking.publicIp.name = v; });
  }
}

function renderNsgSection() {
  const mode = vmConfig.networking.nsg.mode;
  const advancedSection = document.getElementById('nsg-advanced-section');
  if (advancedSection) advancedSection.style.display = (mode === 'advanced') ? 'block' : 'none';

  if (mode === 'advanced') {
    renderNsgRulesTable();
    document.getElementById('btn-add-nsg-rule')?.addEventListener('click', openNsgRuleModal);
  }
}

function renderNsgRulesTable() {
  const tbody = document.getElementById('nsg-rules-tbody');
  if (!tbody) return;

  const rules = vmConfig.networking.nsg.customRules || [];
  const allRules = [...rules, ...DATA.defaultNsgRules];

  if (allRules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-table-msg">No custom rules. Default rules shown below.</td></tr>`;
    return;
  }

  tbody.innerHTML = allRules.map((rule, i) => {
    const isCustom = rule.editable !== false;
    return `
    <tr class="${rule.editable === false ? 'default-rule' : ''}">
      <td>${rule.priority}</td>
      <td>${rule.name}</td>
      <td>${rule.port}</td>
      <td>${rule.protocol}</td>
      <td>${rule.source}</td>
      <td>${rule.destination}</td>
      <td><span class="action-badge ${rule.action.toLowerCase()}">${rule.action}</span></td>
      <td>
        ${isCustom ? `<button class="btn-icon" onclick="removeNsgRule(${i})" title="Delete rule">🗑</button>` : '<span class="text-muted">System</span>'}
      </td>
    </tr>`;
  }).join('');
}

function removeNsgRule(index) {
  vmConfig.networking.nsg.customRules.splice(index, 1);
  renderNsgRulesTable();
}

function renderLbSection() {
  const note = document.getElementById('lb-note');
  if (note) note.style.display = (vmConfig.networking.loadBalancing !== 'none') ? 'block' : 'none';
}

// ── MANAGEMENT TAB ────────────────────────────────────────────────────────────
function renderManagementTab() {
  // Defender
  syncToggle('toggle-defender', vmConfig.management.defenderForCloud, v => { vmConfig.management.defenderForCloud = v; });
  // Boot diagnostics
  syncToggle('toggle-boot-diag', vmConfig.management.bootDiagnostics, v => { vmConfig.management.bootDiagnostics = v; });
  // OS guest diagnostics
  syncToggle('toggle-guest-diag', vmConfig.management.osGuestDiagnostics, v => { vmConfig.management.osGuestDiagnostics = v; });

  // Auto shutdown
  const shutdownCb = document.getElementById('auto-shutdown-cb');
  if (shutdownCb) {
    shutdownCb.checked = vmConfig.management.autoShutdown.enabled;
    shutdownCb.onchange = () => {
      vmConfig.management.autoShutdown.enabled = shutdownCb.checked;
      renderAutoShutdownExtras();
      if (appState.challengeMode) renderChallengeProgress();
    };
  }
  renderAutoShutdownExtras();

  // Identity
  const sysId = document.getElementById('system-identity-toggle');
  if (sysId) {
    sysId.checked = vmConfig.management.identity.systemAssigned;
    sysId.onchange = () => {
      vmConfig.management.identity.systemAssigned = sysId.checked;
      if (appState.challengeMode) renderChallengeProgress();
    };
  }
}

function renderAutoShutdownExtras() {
  const section = document.getElementById('auto-shutdown-extras');
  if (!section) return;
  section.style.display = vmConfig.management.autoShutdown.enabled ? 'block' : 'none';
  if (vmConfig.management.autoShutdown.enabled) {
    syncInput('field-shutdown-time', vmConfig.management.autoShutdown.time, v => { vmConfig.management.autoShutdown.time = v; });
    syncSelect('field-shutdown-tz', vmConfig.management.autoShutdown.timezone, v => { vmConfig.management.autoShutdown.timezone = v; });
  }
}

// ── MONITORING TAB ────────────────────────────────────────────────────────────
function renderMonitoringTab() {
  syncToggle('toggle-azure-monitor', vmConfig.monitoring.azureMonitor, v => {
    vmConfig.monitoring.azureMonitor = v;
    if (appState.challengeMode) renderChallengeProgress();
  });
  syncToggle('toggle-metrics', vmConfig.monitoring.metrics, v => { vmConfig.monitoring.metrics = v; });
  syncToggle('toggle-alerts', vmConfig.monitoring.alerts, v => { vmConfig.monitoring.alerts = v; });
  syncToggle('toggle-logs', vmConfig.monitoring.logCollection, v => { vmConfig.monitoring.logCollection = v; });
}

// ── ADVANCED TAB ──────────────────────────────────────────────────────────────
function renderAdvancedTab() {
  renderExtensionsTable();
  document.getElementById('btn-add-extension')?.addEventListener('click', () => openExtensionModal());

  syncTextarea('field-custom-data', vmConfig.advanced.customData, v => { vmConfig.advanced.customData = v; });
  syncInput('field-host-group', vmConfig.advanced.hostGroup, v => { vmConfig.advanced.hostGroup = v; });
  syncInput('field-host', vmConfig.advanced.host, v => { vmConfig.advanced.host = v; });
  syncInput('field-ppg', vmConfig.advanced.proximityPlacementGroup, v => { vmConfig.advanced.proximityPlacementGroup = v; });

  const encCb = document.getElementById('encryption-at-host');
  if (encCb) {
    encCb.checked = vmConfig.advanced.encryptionAtHost;
    encCb.onchange = () => { vmConfig.advanced.encryptionAtHost = encCb.checked; };
  }
}

function renderExtensionsTable() {
  const tbody = document.getElementById('extensions-tbody');
  if (!tbody) return;

  if (vmConfig.advanced.extensions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-table-msg">No extensions installed.</td></tr>`;
    return;
  }

  tbody.innerHTML = vmConfig.advanced.extensions.map((ext, i) => {
    const extData = DATA.extensions.find(e => e.id === ext.id);
    return `
    <tr>
      <td>${extData ? extData.name : ext.id}</td>
      <td>${extData ? extData.publisher : ''}</td>
      <td><button class="btn-icon btn-danger" onclick="removeExtension(${i})" title="Remove">🗑</button></td>
    </tr>`;
  }).join('');
}

function removeExtension(index) {
  vmConfig.advanced.extensions.splice(index, 1);
  renderExtensionsTable();
}

// ── TAGS TAB ──────────────────────────────────────────────────────────────────
function renderTagsTab() {
  renderTagsTable();
  document.getElementById('btn-add-tag')?.addEventListener('click', addTag);
}

function renderTagsTable() {
  const tbody = document.getElementById('tags-tbody');
  if (!tbody) return;

  if (vmConfig.tags.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-table-msg">No tags. Click "Add tag" to add metadata.</td></tr>`;
    return;
  }

  tbody.innerHTML = vmConfig.tags.map((tag, i) => `
    <tr>
      <td><input type="text" class="table-input" value="${escHtml(tag.name)}" placeholder="Name" onchange="vmConfig.tags[${i}].name = this.value; if(appState.challengeMode) renderChallengeProgress();"></td>
      <td><input type="text" class="table-input" value="${escHtml(tag.value)}" placeholder="Value" onchange="vmConfig.tags[${i}].value = this.value;"></td>
      <td><button class="btn-icon btn-danger" onclick="removeTag(${i})" title="Remove tag">🗑</button></td>
    </tr>
  `).join('');
}

function addTag() {
  vmConfig.tags.push({ name: '', value: '' });
  renderTagsTable();
  if (appState.challengeMode) renderChallengeProgress();
}

function removeTag(index) {
  vmConfig.tags.splice(index, 1);
  renderTagsTable();
  if (appState.challengeMode) renderChallengeProgress();
}

// ── REVIEW + CREATE TAB ───────────────────────────────────────────────────────
function renderReviewTab() {
  const result = Validation.validateAll(vmConfig);
  const statusEl = document.getElementById('validation-status');
  const errListEl = document.getElementById('validation-error-list');
  const summaryEl = document.getElementById('config-summary');
  const createBtn = document.getElementById('btn-create');

  if (statusEl) {
    if (result.valid) {
      statusEl.innerHTML = `<div class="validation-pass">✅ Validation passed — your configuration is ready to deploy.</div>`;
    } else {
      statusEl.innerHTML = `<div class="validation-fail">⚠ Validation failed — <strong>${result.errors.length} error${result.errors.length > 1 ? 's' : ''}</strong> must be fixed before you can create the VM.</div>`;
    }
  }

  if (errListEl) {
    if (result.errors.length > 0) {
      errListEl.innerHTML = result.errors.map(e => `
        <div class="review-error" onclick="navigateToTab('${e.tab}')" title="Click to navigate to ${e.tab} tab">
          <span class="error-tab-badge">${capitalize(e.tab)}</span>
          ${escHtml(e.message)}
        </div>
      `).join('');
      errListEl.style.display = 'block';
    } else {
      errListEl.innerHTML = '';
      errListEl.style.display = 'none';
    }
  }

  if (createBtn) createBtn.disabled = !result.valid;

  if (summaryEl) summaryEl.innerHTML = buildConfigSummaryHTML();
  updateCostEstimate();
}

function buildConfigSummaryHTML() {
  const imageData = DATA.images.find(i => i.id === vmConfig.image);
  const sizeData = DATA.vmSizes.find(s => s.name === vmConfig.size);
  const regionData = DATA.regions.find(r => r.id === vmConfig.region);
  const subData = DATA.subscriptions.find(s => s.id === vmConfig.subscription);

  const field = (label, value) => value
    ? `<div class="summary-row"><span class="summary-label">${label}</span><span class="summary-value">${escHtml(String(value))}</span></div>`
    : '';

  const avText = vmConfig.availability.type === 'zone' ? `Availability Zone ${vmConfig.availability.zone}` :
                 vmConfig.availability.type === 'scaleset' ? 'VM Scale Set' : 'No redundancy';

  const portText = vmConfig.inboundPorts.length > 0 ? vmConfig.inboundPorts.map(p => portName(p)).join(', ') : 'None';

  return `
    <div class="summary-section">
      <h4>Project details</h4>
      ${field('Subscription', subData ? subData.name : vmConfig.subscription)}
      ${field('Resource group', vmConfig.resourceGroup.name)}
    </div>
    <div class="summary-section">
      <h4>Virtual machine</h4>
      ${field('Name', vmConfig.vmName)}
      ${field('Region', regionData ? regionData.name : vmConfig.region)}
      ${field('Availability', avText)}
      ${field('Security type', vmConfig.securityType)}
      ${field('Image', imageData ? imageData.name : vmConfig.image)}
      ${field('Architecture', vmConfig.architecture)}
      ${field('Size', vmConfig.size ? `${vmConfig.size} (${sizeData ? sizeData.vcpus + ' vCPU, ' + sizeData.ram + ' GiB RAM' : ''})` : '')}
      ${field('Spot', vmConfig.spot.enabled ? 'Yes' : 'No')}
    </div>
    <div class="summary-section">
      <h4>Administrator account</h4>
      ${field('Authentication type', vmConfig.administrator.authType === 'ssh' ? 'SSH public key' : 'Password')}
      ${field('Username', vmConfig.administrator.username)}
      ${field('Inbound ports', portText)}
    </div>
    <div class="summary-section">
      <h4>Disks</h4>
      ${field('OS disk type', diskTypeName(vmConfig.disks.osDisk.type))}
      ${field('Data disks', vmConfig.disks.dataDisks.length > 0 ? vmConfig.disks.dataDisks.length + ' disk(s)' : 'None')}
    </div>
    <div class="summary-section">
      <h4>Networking</h4>
      ${field('Virtual network', vmConfig.networking.vnet.name)}
      ${field('Subnet', vmConfig.networking.subnet.name + (vmConfig.networking.subnet.range ? ' (' + vmConfig.networking.subnet.range + ')' : ''))}
      ${field('Public IP', vmConfig.networking.publicIp.mode === 'new' ? vmConfig.networking.publicIp.name : vmConfig.networking.publicIp.mode === 'none' ? 'None' : 'Existing')}
      ${field('NIC', vmConfig.networking.nic.name)}
      ${field('NSG', vmConfig.networking.nsgName || vmConfig.vmName + '-nsg')}
      ${field('Load balancing', vmConfig.networking.loadBalancing === 'none' ? 'None' : vmConfig.networking.loadBalancing)}
    </div>
    <div class="summary-section">
      <h4>Management</h4>
      ${field('Boot diagnostics', vmConfig.management.bootDiagnostics ? 'Enabled' : 'Disabled')}
      ${field('Auto-shutdown', vmConfig.management.autoShutdown.enabled ? 'Enabled — ' + vmConfig.management.autoShutdown.time + ' ' + vmConfig.management.autoShutdown.timezone : 'Disabled')}
      ${field('System identity', vmConfig.management.identity.systemAssigned ? 'On' : 'Off')}
    </div>
    <div class="summary-section">
      <h4>Monitoring</h4>
      ${field('Azure Monitor', vmConfig.monitoring.azureMonitor ? 'Enabled' : 'Disabled')}
    </div>
    ${vmConfig.tags.length > 0 ? `
    <div class="summary-section">
      <h4>Tags</h4>
      ${vmConfig.tags.map(t => field(t.name, t.value)).join('')}
    </div>` : ''}
  `;
}

// ── Cost Estimate ────────────────────────────────────────────────────────────
function updateCostEstimate() {
  const cost = Simulator.calculateCost(vmConfig.size);
  const el = document.getElementById('cost-estimate');
  if (!el) return;
  if (vmConfig.size) {
    el.innerHTML = `
      <div class="cost-card">
        <div class="cost-label">Estimated cost (simulated)</div>
        <div class="cost-hourly">₹${cost.hourly.toFixed(2)}/hour</div>
        <div class="cost-monthly">≈ ₹${cost.monthly.toLocaleString('en-IN')}/month</div>
        <div class="cost-disclaimer">⚠ Simulated estimate for educational purposes only. Based on ${vmConfig.size} running 24×7 in ${DATA.regions.find(r => r.id === vmConfig.region)?.name || 'selected region'}.</div>
      </div>`;
  } else {
    el.innerHTML = `<div class="cost-card cost-empty">Select a VM size to see estimated cost.</div>`;
  }
}

// ── DEPLOYMENT ────────────────────────────────────────────────────────────────
function startDeployment() {
  showPageSection('deployment-page');
  updateBreadcrumb('Deployment');

  const stepsContainer = document.getElementById('deployment-steps');
  if (stepsContainer) stepsContainer.innerHTML = '';

  Simulator.runDeployment(vmConfig, {
    onStepStart: (stepId, label) => {
      let row = document.getElementById(`dep-step-${stepId}`);
      if (!row) {
        row = document.createElement('div');
        row.id = `dep-step-${stepId}`;
        row.className = 'deployment-step pending';
        row.innerHTML = `<span class="step-icon">⏳</span><span class="step-label">${label}</span><span class="step-status">Creating...</span>`;
        stepsContainer.appendChild(row);
      }
      row.className = 'deployment-step in-progress';
      row.querySelector('.step-icon').textContent = '⏳';
      row.querySelector('.step-status').textContent = 'Creating...';
    },
    onStepComplete: (stepId, label) => {
      const row = document.getElementById(`dep-step-${stepId}`);
      if (row) {
        row.className = 'deployment-step complete';
        row.querySelector('.step-icon').textContent = '✅';
        row.querySelector('.step-status').textContent = 'Created';
      }
    },
    onDeploymentComplete: (resources) => {
      showDeploymentComplete(resources);
    }
  });
}

function showDeploymentComplete(resources) {
  showPageSection('deployment-complete-page');

  const vm = resources.virtualMachine;
  const rg = resources.resourceGroup;
  const pip = resources.publicIpAddress;

  document.getElementById('deploy-complete-content').innerHTML = `
    <div class="deploy-complete-header">
      <div class="deploy-complete-icon">✅</div>
      <h2>Your deployment is complete</h2>
      <p class="deploy-subtitle">Your virtual machine has been deployed successfully.</p>
      <div class="simulator-badge">⚠ This is a simulated deployment. No real Azure resources were created.</div>
    </div>
    <div class="deploy-summary-cards">
      <div class="deploy-card">
        <div class="deploy-card-label">Resource group</div>
        <div class="deploy-card-value">${rg.name}</div>
        <div class="deploy-card-sub">Simulated Resource ID:<br><code>${rg.id}</code></div>
      </div>
      <div class="deploy-card">
        <div class="deploy-card-label">Virtual machine</div>
        <div class="deploy-card-value">${vm.name}</div>
        <div class="deploy-card-sub">Status: <strong class="status-running">Running</strong></div>
      </div>
      <div class="deploy-card">
        <div class="deploy-card-label">Region</div>
        <div class="deploy-card-value">${vm.location}</div>
      </div>
      <div class="deploy-card">
        <div class="deploy-card-label">Public IP address</div>
        <div class="deploy-card-value">${pip ? pip.ipAddress : 'None (no public IP)'}</div>
        <div class="deploy-card-sub">${pip ? 'Simulated IP — not a real Azure address' : ''}</div>
      </div>
      <div class="deploy-card">
        <div class="deploy-card-label">Private IP address</div>
        <div class="deploy-card-value">${resources.networkInterface.privateIpAddress}</div>
        <div class="deploy-card-sub">Simulated — not a real address</div>
      </div>
      <div class="deploy-card">
        <div class="deploy-card-label">VM size</div>
        <div class="deploy-card-value">${vm.size}</div>
      </div>
    </div>
    <div class="deploy-actions">
      <button class="btn btn-primary" onclick="showVmOverview()">Go to resource →</button>
      <button class="btn btn-secondary" onclick="showResourceGraph()">View resource graph</button>
      <button class="btn btn-secondary" onclick="showResourceGroupView()">View resource group</button>
    </div>
  `;
}

// ── VM OVERVIEW ────────────────────────────────────────────────────────────────
function showVmOverview() {
  showPageSection('vm-overview-page');
  renderVmOverview();
}

function renderVmOverview() {
  const resources = Simulator.getDeployedResources();
  const vm = resources.virtualMachine;
  const rg = resources.resourceGroup;
  const pip = resources.publicIpAddress;
  const nic = resources.networkInterface;
  const metrics = Simulator.generateMetrics();

  document.getElementById('vm-overview-content').innerHTML = `
    <div class="vm-overview-header">
      <div class="vm-title-row">
        <span class="vm-icon">🖥️</span>
        <div>
          <h2>${vm.name}</h2>
          <div class="vm-breadcrumb">${rg.name} / Virtual machine</div>
        </div>
        <div class="vm-status-badge status-running">● Running</div>
      </div>
      <div class="vm-actions-bar">
        <button class="btn btn-outline" onclick="vmOperation('start')" id="btn-vm-start" disabled>▶ Start</button>
        <button class="btn btn-outline" onclick="vmOperation('restart')" id="btn-vm-restart">↺ Restart</button>
        <button class="btn btn-outline" onclick="vmOperation('stop')" id="btn-vm-stop">■ Stop</button>
        <button class="btn btn-danger-outline" onclick="vmOperation('delete')" id="btn-vm-delete">🗑 Delete</button>
      </div>
    </div>

    <div class="vm-overview-grid">
      <div class="vm-info-card">
        <h4>Essentials</h4>
        <div class="info-table">
          <div class="info-row"><span>Resource group</span><span>${rg.name}</span></div>
          <div class="info-row"><span>Location</span><span>${vm.location}</span></div>
          <div class="info-row"><span>Subscription</span><span>${DATA.subscriptions.find(s => s.id === resources.config.subscription)?.name || ''}</span></div>
          <div class="info-row"><span>VM size</span><span>${vm.size}</span></div>
          <div class="info-row"><span>Operating system</span><span>${vm.os}</span></div>
          <div class="info-row"><span>Image</span><span>${vm.image}</span></div>
          <div class="info-row"><span>Public IP</span><span>${pip ? pip.ipAddress : 'None'}</span></div>
          <div class="info-row"><span>Private IP</span><span>${nic.privateIpAddress}</span></div>
          <div class="info-row"><span>VNet/Subnet</span><span>${resources.virtualNetwork.name} / ${resources.subnet.name}</span></div>
        </div>
      </div>

      <div class="vm-metrics-grid">
        <div class="metric-card">
          <div class="metric-title">CPU</div>
          <div class="metric-value">${metrics.cpu}%</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${metrics.cpu}%"></div></div>
          <div class="metric-sub">Average (simulated)</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Memory</div>
          <div class="metric-value">${metrics.memory}%</div>
          <div class="metric-bar"><div class="metric-fill" style="width:${metrics.memory}%"></div></div>
          <div class="metric-sub">Average (simulated)</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Disk Read</div>
          <div class="metric-value">${metrics.diskRead} MB/s</div>
          <div class="metric-sub">Throughput (simulated)</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Network In</div>
          <div class="metric-value">${metrics.networkIn} MB/s</div>
          <div class="metric-sub">Throughput (simulated)</div>
        </div>
      </div>
    </div>

    <div class="simulated-resource-id">
      <strong>Simulated Resource ID:</strong><br>
      <code>${vm.id}</code>
    </div>
  `;
}

function vmOperation(action) {
  const labelMap = { start: 'Starting', stop: 'Stopping', restart: 'Restarting', delete: 'Deleting' };

  if (action === 'delete') {
    openConfirmModal(
      'Delete Virtual Machine',
      `Are you sure you want to delete "${Simulator.getDeployedResources().virtualMachine?.name}"? This is a simulated action — no real resources will be affected.`,
      () => performVmAction('delete')
    );
    return;
  }

  performVmAction(action);
}

function performVmAction(action) {
  const statusBadge = document.querySelector('.vm-status-badge');
  const disableAll = () => {
    ['btn-vm-start', 'btn-vm-stop', 'btn-vm-restart', 'btn-vm-delete'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
  };

  disableAll();

  Simulator.vmAction(action,
    (state) => {
      if (statusBadge) {
        statusBadge.textContent = `● ${Simulator.getDeployedResources().virtualMachine?.status || state}`;
        statusBadge.className = `vm-status-badge status-${state}`;
      }
    },
    (finalState) => {
      if (finalState === 'deleted') {
        showPageSection('vm-list-page');
        showToast('🗑 VM deleted (simulated). Returning to Virtual machines list.');
        return;
      }
      const startBtn = document.getElementById('btn-vm-start');
      const stopBtn = document.getElementById('btn-vm-stop');
      const restartBtn = document.getElementById('btn-vm-restart');
      const delBtn = document.getElementById('btn-vm-delete');
      if (finalState === 'running') {
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (restartBtn) restartBtn.disabled = false;
        if (delBtn) delBtn.disabled = false;
      } else if (finalState === 'deallocated') {
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (restartBtn) restartBtn.disabled = true;
        if (delBtn) delBtn.disabled = false;
      }
    }
  );
}

// ── RESOURCE GRAPH ─────────────────────────────────────────────────────────────
function showResourceGraph() {
  showPageSection('resource-graph-page');
  const resources = Simulator.getDeployedResources();
  const graph = Simulator.buildResourceGraph(resources);
  renderResourceGraph(graph, resources);
}

function renderResourceGraph(graph, resources) {
  const container = document.getElementById('resource-graph-content');
  if (!container) return;

  // Build SVG-based relationship diagram
  const nodeDetails = {};
  graph.nodes.forEach(n => { nodeDetails[n.id] = n; });

  container.innerHTML = `
    <div class="graph-wrapper">
      <div class="graph-title">Resource Relationship Diagram</div>
      <div class="graph-subtitle">Click any resource to view its simulated details.</div>
      <div class="resource-tree">
        <div class="rg-node graph-node" data-node-id="rg" onclick="showGraphNodeDetail('rg')">
          <span class="node-icon">📁</span>
          <div class="node-label">Resource Group</div>
          <div class="node-name">${resources.resourceGroup.name}</div>
        </div>
        <div class="tree-branches">
          <div class="tree-branch">
            <div class="graph-node vm-node" data-node-id="vm" onclick="showGraphNodeDetail('vm')">
              <span class="node-icon">🖥️</span>
              <div class="node-label">Virtual Machine</div>
              <div class="node-name">${resources.virtualMachine.name}</div>
            </div>
            <div class="tree-subbranches">
              <div class="graph-node" data-node-id="disk" onclick="showGraphNodeDetail('disk')">
                <span class="node-icon">💽</span>
                <div class="node-label">OS Disk</div>
                <div class="node-name">${resources.osDisk.name.substring(0, 20)}...</div>
              </div>
              <div class="graph-node" data-node-id="nic" onclick="showGraphNodeDetail('nic')">
                <span class="node-icon">🔌</span>
                <div class="node-label">NIC</div>
                <div class="node-name">${resources.networkInterface.name}</div>
                <div class="tree-subbranches-inline">
                  ${resources.publicIpAddress ? `<div class="graph-node-sm" data-node-id="pip" onclick="event.stopPropagation();showGraphNodeDetail('pip')"><span>🌍</span>${resources.publicIpAddress.name}</div>` : ''}
                  <div class="graph-node-sm" data-node-id="nsg" onclick="event.stopPropagation();showGraphNodeDetail('nsg')"><span>🔒</span>${resources.networkSecurityGroup.name}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="tree-branch">
            <div class="graph-node" data-node-id="vnet" onclick="showGraphNodeDetail('vnet')">
              <span class="node-icon">🌐</span>
              <div class="node-label">Virtual Network</div>
              <div class="node-name">${resources.virtualNetwork.name}</div>
            </div>
            <div class="tree-subbranches">
              <div class="graph-node" data-node-id="subnet" onclick="showGraphNodeDetail('subnet')">
                <span class="node-icon">🔗</span>
                <div class="node-label">Subnet</div>
                <div class="node-name">${resources.subnet.name}</div>
              </div>
            </div>
          </div>
          <div class="tree-branch">
            <div class="graph-node" data-node-id="nsg" onclick="showGraphNodeDetail('nsg')">
              <span class="node-icon">🔒</span>
              <div class="node-label">NSG</div>
              <div class="node-name">${resources.networkSecurityGroup.name}</div>
            </div>
          </div>
        </div>
      </div>
      <div id="graph-node-detail" class="graph-detail-panel" style="display:none;"></div>
    </div>
  `;

  // Preload details for each node
  container._graphData = { graph, resources };
}

function showGraphNodeDetail(nodeId) {
  const resources = Simulator.getDeployedResources();
  const panel = document.getElementById('graph-node-detail');
  if (!panel) return;

  const details = {
    rg:     { title: 'Resource Group',       icon: '📁', rows: [['Name', resources.resourceGroup.name], ['Location', resources.resourceGroup.location], ['Simulated ID', resources.resourceGroup.id]] },
    vm:     { title: 'Virtual Machine',      icon: '🖥️', rows: [['Name', resources.virtualMachine.name], ['Size', resources.virtualMachine.size], ['OS', resources.virtualMachine.os], ['Image', resources.virtualMachine.image], ['Status', resources.virtualMachine.status], ['Simulated ID', resources.virtualMachine.id]] },
    vnet:   { title: 'Virtual Network',      icon: '🌐', rows: [['Name', resources.virtualNetwork.name], ['Address Space', resources.virtualNetwork.addressSpace], ['Simulated ID', resources.virtualNetwork.id]] },
    subnet: { title: 'Subnet',              icon: '🔗', rows: [['Name', resources.subnet.name], ['Address Prefix', resources.subnet.addressPrefix]] },
    nsg:    { title: 'Network Security Group', icon: '🔒', rows: [['Name', resources.networkSecurityGroup.name], ['Simulated ID', resources.networkSecurityGroup.id]] },
    nic:    { title: 'Network Interface',    icon: '🔌', rows: [['Name', resources.networkInterface.name], ['Private IP', resources.networkInterface.privateIpAddress], ['Simulated ID', resources.networkInterface.id]] },
    pip:    resources.publicIpAddress ? { title: 'Public IP Address', icon: '🌍', rows: [['Name', resources.publicIpAddress.name], ['IP Address', resources.publicIpAddress.ipAddress], ['SKU', resources.publicIpAddress.sku], ['Assignment', resources.publicIpAddress.assignment], ['Note', 'Simulated — not a real Azure IP']] } : null,
    disk:   { title: 'OS Disk',              icon: '💽', rows: [['Name', resources.osDisk.name], ['Type', resources.osDisk.type], ['Size', resources.osDisk.size + ' GiB'], ['Simulated ID', resources.osDisk.id]] }
  };

  const d = details[nodeId];
  if (!d) return;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="detail-header">
      <span class="detail-icon">${d.icon}</span>
      <h4>${d.title}</h4>
      <button class="detail-close" onclick="document.getElementById('graph-node-detail').style.display='none'">✕</button>
    </div>
    <div class="detail-rows">
      ${d.rows.map(([k, v]) => `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${escHtml(String(v || ''))}</span></div>`).join('')}
    </div>
  `;

  // Highlight selected node
  document.querySelectorAll('.graph-node, .graph-node-sm').forEach(n => n.classList.remove('selected'));
  document.querySelectorAll(`[data-node-id="${nodeId}"]`).forEach(n => n.classList.add('selected'));
}

// ── RESOURCE GROUP VIEW ────────────────────────────────────────────────────────
function showResourceGroupView() {
  showPageSection('resource-group-page');
  const resources = Simulator.getDeployedResources();
  const rg = resources.resourceGroup;
  const vm = resources.virtualMachine;

  const resourceList = [
    { type: 'Virtual machine', name: vm.name, icon: '🖥️' },
    { type: 'Network interface', name: resources.networkInterface.name, icon: '🔌' },
    resources.publicIpAddress ? { type: 'Public IP address', name: resources.publicIpAddress.name, icon: '🌍' } : null,
    { type: 'Network security group', name: resources.networkSecurityGroup.name, icon: '🔒' },
    { type: 'OS disk', name: resources.osDisk.name.substring(0, 40) + '...', icon: '💽' },
    { type: 'Virtual network', name: resources.virtualNetwork.name, icon: '🌐' },
    ...vmConfig.disks.dataDisks.map(d => ({ type: 'Managed disk (data)', name: d.name, icon: '💾' }))
  ].filter(Boolean);

  document.getElementById('resource-group-content').innerHTML = `
    <div class="rg-header">
      <span class="rg-icon">📁</span>
      <div>
        <h2>${rg.name}</h2>
        <p class="rg-subtitle">Resource group — ${rg.location} — ${resourceList.length} resources</p>
        <div class="simulator-badge">Simulated resource group — no real Azure resources exist.</div>
      </div>
    </div>
    <div class="rg-resources-table">
      <div class="rg-table-header">
        <span>Name</span><span>Type</span>
      </div>
      ${resourceList.map(r => `
        <div class="rg-resource-row">
          <span class="rg-resource-icon">${r.icon}</span>
          <span class="rg-resource-name">${escHtml(r.name)}</span>
          <span class="rg-resource-type">${r.type}</span>
        </div>
      `).join('')}
    </div>
    <div class="rg-actions">
      <button class="btn btn-primary" onclick="showVmOverview()">Open Virtual Machine</button>
      <button class="btn btn-secondary" onclick="showResourceGraph()">View resource graph</button>
    </div>
  `;
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function bindModalEvents() {
  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && appState.activeModal) closeModal(appState.activeModal);
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    appState.activeModal = id;
    document.body.style.overflow = 'hidden';
    // Focus trap
    setTimeout(() => modal.querySelector('[tabindex="0"], button, input')?.focus(), 50);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    appState.activeModal = null;
    document.body.style.overflow = '';
  }
}

// ── IMAGE PICKER MODAL ────────────────────────────────────────────────────────
function openImagePickerModal() {
  const container = document.getElementById('image-picker-list');
  if (!container) return;

  const filtered = DATA.images.filter(img =>
    img.architecture.includes(vmConfig.architecture)
  );

  const windows = filtered.filter(i => i.os === 'Windows');
  const linux = filtered.filter(i => i.os === 'Linux');

  const renderGroup = (title, images) => `
    <div class="image-group">
      <h4 class="image-group-title">${title}</h4>
      ${images.map(img => `
        <div class="image-option ${vmConfig.image === img.id ? 'selected' : ''}" onclick="selectImage('${img.id}')">
          <span class="os-dot ${img.os.toLowerCase()}"></span>
          <div class="image-option-info">
            <strong>${img.name}</strong>
            <div class="image-meta-sm">Publisher: ${img.publisher} | SKU: ${img.sku}</div>
          </div>
          ${vmConfig.image === img.id ? '<span class="checkmark">✓</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = renderGroup('Windows', windows) + renderGroup('Linux', linux);
  openModal('image-picker-modal');
}

function selectImage(imageId) {
  vmConfig.image = imageId;
  const imageData = DATA.images.find(i => i.id === imageId);
  // Reset auth type for Windows
  if (imageData && imageData.os === 'Windows') {
    vmConfig.administrator.authType = 'password';
  }
  closeModal('image-picker-modal');
  updateImageDisplay();
  renderAuthSection();
  updateImageFilter();
  if (appState.challengeMode) renderChallengeProgress();
  // Refresh image options highlighting
  document.querySelectorAll('.image-option').forEach(el => el.classList.remove('selected'));
}

// ── SIZE PICKER MODAL ─────────────────────────────────────────────────────────
function openSizePickerModal() {
  const container = document.getElementById('size-picker-list');
  if (!container) return;

  const filtered = DATA.vmSizes.filter(s => s.architecture.includes(vmConfig.architecture));

  container.innerHTML = `
    <table class="size-table">
      <thead>
        <tr>
          <th>Name</th><th>Family</th><th>vCPUs</th><th>RAM (GiB)</th>
          <th>Temp Storage</th><th>Max Disks</th><th>Simulated Price</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(s => `
          <tr class="size-row ${vmConfig.size === s.name ? 'selected-size' : ''}" onclick="selectSize('${s.name}')">
            <td><strong>${s.name}</strong><div class="size-desc">${s.description}</div></td>
            <td>${s.family}</td>
            <td>${s.vcpus}</td>
            <td>${s.ram}</td>
            <td>${s.tempStorage > 0 ? s.tempStorage + ' GiB' : '—'}</td>
            <td>${s.maxDataDisks}</td>
            <td class="price-col">₹${s.pricePerHour}/hr<div class="price-note">educational</div></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p class="size-disclaimer">⚠ All prices are simulated estimates for educational purposes only. They do not represent current Azure pricing.</p>
  `;

  openModal('size-picker-modal');
}

function selectSize(sizeName) {
  vmConfig.size = sizeName;
  closeModal('size-picker-modal');
  updateSizeDisplay();
  if (appState.challengeMode) renderChallengeProgress();
}

// ── DISK MODAL ────────────────────────────────────────────────────────────────
function openDiskModal(editDiskData) {
  const modal = document.getElementById('disk-modal');
  if (!modal) return;

  const isEdit = editDiskData && editDiskData._editIndex !== undefined;
  document.getElementById('disk-modal-title').textContent = isEdit ? 'Edit data disk' : 'Create and attach a new disk';

  const disk = isEdit ? editDiskData : {
    name: `${vmConfig.vmName || 'vm'}-data-disk-${++appState.diskCounter}`,
    type: 'premium-ssd',
    size: 128,
    caching: 'none',
    deleteWithVm: true,
    encryption: 'platform-managed'
  };

  document.getElementById('disk-form').innerHTML = `
    <div class="form-group">
      <label for="disk-name">Disk name</label>
      <input type="text" id="disk-name" class="form-input" value="${escHtml(disk.name)}">
    </div>
    <div class="form-group">
      <label>Disk type</label>
      ${DATA.diskTypes.map(t => `
        <label class="radio-option">
          <input type="radio" name="disk-type" value="${t.id}" ${disk.type === t.id ? 'checked' : ''}>
          <span>${t.name}</span>
          <span class="radio-desc">${t.description}</span>
        </label>
      `).join('')}
    </div>
    <div class="form-group">
      <label for="disk-size">Size (GiB)</label>
      <select id="disk-size" class="form-select">
        ${DATA.dataDiskSizes.map(s => `<option value="${s}" ${disk.size == s ? 'selected' : ''}>${s} GiB</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="disk-caching">Host caching</label>
      <select id="disk-caching" class="form-select">
        ${DATA.cachingOptions.map(c => `<option value="${c.id}" ${disk.caching === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" id="disk-delete-with-vm" ${disk.deleteWithVm ? 'checked' : ''}>
        Delete with VM
      </label>
    </div>
  `;

  // Set save handler
  document.getElementById('btn-save-disk').onclick = () => {
    const newDisk = {
      name: document.getElementById('disk-name').value.trim(),
      type: document.querySelector('input[name="disk-type"]:checked')?.value || 'premium-ssd',
      size: parseInt(document.getElementById('disk-size').value, 10),
      caching: document.getElementById('disk-caching').value,
      deleteWithVm: document.getElementById('disk-delete-with-vm').checked
    };

    if (!newDisk.name) { showToast('⚠ Disk name is required.'); return; }

    if (isEdit) {
      vmConfig.disks.dataDisks[editDiskData._editIndex] = newDisk;
    } else {
      vmConfig.disks.dataDisks.push(newDisk);
    }

    closeModal('disk-modal');
    renderDataDisksTable();
    if (appState.challengeMode) renderChallengeProgress();
  };

  openModal('disk-modal');
}

// ── NSG RULE MODAL ────────────────────────────────────────────────────────────
function openNsgRuleModal() {
  const modal = document.getElementById('nsg-rule-modal');
  if (!modal) return;

  document.getElementById('nsg-rule-form').innerHTML = `
    <div class="form-group">
      <label>Priority (100–4096)</label>
      <input type="number" id="nsg-priority" class="form-input" min="100" max="4096" value="${1000 + (vmConfig.networking.nsg.customRules || []).length * 10}">
    </div>
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="nsg-name" class="form-input" placeholder="e.g. AllowSSH">
    </div>
    <div class="form-group">
      <label>Port</label>
      <input type="text" id="nsg-port" class="form-input" placeholder="22, 80, 443, Any, 8080-8090">
    </div>
    <div class="form-group">
      <label>Protocol</label>
      <select id="nsg-protocol" class="form-select">
        <option value="TCP">TCP</option>
        <option value="UDP">UDP</option>
        <option value="Any">Any</option>
      </select>
    </div>
    <div class="form-group">
      <label>Source</label>
      <select id="nsg-source" class="form-select">
        <option value="Any">Any</option>
        <option value="VirtualNetwork">VirtualNetwork</option>
        <option value="Internet">Internet</option>
        <option value="AzureLoadBalancer">AzureLoadBalancer</option>
      </select>
    </div>
    <div class="form-group">
      <label>Destination</label>
      <select id="nsg-dest" class="form-select">
        <option value="Any">Any</option>
        <option value="VirtualNetwork">VirtualNetwork</option>
        <option value="Internet">Internet</option>
      </select>
    </div>
    <div class="form-group">
      <label>Action</label>
      <select id="nsg-action" class="form-select">
        <option value="Allow">Allow</option>
        <option value="Deny">Deny</option>
      </select>
    </div>
  `;

  document.getElementById('btn-save-nsg-rule').onclick = () => {
    const rule = {
      priority: parseInt(document.getElementById('nsg-priority').value, 10),
      name:     document.getElementById('nsg-name').value.trim(),
      port:     document.getElementById('nsg-port').value.trim(),
      protocol: document.getElementById('nsg-protocol').value,
      source:   document.getElementById('nsg-source').value,
      destination: document.getElementById('nsg-dest').value,
      action:   document.getElementById('nsg-action').value
    };

    const errors = Validation.validateNsgRules([rule]);
    if (errors.length > 0) { showToast('⚠ ' + errors[0]); return; }

    if (!vmConfig.networking.nsg.customRules) vmConfig.networking.nsg.customRules = [];
    vmConfig.networking.nsg.customRules.push(rule);
    closeModal('nsg-rule-modal');
    renderNsgRulesTable();
  };

  openModal('nsg-rule-modal');
}

// ── EXTENSION MODAL ───────────────────────────────────────────────────────────
function openExtensionModal() {
  const modal = document.getElementById('extension-modal');
  if (!modal) return;

  const container = document.getElementById('extension-list');
  const imageData = DATA.images.find(i => i.id === vmConfig.image);
  const isWindows = imageData && imageData.os === 'Windows';

  const extensions = DATA.extensions.filter(e => {
    if (e.id === 'iis' && !isWindows) return false;
    if (e.id === 'psdsc' && !isWindows) return false;
    return true;
  });

  container.innerHTML = extensions.map(ext => `
    <div class="extension-option" onclick="selectExtension('${ext.id}')">
      <strong>${ext.name}</strong>
      <div class="ext-publisher">${ext.publisher}</div>
      <div class="ext-desc">${ext.description}</div>
    </div>
  `).join('');

  document.getElementById('extension-config-section').style.display = 'none';
  appState.pendingExtension = null;

  openModal('extension-modal');
}

function selectExtension(extId) {
  const ext = DATA.extensions.find(e => e.id === extId);
  if (!ext) return;

  appState.pendingExtension = { id: extId, config: {} };

  const cfgSection = document.getElementById('extension-config-section');
  cfgSection.style.display = 'block';
  cfgSection.innerHTML = `
    <h4>${ext.name} — Configuration</h4>
    ${ext.fields.length > 0 ? ext.fields.map(f => `
      <div class="form-group">
        <label>${f.label}</label>
        <input type="${f.type}" class="form-input ext-field" data-field="${f.id}" placeholder="${f.placeholder || ''}">
      </div>
    `).join('') : '<p class="text-muted">No configuration required for this extension.</p>'}
  `;

  document.getElementById('btn-add-ext-confirm').onclick = () => {
    if (!appState.pendingExtension) return;
    cfgSection.querySelectorAll('.ext-field').forEach(input => {
      appState.pendingExtension.config[input.dataset.field] = input.value;
    });
    const already = vmConfig.advanced.extensions.find(e => e.id === extId);
    if (!already) {
      vmConfig.advanced.extensions.push(appState.pendingExtension);
    }
    closeModal('extension-modal');
    renderExtensionsTable();
  };
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  document.getElementById('btn-confirm-ok').onclick = () => {
    closeModal('confirm-modal');
    if (onConfirm) onConfirm();
  };
  document.getElementById('btn-confirm-cancel').onclick = () => closeModal('confirm-modal');
  openModal('confirm-modal');
}

// ── CHALLENGE MODE ────────────────────────────────────────────────────────────
function renderChallengePicker() {
  const container = document.getElementById('challenge-picker-list');
  if (!container) return;

  container.innerHTML = DATA.challengeLabs.map(lab => `
    <div class="challenge-option" onclick="startChallenge('${lab.id}')">
      <h4>${lab.title}</h4>
      <p>${lab.description}</p>
      <div class="challenge-req-count">${lab.requirements.length} requirements</div>
    </div>
  `).join('');
}

function startChallenge(labId) {
  const lab = DATA.challengeLabs.find(l => l.id === labId);
  if (!lab) return;
  appState.challengeMode = true;
  appState.currentChallenge = lab;
  closeModal('challenge-picker-modal');

  const bar = document.getElementById('challenge-bar');
  if (bar) bar.style.display = 'flex';
  document.getElementById('challenge-title').textContent = lab.title;
  document.getElementById('toggle-challenge').classList.add('active');

  renderChallengeProgress();
  showToast(`🎯 Challenge started: ${lab.title}`);
}

function renderChallengeProgress() {
  if (!appState.challengeMode || !appState.currentChallenge) return;
  const lab = appState.currentChallenge;
  const results = Simulator.evaluateChallenge(lab, vmConfig);
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  const bar = document.getElementById('challenge-bar');
  if (bar) {
    document.getElementById('challenge-progress-text').textContent = `${passed} / ${total} requirements completed`;
    document.getElementById('challenge-progress-fill').style.width = `${(passed / total) * 100}%`;

    const detailList = document.getElementById('challenge-requirements');
    if (detailList) {
      detailList.innerHTML = results.map(r => `
        <div class="challenge-req ${r.passed ? 'passed' : 'pending'}">
          ${r.passed ? '✅' : '⭕'} ${r.label}
        </div>
      `).join('');
    }

    if (passed === total) {
      document.getElementById('challenge-complete-msg').style.display = 'block';
    }
  }
}

// Bind challenge picker modal
document.addEventListener('DOMContentLoaded', () => {
  renderChallengePicker();
});

// ── SIMULATOR MENU ────────────────────────────────────────────────────────────
function bindSimulatorMenu() {
  document.getElementById('btn-load-sample')?.addEventListener('click', loadSampleConfig);
  document.getElementById('btn-reset-config')?.addEventListener('click', () => {
    openConfirmModal('Reset Configuration', 'Are you sure you want to reset all configuration to defaults?', resetConfig);
  });
  document.getElementById('btn-reset-all')?.addEventListener('click', () => {
    openConfirmModal('Reset All', 'Reset all configuration and simulated resources?', resetAll);
  });
}

function loadSampleConfig() {
  const sc = DATA.sampleConfig;
  vmConfig.subscription = sc.subscription;
  vmConfig.resourceGroup = { ...sc.resourceGroup };
  vmConfig.vmName = sc.vmName;
  vmConfig.region = sc.region;
  vmConfig.availability = { ...sc.availability };
  vmConfig.securityType = sc.securityType;
  vmConfig.image = sc.image;
  vmConfig.architecture = sc.architecture;
  vmConfig.spot = { ...sc.spot };
  vmConfig.size = sc.size;
  vmConfig.administrator = { ...sc.administrator };
  vmConfig.inboundPorts = [...sc.inboundPorts];
  vmConfig.disks = {
    osDisk: { ...sc.disks.osDisk },
    dataDisks: []
  };
  vmConfig.networking = JSON.parse(JSON.stringify(sc.networking));
  vmConfig.management = JSON.parse(JSON.stringify(sc.management));
  vmConfig.monitoring = { ...sc.monitoring };
  vmConfig.advanced = JSON.parse(JSON.stringify(sc.advanced));
  vmConfig.tags = sc.tags.map(t => ({ ...t }));

  navigateToTab('basics');
  showToast('✅ Sample configuration loaded! Review the settings and click "Review + create" when ready.');
}

function resetConfig() {
  Object.assign(vmConfig, {
    subscription: 'sub-students',
    resourceGroup: { mode: 'new', name: 'student-vm-rg' },
    vmName: '',
    region: '',
    availability: { type: 'none', zone: '' },
    securityType: 'trustedlaunch',
    image: '',
    architecture: 'x64',
    spot: { enabled: false, evictionType: 'deallocate', maxPrice: '' },
    size: '',
    administrator: { authType: 'ssh', username: '', password: '', confirmPassword: '', sshKey: '' },
    inboundPorts: [],
    disks: { osDisk: { type: 'premium-ssd', deleteWithVm: true, caching: 'readwrite' }, dataDisks: [] },
    networking: {
      vnet: { mode: 'new', name: 'student-vnet', addressSpace: '10.0.0.0/16' },
      subnet: { name: 'web-subnet', range: '10.0.1.0/24' },
      publicIp: { mode: 'new', name: '', sku: 'Standard', assignment: 'Static' },
      nic: { name: '' }, nsg: { mode: 'basic', customRules: [] }, nsgName: '', loadBalancing: 'none'
    },
    management: {
      defenderForCloud: true, bootDiagnostics: true, osGuestDiagnostics: false,
      autoShutdown: { enabled: false, time: '19:00', timezone: 'India Standard Time' },
      identity: { systemAssigned: false, userAssigned: '' }
    },
    monitoring: { azureMonitor: true, metrics: true, alerts: false, logCollection: false },
    advanced: { extensions: [], customData: '', hostGroup: '', host: '', proximityPlacementGroup: '', encryptionAtHost: false },
    tags: []
  });
  navigateToTab('basics');
  showToast('Configuration reset.');
}

function resetAll() {
  resetConfig();
  Simulator.resetDeployment();
  showPageSection('create-vm-page');
  showToast('All simulated resources and configuration reset.');
}

// ── PRACTICE HINTS ────────────────────────────────────────────────────────────
function renderHints() {
  const container = document.getElementById('hints-container');
  if (!container) return;

  if (!appState.practiceMode) {
    container.innerHTML = '';
    return;
  }

  const hints = DATA.hints[appState.currentTab] || [];
  if (hints.length === 0) {
    container.innerHTML = '';
    return;
  }

  const hint = hints[Math.floor(Math.random() * hints.length)];
  container.innerHTML = `
    <div class="hint-card">
      <span class="hint-icon">💡</span>
      <div>
        <strong>Hint</strong>
        <p>${hint.text}</p>
      </div>
    </div>
  `;
}

// ── TOOLTIP / INFO SYSTEM ─────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const infoBtn = e.target.closest('.info-btn');
  if (infoBtn) {
    const tooltipKey = infoBtn.dataset.tooltip;
    const info = DATA.tooltips[tooltipKey];
    if (info) showTooltipPopover(infoBtn, info);
    return;
  }

  // Close open popovers
  const existing = document.querySelector('.tooltip-popover');
  if (existing && !existing.contains(e.target) && !e.target.closest('.info-btn')) {
    existing.remove();
  }
});

function showTooltipPopover(anchor, info) {
  document.querySelectorAll('.tooltip-popover').forEach(el => el.remove());

  const popover = document.createElement('div');
  popover.className = 'tooltip-popover';
  popover.innerHTML = `
    <div class="popover-header">
      <strong>${info.title}</strong>
      <button class="popover-close" onclick="this.closest('.tooltip-popover').remove()">✕</button>
    </div>
    <p>${info.content}</p>
  `;

  document.body.appendChild(popover);

  const rect = anchor.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;

  let top = rect.bottom + scrollY + 8;
  let left = rect.left + scrollX;

  if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
  if (top + 200 > window.innerHeight + scrollY) top = rect.top + scrollY - 200 - 8;

  popover.style.top = top + 'px';
  popover.style.left = left + 'px';
}

// ── TOAST NOTIFICATION ─────────────────────────────────────────────────────────
function showToast(message, duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── SYNC HELPERS ──────────────────────────────────────────────────────────────
function syncInput(id, value, onChange) {
  const el = document.getElementById(id);
  if (!el) return;
  if (document.activeElement !== el) el.value = value || '';
  el.oninput = () => onChange(el.value);
}

function syncTextarea(id, value, onChange) {
  const el = document.getElementById(id);
  if (!el) return;
  if (document.activeElement !== el) el.value = value || '';
  el.oninput = () => onChange(el.value);
}

function syncSelect(id, value, onChange) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value || '';
  el.onchange = () => onChange(el.value);
}

function syncRadio(name, value, onChange) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach(r => {
    r.checked = (r.value === value);
    r.onchange = () => { if (r.checked) onChange(r.value); };
  });
}

function syncToggle(id, value, onChange) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = !!value;
  el.onchange = () => onChange(el.checked);
}

// ── UTILITY HELPERS ───────────────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function portName(port) {
  const map = { '22': 'SSH (22)', '80': 'HTTP (80)', '443': 'HTTPS (443)', '3389': 'RDP (3389)' };
  return map[port] || port;
}

function diskTypeName(type) {
  const map = { 'premium-ssd': 'Premium SSD', 'standard-ssd': 'Standard SSD', 'standard-hdd': 'Standard HDD' };
  return map[type] || type;
}

// ── VM LIST PAGE ──────────────────────────────────────────────────────────────
function renderVmListPage() {
  const resources = Simulator.getDeployedResources();
  const listEl = document.getElementById('vm-list-content');
  if (!listEl) return;

  const hasVm = resources.virtualMachine;
  listEl.innerHTML = hasVm ? `
    <div class="vm-list-toolbar">
      <button class="btn btn-primary" onclick="showPageSection('create-vm-page'); navigateToTab('basics')">+ Create</button>
    </div>
    <table class="vm-list-table">
      <thead><tr><th>Name</th><th>Status</th><th>Location</th><th>Resource group</th><th>Size</th></tr></thead>
      <tbody>
        <tr class="vm-list-row" onclick="showVmOverview()">
          <td><span class="vm-name-link">🖥️ ${resources.virtualMachine.name}</span></td>
          <td><span class="status-badge status-running">● Running</span></td>
          <td>${resources.virtualMachine.location}</td>
          <td>${resources.resourceGroup.name}</td>
          <td>${resources.virtualMachine.size}</td>
        </tr>
      </tbody>
    </table>
  ` : `
    <div class="vm-list-empty">
      <div class="empty-icon">🖥️</div>
      <h3>No virtual machines</h3>
      <p>You haven't deployed any virtual machines yet in this simulator session.</p>
      <button class="btn btn-primary" onclick="showPageSection('create-vm-page'); navigateToTab('basics')">+ Create virtual machine</button>
    </div>
  `;
}

// Refresh VM list when navigating to it
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[data-target="vm-list"]')?.addEventListener('click', renderVmListPage);
});
