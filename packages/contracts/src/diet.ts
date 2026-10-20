export type DietRegion = 'Telugu / Deccan' | 'South Indian' | 'North Indian';
export type DietSetting = 'urban' | 'rural';

export interface DoctorDietRestriction {
  id: string;
  rule: string;
  source: string;
  severity: 'mandatory' | 'recommended';
}

export interface DailyTargets {
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinGrams: number;
  proteinConsumed: number;
  sodiumMg: number;
  sodiumLimitMg: number;
}

export interface MealSlot {
  id: string;
  name: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  time: string;
  items: string;
  calories: number;
  logged: boolean;
}

export interface DietDataResponse {
  region: DietRegion;
  setting: DietSetting;
  doctorRestrictions: DoctorDietRestriction[];
  dailyTargets: DailyTargets;
  meals: MealSlot[];
}

export interface ToggleMealRequest {
  mealId: string;
  logged?: boolean;
}
