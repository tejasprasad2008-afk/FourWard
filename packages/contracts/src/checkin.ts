export type CheckinVerifyStatus = 'ok' | 'invalid' | 'expired' | 'locked' | 'error';

export interface CheckinVerifyRequest {
  code: string;
  patientId?: string;
  visitId?: string;
}

export interface CheckinVerifyResponse {
  status: CheckinVerifyStatus;
  message?: string;
  room?: string;
  doctorName?: string;
  department?: string;
  visitId?: string;
  remainingTries?: number;
}

/**
 * Stub verification logic adhering to the contract rules.
 * Test codes:
 * - '123456': Valid active consultation code
 * - '999999': Expired code
 * - '888888': Locked out (too many tries)
 * - Any other: Invalid code
 */
export function verifyCheckinStub(code: string, currentAttempts = 0): CheckinVerifyResponse {
  const sanitized = code.trim();

  if (sanitized === '123456') {
    return {
      status: 'ok',
      room: 'Room 204',
      doctorName: 'Dr. P. V. Ramana Rao',
    };
  }

  if (sanitized === '999999') {
    return {
      status: 'expired',
      message: 'This code expired. Ask the nurse for a new one.',
    };
  }

  if (sanitized === '888888' || currentAttempts >= 2) {
    return {
      status: 'locked',
      message: 'Too many tries. Ask the nurse for a new code.',
      remainingTries: 0,
    };
  }

  const remaining = Math.max(0, 2 - currentAttempts);
  return {
    status: 'invalid',
    message: `That code doesn't match. ${remaining} ${remaining === 1 ? 'try' : 'tries'} left.`,
    remainingTries: remaining,
  };
}
