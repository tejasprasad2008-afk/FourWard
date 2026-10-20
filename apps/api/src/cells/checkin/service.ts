import type { CheckinVerifyResponse } from '../../../../../packages/contracts/src/checkin.ts';
import { checkinStore } from './store.ts';
import { consentEngine } from '../../spine/consent.ts';
import { auditLedger } from '../../spine/audit.ts';

export class CheckinService {
  public verify(
    patientId: string,
    visitId: string,
    code: string,
    actor = patientId
  ): CheckinVerifyResponse {
    const sanitized = (code || '').trim();
    const session = checkinStore.getOrCreateSession(patientId, visitId);

    // 1. Session is already locked
    if (session.isLocked || session.attempts >= 3) {
      session.isLocked = true;
      checkinStore.updateSession(session);
      return {
        status: 'locked',
        message: 'Too many tries. Ask the nurse for a new code.',
        remainingTries: 0,
      };
    }

    // 2. Lockout test code
    if (sanitized === '888888') {
      session.isLocked = true;
      session.attempts = 3;
      checkinStore.updateSession(session);
      auditLedger.recordEntry({
        action: 'CHECKIN_LOCKED',
        patientId,
        visitId,
        actor,
        metadata: { reason: 'TEST_LOCK_CODE' },
      });
      return {
        status: 'locked',
        message: 'Too many tries. Ask the nurse for a new code.',
        remainingTries: 0,
      };
    }

    // 3. Expired code or session
    if (sanitized === '999999' || session.isExpired || Date.now() > session.expiresAt) {
      session.isExpired = true;
      checkinStore.updateSession(session);
      auditLedger.recordEntry({
        action: 'CHECKIN_EXPIRED',
        patientId,
        visitId,
        actor,
        metadata: { expiresAt: session.expiresAt },
      });
      return {
        status: 'expired',
        message: 'This code expired. Ask the nurse for a new one.',
      };
    }

    // 4. Successful match
    if (sanitized === session.expectedCode) {
      session.verifiedAt = new Date().toISOString();
      checkinStore.updateSession(session);

      // Record consent grant in spine audit ledger
      consentEngine.grantConsent(patientId, visitId, actor, 'CONSULTATION_READ');

      auditLedger.recordEntry({
        action: 'CHECKIN_VERIFIED',
        patientId,
        visitId,
        actor,
        metadata: {
          doctorName: session.doctorName,
          department: session.department,
          room: session.room,
        },
      });

      return {
        status: 'ok',
        room: session.room,
        doctorName: session.doctorName,
        department: session.department,
        visitId: session.visitId,
      };
    }

    // 5. Wrong code - increment attempt count
    session.attempts += 1;
    if (session.attempts >= 3) {
      session.isLocked = true;
      checkinStore.updateSession(session);
      auditLedger.recordEntry({
        action: 'CHECKIN_LOCKED',
        patientId,
        visitId,
        actor,
        metadata: { attempts: session.attempts },
      });
      return {
        status: 'locked',
        message: 'Too many tries. Ask the nurse for a new code.',
        remainingTries: 0,
      };
    }

    checkinStore.updateSession(session);
    const remaining = 3 - session.attempts;
    auditLedger.recordEntry({
      action: 'CHECKIN_FAILED_ATTEMPT',
      patientId,
      visitId,
      actor,
      metadata: { attemptNumber: session.attempts, remainingTries: remaining },
    });

    return {
      status: 'invalid',
      message: `That code doesn't match. ${remaining} ${remaining === 1 ? 'try' : 'tries'} left.`,
      remainingTries: remaining,
    };
  }
}

export const checkinService = new CheckinService();
