import type { CellManifest } from '../../spine/registry.ts';

/**
 * Doctors Cell Manifest
 */
export const doctorsManifest: CellManifest = {
  name: 'doctors',
  version: '1.0.0',
  description: 'Symptom triage, doctor directory, and OPD consultation token booking',
  routes: [
    { method: 'POST', path: '/doctors/triage', permission: 'public' },
    { method: 'GET', path: '/doctors', permission: 'public' },
    { method: 'POST', path: '/doctors/book', permission: 'doctors:book' },
    { method: 'GET', path: '/doctors/health', permission: 'public' },
  ],
  permissions: ['doctors:read', 'doctors:book'],
  events: ['doctors.booked', 'doctors.triaged'],
  assistantTools: [
    {
      name: 'search_doctors',
      description: 'Find doctors by department, locality, or name',
      parameters: {
        department: { type: 'string', description: 'Department e.g. Cardiology, Internal Medicine' },
        search: { type: 'string', description: 'Search keywords' },
      },
      requiredPermissions: ['doctors:read'],
    },
    {
      name: 'book_appointment',
      description: 'Propose a consultation token booking with a doctor (requires Accept/Dismiss confirmation)',
      parameters: {
        doctorId: { type: 'string', description: 'ID of the doctor' },
        patientId: { type: 'string', description: 'Patient ID' },
      },
      requiredPermissions: ['doctors:book'],
    },
  ],
};
