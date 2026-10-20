import type { CellManifest } from '../../spine/registry.ts';

/**
 * Check-in Cell Manifest
 * 
 * Rules:
 * - Assistant tools come ONLY from cell manifests.
 * - Per AGENTS.md, NO assistant tool is exposed for OTP or check-in verification.
 * - Exposes /health endpoint.
 */
export const checkinManifest: CellManifest = {
  name: 'checkin',
  version: '1.0.0',
  description: 'Consultation check-in and OTP-gated room assignment',
  routes: [
    { method: 'POST', path: '/checkin/verify', permission: 'checkin:verify' },
    { method: 'GET', path: '/checkin/health', permission: 'public' },
  ],
  permissions: ['checkin:verify', 'checkin:read'],
  events: ['checkin.verified', 'checkin.locked', 'checkin.failed'],
  assistantTools: [], // Strictly no OTP tools in assistant
};
