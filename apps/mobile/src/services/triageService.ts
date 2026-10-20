import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from './storage.ts';
import { scheduleVisitReminders } from './notificationService.ts';
import {
  createBookAgainDraft,
  type DoctorsTriageResponse,
  type DoctorBookingResponse,
  type DoctorSlotsResponse,
  type TriageQuestion,
} from '../../../../packages/contracts/src/doctors.ts';

export { createBookAgainDraft };

export interface ActiveTokenBooking extends DoctorBookingResponse {}

export interface TriageState {
  hasRecordedSymptoms: boolean;
  recordedAt: string | null;
  chiefComplaint: string;
  assignedDepartment: string;
  answers: Record<string, string>;
  isEmergency: boolean;
}

export interface InProgressBookingDraft {
  step: number; // 1 to 4
  doctorId: string;
  patientName: string;
  patientId: string;
  date: string;
  time?: string;
  slotId?: string;
  isWalkIn?: boolean;
}

export const DEFAULT_TRIAGE_STATE: TriageState = {
  hasRecordedSymptoms: false,
  recordedAt: null,
  chiefComplaint: '',
  assignedDepartment: '',
  answers: {},
  isEmergency: false,
};

let cachedTriage: TriageState = { ...DEFAULT_TRIAGE_STATE };
let cachedBooking: ActiveTokenBooking | null = null;
let isLoaded = false;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function initTriageState(): Promise<{ triage: TriageState; booking: ActiveTokenBooking | null }> {
  if (isLoaded) {
    return { triage: cachedTriage, booking: cachedBooking };
  }

  const [triage, booking] = await Promise.all([
    getStorageItem<TriageState>(STORAGE_KEYS.TRIAGE, DEFAULT_TRIAGE_STATE),
    getStorageItem<ActiveTokenBooking | null>(STORAGE_KEYS.BOOKINGS, null),
  ]);

  cachedTriage = triage;
  cachedBooking = booking;
  isLoaded = true;

  return { triage, booking };
}

export async function saveTriageState(state: TriageState): Promise<void> {
  cachedTriage = state;
  await setStorageItem(STORAGE_KEYS.TRIAGE, state);
}

export async function clearTriageState(): Promise<void> {
  cachedTriage = { ...DEFAULT_TRIAGE_STATE };
  await removeStorageItem(STORAGE_KEYS.TRIAGE);
}

export async function saveActiveBooking(booking: ActiveTokenBooking): Promise<void> {
  cachedBooking = booking;
  await setStorageItem(STORAGE_KEYS.BOOKINGS, booking);
}

export async function clearActiveBooking(): Promise<void> {
  cachedBooking = null;
  await removeStorageItem(STORAGE_KEYS.BOOKINGS);
}

export async function saveBookingDraft(draft: InProgressBookingDraft): Promise<void> {
  await setStorageItem(STORAGE_KEYS.DOCTOR_BOOKING_DRAFT, draft);
}

export async function getBookingDraft(): Promise<InProgressBookingDraft | null> {
  return await getStorageItem<InProgressBookingDraft | null>(STORAGE_KEYS.DOCTOR_BOOKING_DRAFT, null);
}

export async function clearBookingDraft(): Promise<void> {
  await removeStorageItem(STORAGE_KEYS.DOCTOR_BOOKING_DRAFT);
}

/**
 * Call POST /doctors/triage on FourWard Spine API, with local fallback
 */
