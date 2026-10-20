import express from 'express';
import type { Request, Response } from 'express';
import { maternalService } from './service.ts';
import type { ToggleVaccineRequest } from '../../../../../packages/contracts/src/maternal.ts';

export const maternalRouter = express.Router();

maternalRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'maternal',
    timestamp: new Date().toISOString(),
  });
});

maternalRouter.get('/', (_req: Request, res: Response) => {
  const data = maternalService.getMaternalData();
  res.json(data);
});

maternalRouter.post('/toggle-vaccine', (req: Request, res: Response) => {
  const body = req.body as ToggleVaccineRequest;
  if (!body || !body.milestoneId) {
    res.status(400).json({ error: 'milestoneId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = maternalService.toggleVaccine(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});
