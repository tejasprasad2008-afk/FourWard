import express from 'express';
import type { Request, Response } from 'express';
import { familyService } from './service.ts';
import type {
  ToggleAccessRequest,
  AddFamilyMemberRequest,
  AddPersonRequest,
  ApprovePersonRequest,
  UpdatePersonPermissionsRequest,
} from '../../../../../packages/contracts/src/family.ts';

export const familyRouter = express.Router();

familyRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cell: 'family',
    timestamp: new Date().toISOString(),
  });
});

familyRouter.get('/', (_req: Request, res: Response) => {
  const data = familyService.getFamilyData();
  res.json(data);
});

familyRouter.get('/persons', (_req: Request, res: Response) => {
  const persons = familyService.getManagedPersons();
  res.json(persons);
});

familyRouter.post('/persons', (req: Request, res: Response) => {
  const body = req.body as AddPersonRequest;
  if (!body || !body.name || !body.relation || !body.ageBand) {
    res.status(400).json({ error: 'name, relation, and ageBand are required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.addPerson(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

familyRouter.post('/persons/:id/approve', (req: Request, res: Response) => {
  const personId = String(req.params.id);
  const body = req.body as ApprovePersonRequest;
  if (!body || !body.code) {
    res.status(400).json({ error: 'Approval code is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.approvePerson(personId, body.code, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

familyRouter.post('/persons/:id/permissions', (req: Request, res: Response) => {
  const personId = String(req.params.id);
  const body = req.body as UpdatePersonPermissionsRequest;

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.updatePermissions(personId, body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

familyRouter.post('/persons/:id/revoke', (req: Request, res: Response) => {
  const personId = String(req.params.id);
  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.revokePerson(personId, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

familyRouter.post('/toggle-access', (req: Request, res: Response) => {
  const body = req.body as ToggleAccessRequest;
  if (!body || !body.caregiverId) {
    res.status(400).json({ error: 'caregiverId is required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.toggleAccess(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

familyRouter.post('/add', (req: Request, res: Response) => {
  const body = req.body as AddFamilyMemberRequest;
  if (!body || !body.name || !body.relation || !body.phone) {
    res.status(400).json({ error: 'name, relation, and phone are required' });
    return;
  }

  const actor = req.authContext?.actor || 'patient_std_01';
  const patientId = req.authContext?.patientId || 'patient_std_01';

  try {
    const result = familyService.addMember(body, actor, patientId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