export async function submitTriage(
  symptomInput: string,
  answers: Record<string, string> = {}
): Promise<DoctorsTriageResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptomInput, answers }),
    });

    if (res.ok) {
      return (await res.json()) as DoctorsTriageResponse;
    }
  } catch {
    // API offline
  }

  // Local rule-based fallback
  const input = symptomInput.toLowerCase().trim();
  const emergencyRegex = /\b(?:chest\s*pain|difficulty\s*breathing|breathless|choking|heart\s*attack|collapsed|unconscious|severe\s*chest)\b/i;

  if (emergencyRegex.test(input) || (answers['severity'] === 'severe' && /chest|breath/i.test(input))) {
    return {
      isEmergency: true,
      emergencyMessage: 'Immediate emergency alert. Please call 108 ambulance service or proceed to the nearest emergency ward.',
      recommendedDepartment: 'Cardiology / Emergency',
      rationale: 'Symptoms indicate potential cardiac or respiratory emergency.',
      questions: [],
      isComplete: true,
    };
  }

  let dept = 'Internal Medicine';
  let rationale = 'General physician evaluation recommended for acute symptoms.';

  if (/chest|palpitation|blood\s*pressure|high\s*bp|hypertension|heart/i.test(input)) {
    dept = 'Cardiology';
    rationale = 'Recommended for cardiovascular symptoms and blood pressure evaluation.';
  } else if (/child|infant|kid|baby|pediatric|toddler/i.test(input)) {
    dept = 'Pediatrics';
    rationale = 'Specialized pediatrician care recommended for children.';
  } else if (/pregnancy|period|cramp|menstrual|bleeding|gynec|maternal/i.test(input)) {
    dept = 'Gynecology';
    rationale = 'Recommended for maternal and women’s health concerns.';
  } else if (/joint|knee|bone|fracture|back\s*pain|sprain|ligament|arthritis/i.test(input)) {
    dept = 'Orthopedics';
    rationale = 'Recommended for musculoskeletal, joint, or bone discomfort.';
  } else if (/ear|throat|nose|sinus|tonsil|voice|earache|swallowing/i.test(input)) {
    dept = 'ENT';
    rationale = 'Recommended for ear, nose, and throat symptoms.';
  }

  const defaultQuestions: TriageQuestion[] = [
    {
      id: 'duration',
      question: 'How long have you had this?',
      options: [
        { id: 'today', label: 'Started today' },
        { id: 'days', label: '2 to 4 days' },
        { id: 'week', label: 'More than a week' },
      ],
    },
    {
      id: 'severity',
      question: 'How severe is the discomfort?',
      options: [
        { id: 'mild', label: 'Mild' },
        { id: 'moderate', label: 'Moderate' },
        { id: 'severe', label: 'Severe' },
      ],
    },
    {
      id: 'associated',
      question: 'Any accompanying symptoms?',
      options: [
        { id: 'fever', label: 'Fever' },
        { id: 'nausea', label: 'Nausea' },
        { id: 'none', label: 'None of these' },
      ],
    },
  ];

  return {
    isEmergency: false,
    recommendedDepartment: dept,
    rationale,
    questions: defaultQuestions,
    isComplete: Object.keys(answers).length >= 1,
  };
}

/**
 * Fetch available consultation slots for a doctor on a specific date
 */
export async function fetchDoctorSlots(
  doctorId: string,
  date: string
): Promise<DoctorSlotsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
    if (res.ok) {
      return (await res.json()) as DoctorSlotsResponse;
    }
  } catch {
    // API offline
  }

  // Local fallback
  const d = new Date(date);
  if (d.getDay() === 0 || date === '2026-10-25' || date.endsWith('-empty')) {
    return {
      doctorId,
      date,
      slots: [],
      supportsWalkIn: false,
    };
  }

  return {
    doctorId,
    date,
    slots: [
      { id: `${doctorId}_${date}_0900`, time: '09:00 AM', period: 'morning', isAvailable: true },
      { id: `${doctorId}_${date}_0930`, time: '09:30 AM', period: 'morning', isAvailable: true },
      { id: `${doctorId}_${date}_1030`, time: '10:30 AM', period: 'morning', isAvailable: false },
      { id: `${doctorId}_${date}_1130`, time: '11:30 AM', period: 'morning', isAvailable: true },
      { id: `${doctorId}_${date}_1330`, time: '01:30 PM', period: 'afternoon', isAvailable: true },
      { id: `${doctorId}_${date}_1430`, time: '02:30 PM', period: 'afternoon', isAvailable: false },
      { id: `${doctorId}_${date}_1530`, time: '03:30 PM', period: 'afternoon', isAvailable: true },
      { id: `${doctorId}_${date}_1700`, time: '05:00 PM', period: 'evening', isAvailable: true },
      { id: `${doctorId}_${date}_1800`, time: '06:00 PM', period: 'evening', isAvailable: true },
    ],
    supportsWalkIn: true,
    walkInEstimatedWaitMinutes: 35,
    walkInTokenNumber: 19,
  };
}

