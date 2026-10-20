import type {
  DietRegion,
  DietSetting,
  DietDataResponse,
  ToggleMealRequest,
} from '../../../../../packages/contracts/src/diet.ts';
import { dietStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

export class DietService {
  public getDietData(region?: DietRegion, setting?: DietSetting): DietDataResponse {
    return dietStore.getDietData(region, setting);
  }

  public toggleMeal(
    req: ToggleMealRequest,
    region?: DietRegion,
    setting?: DietSetting,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): DietDataResponse {
    const updated = dietStore.toggleMeal(req.mealId, req.logged, region, setting);

    auditLedger.recordEntry({
      action: req.logged ? 'MEAL_LOGGED' : 'MEAL_UNLOGGED',
      patientId,
      visitId: req.mealId,
      actor,
      metadata: {
        mealId: req.mealId,
        caloriesConsumed: updated.dailyTargets.caloriesConsumed,
        region: updated.region,
        setting: updated.setting,
      },
    });

    return updated;
  }
}

export const dietService = new DietService();
