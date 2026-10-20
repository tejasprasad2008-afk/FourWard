import { CheckinVerifyResponse } from '../../../../packages/contracts/src/checkin';

export interface CheckinResult extends CheckinVerifyResponse {}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Service to verify consultation OTP check-in code with the FourWard Spine API.
 *
 * Calls POST /checkin/verify on the backend API.
 * Attempt counts, lockouts, and consent recording are strictly enforced server-side.
 * Returns a clean error state if the service is unreachable — NO client-side bypass.
 */
export async function verifyCheckinCode(
  code: string,
  patientId = 'patient_std_01',
  visitId = 'v_today_01'
): Promise<CheckinResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE_URL}/checkin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-patient-id': patientId,
      },
      body: JSON.stringify({ code, patientId, visitId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return (await res.json()) as CheckinResult;
    }

    const errorBody = await res.json().catch(() => null);
    if (errorBody && errorBody.status) {
      return errorBody as CheckinResult;
    }

    return {
      status: 'error',
      message: 'Hospital service error. Please ask the nurse.',
    };
  } catch (err: unknown) {
    return {
      status: 'error',
      message: 'Unable to reach hospital service. Check your connection or ask the nurse.',
    };
  }
}
