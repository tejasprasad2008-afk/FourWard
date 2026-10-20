import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  LOCATION: '@fourward/user_location',
  CART: '@fourward/cart_items',
  REMINDERS: '@fourward/medicine_reminders',
  TRIAGE: '@fourward/triage_state',
  BOOKINGS: '@fourward/doctor_bookings',
  RECORDS: '@fourward/medical_records',
  VISIT_CHECKLIST: '@fourward/visit_checklist',
  ORDERS: '@fourward/medicine_orders',
  DIET: '@fourward/diet_data',
  MATERNAL: '@fourward/maternal_data',
  FAMILY: '@fourward/family_data',
  THEME_MODE: '@fourward/theme_mode',
  PATIENT_PROFILE: '@fourward/patient_profile',
  DOCTOR_BOOKING_DRAFT: '@fourward/doctor_booking_draft',
  VISITS_LIST: '@fourward/patient_visits_list',
  ACTIVE_PERSON_ID: '@fourward/active_person_id',
  MANAGED_PERSONS: '@fourward/managed_persons',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS] | string;

// In-memory session cache fallback in case native storage fails
const memoryFallback = new Map<string, string>();

function getNativeStorage() {
  if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
    return AsyncStorage;
  }
  if (AsyncStorage && (AsyncStorage as any).default && typeof (AsyncStorage as any).default.getItem === 'function') {
    return (AsyncStorage as any).default;
  }
  return null;
}

/**
 * Retrieve and parse JSON item from persistent storage.
 * Returns defaultValue if item is not found or fails parsing.
 * Never throws into UI.
 */
export async function getStorageItem<T>(key: StorageKey, defaultValue: T): Promise<T> {
  try {
    const storage = getNativeStorage();
    if (!storage) {
      if (memoryFallback.has(key)) {
        try {
          return JSON.parse(memoryFallback.get(key)!) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
    const raw = await storage.getItem(key);
    if (raw === null || raw === undefined) {
      if (memoryFallback.has(key)) {
        try {
          return JSON.parse(memoryFallback.get(key)!) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (!errMsg.includes('window is not defined')) {
      console.warn(`[Storage] Failed to read key "${key}": ${errMsg}`, error);
    }
    if (memoryFallback.has(key)) {
      try {
        return JSON.parse(memoryFallback.get(key)!) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

/**
 * Serialize and save JSON item into persistent storage.
 * Never throws into UI.
 */
export async function setStorageItem<T>(key: StorageKey, value: T): Promise<void> {
  let raw = '';
  try {
    raw = JSON.stringify(value);
  } catch (serializationError) {
    console.warn(`[Storage] Failed to serialize value for key "${key}":`, serializationError);
    return;
  }

  // Always keep in memory fallback
  memoryFallback.set(key, raw);

  try {
    const storage = getNativeStorage();
    if (storage) {
      await storage.setItem(key, raw);
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (!errMsg.includes('window is not defined')) {
      console.warn(`[Storage] Failed to write key "${key}": ${errMsg}`, error);
    }
  }
}

/**
 * Remove an item from persistent storage.
 * Never throws into UI.
 */
export async function removeStorageItem(key: StorageKey): Promise<void> {
  memoryFallback.delete(key);
  try {
    const storage = getNativeStorage();
    if (storage) {
      await storage.removeItem(key);
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (!errMsg.includes('window is not defined')) {
      console.warn(`[Storage] Failed to remove key "${key}": ${errMsg}`, error);
    }
  }
}
