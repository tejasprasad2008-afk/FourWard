import type { CellManifest } from '../../spine/registry.ts';

export const familyManifest: CellManifest = {
  name: 'family',
  version: '1.0.0',
  description: 'Family caregiver access management, permission grants, revocation, and record access audit ledger',
  routes: [
    { method: 'GET', path: '/family', permission: 'public' },
    { method: 'POST', path: '/family/toggle-access', permission: 'family:write' },
    { method: 'POST', path: '/family/add', permission: 'family:write' },
    { method: 'GET', path: '/family/health', permission: 'public' },
  ],
  permissions: ['family:read', 'family:write'],
  events: ['FAMILY_ACCESS_UPDATED', 'FAMILY_MEMBER_ADDED'],
  assistantTools: [
    {
      name: 'list_family_access',
      description: 'View linked family caregivers and their current record access permissions (read-only)',
      parameters: {},
      requiredPermissions: ['family:read'],
    },
  ],
};
