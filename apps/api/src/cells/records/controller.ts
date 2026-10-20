import express from 'express';
import type { Request, Response } from 'express';
import { recordsService } from './service.ts';
import type {
  RecordUploadRequest,
  ChecklistToggleRequest,
} from '../../../../../packages/contracts/src/records.ts';

export const recordsRouter = express.Router();

recordsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'records',
    timestamp: new Date().toISOString(),
  });
});

recordsRouter.get('/', (req: Request, res: Response) => {
  const patientId = (req.query.patientId as string) || req.authContext?.patientId;
  const data = recordsService.getRecordsData(patientId);
  res.json(data);
});

recordsRouter.post('/upload', (req: Request, res: Response) => {
  const body = req.body as RecordUploadRequest;
  if (!body || !body.title || !body.problemFolder) {
    res.status(400).json({ error: 'title and problemFolder are required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = recordsService.uploadRecord(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

recordsRouter.post('/checklist/toggle', (req: Request, res: Response) => {
  const body = req.body as ChecklistToggleRequest;
  if (!body || !body.itemId) {
    res.status(400).json({ error: 'itemId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = recordsService.toggleChecklistItem(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});
