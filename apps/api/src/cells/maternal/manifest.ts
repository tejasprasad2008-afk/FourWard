import type { CellManifest } from '../../spine/registry.ts';

export const maternalManifest: CellManifest = {
  name: 'maternal',
  version: '1.0.0',
  description: 'Maternal pregnancy care, NIS immunization schedule, and PMSMA clinic milestone tracker',
  routes: [
    { method: 'GET', path: '/maternal', permission: 'public' },
    { method: 'POST', path: '/maternal/toggle-vaccine', permission: 'maternal:write' },
    { method: 'GET', path: '/maternal/health', permission: 'public' },
  ],
  permissions: ['maternal:read', 'maternal:write'],
  events: ['MATERNAL_VACCINE_TOGGLED'],
  assistantTools: [
    {
      name: 'check_vaccine_schedule',
      description: 'Check upcoming maternal or newborn NIS vaccine milestones and PMSMA dates (read-only)',
      parameters: {},
      requiredPermissions: ['maternal:read'],
    },
  ],
};
