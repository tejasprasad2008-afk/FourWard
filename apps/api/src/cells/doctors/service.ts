import type {
  DoctorsTriageRequest,
  DoctorsTriageResponse,
  DoctorsFilterQuery,
  DoctorItem,
  DoctorBookingRequest,
  DoctorBookingResponse,
  DoctorSlotsResponse,
  TriageQuestion,
} from '../../../../../packages/contracts/src/doctors.ts';
import { doctorsStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

const TRIAGE_QUESTIONS: TriageQuestion[] = [
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

export class DoctorsService {
  public triageSymptoms(req: DoctorsTriageRequest): DoctorsTriageResponse {
    const input = (req.symptomInput || '').toLowerCase().trim();
    const answers = req.answers || {};

    // 1. Emergency detection
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

    // 2. Department mapping
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

    const answeredCount = Object.keys(answers).length;
    const isComplete = answeredCount >= 2 || (answeredCount >= 1 && answers['duration']);

    return {
      isEmergency: false,
      recommendedDepartment: dept,
      rationale,
      questions: TRIAGE_QUESTIONS,
      isComplete: Boolean(isComplete),
    };
  }

  public getDoctors(filters: DoctorsFilterQuery = {}): DoctorItem[] {
    let list = doctorsStore.getDoctors();

    if (filters.department && filters.department !== 'All') {
      const depQuery = filters.department.toLowerCase();
      list = list.filter((d) => d.department.toLowerCase() === depQuery);
    }

    if (filters.hospital && filters.hospital !== 'All') {
      const hospQuery = filters.hospital.toLowerCase();
      list = list.filter((d) => d.hospitalName.toLowerCase().includes(hospQuery));
    }

    if (filters.locality) {
      const locQuery = filters.locality.toLowerCase();
      list = list.filter((d) => d.locality.toLowerCase().includes(locQuery));
    }

    if (filters.acceptsCard && filters.acceptsCard !== 'none') {
      const card = filters.acceptsCard.toLowerCase();
      list = list.filter((d) => d.acceptedSchemes && d.acceptedSchemes.some((s) => s.toLowerCase() === card));
    }

    if (filters.partnerOnly) {
      list = list.filter((d) => d.isPartner);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.hospitalName.toLowerCase().includes(q) ||
          d.locality.toLowerCase().includes(q)
      );
    }

    // Sort options: soonest, nearest, fee
    if (filters.sort === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    } else if (filters.sort === 'fee') {
      list.sort((a, b) => a.fee - b.fee);
    } else {
      // Default: soonest (partner live queue first, then lowest estimated wait)
      list.sort((a, b) => {
        if (a.isPartner && !b.isPartner) return -1;
        if (!a.isPartner && b.isPartner) return 1;
        return (a.estimatedWaitMinutes || 99) - (b.estimatedWaitMinutes || 99);
      });
    }

    return list;
  }

  public getSlots(doctorId: string, date: string): DoctorSlotsResponse {
    return doctorsStore.getSlots(doctorId, date);
  }

  public bookDoctor(
    req: DoctorBookingRequest,
    actor = req.patientId || 'patient_std_01'
  ): DoctorBookingResponse {
    const doctor = doctorsStore.getDoctorById(req.doctorId);
    if (!doctor) {
      throw new Error(`Doctor with ID ${req.doctorId} not found`);
    }

    const patientId = req.patientId || 'patient_std_01';
    const patientName = req.patientName || 'Tejas';
    const isWalkIn = req.walkIn ?? (!req.slotId && doctor.isPartner);
    const bookingSequence = doctorsStore.getBookings(patientId).length + 1;
    const tokenNumber = isWalkIn ? (doctor.patientsAhead || 4) + bookingSequence * 2 : undefined;
    const estimatedWaitMinutes = isWalkIn ? Math.max(10, (tokenNumber || 5) * 3) : undefined;
    const bookingId = `bk_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
    const status = doctor.isPartner ? 'confirmed' : 'requested';
    const cardAccepted = Boolean(
      req.schemeCard && doctor.acceptedSchemes && doctor.acceptedSchemes.includes(req.schemeCard)
    );

    const response: DoctorBookingResponse = {
      bookingId,
      doctorId: doctor.id,
      status,
      tokenNumber,
      slotId: req.slotId,
      date: req.date || 'Today',
      time: req.time || (isWalkIn ? 'Walk-in OP' : 'Slot Consult'),
      estimatedWaitMinutes,
      doctorName: doctor.name,
      hospitalName: doctor.hospitalName,
      locality: doctor.locality,
      department: doctor.department,
      room: doctor.room,
      patientName,
      patientId,
      fee: doctor.fee,
      cardAccepted,
      bookedAt: new Date().toISOString(),
    };

    // Add booking to store (will throw on double booking)
    doctorsStore.addBooking(patientId, response, doctor.id);

    // Record booking in spine hash-chained audit ledger
    auditLedger.recordEntry({
      action: isWalkIn ? 'DOCTOR_TOKEN_BOOKED' : 'DOCTOR_SLOT_BOOKED',
      patientId,
      visitId: bookingId,
      actor,
      metadata: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        status,
        tokenNumber,
        slotId: req.slotId,
        department: doctor.department,
        hospitalName: doctor.hospitalName,
        cardAccepted,
      },
    });

    return response;
  }

  public getBookings(patientId: string): DoctorBookingResponse[] {
    return doctorsStore.getBookings(patientId);
  }

  public cancelBooking(bookingId: string, patientId?: string, actor?: string): DoctorBookingResponse {
    const booking = doctorsStore.cancelBooking(bookingId, patientId);
    auditLedger.recordEntry({
      action: 'DOCTOR_BOOKING_CANCELLED',
      patientId: booking.patientId || patientId || 'patient_std_01',
      visitId: booking.bookingId,
      actor: actor || patientId || 'patient_std_01',
      metadata: {
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        status: 'cancelled',
      },
    });
    return booking;
  }

  public rescheduleBooking(
    bookingId: string,
    newSlotId: string,
    newDate: string,
    newTime: string,
    patientId?: string,
    actor?: string
  ): DoctorBookingResponse {
    const booking = doctorsStore.rescheduleBooking(bookingId, newSlotId, newDate, newTime, patientId);
    auditLedger.recordEntry({
      action: 'DOCTOR_BOOKING_RESCHEDULED',
      patientId: booking.patientId || patientId || 'patient_std_01',
      visitId: booking.bookingId,
      actor: actor || patientId || 'patient_std_01',
      metadata: {
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        newSlotId,
        newDate,
        newTime,
        status: 'confirmed',
      },
    });
    return booking;
  }
}

export const doctorsService = new DoctorsService();
