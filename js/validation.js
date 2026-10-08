/**
 * validation.js — Validation engine for Azure VM Practice Simulator
 * All validation functions, error messages, and the validateAll() orchestrator.
 */

const Validation = (() => {

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Parse a CIDR string like "10.0.0.0/16" and return the network and mask.
   */
  function parseCIDR(cidr) {
    const parts = cidr.trim().split('/');
    if (parts.length !== 2) return null;
    const mask = parseInt(parts[1], 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return null;
    const ipParts = parts[0].split('.');
    if (ipParts.length !== 4) return null;
    const ip = ipParts.map(Number);
    if (ip.some(n => isNaN(n) || n < 0 || n > 255)) return null;
    const ipInt = (ip[0] << 24) | (ip[1] << 16) | (ip[2] << 8) | ip[3];
    const maskInt = mask === 0 ? 0 : (0xFFFFFFFF << (32 - mask)) >>> 0;
    const network = (ipInt & maskInt) >>> 0;
    const broadcast = (network | (~maskInt >>> 0)) >>> 0;
    return { network, broadcast, mask };
  }

  /**
   * Return true if subnetCIDR is fully contained within vnetCIDR.
   */
  function isSubnetInVnet(vnetCIDR, subnetCIDR) {
    const vnet = parseCIDR(vnetCIDR);
    const subnet = parseCIDR(subnetCIDR);
    if (!vnet || !subnet) return false;
    if (subnet.mask < vnet.mask) return false; // subnet can't be bigger than vnet
    return subnet.network >= vnet.network && subnet.broadcast <= vnet.broadcast;
  }

  /**
   * Return true if a string is a valid CIDR.
   */
  function isValidCIDR(cidr) {
    return parseCIDR(cidr) !== null;
  }

  /**
   * Azure VM naming: 1-15 chars (Windows) or 1-64 chars (Linux), 
   * alphanumeric and hyphens, cannot start/end with hyphen.
   */
  function isValidVmName(name, os) {
    if (!name) return false;
    const maxLen = (os === 'Windows') ? 15 : 64;
    if (name.length < 1 || name.length > maxLen) return false;
    if (!/^[a-zA-Z0-9]/.test(name)) return false;
    if (!/[a-zA-Z0-9]$/.test(name)) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(name)) return false;
    return true;
  }

  /**
   * Azure resource group naming: 1-90 chars, alphanumeric, hyphens, underscores, periods.
   */
  function isValidRgName(name) {
    if (!name) return false;
    if (name.length < 1 || name.length > 90) return false;
    if (!/^[a-zA-Z0-9]/.test(name)) return false;
    if (!/^[a-zA-Z0-9_.\-]+$/.test(name)) return false;
    if (/\.$/.test(name)) return false;
    return true;
  }

  /**
   * Password complexity: 12+ chars, uppercase, lowercase, number, special char.
   */
  function isStrongPassword(password) {
    if (!password || password.length < 12) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    return true;
  }

  /**
   * Basic SSH public key format check (starts with key type string).
   */
  function isValidSshKey(key) {
    if (!key || key.trim().length < 20) return false;
    const trimmed = key.trim();
    return /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/=]+/.test(trimmed);
  }

  /**
   * Valid NSG port: number 1-65535, range like "80-443", or "Any" / "*".
   */
  function isValidNsgPort(port) {
    if (!port) return false;
    if (port === 'Any' || port === '*') return true;
    if (/^\d+$/.test(port)) {
      const n = parseInt(port, 10);
      return n >= 1 && n <= 65535;
    }
    if (/^\d+-\d+$/.test(port)) {
      const [a, b] = port.split('-').map(Number);
      return a >= 1 && b <= 65535 && a <= b;
    }
    return false;
  }

  // ── Individual Field Validators ──────────────────────────────────────────

  function validateSubscription(config) {
    if (!config.subscription) {
      return 'Please select a subscription.';
    }
    return null;
  }

  function validateResourceGroup(config) {
    if (config.resourceGroup.mode === 'existing') {
      if (!config.resourceGroup.name) {
        return 'Please select an existing resource group.';
      }
      return null;
    }
    const name = config.resourceGroup.name;
    if (!name) return 'Resource group name is required.';
    if (!isValidRgName(name)) {
      return 'Resource group name must be 1–90 characters. Use only letters, numbers, hyphens, underscores, or periods. Cannot end with a period.';
    }
    return null;
  }

  function validateVmName(config) {
    const name = config.vmName;
    const os = config.image ? (DATA.images.find(i => i.id === config.image) || {}).os : null;

    if (!name) return 'Virtual machine name is required.';

    if (os === 'Windows' && name.length > 15) {
      return 'Windows VM names must be 15 characters or fewer.';
    }
    if (name.length > 64) {
      return 'VM name must be 64 characters or fewer.';
    }
    if (!isValidVmName(name, os)) {
      return 'VM name must start and end with a letter or number, and contain only letters, numbers, or hyphens.';
    }
    return null;
  }

  function validateRegion(config) {
    if (!config.region) return 'Please select a region.';
    return null;
  }

  function validateAvailability(config) {
    if (config.availability.type === 'zone') {
      if (!config.availability.zone) {
        return 'Please select an availability zone (1, 2, or 3).';
      }
    }
    return null;
  }

  function validateImage(config) {
    if (!config.image) return 'Please select a virtual machine image.';
    return null;
  }

  function validateSize(config) {
    if (!config.size) return 'Please select a virtual machine size.';
    const sizeData = DATA.vmSizes.find(s => s.name === config.size);
    if (!sizeData) return 'Selected VM size is not recognized.';
    if (config.architecture && !sizeData.architecture.includes(config.architecture)) {
      return `The size ${config.size} is not available for the ${config.architecture} architecture. Please choose a compatible size.`;
    }
    return null;
  }

  function validateAdministrator(config) {
    const admin = config.administrator;
    const imageData = DATA.images.find(i => i.id === config.image);
    const os = imageData ? imageData.os : null;

    if (!admin.username) return 'Administrator username is required.';
    if (admin.username.length < 1 || admin.username.length > 64) {
      return 'Username must be between 1 and 64 characters.';
    }
    const reservedNames = ['administrator', 'admin', 'user', 'user1', 'test', 'test1', 'user2', 'root'];
    if (reservedNames.includes(admin.username.toLowerCase())) {
      return `"${admin.username}" is a reserved username. Please choose a different name.`;
    }

    if (os === 'Linux' && admin.authType === 'ssh') {
      if (!admin.sshKey) return 'SSH public key is required.';
      if (!isValidSshKey(admin.sshKey)) {
        return 'SSH public key format is invalid. It must begin with a key type (e.g. ssh-rsa, ssh-ed25519) followed by the key data.';
      }
      return null;
    }

    // Password validation
    if (!admin.password) return 'Password is required.';
    if (!isStrongPassword(admin.password)) {
      return 'Password must be at least 12 characters and include: uppercase letter, lowercase letter, number, and special character (!@#$%^&* etc).';
    }
    if (admin.password !== admin.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }

  function validateInboundPorts(config) {
    // Warn if no ports but no advisory error — this is a valid configuration
    return null;
  }

  // ── Disk Tab ─────────────────────────────────────────────────────────────

  function validateDisks(config) {
    const errors = [];
    if (!config.disks.osDisk.type) {
      errors.push('OS disk type is required.');
    }
    config.disks.dataDisks.forEach((disk, i) => {
      if (!disk.name) errors.push(`Data disk ${i + 1}: name is required.`);
      if (!disk.type) errors.push(`Data disk ${i + 1}: disk type is required.`);
      if (!disk.size) errors.push(`Data disk ${i + 1}: disk size is required.`);
    });
    return errors.length > 0 ? errors.join(' ') : null;
  }

  // ── Networking Tab ───────────────────────────────────────────────────────

  function validateVnet(config) {
    const vnet = config.networking.vnet;
    if (vnet.mode === 'new') {
      if (!vnet.name) return 'Virtual network name is required.';
      if (!vnet.addressSpace) return 'VNet address space is required.';
      if (!isValidCIDR(vnet.addressSpace)) {
        return 'VNet address space must be a valid CIDR range (e.g. 10.0.0.0/16).';
      }
    } else if (vnet.mode === 'existing') {
      if (!vnet.name) return 'Please select an existing virtual network.';
    }
    return null;
  }

  function validateSubnet(config) {
    const vnet = config.networking.vnet;
    const subnet = config.networking.subnet;

    if (!subnet.name) return 'Subnet name is required.';

    if (vnet.mode === 'new') {
      if (!subnet.range) return 'Subnet address range is required.';
      if (!isValidCIDR(subnet.range)) {
        return 'Subnet address range must be a valid CIDR range (e.g. 10.0.1.0/24).';
      }
      if (vnet.addressSpace && subnet.range) {
        if (!isSubnetInVnet(vnet.addressSpace, subnet.range)) {
          return `Subnet address range (${subnet.range}) must be inside the virtual network address space (${vnet.addressSpace}).`;
        }
      }
    }
    return null;
  }

  function validatePublicIp(config) {
    const pip = config.networking.publicIp;
    if (pip.mode === 'new' && !pip.name) {
      return 'Public IP address name is required.';
    }
    return null;
  }

  function validateNsg(config) {
    const nsg = config.networking.nsg;
    if (nsg.mode === 'advanced' && nsg.customRules) {
      const errors = validateNsgRules(nsg.customRules);
      if (errors.length > 0) return errors.join('; ');
    }
    return null;
  }

  function validateNsgRules(rules) {
    const errors = [];
    const priorities = [];

    rules.forEach((rule, i) => {
      const idx = i + 1;
      if (!rule.name) errors.push(`Rule ${idx}: name is required.`);
      if (!rule.priority && rule.priority !== 0) {
        errors.push(`Rule ${idx}: priority is required.`);
      } else {
        const p = parseInt(rule.priority, 10);
        if (isNaN(p) || p < 100 || p > 4096) {
          errors.push(`Rule ${idx}: priority must be between 100 and 4096.`);
        } else if (priorities.includes(p)) {
          errors.push(`Rule ${idx}: duplicate priority ${p}. Each rule must have a unique priority.`);
        } else {
          priorities.push(p);
        }
      }
      if (!isValidNsgPort(rule.port)) {
        errors.push(`Rule ${idx}: port "${rule.port}" is invalid. Use a number (1-65535), range (80-443), or "Any".`);
      }
      if (!rule.action) errors.push(`Rule ${idx}: action (Allow/Deny) is required.`);
    });

    return errors;
  }

  function validateNetworking(config) {
    const errors = [];
    const vnetErr = validateVnet(config);
    if (vnetErr) errors.push(vnetErr);
    const subnetErr = validateSubnet(config);
    if (subnetErr) errors.push(subnetErr);
    const pipErr = validatePublicIp(config);
    if (pipErr) errors.push(pipErr);
    const nsgErr = validateNsg(config);
    if (nsgErr) errors.push(nsgErr);
    return errors.length > 0 ? errors.join(' ') : null;
  }

  // ── Management Tab ───────────────────────────────────────────────────────

  function validateManagement(config) {
    const mgmt = config.management;
    if (mgmt.autoShutdown.enabled) {
      if (!mgmt.autoShutdown.time) return 'Auto-shutdown time is required when auto-shutdown is enabled.';
      if (!/^\d{2}:\d{2}$/.test(mgmt.autoShutdown.time)) {
        return 'Auto-shutdown time must be in HH:MM format.';
      }
    }
    return null;
  }

  // ── Tags Tab ─────────────────────────────────────────────────────────────

  function validateTags(config) {
    const errors = [];
    const names = [];
    config.tags.forEach((tag, i) => {
      if (!tag.name) errors.push(`Tag ${i + 1}: name is required.`);
      else if (tag.name.length > 512) errors.push(`Tag ${i + 1}: name must be 512 characters or fewer.`);
      else if (names.includes(tag.name)) errors.push(`Tag ${i + 1}: duplicate tag name "${tag.name}".`);
      else names.push(tag.name);
      if (tag.value && tag.value.length > 256) errors.push(`Tag ${i + 1}: value must be 256 characters or fewer.`);
    });
    return errors.length > 0 ? errors.join(' ') : null;
  }

  // ── Full Validation ───────────────────────────────────────────────────────

  /**
   * Validate the entire vmConfig and return an object:
   * {
   *   valid: boolean,
   *   errors: { tab: string, field: string, message: string }[]
   * }
   */
  function validateAll(config) {
    const errors = [];

    const addError = (tab, field, message) => {
      if (message) errors.push({ tab, field, message });
    };

    // Basics
    addError('basics', 'subscription',   validateSubscription(config));
    addError('basics', 'resourceGroup',  validateResourceGroup(config));
    addError('basics', 'vmName',         validateVmName(config));
    addError('basics', 'region',         validateRegion(config));
    addError('basics', 'availability',   validateAvailability(config));
    addError('basics', 'image',          validateImage(config));
    addError('basics', 'size',           validateSize(config));
    addError('basics', 'administrator',  validateAdministrator(config));

    // Disks
    addError('disks', 'disks', validateDisks(config));

    // Networking
    addError('networking', 'networking', validateNetworking(config));

    // Management
    addError('management', 'management', validateManagement(config));

    // Tags
    addError('tags', 'tags', validateTags(config));

    const filtered = errors.filter(e => e.message !== null);
    return {
      valid: filtered.length === 0,
      errors: filtered
    };
  }

  /**
   * Validate a single named field and return error string or null.
   */
  function validateField(fieldName, config) {
    switch (fieldName) {
      case 'subscription':   return validateSubscription(config);
      case 'resourceGroup':  return validateResourceGroup(config);
      case 'vmName':         return validateVmName(config);
      case 'region':         return validateRegion(config);
      case 'availability':   return validateAvailability(config);
      case 'image':          return validateImage(config);
      case 'size':           return validateSize(config);
      case 'administrator':  return validateAdministrator(config);
      case 'disks':          return validateDisks(config);
      case 'networking':     return validateNetworking(config);
      case 'vnet':           return validateVnet(config);
      case 'subnet':         return validateSubnet(config);
      case 'publicIp':       return validatePublicIp(config);
      case 'nsg':            return validateNsg(config);
      case 'management':     return validateManagement(config);
      case 'tags':           return validateTags(config);
      default:               return null;
    }
  }

  /**
   * Show inline validation error under a field element.
   */
  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (!errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
      if (input) input.classList.add('input-error');
    } else {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
      const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
      if (input) input.classList.remove('input-error');
    }
  }

  /**
   * Clear all inline validation errors.
   */
  function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    document.querySelectorAll('.input-error').forEach(el => {
      el.classList.remove('input-error');
    });
  }

  return {
    validateAll,
    validateField,
    validateNsgRules,
    showFieldError,
    clearAllErrors,
    isSubnetInVnet,
    isValidCIDR,
    isStrongPassword
  };
})();
