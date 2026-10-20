import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';

export interface UserLocation {
  locality: string;
  latitude: number; // rounded to 2 decimals
  longitude: number; // rounded to 2 decimals
}

export const DEFAULT_LOCATION: UserLocation = {
  locality: 'Gachibowli, Hyderabad',
  latitude: 17.44,
  longitude: 78.35,
};

let currentLocation: UserLocation = { ...DEFAULT_LOCATION };
let isLoaded = false;

/**
 * Loads the saved device location from AsyncStorage on boot.
 */
export async function initDeviceLocation(): Promise<UserLocation> {
  if (isLoaded) {
    return currentLocation;
  }
  const saved = await getStorageItem<UserLocation>(STORAGE_KEYS.LOCATION, DEFAULT_LOCATION);
  currentLocation = {
    locality: saved.locality || DEFAULT_LOCATION.locality,
    latitude: Math.round((saved.latitude ?? DEFAULT_LOCATION.latitude) * 100) / 100,
    longitude: Math.round((saved.longitude ?? DEFAULT_LOCATION.longitude) * 100) / 100,
  };
  isLoaded = true;
  return currentLocation;
}

/**
 * Stores the location on the device only.
 * Coordinates are strictly rounded to 2 decimal places before saving.
 * Persists immediately to AsyncStorage.
 */
export function saveDeviceLocation(loc: { locality: string; latitude: number; longitude: number }): UserLocation {
  currentLocation = {
    locality: loc.locality.trim() || DEFAULT_LOCATION.locality,
    latitude: Math.round(loc.latitude * 100) / 100,
    longitude: Math.round(loc.longitude * 100) / 100,
  };
  setStorageItem(STORAGE_KEYS.LOCATION, currentLocation).catch(() => {});
  return currentLocation;
}

export function getDeviceLocation(): UserLocation {
  return currentLocation;
}
