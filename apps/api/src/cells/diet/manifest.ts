import type { CellManifest } from '../../spine/registry.ts';

export const dietManifest: CellManifest = {
  name: 'diet',
  version: '1.0.0',
  description: 'Region-aware diet tracker with clinical restrictions and rural/urban food tailoring',
  routes: [
    { method: 'GET', path: '/diet', permission: 'public' },
    { method: 'POST', path: '/diet/toggle-meal', permission: 'diet:write' },
    { method: 'GET', path: '/diet/health', permission: 'public' },
  ],
  permissions: ['diet:read', 'diet:write'],
  events: ['MEAL_LOGGED', 'MEAL_UNLOGGED'],
  assistantTools: [
    {
      name: 'log_meal',
      description: 'Propose logging a regional meal slot for the day (requires Accept/Dismiss confirmation)',
      parameters: {
        mealName: { type: 'string', description: 'Name of the meal slot e.g. Breakfast, Lunch, Dinner' },
      },
      requiredPermissions: ['diet:write'],
    },
  ],
};