/**
 * Call POST /doctors/book on the FourWard Spine API, with local fallback
 */
export async function submitDoctorBooking(
  doctorId: string,
  doctorName: string,
  hospitalName: string,
  department: string,
  room?: string,
  patientId = 'patient_std_01',
  patientName = 'Tejas',
  slotId?: string,
  date?: string,
  time?: string,
  walkIn?: boolean,
  schemeCard?: string
): Promise<ActiveTokenBooking> {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-patient-id': patientId },
      body: JSON.stringify({ doctorId, patientId, patientName, slotId, date, time, walkIn, schemeCard }),
    });

    if (res.status === 409) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'You already have an active booking with this doctor.');
    }

    if (res.ok) {
      const data = (await res.json()) as ActiveTokenBooking;
      await saveActiveBooking(data);
      await clearBookingDraft();
      // Prepend to visits list
      const visits = await getStorageItem<DoctorBookingResponse[]>(STORAGE_KEYS.VISITS_LIST, DEFAULT_VISITS);
      const filtered = visits.filter((v) => v.bookingId !== data.bookingId);
      await setStorageItem(STORAGE_KEYS.VISITS_LIST, [data, ...filtered]);
      scheduleVisitReminders(data).catch(() => {});
      return data;
    }
  } catch (err: any) {
    if (err.message?.includes('already have an active booking') || err.message?.includes('Double booking')) {
      throw err;
    }
    // Network error: use offline fallback
  }

  // Fallback booking
  const fallbackToken: ActiveTokenBooking = {
    bookingId: `bk_${Date.now()}`,
    doctorId,
    status: 'confirmed',
    tokenNumber: walkIn ? 19 : undefined,
    slotId,
    date: date || 'Today',
    time: time || (walkIn ? 'Walk-in OP' : 'Slot Consult'),
    estimatedWaitMinutes: walkIn ? 35 : undefined,
    doctorName,
    hospitalName,
    department,
    room: room || 'Room 101',
    patientName,
    patientId,
    fee: 500,
    cardAccepted: schemeCard === 'aarogyasri' || schemeCard === 'pmjay',
    bookedAt: new Date().toISOString(),
  };

  await saveActiveBooking(fallbackToken);
  await clearBookingDraft();
  const visits = await getStorageItem<DoctorBookingResponse[]>(STORAGE_KEYS.VISITS_LIST, DEFAULT_VISITS);
  const filtered = visits.filter((v) => v.bookingId !== fallbackToken.bookingId);
  await setStorageItem(STORAGE_KEYS.VISITS_LIST, [fallbackToken, ...filtered]);
  scheduleVisitReminders(fallbackToken).catch(() => {});
  return fallbackToken;
}

export const DEFAULT_VISITS: DoctorBookingResponse[] = [
  {
    bookingId: 'bk_past_01',
    doctorId: 'doc_genmed_02',
    status: 'completed',
    slotId: 'doc_genmed_02_2026-10-10_1130',
    date: '10 Oct 2026',
    time: '11:30 AM',
    doctorName: 'Dr. K. Srinivas',
    hospitalName: 'Deccan Health Institute',
    locality: 'Gachibowli, Hyderabad',
    department: 'Internal Medicine',
    room: 'Room 102',
    patientName: 'Tejas',
    patientId: 'patient_std_01',
    fee: 450,
    cardAccepted: true,
    bookedAt: '2026-10-08T09:00:00.000Z',
  },
  {
    bookingId: 'bk_canc_01',
    doctorId: 'doc_pedia_03',
    status: 'cancelled',
    slotId: 'doc_pedia_03_2026-10-14_1530',
    date: '14 Oct 2026',
    time: '03:30 PM',
    doctorName: 'Dr. Ananya Reddy',
    hospitalName: 'Sunrise Child Clinic',
    locality: 'Banjara Hills, Hyderabad',
    department: 'Pediatrics',
    room: 'Room 305',
    patientName: 'Tejas',
    patientId: 'patient_std_01',
    fee: 400,
    cardAccepted: false,
    bookedAt: '2026-10-12T10:00:00.000Z',
    cancelledAt: '2026-10-13T08:30:00.000Z',
  },
  {
    bookingId: 'bk_arjun_past_01',
    doctorId: 'doc_pedia_03',
    status: 'completed',
    slotId: 'doc_pedia_03_2026-10-02_1030',
    date: '02 Oct 2026',
    time: '10:30 AM',
    doctorName: 'Dr. Ananya Reddy',
    hospitalName: 'Sunrise Child Clinic',
    locality: 'Banjara Hills, Hyderabad',
    department: 'Pediatrics',
    room: 'Room 305',
    patientName: 'Arjun Prasad',
    patientId: 'person_arjun',
    fee: 400,
    cardAccepted: false,
    bookedAt: '2026-09-30T10:00:00.000Z',
  },
];

