import { auditLedger } from './audit.ts';

export interface ConsentRecord {
  id: string;
  patientId: string;
  visitId: string;
  scope: 'CONSULTATION_READ' | 'CONSULTATION_WRITE' | 'FULL_ACCESS';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  expiresAt: string;
}

class ConsentEngine {
  private consents: Map<string, ConsentRecord> = new Map();

  public grantConsent(
    patientId: string,
    visitId: string,
    actor: string,
    scope: ConsentRecord['scope'] = 'CONSULTATION_READ'
  ): ConsentRecord {
    const id = `cns_${patientId}_${visitId}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hour consultation window

    const record: ConsentRecord = {
      id,
      patientId,
      visitId,
      scope,
      status: 'ACTIVE',
      grantedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    this.consents.set(id, record);

    // Record consent grant in the spine audit ledger
    auditLedger.recordEntry({
      action: 'CONSENT_GRANTED',
      patientId,
      visitId,
      actor,
      metadata: {
        consentId: id,
        scope,
        expiresAt: record.expiresAt,
      },
    });

    return record;
  }

  public getConsent(patientId: string, visitId: string): ConsentRecord | undefined {
    return this.consents.get(`cns_${patientId}_${visitId}`);
  }
}

export const consentEngine = new ConsentEngine();
