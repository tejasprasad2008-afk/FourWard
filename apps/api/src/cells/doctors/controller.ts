import express from 'express';
import type { Request, Response } from 'express';
import { doctorsService } from './service.ts';
import type {
  DoctorsTriageRequest,
  DoctorsFilterQuery,
  DoctorBookingRequest,
} from '../../../../../packages/contracts/src/doctors.ts';

export const doctorsRouter = express.Router();

doctorsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'doctors',
    timestamp: new Date().toISOString(),
  });
});

doctorsRouter.post('/triage', (req: Request, res: Response) => {
  const body = req.body as DoctorsTriageRequest;
  const result = doctorsService.triageSymptoms(body || { symptomInput: '' });
  res.json(result);
});

doctorsRouter.get('/', (req: Request, res: Response) => {
  const filters: DoctorsFilterQuery = {
    department: req.query.department as string | undefined,
    hospital: req.query.hospital as string | undefined,
    locality: req.query.locality as string | undefined,
    search: req.query.search as string | undefined,
    acceptsCard: req.query.acceptsCard as string | undefined,
    partnerOnly: req.query.partnerOnly === 'true' || req.query.partnerOnly === '1',
    sort: req.query.sort as 'soonest' | 'nearest' | 'fee' | undefined,
  };
  const list = doctorsService.getDoctors(filters);
  res.json(list);
});

doctorsRouter.get('/:id/slots', (req: Request, res: Response) => {
  const doctorId = String(req.params.id);
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  try {
    const slots = doctorsService.getSlots(doctorId, date);
    res.json(slots);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

doctorsRouter.post('/book', (req: Request, res: Response) => {
  const body = req.body as DoctorBookingRequest;
  if (!body || !body.doctorId) {
    res.status(400).json({ error: 'doctorId is required for booking' });
    return;
  }

  const patientId = body.patientId || req.authContext?.patientId || 'patient_std_01';
  const actor = req.authContext?.actor || patientId;

  try {
    const booking = doctorsService.bookDoctor({ ...body, patientId }, actor);
    res.json(booking);
  } catch (err: any) {
    if (err.code === 'DOUBLE_BOOKING' || err.message?.includes('Double booking')) {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(404).json({ error: err.message });
  }
});

doctorsRouter.get('/visits', (req: Request, res: Response) => {
  const patientId = (req.query.patientId as string) || req.authContext?.patientId || 'patient_std_01';
  const list = doctorsService.getBookings(patientId);
  res.json(list);
});

doctorsRouter.post('/visits/:id/cancel', (req: Request, res: Response) => {
  const bookingId = String(req.params.id);
  const patientId = req.authContext?.patientId || 'patient_std_01';
  const actor = req.authContext?.actor || patientId;

  try {
    const updated = doctorsService.cancelBooking(bookingId, patientId, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

doctorsRouter.post('/visits/:id/reschedule', (req: Request, res: Response) => {
  const bookingId = String(req.params.id);
  const { slotId, date, time } = req.body || {};
  const patientId = req.authContext?.patientId || 'patient_std_01';
  const actor = req.authContext?.actor || patientId;

  if (!slotId || !date || !time) {
    res.status(400).json({ error: 'slotId, date, and time are required for rescheduling' });
    return;
  }

  try {
    const updated = doctorsService.rescheduleBooking(bookingId, slotId, date, time, patientId, actor);
    res.json(updated);
  } catch (err: any) {
    if (err.code === 'SLOT_UNAVAILABLE') {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(404).json({ error: err.message });
  }
});

