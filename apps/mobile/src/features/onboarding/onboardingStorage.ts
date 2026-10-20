import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '../../services/storage';
import { updateSelfPersonName } from '../../services/familyService';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn';
export type AgeGroup = 'under_35' | '35_59' | '60_plus';
export type LivingSetting = 'urban' | 'rural';
export type MaternalStatus = 'pregnant' | 'newborn' | 'none';
export type SchemeCard = 'pmjay' | 'aarogyasri' | 'cghs' | 'none';

export interface PatientProfile {
  hasCompletedOnboarding: boolean;
  language: SupportedLanguage;
  name: string;
  ageGroup: AgeGroup;
  setting: LivingSetting;
  conditions: string[];
  maternalStatus: MaternalStatus;
  schemeCard: SchemeCard;
  emergencyPhone?: string;
}

export const DEFAULT_PATIENT_PROFILE: PatientProfile = {
  hasCompletedOnboarding: false,
  language: 'en',
  name: 'Tejas',
  ageGroup: 'under_35',
  setting: 'urban',
  conditions: ['none'],
  maternalStatus: 'none',
  schemeCard: 'aarogyasri',
  emergencyPhone: '9849028143',
};

let memoryProfile: PatientProfile | null = null;

export async function getPatientProfile(): Promise<PatientProfile> {
  if (memoryProfile) {
    return memoryProfile;
  }
  const stored = await getStorageItem<PatientProfile>(
    STORAGE_KEYS.PATIENT_PROFILE,
    DEFAULT_PATIENT_PROFILE
  );
  memoryProfile = stored;
  return stored;
}

export async function savePatientProfile(
  updates: Partial<PatientProfile>
): Promise<PatientProfile> {
  const current = await getPatientProfile();
  const updated: PatientProfile = {
    ...current,
    ...updates,
  };
  memoryProfile = updated;
  await setStorageItem(STORAGE_KEYS.PATIENT_PROFILE, updated);
  if (updates.name) {
    await updateSelfPersonName(updates.name);
  }
  return updated;
}

export async function resetPatientProfile(): Promise<void> {
  memoryProfile = {
    ...DEFAULT_PATIENT_PROFILE,
    hasCompletedOnboarding: false,
  };
  await setStorageItem(STORAGE_KEYS.PATIENT_PROFILE, memoryProfile);
}
