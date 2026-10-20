import express from 'express';
import type { Request, Response } from 'express';
import { dietService } from './service.ts';
import type {
  DietRegion,
  DietSetting,
  ToggleMealRequest,
} from '../../../../../packages/contracts/src/diet.ts';

export const dietRouter = express.Router();

dietRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'diet',
    timestamp: new Date().toISOString(),
  });
});

dietRouter.get('/', (req: Request, res: Response) => {
  const region = req.query.region as DietRegion | undefined;
  const setting = req.query.setting as DietSetting | undefined;
  const data = dietService.getDietData(region, setting);
  res.json(data);
});

dietRouter.post('/toggle-meal', (req: Request, res: Response) => {
  const body = req.body as ToggleMealRequest & { region?: DietRegion; setting?: DietSetting };
  if (!body || !body.mealId) {
    res.status(400).json({ error: 'mealId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const data = dietService.toggleMeal(body, body.region, body.setting, actor, patientId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
