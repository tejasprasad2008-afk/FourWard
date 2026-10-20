import type { Request, Response, NextFunction } from 'express';

export interface AuthContext {
  patientId: string;
  hospitalId: string;
  role: 'patient' | 'nurse' | 'doctor';
  actor: string;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export function spineAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Spine authorization & tenancy extraction
  const patientId = (req.headers['x-patient-id'] as string) || req.body?.patientId || 'patient_std_01';
  const hospitalId = (req.headers['x-hospital-id'] as string) || 'hosp_central_hyd_01';
  const role = ((req.headers['x-user-role'] as string) as 'patient' | 'nurse' | 'doctor') || 'patient';
  const actor = (req.headers['x-actor-id'] as string) || patientId;

  req.authContext = {
    patientId,
    hospitalId,
    role,
    actor,
  };

  next();
}
