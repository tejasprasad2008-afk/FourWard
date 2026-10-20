#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dtsPath = path.resolve(__dirname, '..', 'node_modules', 'lucide-react-native', 'dist', 'lucide-react-native.d.ts');
if (!fs.existsSync(dtsPath)) {
  console.error('Cannot find lucide-react-native.d.ts at', dtsPath);
  process.exit(1);
}

const dts = fs.readFileSync(dtsPath, 'utf8');
const iconNames = new Set();
const regex = /index_([A-Za-z0-9_]+) as ([A-Za-z0-9_]+)/g;
let m;
while ((m = regex.exec(dts)) !== null) {
  iconNames.add(m[2]);
}

const requestedIcons = [
  // Tabs
  'House', 'Stethoscope', 'FolderOpen', 'Pill', 'UserRound',
  // Actions
  'ArrowLeft', 'ChevronRight', 'ChevronDown', 'X', 'Check',
  'Plus', 'Minus', 'Trash2', 'Search', 'SlidersHorizontal',
  'ArrowUpDown', 'RefreshCw', 'Info', 'TriangleAlert', 'WifiOff',
  // Location
  'MapPin', 'LocateFixed', 'Navigation',
  // Assistant
  'Mic', 'MicOff', 'SendHorizontal',
  // Emergency
  'Ambulance', 'PhoneCall',
  // Visits
  'Calendar', 'CalendarCheck', 'CalendarPlus', 'CalendarX', 'Clock', 'Hospital',
  // Records
  'FileText', 'FlaskConical', 'Scan', 'Activity', 'ClipboardList', 'Upload', 'Camera',
  // Medicines
  'BellRing', 'BellOff', 'ShoppingCart', 'Truck', 'Store',
  // Diet
  'Utensils', 'Apple',
  // Maternal
  'Baby', 'Syringe',
  // Family
  'Users', 'UserPlus', 'UserCheck', 'UserX', 'ShieldCheck', 'Lock', 'LockOpen', 'Eye',
  // Check-in
  'KeyRound',
  // Hospital status
  'BedDouble', 'Droplet',
  // Departments
  'HeartPulse', 'Ear', 'Bone',
  // Account
  'Folder', 'Settings', 'LifeBuoy', 'IdCard', 'CreditCard', 'Languages', 'Bell', 'ALargeSmall', 'Type'
];

let missing = 0;
for (const name of requestedIcons) {
  if (!iconNames.has(name)) {
    missing++;
    const lower = name.toLowerCase();
    const alternatives = Array.from(iconNames).filter(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())).slice(0, 5);
    console.warn(`[Missing Lucide Icon] "${name}" is NOT in lucide-react-native. Alternatives:`, alternatives.join(', '));
  }
}

if (missing === 0) {
  console.log(`✅ All ${requestedIcons.length} requested semantic Lucide icons exist in lucide-react-native.`);
} else {
  console.error(`❌ ${missing} requested icons are missing.`);
  process.exit(1);
}
