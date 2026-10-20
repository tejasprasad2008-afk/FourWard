import type { CellManifest } from '../../spine/registry.ts';

/**
 * Medicines Cell Manifest
 */
export const medicinesManifest: CellManifest = {
  name: 'medicines',
  version: '1.0.0',
  description: 'Active prescriptions, dose reminders, and pharmacy refill cart with Spine audit trail',
  routes: [
    { method: 'GET', path: '/medicines', permission: 'public' },
    { method: 'POST', path: '/medicines/reminders/toggle', permission: 'medicines:write' },
    { method: 'POST', path: '/medicines/cart/update', permission: 'medicines:write' },
    { method: 'POST', path: '/medicines/checkout', permission: 'medicines:checkout' },
    { method: 'GET', path: '/medicines/health', permission: 'public' },
  ],
  permissions: ['medicines:read', 'medicines:write', 'medicines:checkout'],
  events: ['MEDICINE_REMINDER_TOGGLED', 'CART_UPDATED', 'MEDICINE_ORDER_CREATED'],
  assistantTools: [
    {
      name: 'add_to_cart',
      description: 'Propose adding a medicine strip refill to the cart (requires Accept/Dismiss confirmation)',
      parameters: {
        medicineId: { type: 'string', description: 'ID of the medicine/prescription' },
        quantity: { type: 'number', description: 'Number of strips to add' },
      },
      requiredPermissions: ['medicines:write'],
    },
    {
      name: 'set_reminder',
      description: 'Propose setting or toggling a dose reminder for a medicine (requires Accept/Dismiss confirmation)',
      parameters: {
        prescriptionId: { type: 'string', description: 'ID of the prescription' },
        enabled: { type: 'boolean', description: 'True to enable, false to disable' },
      },
      requiredPermissions: ['medicines:write'],
    },
    {
      name: 'open_checkout',
      description: 'Propose opening checkout for pending medicine cart refill (requires Accept/Dismiss confirmation; never completes payment automatically)',
      parameters: {
        deliveryMode: { type: 'string', description: 'doorstep or pickup' },
      },
      requiredPermissions: ['medicines:checkout'],
    },
  ],
};
