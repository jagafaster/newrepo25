/**
 * data.js — Static data for Azure VM Practice Simulator
 * Contains: regions, images, VM sizes, disk types, extensions,
 *           educational tooltips, sample configuration, challenge labs
 */

const DATA = {

  // ── Subscriptions ────────────────────────────────────────────────────────
  subscriptions: [
    { id: 'sub-students', name: 'Azure for Students' },
    { id: 'sub-payg',     name: 'Pay-As-You-Go' },
    { id: 'sub-sponsor',  name: 'Microsoft Azure Sponsorship' },
    { id: 'sub-practice', name: 'Student Practice Subscription' }
  ],

  // ── Existing Resource Groups ──────────────────────────────────────────────
  existingResourceGroups: [
    'student-lab-rg',
    'cloud-practice-rg',
    'azure-training-rg',
    'vm-lab-rg'
  ],

  // ── Azure Regions ─────────────────────────────────────────────────────────
  regions: [
    { id: 'eastus',         name: 'East US',          geo: 'Americas' },
    { id: 'eastus2',        name: 'East US 2',         geo: 'Americas' },
    { id: 'westus',         name: 'West US',           geo: 'Americas' },
    { id: 'westus2',        name: 'West US 2',         geo: 'Americas' },
    { id: 'centralus',      name: 'Central US',        geo: 'Americas' },
    { id: 'southcentralus', name: 'South Central US',  geo: 'Americas' },
    { id: 'northeurope',    name: 'North Europe',       geo: 'Europe' },
    { id: 'westeurope',     name: 'West Europe',        geo: 'Europe' },
    { id: 'uksouth',        name: 'UK South',           geo: 'Europe' },
    { id: 'southeastasia',  name: 'Southeast Asia',     geo: 'Asia Pacific' },
    { id: 'eastasia',       name: 'East Asia',          geo: 'Asia Pacific' },
    { id: 'australiaeast',  name: 'Australia East',     geo: 'Asia Pacific' },
    { id: 'japaneast',      name: 'Japan East',         geo: 'Asia Pacific' },
    { id: 'centralindia',   name: 'Central India',      geo: 'Asia Pacific' },
    { id: 'southindia',     name: 'South India',        geo: 'Asia Pacific' },
    { id: 'westindia',      name: 'West India',         geo: 'Asia Pacific' }
  ],

  // ── VM Images ─────────────────────────────────────────────────────────────
  images: [
    // Windows
    {
      id: 'ws2025-ae',
      name: 'Windows Server 2025 Datacenter: Azure Edition',
      os: 'Windows',
      publisher: 'MicrosoftWindowsServer',
      offer: 'WindowsServer',
      sku: '2025-datacenter-azure-edition',
      version: 'latest',
      architecture: ['x64'],
      featured: true
    },
    {
      id: 'ws2022-ae',
      name: 'Windows Server 2022 Datacenter: Azure Edition',
      os: 'Windows',
      publisher: 'MicrosoftWindowsServer',
      offer: 'WindowsServer',
      sku: '2022-datacenter-azure-edition',
      version: 'latest',
      architecture: ['x64'],
      featured: true
    },
    {
      id: 'ws2022',
      name: 'Windows Server 2022 Datacenter',
      os: 'Windows',
      publisher: 'MicrosoftWindowsServer',
      offer: 'WindowsServer',
      sku: '2022-datacenter',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    },
    {
      id: 'win11pro',
      name: 'Windows 11 Pro',
      os: 'Windows',
      publisher: 'MicrosoftWindowsDesktop',
      offer: 'Windows-11',
      sku: 'win11-24h2-pro',
      version: 'latest',
      architecture: ['x64', 'Arm64'],
      featured: false
    },
    // Linux
    {
      id: 'ubuntu2404',
      name: 'Ubuntu Server 24.04 LTS',
      os: 'Linux',
      publisher: 'Canonical',
      offer: 'ubuntu-24_04-lts',
      sku: 'server',
      version: 'latest',
      architecture: ['x64', 'Arm64'],
      featured: true
    },
    {
      id: 'ubuntu2204',
      name: 'Ubuntu Server 22.04 LTS',
      os: 'Linux',
      publisher: 'Canonical',
      offer: '0001-com-ubuntu-server-jammy',
      sku: '22_04-lts',
      version: 'latest',
      architecture: ['x64', 'Arm64'],
      featured: true
    },
    {
      id: 'debian12',
      name: 'Debian 12',
      os: 'Linux',
      publisher: 'Debian',
      offer: 'debian-12',
      sku: '12',
      version: 'latest',
      architecture: ['x64', 'Arm64'],
      featured: false
    },
    {
      id: 'rhel9',
      name: 'Red Hat Enterprise Linux 9.4',
      os: 'Linux',
      publisher: 'RedHat',
      offer: 'RHEL',
      sku: '94-gen2',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    },
    {
      id: 'sles15',
      name: 'SUSE Linux Enterprise Server 15 SP5',
      os: 'Linux',
      publisher: 'SUSE',
      offer: 'sles-15-sp5',
      sku: 'gen2',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    },
    {
      id: 'centos8',
      name: 'CentOS 8.5',
      os: 'Linux',
      publisher: 'OpenLogic',
      offer: 'CentOS',
      sku: '8_5',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    },
    {
      id: 'oracle8',
      name: 'Oracle Linux 8.9',
      os: 'Linux',
      publisher: 'Oracle',
      offer: 'Oracle-Linux',
      sku: 'ol89-lvm-gen2',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    },
    {
      id: 'ws2019',
      name: 'Windows Server 2019 Datacenter',
      os: 'Windows',
      publisher: 'MicrosoftWindowsServer',
      offer: 'WindowsServer',
      sku: '2019-datacenter',
      version: 'latest',
      architecture: ['x64'],
      featured: false
    }
  ],

  // ── VM Sizes ──────────────────────────────────────────────────────────────
  vmSizes: [
    // B-series (burstable)
    {
      name: 'Standard_B1s',
      family: 'B-series',
      vcpus: 1,
      ram: 1,
      tempStorage: 4,
      maxDataDisks: 2,
      maxNics: 2,
      pricePerHour: 3.50,
      architecture: ['x64'],
      description: 'Low cost burstable — ideal for dev/test workloads'
    },
    {
      name: 'Standard_B2s',
      family: 'B-series',
      vcpus: 2,
      ram: 4,
      tempStorage: 8,
      maxDataDisks: 4,
      maxNics: 3,
      pricePerHour: 7.00,
      architecture: ['x64'],
      description: 'Burstable — web servers, small databases'
    },
    {
      name: 'Standard_B2ms',
      family: 'B-series',
      vcpus: 2,
      ram: 8,
      tempStorage: 16,
      maxDataDisks: 4,
      maxNics: 3,
      pricePerHour: 10.50,
      architecture: ['x64'],
      description: 'Burstable with more RAM — medium workloads'
    },
    {
      name: 'Standard_B4ms',
      family: 'B-series',
      vcpus: 4,
      ram: 16,
      tempStorage: 32,
      maxDataDisks: 8,
      maxNics: 4,
      pricePerHour: 21.00,
      architecture: ['x64'],
      description: 'Burstable — larger dev/test environments'
    },
    // D-series (general purpose)
    {
      name: 'Standard_D2s_v5',
      family: 'D-series v5',
      vcpus: 2,
      ram: 8,
      tempStorage: 0,
      maxDataDisks: 4,
      maxNics: 2,
      pricePerHour: 14.00,
      architecture: ['x64', 'Arm64'],
      description: 'General purpose — balanced CPU and memory'
    },
    {
      name: 'Standard_D4s_v5',
      family: 'D-series v5',
      vcpus: 4,
      ram: 16,
      tempStorage: 0,
      maxDataDisks: 8,
      maxNics: 4,
      pricePerHour: 28.00,
      architecture: ['x64', 'Arm64'],
      description: 'General purpose — medium production workloads'
    },
    {
      name: 'Standard_D8s_v5',
      family: 'D-series v5',
      vcpus: 8,
      ram: 32,
      tempStorage: 0,
      maxDataDisks: 16,
      maxNics: 4,
      pricePerHour: 56.00,
      architecture: ['x64', 'Arm64'],
      description: 'General purpose — large applications'
    },
    // E-series (memory optimized)
    {
      name: 'Standard_E2s_v5',
      family: 'E-series v5',
      vcpus: 2,
      ram: 16,
      tempStorage: 0,
      maxDataDisks: 4,
      maxNics: 2,
      pricePerHour: 17.50,
      architecture: ['x64', 'Arm64'],
      description: 'Memory optimized — in-memory databases, analytics'
    },
    {
      name: 'Standard_E4s_v5',
      family: 'E-series v5',
      vcpus: 4,
      ram: 32,
      tempStorage: 0,
      maxDataDisks: 8,
      maxNics: 4,
      pricePerHour: 35.00,
      architecture: ['x64', 'Arm64'],
      description: 'Memory optimized — larger in-memory workloads'
    },
    // F-series (compute optimized)
    {
      name: 'Standard_F2s_v2',
      family: 'F-series v2',
      vcpus: 2,
      ram: 4,
      tempStorage: 16,
      maxDataDisks: 4,
      maxNics: 2,
      pricePerHour: 11.50,
      architecture: ['x64'],
      description: 'Compute optimized — batch processing, web servers'
    },
    // Arm64 specific
    {
      name: 'Standard_D2ps_v5',
      family: 'D-series v5 Arm64',
      vcpus: 2,
      ram: 8,
      tempStorage: 0,
      maxDataDisks: 4,
      maxNics: 2,
      pricePerHour: 10.00,
      architecture: ['Arm64'],
      description: 'Arm64 general purpose — cost-effective Linux workloads'
    },
    {
      name: 'Standard_D4ps_v5',
      family: 'D-series v5 Arm64',
      vcpus: 4,
      ram: 16,
      tempStorage: 0,
      maxDataDisks: 8,
      maxNics: 4,
      pricePerHour: 20.00,
      architecture: ['Arm64'],
      description: 'Arm64 general purpose — medium Linux workloads'
    }
  ],

  // ── Disk Types ────────────────────────────────────────────────────────────
  diskTypes: [
    { id: 'premium-ssd', name: 'Premium SSD', description: 'High performance for production workloads. Low latency, high IOPS.' },
    { id: 'standard-ssd', name: 'Standard SSD', description: 'Consistent performance for lightly used applications.' },
    { id: 'standard-hdd', name: 'Standard HDD', description: 'Low cost. Suitable for backups and non-critical workloads.' }
  ],

  // ── Data Disk Sizes ───────────────────────────────────────────────────────
  dataDiskSizes: [4, 32, 64, 128, 256, 512, 1024],

  // ── Host Caching Options ──────────────────────────────────────────────────
  cachingOptions: [
    { id: 'none', name: 'None' },
    { id: 'readonly', name: 'Read-only' },
    { id: 'readwrite', name: 'Read/write' }
  ],

  // ── VNet Presets ──────────────────────────────────────────────────────────
  existingVnets: [
    { name: 'student-vnet', addressSpace: '10.0.0.0/16', subnets: ['default', 'web-subnet', 'app-subnet', 'database-subnet'] },
    { name: 'lab-vnet',     addressSpace: '172.16.0.0/16', subnets: ['default', 'frontend-subnet', 'backend-subnet'] },
    { name: 'training-vnet', addressSpace: '192.168.0.0/16', subnets: ['default', 'vm-subnet'] }
  ],

  // ── Security Types ────────────────────────────────────────────────────────
  securityTypes: [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Basic security with no additional features.'
    },
    {
      id: 'trustedlaunch',
      name: 'Trusted launch virtual machines',
      description: 'Protects against advanced and persistent attack techniques using Secure Boot and vTPM.'
    },
    {
      id: 'confidential',
      name: 'Confidential virtual machines',
      description: 'Uses hardware-based Trusted Execution Environments (TEE) for highest data protection in use.'
    }
  ],

  // ── Availability Options ──────────────────────────────────────────────────
  availabilityOptions: [
    {
      id: 'none',
      name: 'No infrastructure redundancy required',
      description: 'Single VM. No SLA for planned maintenance. Good for dev/test.'
    },
    {
      id: 'zone',
      name: 'Availability zone',
      description: 'Deploy VM into a specific datacenter within a region. 99.99% SLA.'
    },
    {
      id: 'scaleset',
      name: 'Virtual machine scale set',
      description: 'Automatically scale a group of load-balanced VMs. Good for high-availability production.'
    }
  ],

  // ── Extensions ────────────────────────────────────────────────────────────
  extensions: [
    {
      id: 'customscript',
      name: 'Custom Script Extension',
      publisher: 'Microsoft.Azure.Extensions',
      description: 'Download and execute scripts on your VM post-provisioning.',
      fields: [
        { id: 'scriptUri', label: 'Script URI', type: 'text', placeholder: 'https://example.com/setup.sh' },
        { id: 'command',   label: 'Command to execute', type: 'text', placeholder: 'bash setup.sh' }
      ]
    },
    {
      id: 'azuremonitoragent',
      name: 'Azure Monitor Agent',
      publisher: 'Microsoft.Azure.Monitor',
      description: 'Collects monitoring data from the guest OS and workloads and sends to Azure Monitor.',
      fields: []
    },
    {
      id: 'dependencyagent',
      name: 'Dependency Agent',
      publisher: 'Microsoft.Azure.Monitoring.DependencyAgent',
      description: 'Enables Service Map and VM Insights to discover and map application dependencies.',
      fields: []
    },
    {
      id: 'iis',
      name: 'IIS (Windows only)',
      publisher: 'Microsoft.Compute',
      description: 'Install and configure Internet Information Services (IIS) on Windows Server.',
      fields: [
        { id: 'siteName', label: 'Default site name', type: 'text', placeholder: 'Default Web Site' }
      ]
    },
    {
      id: 'psdsc',
      name: 'PowerShell DSC',
      publisher: 'Microsoft.Powershell',
      description: 'Apply Desired State Configuration (DSC) configurations to a Windows VM.',
      fields: [
        { id: 'configUri', label: 'Configuration URI', type: 'text', placeholder: 'https://example.com/config.zip' },
        { id: 'configFunction', label: 'Configuration function', type: 'text', placeholder: 'MyConfig.ps1\\MyConfig' }
      ]
    }
  ],

  // ── NSG Default Rules ─────────────────────────────────────────────────────
  defaultNsgRules: [
    { priority: 65000, name: 'AllowVnetInBound',    port: 'Any', protocol: 'Any', source: 'VirtualNetwork', destination: 'VirtualNetwork', action: 'Allow',  editable: false },
    { priority: 65001, name: 'AllowAzureLBInBound', port: 'Any', protocol: 'Any', source: 'AzureLoadBalancer', destination: 'Any',           action: 'Allow',  editable: false },
    { priority: 65500, name: 'DenyAllInBound',      port: 'Any', protocol: 'Any', source: 'Any',            destination: 'Any',           action: 'Deny',   editable: false }
  ],

  // ── Timezones ─────────────────────────────────────────────────────────────
  timezones: [
    'India Standard Time',
    'UTC',
    'Eastern Standard Time',
    'Central Standard Time',
    'Pacific Standard Time',
    'Greenwich Mean Time',
    'Central Europe Standard Time',
    'Singapore Standard Time',
    'AUS Eastern Standard Time',
    'Tokyo Standard Time'
  ],

  // ── Educational Tooltips ──────────────────────────────────────────────────
  tooltips: {
    subscription: {
      title: 'Azure Subscription',
      content: 'A subscription is a billing and access management container in Azure. All Azure resources belong to a subscription. Think of it like a billing account — costs are tracked and charged at the subscription level.'
    },
    resourceGroup: {
      title: 'Resource Group',
      content: 'A resource group is a logical container for Azure resources. All resources in a group share the same lifecycle — you can deploy, update, and delete them all at once. A VM deployment typically creates multiple related resources (VM, NIC, disk, public IP, NSG) — grouping them makes management easier.'
    },
    region: {
      title: 'Azure Region',
      content: 'An Azure region is a geographic location containing one or more datacenters. Choosing a region close to your users reduces network latency. Some services are only available in certain regions. Data sovereignty laws may also require data to stay in a specific country.'
    },
    availabilityZone: {
      title: 'Availability Zone',
      content: 'Availability Zones are physically separate datacenters within an Azure region, each with independent power, cooling, and networking. Deploying across zones protects against datacenter-level failures. VMs deployed in availability zones have a 99.99% SLA.'
    },
    securityType: {
      title: 'Security Type',
      content: 'Standard: Basic VM security. Trusted Launch: Adds Secure Boot and vTPM to protect against rootkits and boot-level malware. Confidential VMs: Use hardware-based TEE (e.g. AMD SEV-SNP) to encrypt memory in use, protecting against the hypervisor and infrastructure operators.'
    },
    vmImage: {
      title: 'VM Image',
      content: 'A VM image is a template containing the OS, configuration, and optionally pre-installed software. Azure Marketplace offers hundreds of images from Microsoft and third-party publishers. The image you choose determines the base OS, available features, and licensing costs.'
    },
    vmSize: {
      title: 'VM Size',
      content: 'VM size determines the compute resources (vCPUs, RAM, temporary storage) allocated to your VM. Azure groups sizes into families: B-series (burstable, cost-effective), D-series (general purpose), E-series (memory optimized), F-series (compute optimized). Choose based on your workload requirements.'
    },
    managedDisk: {
      title: 'Managed Disk',
      content: 'Azure Managed Disks are block-level storage volumes managed by Azure. Unlike unmanaged disks, you don\'t need to manage storage accounts. Three types: Premium SSD (high performance, low latency), Standard SSD (consistent performance), Standard HDD (low cost, higher latency).'
    },
    vnet: {
      title: 'Virtual Network (VNet)',
      content: 'A Virtual Network is Azure\'s private network in the cloud. Resources in a VNet can communicate securely with each other, the internet, and on-premises networks. A VNet is defined by an IP address space (e.g. 10.0.0.0/16) and is divided into subnets.'
    },
    subnet: {
      title: 'Subnet',
      content: 'A subnet is a range of IP addresses within a VNet. You can segment a VNet into multiple subnets for different workloads (e.g. web, app, database tiers). Network security groups (NSGs) can be applied to subnets to filter traffic.'
    },
    nic: {
      title: 'Network Interface (NIC)',
      content: 'A Network Interface Card (NIC) connects a VM to a Virtual Network. Each NIC is assigned a private IP address from the subnet\'s address range. A VM must have at least one NIC. Multiple NICs allow a VM to connect to multiple networks.'
    },
    publicIp: {
      title: 'Public IP Address',
      content: 'A public IP makes your VM reachable from the internet. Standard SKU public IPs are zone-redundant and support static assignment. Not all VMs need a public IP — internal workloads can communicate privately within a VNet. Use NSGs to control what traffic reaches the VM.'
    },
    nsg: {
      title: 'Network Security Group (NSG)',
      content: 'An NSG contains security rules that allow or deny network traffic to resources in a VNet. Rules are evaluated by priority (lower number = higher priority). Each rule specifies: source, destination, port, protocol, and action (Allow/Deny). NSGs can be applied to subnets or individual NICs.'
    },
    loadBalancer: {
      title: 'Load Balancer',
      content: 'A load balancer distributes incoming network traffic across multiple VM instances. Azure Load Balancer operates at Layer 4 (TCP/UDP). Application Gateway operates at Layer 7 (HTTP/HTTPS) and supports features like SSL termination and URL-based routing. Generally used when you have multiple VMs serving the same application.'
    },
    managedIdentity: {
      title: 'Managed Identity',
      content: 'A Managed Identity gives your VM an automatically managed identity in Azure Active Directory. The VM can authenticate to Azure services (like Key Vault, Storage) without storing credentials in code. System-assigned: tied to the VM lifecycle. User-assigned: independent, can be shared across multiple VMs.'
    },
    bootDiagnostics: {
      title: 'Boot Diagnostics',
      content: 'Boot Diagnostics captures serial console output and screenshots of your VM during startup. Useful for troubleshooting VMs that fail to boot. The diagnostic data is stored in an Azure Storage account. Recommended for production VMs.'
    },
    azureMonitor: {
      title: 'Azure Monitor',
      content: 'Azure Monitor collects metrics and logs from Azure resources. For VMs, it can collect CPU, memory, disk, and network metrics. Alerts can notify you when thresholds are exceeded. Log Analytics stores and queries log data. Enabling Azure Monitor Agent provides richer guest OS metrics.'
    },
    tags: {
      title: 'Resource Tags',
      content: 'Tags are name-value pairs you apply to Azure resources for organization, cost management, and automation. Example: Environment=Production, Department=Engineering, CostCenter=12345. You can filter resources by tag in the Azure Portal and use tags to split billing costs.'
    },
    spotVm: {
      title: 'Azure Spot VM',
      content: 'Spot VMs use Azure\'s unused compute capacity at a discounted price (up to 90% off). The tradeoff: Azure can evict (stop or delete) your Spot VM with 30 seconds notice when capacity is needed. Suitable for batch jobs, dev/test, and fault-tolerant workloads. Not recommended for production applications requiring high availability.'
    },
    architecture: {
      title: 'VM Architecture',
      content: 'x64 (AMD64): The traditional Intel/AMD 64-bit architecture. Widest software compatibility. Arm64 (AArch64): ARM-based processors. Generally more energy-efficient and cost-effective. Good for Linux workloads. Not all VM sizes or images support both architectures.'
    }
  },

  // ── Sample Configuration (Lab Example) ───────────────────────────────────
  sampleConfig: {
    subscription: 'sub-students',
    resourceGroup: { mode: 'new', name: 'azure-lab-rg' },
    vmName: 'student-web-01',
    region: 'centralindia',
    availability: { type: 'zone', zone: '1' },
    securityType: 'trustedlaunch',
    image: 'ubuntu2404',
    architecture: 'x64',
    spot: { enabled: false, evictionType: '', maxPrice: '' },
    size: 'Standard_B2s',
    administrator: {
      authType: 'ssh',
      username: 'azurestudent',
      password: '',
      confirmPassword: '',
      sshKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAA... student@example.com'
    },
    inboundPorts: ['22', '80'],
    disks: {
      osDisk: { type: 'premium-ssd', deleteWithVm: true, caching: 'readwrite' },
      dataDisks: []
    },
    networking: {
      vnet: { mode: 'new', name: 'student-vnet', addressSpace: '10.0.0.0/16' },
      subnet: { name: 'web-subnet', range: '10.0.1.0/24' },
      publicIp: { mode: 'new', name: 'student-web-01-ip', sku: 'Standard', assignment: 'Static' },
      nic: { name: 'student-web-01-nic' },
      nsg: { mode: 'basic' },
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
    tags: [
      { name: 'Environment', value: 'Training' },
      { name: 'Department', value: 'Computer Science' },
      { name: 'Owner', value: 'Student' }
    ]
  },

  // ── Challenge Labs ────────────────────────────────────────────────────────
  challengeLabs: [
    {
      id: 'lab01',
      title: 'LAB 01 — Deploy a Linux Web Server',
      description: 'Configure and deploy a Linux virtual machine that can serve web traffic over HTTP and be managed via SSH.',
      requirements: [
        { id: 'region',       label: 'Region: Central India',         field: 'region',                     expected: 'centralindia' },
        { id: 'image',        label: 'Image: Ubuntu Server 24.04 LTS', field: 'image',                     expected: 'ubuntu2404' },
        { id: 'size',         label: 'Size: Standard_B2s',             field: 'size',                       expected: 'Standard_B2s' },
        { id: 'avzone',       label: 'Availability: Zone 1',           field: 'availability.zone',          expected: '1',           condition: (c) => c.availability.type === 'zone' },
        { id: 'osdisk',       label: 'OS Disk: Premium SSD',           field: 'disks.osDisk.type',          expected: 'premium-ssd' },
        { id: 'vnetspace',    label: 'VNet: 10.0.0.0/16',             field: 'networking.vnet.addressSpace', expected: '10.0.0.0/16' },
        { id: 'subnet',       label: 'Subnet: 10.0.1.0/24',           field: 'networking.subnet.range',    expected: '10.0.1.0/24' },
        { id: 'publicip',     label: 'Public IP: Enabled',             field: 'networking.publicIp.mode',   expected: 'new' },
        { id: 'sshport',      label: 'Inbound Port: SSH (22)',         field: 'inboundPorts',               expected: '22', checker: (c) => c.inboundPorts.includes('22') },
        { id: 'httpport',     label: 'Inbound Port: HTTP (80)',        field: 'inboundPorts',               expected: '80', checker: (c) => c.inboundPorts.includes('80') }
      ]
    },
    {
      id: 'lab02',
      title: 'LAB 02 — Deploy a Windows Server',
      description: 'Configure and deploy a Windows Server 2022 VM with RDP access, a Premium SSD OS disk, and managed identity enabled.',
      requirements: [
        { id: 'region',       label: 'Region: East US',                field: 'region',                    expected: 'eastus' },
        { id: 'image',        label: 'Image: Windows Server 2022',     field: 'image',                     expected: 'ws2022-ae' },
        { id: 'size',         label: 'Size: Standard_D2s_v5',          field: 'size',                       expected: 'Standard_D2s_v5' },
        { id: 'osdisk',       label: 'OS Disk: Premium SSD',           field: 'disks.osDisk.type',          expected: 'premium-ssd' },
        { id: 'rdpport',      label: 'Inbound Port: RDP (3389)',       field: 'inboundPorts',               expected: '3389', checker: (c) => c.inboundPorts.includes('3389') },
        { id: 'identity',     label: 'System Managed Identity: On',    field: 'management.identity.systemAssigned', expected: true, checker: (c) => c.management.identity.systemAssigned === true },
        { id: 'boot',         label: 'Boot Diagnostics: Enabled',      field: 'management.bootDiagnostics', expected: true, checker: (c) => c.management.bootDiagnostics === true },
        { id: 'publicip',     label: 'Public IP: Enabled',             field: 'networking.publicIp.mode',   expected: 'new' }
      ]
    },
    {
      id: 'lab03',
      title: 'LAB 03 — High-Availability Multi-Disk Setup',
      description: 'Deploy an Ubuntu VM with high availability (zone 2), a data disk, auto-shutdown enabled, and resource tags.',
      requirements: [
        { id: 'image',        label: 'Image: Ubuntu Server 22.04 LTS', field: 'image',                     expected: 'ubuntu2204' },
        { id: 'size',         label: 'Size: Standard_D4s_v5',          field: 'size',                       expected: 'Standard_D4s_v5' },
        { id: 'avzone',       label: 'Availability: Zone 2',           field: 'availability.zone',          expected: '2', condition: (c) => c.availability.type === 'zone' },
        { id: 'datadisk',     label: 'At least one data disk added',   field: 'disks.dataDisks',            expected: null, checker: (c) => c.disks.dataDisks.length > 0 },
        { id: 'shutdown',     label: 'Auto-shutdown: Enabled',         field: 'management.autoShutdown.enabled', expected: true, checker: (c) => c.management.autoShutdown.enabled === true },
        { id: 'tags',         label: 'At least 2 tags applied',        field: 'tags',                       expected: null, checker: (c) => c.tags.length >= 2 },
        { id: 'monitor',      label: 'Azure Monitor: Enabled',         field: 'monitoring.azureMonitor',    expected: true, checker: (c) => c.monitoring.azureMonitor === true }
      ]
    }
  ],

  // ── Practice Mode Hints (contextual per tab) ──────────────────────────────
  hints: {
    basics: [
      { id: 'h-rg',     text: 'A Resource Group is a logical container. Everything you create in this deployment (VM, NIC, disk, NSG, public IP) will live in this resource group.' },
      { id: 'h-region', text: 'Choose a region close to your intended users to reduce latency. Once deployed, a VM cannot be moved to a different region.' },
      { id: 'h-image',  text: 'Your choice of image determines the OS. Ubuntu and Windows Server are the most common choices for cloud workloads.' },
      { id: 'h-size',   text: 'VM size determines your compute budget. Standard_B2s is a great starting point for learning — it\'s cost-effective and handles most dev/test workloads.' },
      { id: 'h-auth',   text: 'For Linux VMs, SSH key authentication is more secure than passwords. For Windows VMs, you must use a password for the built-in administrator account.' }
    ],
    disks: [
      { id: 'h-disk1', text: 'Premium SSD is recommended for production. Standard SSD is good for dev/test. Standard HDD is lowest cost but has higher latency.' },
      { id: 'h-disk2', text: 'Data disks store application data separately from the OS disk. This allows you to resize, snapshot, or move data independently of the OS.' },
      { id: 'h-disk3', text: '"Delete with VM" means the disk will be deleted when the VM is deleted. Uncheck this if you want to keep the disk for data recovery purposes.' }
    ],
    networking: [
      { id: 'h-vnet',   text: 'A VM needs a network interface (NIC) to communicate with a virtual network. The NIC bridges the VM and the VNet.' },
      { id: 'h-ssh',    text: 'SSH normally uses TCP port 22. Exposing it publicly is convenient but adds security risk. In production, consider using Azure Bastion or VPN instead.' },
      { id: 'h-pip',    text: 'A public IP is not always required for a VM. VMs without a public IP can still communicate within the VNet and reach the internet via NAT Gateway.' },
      { id: 'h-nsg',    text: 'NSG rules are evaluated by priority (lower number = higher priority). Once a rule matches, evaluation stops. The default deny-all rule at priority 65500 blocks everything not explicitly allowed.' }
    ],
    management: [
      { id: 'h-boot',  text: 'Boot diagnostics is very helpful for troubleshooting. If a VM fails to start, the serial console output tells you exactly what went wrong.' },
      { id: 'h-ident', text: 'Managed identities eliminate the need to store credentials in your code. The VM can securely access Azure services like Key Vault and Storage.' }
    ],
    monitoring: [
      { id: 'h-mon1', text: 'Azure Monitor collects platform metrics (CPU, disk, network) automatically for all VMs. Enabling the Azure Monitor Agent provides guest OS-level metrics too.' },
      { id: 'h-mon2', text: 'Set up alerts so you\'re notified when CPU stays above 80% or disk is nearly full — before users notice a problem.' }
    ],
    advanced: [
      { id: 'h-ext1',    text: 'Extensions run automatically after VM provisioning. Use them to install software, configure settings, or run setup scripts without manually logging in.' },
      { id: 'h-custom',  text: 'Custom data is passed to the VM at first boot and processed by cloud-init (Linux) or cloudbase-init (Windows). Use it to automate initial VM configuration.' }
    ],
    tags: [
      { id: 'h-tag1', text: 'Tags are name-value metadata pairs. Use them to identify cost centers, environments (Dev/Prod), owners, and projects. They appear in billing reports.' },
      { id: 'h-tag2', text: 'Consistent tagging across your organization makes it easy to filter resources and understand cloud costs by team or project.' }
    ],
    review: [
      { id: 'h-rev1', text: 'Review all settings carefully before clicking Create. While VMs can be reconfigured after deployment, some settings (like OS disk type and region) cannot be changed.' },
      { id: 'h-rev2', text: 'The estimated cost shown is based on your chosen size running 24/7. You can reduce costs by stopping the VM when not in use — you only pay for storage when stopped.' }
    ]
  }
};