export async function fetchPatientVisits(patientId = 'patient_std_01'): Promise<DoctorBookingResponse[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/visits?patientId=${encodeURIComponent(patientId)}`);
    if (res.ok) {
      const data = (await res.json()) as DoctorBookingResponse[];
      await setStorageItem(STORAGE_KEYS.VISITS_LIST, data);
      return data.filter((v) => !patientId || patientId === 'all' || (v.patientId || 'patient_std_01') === patientId);
    }
  } catch {
    // offline fallback
  }

  const stored = await getStorageItem<DoctorBookingResponse[]>(STORAGE_KEYS.VISITS_LIST, DEFAULT_VISITS);
  return stored.filter((v) => !patientId || patientId === 'all' || (v.patientId || 'patient_std_01') === patientId);
}

export async function cancelDoctorBooking(bookingId: string): Promise<DoctorBookingResponse | null> {
  let updatedBooking: DoctorBookingResponse | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/visits/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      updatedBooking = (await res.json()) as DoctorBookingResponse;
    }
  } catch {
    // offline
  }

  // Update local storage
  const visits = await getStorageItem<DoctorBookingResponse[]>(STORAGE_KEYS.VISITS_LIST, DEFAULT_VISITS);
  const updatedList = visits.map((v) => {
    if (v.bookingId === bookingId) {
      const cancelled: DoctorBookingResponse = {
        ...v,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      };
      if (!updatedBooking) updatedBooking = cancelled;
      return cancelled;
    }
    return v;
  });
  await setStorageItem(STORAGE_KEYS.VISITS_LIST, updatedList);

  if (cachedBooking && cachedBooking.bookingId === bookingId) {
    await clearActiveBooking();
  }

  return updatedBooking;
}

export async function rescheduleDoctorBooking(
  bookingId: string,
  slotId: string,
  date: string,
  time: string
): Promise<DoctorBookingResponse> {
  let updatedBooking: DoctorBookingResponse | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/visits/${bookingId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, date, time }),
    });

    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Selected slot is full. Please choose another time.');
    }

    if (res.ok) {
      updatedBooking = (await res.json()) as DoctorBookingResponse;
    }
  } catch (err: any) {
    if (err.message?.includes('full') || err.message?.includes('SLOT_UNAVAILABLE')) {
      throw err;
    }
    // offline fallback
  }

  const visits = await getStorageItem<DoctorBookingResponse[]>(STORAGE_KEYS.VISITS_LIST, DEFAULT_VISITS);
  const updatedList = visits.map((v) => {
    if (v.bookingId === bookingId) {
      const rescheduled: DoctorBookingResponse = {
        ...v,
        slotId,
        date,
        time,
        status: 'confirmed',
      };
      if (!updatedBooking) updatedBooking = rescheduled;
      return rescheduled;
    }
    return v;
  });
  await setStorageItem(STORAGE_KEYS.VISITS_LIST, updatedList);

  if (updatedBooking) {
    await saveActiveBooking(updatedBooking);
    scheduleVisitReminders(updatedBooking).catch(() => {});
    return updatedBooking;
  }

  throw new Error('Failed to reschedule visit');
}

