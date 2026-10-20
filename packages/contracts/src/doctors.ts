export interface TriageQuestionOption {
  id: string;
  label: string;
}

export interface TriageQuestion {
  id: string;
  question: string;
  options: TriageQuestionOption[];
}

export interface DoctorsTriageRequest {
  symptomInput: string;
  answers?: Record<string, string>;
}

export interface DoctorsTriageResponse {
  isEmergency: boolean;
  emergencyMessage?: string;
  recommendedDepartment?: string;
  rationale?: string;
  questions: TriageQuestion[];
  isComplete: boolean;
}

export interface DoctorItem {
  id: string;
  name: string;
  qualification: string;
  department: string;
  hospitalName: string;
  locality: string;
  fee: number;
  isPartner: boolean;
  room: string;
  inClinic?: boolean;
  nowServingToken?: number;
  patientsAhead?: number;
  estimatedWaitMinutes?: number;
  availableDays: string;
  nextAvailableSlot: string;
  acceptedSchemes?: string[];
  distanceKm?: number;
}

export interface DoctorsFilterQuery {
  department?: string;
  hospital?: string;
  locality?: string;
  search?: string;
  acceptsCard?: string;
  partnerOnly?: boolean;
  sort?: 'soonest' | 'nearest' | 'fee';
}

export type SlotPeriod = 'morning' | 'afternoon' | 'evening';

export interface DoctorSlot {
  id: string;
  time: string;
  period: SlotPeriod;
  isAvailable: boolean;
}

export interface DoctorSlotsResponse {
  doctorId: string;
  date: string;
  slots: DoctorSlot[];
  supportsWalkIn: boolean;
  walkInEstimatedWaitMinutes?: number;
  walkInTokenNumber?: number;
}

export type BookingStatus = 'confirmed' | 'requested' | 'completed' | 'cancelled';

export interface DoctorBookingRequest {
  doctorId: string;
  patientId?: string;
  patientName?: string;
  slotId?: string;
  date?: string;
  time?: string;
  walkIn?: boolean;
  schemeCard?: string;
}

export interface DoctorBookingResponse {
  bookingId: string;
  doctorId: string;
  status: BookingStatus;
  tokenNumber?: number;
  slotId?: string;
  date?: string;
  time?: string;
  estimatedWaitMinutes?: number;
  doctorName: string;
  hospitalName: string;
  locality?: string;
  department: string;
  room?: string;
  patientName?: string;
  patientId?: string;
  fee?: number;
  cardAccepted?: boolean;
  bookedAt: string;
  cancelledAt?: string;
}

export interface RescheduleBookingRequest {
  slotId: string;
  date: string;
  time: string;
}

export function createBookAgainDraft(visit: DoctorBookingResponse): {
  step: number;
  doctorId: string;
  patientId: string;
  patientName: string;
  date: string;
} {
  return {
    step: 3,
    doctorId: visit.doctorId,
    patientId: visit.patientId || 'patient_std_01',
    patientName: visit.patientName || 'Tejas',
    date: 'Today',
  };
}
