import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export interface CalendarEventPayload {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

/**
 * Add a confirmed hospital visit to the device calendar with in-context permission request.
 * Plain English context sentence: "Allow calendar access so we can add your hospital visit."
 * Returns true if added successfully, false if denied or failed.
 * Never throws into UI.
 */
export async function addVisitToCalendar(payload: CalendarEventPayload): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Calendar access needed',
        'Allow calendar access so we can add your hospital visit.'
      );
      return false;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    let defaultCalendar =
      Platform.OS === 'ios'
        ? await Calendar.getDefaultCalendarAsync().catch(() => null)
        : calendars.find((c) => c.isPrimary) || calendars.find((c) => c.allowsModifications) || calendars[0];

    if (!defaultCalendar && calendars.length > 0) {
      defaultCalendar = calendars[0];
    }

    if (!defaultCalendar) {
      console.warn('[Calendar] No writable calendar found on device');
      return false;
    }

    await Calendar.createEventAsync(defaultCalendar.id, {
      title: payload.title,
      startDate: payload.startDate,
      endDate: payload.endDate,
      location: payload.location,
      notes: payload.notes,
      timeZone: 'Asia/Kolkata',
    });

    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[Calendar] Failed to add event: ${errMsg}`, error);
    return false;
  }
}
