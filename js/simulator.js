/**
 * simulator.js — Deployment simulation, resource generation, VM state machine
 * Handles: deployment animation, resource ID generation, simulated IPs,
 *          resource relationship graph data, and VM lifecycle state.
 */

const Simulator = (() => {

  // ── Simulated Resource Store ─────────────────────────────────────────────
  let deployedResources = {};
  let vmState = 'none'; // none | running | stopping | stopped | starting | restarting | deleting | deleted

  // ── Resource ID Generator ────────────────────────────────────────────────
  function generateSubscriptionId() {
    return 'demo-' + Math.random().toString(36).substr(2, 8) + '-' + Math.random().toString(36).substr(2, 4) + '-' + Math.random().toString(36).substr(2, 4);
  }

  function generateResourceId(subscriptionId, resourceGroupName, provider, type, name) {
    return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${provider}/${type}/${name}`;
  }

  function generateNicId(subId, rg, nicName) {
    return generateResourceId(subId, rg, 'Microsoft.Network', 'networkInterfaces', nicName);
  }

  function generateDiskId(subId, rg, diskName) {
    return generateResourceId(subId, rg, 'Microsoft.Compute', 'disks', diskName);
  }

  function generateVmId(subId, rg, vmName) {
    return generateResourceId(subId, rg, 'Microsoft.Compute', 'virtualMachines', vmName);
  }

  // ── IP Address Generator ─────────────────────────────────────────────────
  function generatePublicIp() {
    return `${randomInt(20, 40)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
  }

  function generatePrivateIp(subnetCIDR) {
    // Try to pick an IP within the subnet range
    if (subnetCIDR && subnetCIDR.includes('/')) {
      const base = subnetCIDR.split('/')[0];
      const parts = base.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.${randomInt(4, 254)}`;
      }
    }
    return `10.0.1.${randomInt(4, 254)}`;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ── Simulated Metric Values ───────────────────────────────────────────────
  function generateMetrics() {
    return {
      cpu: randomInt(2, 15),
      memory: randomInt(30, 70),
      diskRead: (Math.random() * 5).toFixed(2),
      diskWrite: (Math.random() * 3).toFixed(2),
      networkIn: (Math.random() * 2).toFixed(2),
      networkOut: (Math.random() * 0.5).toFixed(2)
    };
  }

  // ── Resource Name Helpers ─────────────────────────────────────────────────
  function buildResourceNames(config) {
    const vmName = config.vmName || 'student-vm';
    const rgName = config.resourceGroup.name || 'student-rg';
    const vnetName = config.networking.vnet.name || `${vmName}-vnet`;
    const subnetName = config.networking.subnet.name || 'default';
    const nicName = config.networking.nic && config.networking.nic.name ? config.networking.nic.name : `${vmName}-nic`;
    const nsgName = config.networking.nsgName || `${vmName}-nsg`;
    const pipName = (config.networking.publicIp && config.networking.publicIp.name) ? config.networking.publicIp.name : `${vmName}-ip`;
    const osDiskName = `${vmName}_OsDisk_1_${Math.random().toString(36).substr(2, 20)}`;

    return { vmName, rgName, vnetName, subnetName, nicName, nsgName, pipName, osDiskName };
  }

  // ── Deployment Steps ──────────────────────────────────────────────────────
  /**
   * Deployment step definitions with simulated delays (ms).
   */
  const DEPLOYMENT_STEPS = [
    { id: 'rg',    label: 'Resource group',        delay: 600 },
    { id: 'nsg',   label: 'Network security group', delay: 900 },
    { id: 'vnet',  label: 'Virtual network',        delay: 800 },
    { id: 'subnet',label: 'Subnet',                 delay: 500 },
    { id: 'pip',   label: 'Public IP address',      delay: 800 },
    { id: 'nic',   label: 'Network interface',      delay: 700 },
    { id: 'disk',  label: 'OS disk',                delay: 1500 },
    { id: 'vm',    label: 'Virtual machine',        delay: 2500 },
    { id: 'boot',  label: 'Boot diagnostics',       delay: 600 }
  ];

  /**
   * Run the full deployment simulation.
   * @param {object} config - vmConfig
   * @param {object} callbacks - { onStepStart, onStepComplete, onDeploymentComplete }
   */
  function runDeployment(config, callbacks) {
    const subId = generateSubscriptionId();
    const names = buildResourceNames(config);
    const privateIp = generatePrivateIp(config.networking.subnet.range);
    const publicIp = (config.networking.publicIp && config.networking.publicIp.mode === 'new')
      ? generatePublicIp()
      : null;

    const imageData = DATA.images.find(i => i.id === config.image) || {};
    const sizeData = DATA.vmSizes.find(s => s.name === config.size) || {};
    const regionData = DATA.regions.find(r => r.id === config.region) || {};

    // Build the deployed resources object
    deployedResources = {
      subscriptionId: subId,
      resourceGroup: {
        name: names.rgName,
        id: `/subscriptions/${subId}/resourceGroups/${names.rgName}`,
        location: regionData.name || config.region
      },
      virtualNetwork: {
        name: names.vnetName,
        id: generateResourceId(subId, names.rgName, 'Microsoft.Network', 'virtualNetworks', names.vnetName),
        addressSpace: config.networking.vnet.addressSpace || '10.0.0.0/16'
      },
      subnet: {
        name: names.subnetName,
        addressPrefix: config.networking.subnet.range || '10.0.1.0/24'
      },
      networkSecurityGroup: {
        name: names.nsgName,
        id: generateResourceId(subId, names.rgName, 'Microsoft.Network', 'networkSecurityGroups', names.nsgName)
      },
      publicIpAddress: publicIp ? {
        name: names.pipName,
        id: generateResourceId(subId, names.rgName, 'Microsoft.Network', 'publicIPAddresses', names.pipName),
        ipAddress: publicIp,
        sku: 'Standard',
        assignment: 'Static'
      } : null,
      networkInterface: {
        name: names.nicName,
        id: generateNicId(subId, names.rgName, names.nicName),
        privateIpAddress: privateIp,
        publicIpAddress: publicIp
      },
      osDisk: {
        name: names.osDiskName,
        id: generateDiskId(subId, names.rgName, names.osDiskName),
        type: config.disks.osDisk.type || 'premium-ssd',
        size: imageData.os === 'Windows' ? 128 : 30
      },
      virtualMachine: {
        name: names.vmName,
        id: generateVmId(subId, names.rgName, names.vmName),
        location: regionData.name || config.region,
        size: config.size,
        os: imageData.os || 'Linux',
        image: imageData.name || config.image,
        privateIp: privateIp,
        publicIp: publicIp,
        vCpus: sizeData.vcpus,
        ramGb: sizeData.ram,
        status: 'Running',
        createdAt: new Date().toISOString()
      },
      config: JSON.parse(JSON.stringify(config)) // snapshot
    };

    vmState = 'running';

    // Run steps with cascading delays
    let totalDelay = 0;
    const stepsToRun = DEPLOYMENT_STEPS.filter(step => {
      // Skip pip step if no public IP
      if (step.id === 'pip' && !publicIp) return false;
      // Skip boot step if boot diagnostics disabled
      if (step.id === 'boot' && !config.management.bootDiagnostics) return false;
      return true;
    });

    stepsToRun.forEach((step, index) => {
      totalDelay += step.delay;
      const stepDelay = totalDelay;

      setTimeout(() => {
        if (callbacks.onStepStart) callbacks.onStepStart(step.id, step.label, index, stepsToRun.length);
      }, stepDelay - step.delay + 50);

      setTimeout(() => {
        if (callbacks.onStepComplete) callbacks.onStepComplete(step.id, step.label, index, stepsToRun.length);
      }, stepDelay);
    });

    // Final callback
    setTimeout(() => {
      if (callbacks.onDeploymentComplete) callbacks.onDeploymentComplete(deployedResources);
    }, totalDelay + 500);
  }

  // ── VM State Machine ──────────────────────────────────────────────────────

  /**
   * Transition VM state.
   * @param {string} action - 'start' | 'stop' | 'restart' | 'delete'
   * @param {function} onStateChange - called with (newState) during transition
   * @param {function} onComplete - called when transition finishes
   */
  function vmAction(action, onStateChange, onComplete) {
    const transitions = {
      start: [
        { state: 'starting', delay: 200 },
        { state: 'running',  delay: 2000 }
      ],
      stop: [
        { state: 'stopping',     delay: 200 },
        { state: 'deallocated',  delay: 2500 }
      ],
      restart: [
        { state: 'stopping',   delay: 200 },
        { state: 'restarting', delay: 1500 },
        { state: 'running',    delay: 2000 }
      ],
      delete: [
        { state: 'deleting', delay: 200 },
        { state: 'deleted',  delay: 3000 }
      ]
    };

    const steps = transitions[action];
    if (!steps) return;

    let elapsed = 0;
    steps.forEach(step => {
      elapsed += step.delay;
      setTimeout(() => {
        vmState = step.state;
        if (deployedResources.virtualMachine) {
          deployedResources.virtualMachine.status = formatVmStatus(step.state);
        }
        if (onStateChange) onStateChange(step.state);
      }, elapsed);
    });

    setTimeout(() => {
      if (onComplete) onComplete(vmState);
    }, elapsed + 100);
  }

  function formatVmStatus(state) {
    const map = {
      running:     'Running',
      stopping:    'Stopping',
      deallocated: 'Stopped (deallocated)',
      starting:    'Starting',
      restarting:  'Restarting',
      deleting:    'Deleting',
      deleted:     'Deleted'
    };
    return map[state] || state;
  }

  function getVmState() { return vmState; }
  function getDeployedResources() { return deployedResources; }

  function resetDeployment() {
    deployedResources = {};
    vmState = 'none';
  }

  // ── Cost Calculator ───────────────────────────────────────────────────────
  function calculateCost(sizeName) {
    const size = DATA.vmSizes.find(s => s.name === sizeName);
    if (!size) return { hourly: 0, monthly: 0 };
    return {
      hourly: size.pricePerHour,
      monthly: Math.round(size.pricePerHour * 730)
    };
  }

  // ── Resource Graph Data ───────────────────────────────────────────────────
  /**
   * Build the resource relationship graph structure from deployed resources.
   */
  function buildResourceGraph(resources) {
    const nodes = [];
    const edges = [];

    const rg = resources.resourceGroup;
    const vm = resources.virtualMachine;
    const vnet = resources.virtualNetwork;
    const nsg = resources.networkSecurityGroup;
    const nic = resources.networkInterface;
    const disk = resources.osDisk;
    const pip = resources.publicIpAddress;

    nodes.push({ id: 'rg',    label: rg.name,   type: 'resource-group', icon: '📁', detail: `Type: Resource Group\nLocation: ${rg.location}` });
    nodes.push({ id: 'vm',    label: vm.name,   type: 'vm',             icon: '🖥️',  detail: `Type: Virtual Machine\nSize: ${vm.size}\nOS: ${vm.os}\nStatus: ${vm.status}` });
    nodes.push({ id: 'vnet',  label: vnet.name, type: 'vnet',           icon: '🌐', detail: `Type: Virtual Network\nAddress Space: ${vnet.addressSpace}` });
    nodes.push({ id: 'nsg',   label: nsg.name,  type: 'nsg',            icon: '🔒', detail: 'Type: Network Security Group' });
    nodes.push({ id: 'nic',   label: nic.name,  type: 'nic',            icon: '🔌', detail: `Type: Network Interface\nPrivate IP: ${nic.privateIpAddress}` });
    nodes.push({ id: 'disk',  label: disk.name.substring(0, 30) + '...', type: 'disk', icon: '💽', detail: `Type: Managed Disk\nDisk Type: ${disk.type}` });
    nodes.push({ id: 'subnet',label: resources.subnet.name, type: 'subnet', icon: '🔗', detail: `Type: Subnet\nPrefix: ${resources.subnet.addressPrefix}` });

    if (pip) {
      nodes.push({ id: 'pip', label: pip.name, type: 'pip', icon: '🌍', detail: `Type: Public IP Address\nIP: ${pip.ipAddress}` });
    }

    // Resource Group contains all
    ['vm', 'vnet', 'nsg', 'nic', 'disk', ...(pip ? ['pip'] : [])].forEach(id => {
      edges.push({ from: 'rg', to: id });
    });

    // VM uses NIC and Disk
    edges.push({ from: 'vm', to: 'nic' });
    edges.push({ from: 'vm', to: 'disk' });

    // NIC connects to subnet and pip
    edges.push({ from: 'nic', to: 'subnet' });
    if (pip) edges.push({ from: 'nic', to: 'pip' });

    // VNet contains subnet
    edges.push({ from: 'vnet', to: 'subnet' });

    // NSG can apply to NIC or subnet
    edges.push({ from: 'nsg', to: 'nic' });

    return { nodes, edges };
  }

  // ── Challenge Mode Evaluator ──────────────────────────────────────────────
  /**
   * Evaluate current config against a challenge lab's requirements.
   * Returns array of { id, label, passed } objects.
   */
  function evaluateChallenge(lab, config) {
    return lab.requirements.map(req => {
      let passed = false;
      try {
        if (typeof req.checker === 'function') {
          passed = req.checker(config);
        } else {
          // Navigate dot-path
          const val = req.field.split('.').reduce((obj, key) => obj && obj[key], config);
          passed = val === req.expected;
          // For availability zone, also check type is 'zone'
          if (req.condition && !req.condition(config)) {
            passed = false;
          }
        }
      } catch (e) {
        passed = false;
      }
      return { id: req.id, label: req.label, passed };
    });
  }

  return {
    runDeployment,
    vmAction,
    getVmState,
    getDeployedResources,
    resetDeployment,
    calculateCost,
    buildResourceGraph,
    evaluateChallenge,
    generateMetrics,
    DEPLOYMENT_STEPS
  };
})();
