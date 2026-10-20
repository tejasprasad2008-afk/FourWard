import express from 'express';
import type { Request, Response } from 'express';
import { checkinService } from './service.ts';
import type { CheckinVerifyRequest } from '../../../../../packages/contracts/src/checkin.ts';

export const checkinRouter = express.Router();

checkinRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'checkin',
    timestamp: new Date().toISOString(),
  });
});

checkinRouter.post('/verify', (req: Request, res: Response) => {
  const body = req.body as CheckinVerifyRequest;
  if (!body || typeof body.code !== 'string') {
    res.status(400).json({
      status: 'invalid',
      message: 'Code is required.',
      remainingTries: 3,
    });
    return;
  }

  const patientId = body.patientId || req.authContext?.patientId || 'patient_std_01';
  const visitId = body.visitId || 'v_today_01';
  const actor = req.authContext?.actor || patientId;

  const result = checkinService.verify(patientId, visitId, body.code, actor);
  res.json(result);
});
