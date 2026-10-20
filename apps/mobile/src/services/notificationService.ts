import type { DoctorBookingResponse } from '../../../../packages/contracts/src/doctors.ts';

export const NOTIFICATION_PERMISSION_SENTENCE = 'Allow notifications so we can remind you before your visit.';

let isWeb = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rn = require('react-native');
  isWeb = rn?.Platform?.OS === 'web';
} catch {
  isWeb = typeof window !== 'undefined';
}

type NotificationsType = any;
let _notifications: NotificationsType | null = null;
let _notificationsAvailable: boolean | null = null;

function getNotifications(): NotificationsType | null {
  if (isWeb) return null;
  if (_notificationsAvailable === false) return null;
  if (_notifications) return _notifications;

  try {
    const mod = require('expo-notifications');
    if (mod && typeof mod.getPermissionsAsync === 'function') {
      _notifications = mod;
      _notificationsAvailable = true;
    } else {
      _notificationsAvailable = false;
      return null;
    }

    if (typeof mod.setNotificationHandler === 'function') {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    return _notifications;
  } catch (err) {
    _notificationsAvailable = false;
    console.warn('[NotificationService] Notifications unavailable in this environment:', err);
    return null;
  }
}

/**
 * Request notification permissions with plain contextual explanation.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    return true;
  }

  const notifications = getNotifications();
  if (!notifications) {
    return true;
  }

  try {
    const existing = await notifications.getPermissionsAsync();
    if (existing.status === 'granted') {
      return true;
    }

    const requested = await notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch (err) {
    console.warn('[NotificationService] Permission request failed:', err);
    return false;
  }
}

/**
 * Helper to parse a booking's date & time into a Date object
 */
function parseBookingDateTime(dateStr?: string, timeStr?: string): Date {
  const now = new Date();
  const targetDate = new Date();

  if (dateStr) {
    if (dateStr.toLowerCase().includes('tomorrow')) {
      targetDate.setDate(now.getDate() + 1);
    } else if (dateStr.toLowerCase().includes('today')) {
      // today
    } else {
      const parsed = Date.parse(dateStr);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        targetDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }

  // Parse time (e.g. "09:30 AM" or "02:30 PM")
  if (timeStr && /([0-9]{1,2}):([0-9]{2})\s*(AM|PM)?/i.test(timeStr)) {
    const match = timeStr.match(/([0-9]{1,2}):([0-9]{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const mer = (match[3] || '').toUpperCase();
      if (mer === 'PM' && hours < 12) hours += 12;
      if (mer === 'AM' && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
    }
  } else {
    // Default to 10:00 AM
    targetDate.setHours(10, 0, 0, 0);
  }

  return targetDate;
}

/**
 * Schedule local reminders for a booking:
 * 1. One day before
 * 2. Two hours before
 */
export async function scheduleVisitReminders(
  booking: DoctorBookingResponse
): Promise<{ oneDayBeforeId?: string; twoHoursBeforeId?: string }> {
  if (isWeb) {
    return {};
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return {};
  }

  const visitDate = parseBookingDateTime(booking.date, booking.time);
  const now = new Date();
  const results: { oneDayBeforeId?: string; twoHoursBeforeId?: string } = {};

  const notifications = getNotifications();
  if (!notifications) {
    return {
      oneDayBeforeId: `mock-1d-${booking.bookingId}`,
      twoHoursBeforeId: `mock-2h-${booking.bookingId}`,
    };
  }

  try {
    // 1. One day before (24 hours prior)
    const oneDayBefore = new Date(visitDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore.getTime() > now.getTime()) {
      const id = await notifications.scheduleNotificationAsync({
        content: {
          title: 'Doctor visit tomorrow',
          body: `Appointment with ${booking.doctorName} at ${booking.time || 'scheduled time'}, ${booking.hospitalName}.`,
          data: { bookingId: booking.bookingId, type: 'one_day_before' },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: oneDayBefore,
        },
      });
      results.oneDayBeforeId = id;
    }

    // 2. Two hours before
    const twoHoursBefore = new Date(visitDate.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore.getTime() > now.getTime()) {
      const id = await notifications.scheduleNotificationAsync({
        content: {
          title: 'Doctor visit in 2 hours',
          body: `${booking.doctorName} at ${booking.time || 'scheduled time'}, ${booking.hospitalName}. Room: ${booking.room || 'OPD'}.`,
          data: { bookingId: booking.bookingId, type: 'two_hours_before' },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: twoHoursBefore,
        },
      });
      results.twoHoursBeforeId = id;
    } else if (visitDate.getTime() > now.getTime()) {
      // If within 2 hours, schedule an immediate alert 1 minute from now
      const id = await notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming doctor visit',
          body: `Your visit with ${booking.doctorName} is coming up today at ${booking.time || 'OP Desk'}, ${booking.hospitalName}.`,
          data: { bookingId: booking.bookingId, type: 'upcoming_soon' },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });
      results.twoHoursBeforeId = id;
    }
  } catch (err) {
    console.warn('[NotificationService] Failed to schedule reminders:', err);
  }

  return results;
}
