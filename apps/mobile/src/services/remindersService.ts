import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage.ts';
import type { MedicinesDataResponse } from '../../../../packages/contracts/src/medicines.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface MedicineReminder {
  id: string;
  patientId?: string;
  name: string;
  dosage?: string;
  hospital: string;
  daysLeft: number;
  time: string;
  instruction: string;
  pricePerStrip: number;
  refillUrgent: boolean;
  enabled: boolean;
  takenToday: boolean;
  isNextDose?: boolean;
  image?: 'strip' | 'bottle' | 'syrup' | 'inhaler' | 'drops';
}

export const DEFAULT_REMINDERS: MedicineReminder[] = [
  {
    id: 'rem-1',
    patientId: 'patient_std_01',
    name: 'Telmisartan 40mg',
    dosage: '40mg',
    hospital: 'City Care Hospital',
    daysLeft: 16,
    time: '2:00 PM',
    instruction: '1 tablet with water after lunch.',
    pricePerStrip: 142.0,
    refillUrgent: false,
    enabled: true,
    takenToday: false,
    isNextDose: true,
    image: 'strip',
  },
  {
    id: 'rem-2',
    patientId: 'patient_std_01',
    name: 'Metformin 500mg',
    dosage: '500mg',
    hospital: 'Metro General Hospital',
    daysLeft: 4,
    time: '8:30 PM',
    instruction: '1 tablet after dinner.',
    pricePerStrip: 68.0,
    refillUrgent: true,
    enabled: true,
    takenToday: false,
    isNextDose: false,
    image: 'strip',
  },
  {
    id: 'rem-3',
    patientId: 'patient_std_01',
    name: 'Atorvastatin 10mg',
    dosage: '10mg',
    hospital: 'City Care Hospital',
    daysLeft: 22,
    time: '9:00 PM',
    instruction: '1 tablet at bedtime.',
    pricePerStrip: 142.0,
    refillUrgent: false,
    enabled: true,
    takenToday: false,
    isNextDose: false,
    image: 'bottle',
  },
  {
    id: 'rem-4',
    patientId: 'patient_std_01',
    name: 'Ecosprin 75mg',
    dosage: '75mg',
    hospital: 'City Care Hospital',
    daysLeft: 3,
    time: '9:00 AM',
    instruction: '1 tablet after breakfast.',
    pricePerStrip: 32.0,
    refillUrgent: true,
    enabled: false,
    takenToday: true,
    isNextDose: false,
    image: 'strip',
  },
  {
    id: 'rem-arjun-1',
    patientId: 'person_arjun',
    name: 'Multivitamin Syrup 5ml',
    dosage: '5ml',
    hospital: 'Sunrise Child Clinic',
    daysLeft: 12,
    time: '8:00 AM',
    instruction: '1 teaspoon after breakfast.',
    pricePerStrip: 95.0,
    refillUrgent: false,
    enabled: true,
    takenToday: false,
    isNextDose: true,
    image: 'syrup',
  },
  {
    id: 'rem-arjun-2',
    patientId: 'person_arjun',
    name: 'Zinc Oral Drops',
    dosage: '1ml',
    hospital: 'Sunrise Child Clinic',
    daysLeft: 5,
    time: '7:00 PM',
    instruction: 'With evening milk.',
    pricePerStrip: 55.0,
    refillUrgent: true,
    enabled: true,
    takenToday: false,
    isNextDose: false,
    image: 'drops',
  },
];

let cachedReminders: MedicineReminder[] = [...DEFAULT_REMINDERS];
let isLoaded = false;

export async function initReminders(): Promise<MedicineReminder[]> {
  if (isLoaded) return cachedReminders;
  const data = await getStorageItem<MedicineReminder[]>(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDERS);
  cachedReminders = data;
  isLoaded = true;

  // Background sync with API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/medicines`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiData = (await res.json()) as MedicinesDataResponse;
      if (apiData.prescriptions && apiData.prescriptions.length > 0) {
        // Merge prescription data into reminders if appropriate
      }
    }
  } catch {
    // API offline
  }

  return cachedReminders;
}

export function getReminders(): MedicineReminder[] {
  return cachedReminders;
}

export async function getRemindersForPatient(patientId?: string): Promise<MedicineReminder[]> {
  const all = await initReminders();
  if (!patientId) return all;
  return all.filter((r) => (r.patientId || 'patient_std_01') === patientId);
}

type RemindersListener = (reminders: MedicineReminder[]) => void;
const remindersListeners = new Set<RemindersListener>();

export function onRemindersChange(listener: RemindersListener): () => void {
  remindersListeners.add(listener);
  return () => {
    remindersListeners.delete(listener);
  };
}

function notifyRemindersListeners(reminders: MedicineReminder[]) {
  remindersListeners.forEach((l) => l(reminders));
}

export async function saveReminders(reminders: MedicineReminder[]): Promise<void> {
  cachedReminders = reminders;
  await setStorageItem(STORAGE_KEYS.REMINDERS, reminders);
  notifyRemindersListeners([...cachedReminders]);
}

export function getNextDose(patientId = 'patient_std_01'): MedicineReminder | null {
  const patientReminders = cachedReminders.filter(
    (r) => (r.patientId || 'patient_std_01') === patientId && r.enabled
  );
  // Find next untaken reminder that is marked as next, or the first untaken
  const next = patientReminders.find((r) => r.isNextDose && !r.takenToday) ||
    patientReminders.find((r) => !r.takenToday);
  return next || null;
}

export async function toggleReminder(reminderId: string): Promise<MedicineReminder[]> {
  const reminder = cachedReminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.enabled = !reminder.enabled;
    await saveReminders(cachedReminders);

    // Sync to API
    fetch(`${API_BASE_URL}/medicines/reminders/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId: reminderId, enabled: reminder.enabled }),
    }).catch(() => {});
  }
  return [...cachedReminders];
}

export async function markDoseTaken(reminderId: string): Promise<MedicineReminder[]> {
  const reminder = cachedReminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.takenToday = true;
    reminder.isNextDose = false;

    // Advance next dose to next untaken reminder for this patient
    const patientReminders = cachedReminders.filter(
      (r) => (r.patientId || 'patient_std_01') === (reminder.patientId || 'patient_std_01') && r.enabled
    );
    const nextUntaken = patientReminders.find((r) => !r.takenToday && r.id !== reminderId);
    if (nextUntaken) {
      nextUntaken.isNextDose = true;
    }

    await saveReminders(cachedReminders);

    // Sync to API
    fetch(`${API_BASE_URL}/medicines/dose/take`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId }),
    }).catch(() => {});
  }
  return [...cachedReminders];
}
