import { createHash } from 'node:crypto';

export interface AuditEntryData {
  action: string;
  patientId: string;
  visitId: string;
  actor: string;
  metadata?: Record<string, unknown>;
}

export interface AuditRecord extends AuditEntryData {
  id: string;
  sequence: number;
  timestamp: string;
  prevHash: string;
  hash: string;
}

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class AuditLedger {
  private ledger: AuditRecord[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.ledger = [];
  }

  public computeHash(record: Omit<AuditRecord, 'hash'>): string {
    const canonical = JSON.stringify({
      sequence: record.sequence,
      timestamp: record.timestamp,
      action: record.action,
      patientId: record.patientId,
      visitId: record.visitId,
      actor: record.actor,
      metadata: record.metadata || {},
      prevHash: record.prevHash,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  public recordEntry(data: AuditEntryData): AuditRecord {
    const sequence = this.ledger.length + 1;
    const prevHash = this.ledger.length > 0 
      ? this.ledger[this.ledger.length - 1].hash 
      : GENESIS_PREV_HASH;
    const timestamp = new Date().toISOString();
    const id = `audit_${sequence}_${Date.now()}`;

    const recordWithoutHash: Omit<AuditRecord, 'hash'> = {
      id,
      sequence,
      timestamp,
      action: data.action,
      patientId: data.patientId,
      visitId: data.visitId,
      actor: data.actor,
      metadata: data.metadata,
      prevHash,
    };

    const hash = this.computeHash(recordWithoutHash);
    const fullRecord: AuditRecord = {
      ...recordWithoutHash,
      hash,
    };

    this.ledger.push(fullRecord);
    return fullRecord;
  }

  public getEntries(): readonly AuditRecord[] {
    return [...this.ledger];
  }

  public verifyIntegrity(): { isValid: boolean; error?: string } {
    for (let i = 0; i < this.ledger.length; i++) {
      const entry = this.ledger[i];
      const expectedPrev = i === 0 ? GENESIS_PREV_HASH : this.ledger[i - 1].hash;

      if (entry.prevHash !== expectedPrev) {
        return {
          isValid: false,
          error: `Broken chain at sequence ${entry.sequence}: prevHash mismatch.`,
        };
      }

      const calculated = this.computeHash(entry);
      if (entry.hash !== calculated) {
        return {
          isValid: false,
          error: `Corrupted hash at sequence ${entry.sequence}.`,
        };
      }
    }
    return { isValid: true };
  }
}

export const auditLedger = new AuditLedger();
