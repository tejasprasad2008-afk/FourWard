import express from 'express';
import type { Request, Response } from 'express';
import { medicinesService } from './service.ts';
import type {
  ReminderToggleRequest,
  CartUpdateRequest,
  CheckoutRequest,
} from '../../../../../packages/contracts/src/medicines.ts';

export const medicinesRouter = express.Router();

medicinesRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'medicines',
    timestamp: new Date().toISOString(),
  });
});

medicinesRouter.get('/', (_req: Request, res: Response) => {
  const data = medicinesService.getMedicinesData();
  res.json(data);
});

medicinesRouter.post('/reminders/toggle', (req: Request, res: Response) => {
  const body = req.body as ReminderToggleRequest;
  if (!body || !body.prescriptionId) {
    res.status(400).json({ error: 'prescriptionId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = medicinesService.toggleReminder(body.prescriptionId, body.enabled, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

medicinesRouter.post('/dose/take', (req: Request, res: Response) => {
  const body = req.body as { reminderId: string };
  if (!body || !body.reminderId) {
    res.status(400).json({ error: 'reminderId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = medicinesService.markDoseTaken(body.reminderId, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

medicinesRouter.post('/cart/update', (req: Request, res: Response) => {
  const body = req.body as CartUpdateRequest;
  if (!body || !body.medicineId || body.quantity === undefined) {
    res.status(400).json({ error: 'medicineId and quantity are required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = medicinesService.updateCart(body.medicineId, body.quantity, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

medicinesRouter.post('/checkout', (req: Request, res: Response) => {
  const body = req.body as CheckoutRequest;
  if (!body || !body.deliveryMode) {
    res.status(400).json({ error: 'deliveryMode is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const order = medicinesService.checkout(body, actor, patientId);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
