import type { CellManifest } from '../../spine/registry.ts';

/**
 * Records Cell Manifest
 */
export const recordsManifest: CellManifest = {
  name: 'records',
  version: '1.0.0',
  description: 'Medical document management, problem-grouped report folders, and visit physical checklist',
  routes: [
    { method: 'GET', path: '/records', permission: 'public' },
    { method: 'POST', path: '/records/upload', permission: 'records:upload' },
    { method: 'POST', path: '/records/checklist/toggle', permission: 'records:write' },
    { method: 'GET', path: '/records/health', permission: 'public' },
  ],
  permissions: ['records:read', 'records:upload', 'records:write'],
  events: ['RECORD_UPLOADED', 'CHECKLIST_TOGGLED'],
  assistantTools: [
    {
      name: 'open_document',
      description: 'Open and inspect clinical metrics and summaries for a specific document (read-only)',
      parameters: {
        documentId: { type: 'string', description: 'ID of the medical document' },
      },
      requiredPermissions: ['records:read'],
    },
    {
      name: 'list_visit_checklist',
      description: 'View the items and paper reports needed for upcoming hospital visit (read-only)',
      parameters: {},
      requiredPermissions: ['records:read'],
    },
  ],
};
