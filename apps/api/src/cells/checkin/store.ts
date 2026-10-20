export interface CheckinSession {
  patientId: string;
  visitId: string;
  expectedCode: string;
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  isExpired: boolean;
  expiresAt: number;
  doctorName: string;
  department: string;
  room: string;
  verifiedAt?: string;
}

class CheckinStore {
  private sessions: Map<string, CheckinSession> = new Map();

  private getKey(patientId: string, visitId: string): string {
    return `${patientId}::${visitId}`;
  }

  public getOrCreateSession(
    patientId: string,
    visitId = 'v_today_01'
  ): CheckinSession {
    const key = this.getKey(patientId, visitId);
    let session = this.sessions.get(key);

    if (!session) {
      session = {
        patientId,
        visitId,
        expectedCode: '123456',
        attempts: 0,
        maxAttempts: 3,
        isLocked: false,
        isExpired: false,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
        doctorName: 'Dr. P. V. Ramana Rao',
        department: 'General Medicine',
        room: 'Room 204',
      };
      this.sessions.set(key, session);
    }

    return session;
  }

  public updateSession(session: CheckinSession): void {
    const key = this.getKey(session.patientId, session.visitId);
    this.sessions.set(key, session);
  }

  public reset(): void {
    this.sessions.clear();
  }
}

export const checkinStore = new CheckinStore();
