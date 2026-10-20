import type {
  MaternalDataResponse,
  ToggleVaccineRequest,
  MaternalMilestone,
} from '../../../../../packages/contracts/src/maternal.ts';
import { maternalStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

export class MaternalService {
  public getMaternalData(): MaternalDataResponse {
    return maternalStore.getMaternalData();
  }

  public toggleVaccine(
    req: ToggleVaccineRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { milestone: MaternalMilestone; data: MaternalDataResponse } {
    const updated = maternalStore.toggleVaccine(req.milestoneId, req.completed);

    auditLedger.recordEntry({
      action: 'MATERNAL_VACCINE_TOGGLED',
      patientId,
      visitId: req.milestoneId,
      actor,
      metadata: {
        milestoneId: updated.id,
        name: updated.name,
        completed: updated.completed,
      },
    });

    return {
      milestone: updated,
      data: maternalStore.getMaternalData(),
    };
  }
}

export const maternalService = new MaternalService();
