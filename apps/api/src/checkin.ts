import type {
  CheckinVerifyRequest,
  CheckinVerifyResponse,
} from '../../../packages/contracts/src/checkin.ts';
import { checkinService } from './cells/checkin/service.ts';

/**
 * Check-in verification handler in apps/api forwarding to checkin cell service.
 */
export function postCheckinVerify(
  body: CheckinVerifyRequest
): CheckinVerifyResponse {
  if (!body || typeof body.code !== 'string') {
    return {
      status: 'invalid',
      message: 'Code is required.',
      remainingTries: 3,
    };
  }

  const patientId = body.patientId || 'patient_std_01';
  const visitId = body.visitId || 'v_today_01';
  return checkinService.verify(patientId, visitId, body.code);
}
