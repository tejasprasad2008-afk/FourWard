import type {
  DoctorItem,
  DoctorBookingResponse,
  DoctorSlot,
  DoctorSlotsResponse,
} from '../../../../../packages/contracts/src/doctors.ts';

class DoctorsStore {
  private doctors: DoctorItem[] = [
    {
      id: 'doc_cardio_01',
      name: 'Dr. P. V. Ramana Rao',
      qualification: 'MD, DM (Cardiology)',
      department: 'Cardiology',
      hospitalName: 'City Care Hospital',
      locality: 'Jubilee Hills, Hyderabad',
      fee: 500,
      isPartner: true,
      inClinic: true,
      nowServingToken: 14,
      room: 'Room 204',
      patientsAhead: 9,
      estimatedWaitMinutes: 35,
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today · about 35 min',
      acceptedSchemes: ['aarogyasri', 'pmjay', 'cghs'],
      distanceKm: 2.4,
    },
    {
      id: 'doc_genmed_02',
      name: 'Dr. K. Srinivas',
      qualification: 'MBBS, MD (General Medicine)',
      department: 'Internal Medicine',
      hospitalName: 'Deccan Health Institute',
      locality: 'Gachibowli, Hyderabad',
      fee: 450,
      isPartner: true,
      inClinic: true,
      nowServingToken: 21,
      room: 'Room 102',
      patientsAhead: 4,
      estimatedWaitMinutes: 14,
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today · about 14 min',
      acceptedSchemes: ['aarogyasri', 'pmjay'],
      distanceKm: 3.8,
    },
    {
      id: 'doc_pedia_03',
      name: 'Dr. Ananya Reddy',
      qualification: 'MD (Pediatrics), DNB',
      department: 'Pediatrics',
      hospitalName: 'Sunrise Child Clinic',
      locality: 'Banjara Hills, Hyderabad',
      fee: 400,
      isPartner: true,
      inClinic: true,
      nowServingToken: 8,
      room: 'Room 305',
      patientsAhead: 6,
      estimatedWaitMinutes: 22,
      availableDays: 'Mon - Fri',
      nextAvailableSlot: 'Today · about 22 min',
      acceptedSchemes: ['pmjay'],
      distanceKm: 5.2,
    },
    {
      id: 'doc_gynec_04',
      name: 'Dr. Sunita Kulkarni',
      qualification: 'MS (OBG), DGO',
      department: 'Gynecology',
      hospitalName: 'Starlight Maternity Clinic',
      locality: 'Bogulkunta, Hyderabad',
      fee: 550,
      isPartner: true,
      inClinic: true,
      nowServingToken: 11,
      room: 'Room 108',
      patientsAhead: 7,
      estimatedWaitMinutes: 28,
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today · about 28 min',
      acceptedSchemes: ['aarogyasri'],
      distanceKm: 6.7,
    },
    {
      id: 'doc_ortho_05',
      name: 'Dr. G. Rajeshwar Rao',
      qualification: 'MS (Orthopedics), M.Ch',
      department: 'Orthopedics',
      hospitalName: 'Apex Bone & Joint Clinic',
      locality: 'Secunderabad',
      fee: 500,
      isPartner: true,
      inClinic: false,
      room: 'Room 214',
      patientsAhead: 3,
      estimatedWaitMinutes: 12,
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today · about 12 min',
      acceptedSchemes: ['aarogyasri', 'pmjay'],
      distanceKm: 8.1,
    },
    {
      id: 'doc_ent_06',
      name: 'Dr. Mohd. Arif Pasha',
      qualification: 'MS (ENT), DLO',
      department: 'ENT',
      hospitalName: 'Metro Speciality Hospital',
      locality: 'Somajiguda, Hyderabad',
      fee: 450,
      isPartner: true,
      inClinic: true,
      nowServingToken: 6,
      room: 'Room 115',
      patientsAhead: 5,
      estimatedWaitMinutes: 18,
      availableDays: 'Mon - Sat',
      nextAvailableSlot: 'Today · about 18 min',
      acceptedSchemes: ['aarogyasri', 'cghs'],
      distanceKm: 4.9,
    },
    {
      id: 'doc_cardio_spec_07',
      name: 'Dr. Meenakshi Sundaram',
      qualification: 'FRCS, M.Ch (Cardio-Thoracic)',
      department: 'Cardiology',
      hospitalName: 'Central Heart Institute',
      locality: 'Greams Road, Chennai',
      fee: 800,
      isPartner: false,
      inClinic: false,
      room: 'Consult Desk 2',
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      availableDays: 'Tue, Thu, Sat',
      nextAvailableSlot: 'Request a slot',
      acceptedSchemes: [],
      distanceKm: 14.5,
    },
    {
      id: 'doc_aiims_08',
      name: 'Dr. Vikramaditya Sen',
      qualification: 'MD (AIIMS), FACP',
      department: 'Internal Medicine',
      hospitalName: 'National Health Institute OPD',
      locality: 'Ansari Nagar, New Delhi',
      fee: 750,
      isPartner: false,
      room: 'Consult Desk 4',
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      availableDays: 'Mon, Wed, Fri',
      nextAvailableSlot: 'Request a slot',
      acceptedSchemes: ['cghs'],
      distanceKm: 22.0,
    },
  ];

  private bookings: Map<string, DoctorBookingResponse[]> = new Map();

  constructor() {
    // Seed initial visits for patient_std_01
    this.bookings.set('patient_std_01', [
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
    ]);

    this.bookings.set('person_arjun', [
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
    ]);
  }

  public getDoctors(): DoctorItem[] {
    return [...this.doctors];
  }

  public getDoctorById(id: string): DoctorItem | undefined {
    return this.doctors.find((d) => d.id === id);
  }

  public getSlots(doctorId: string, date: string): DoctorSlotsResponse {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found`);
    }

    // If date is Sunday or special empty test date, return empty slots
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || date === '2026-10-25' || date.endsWith('-empty')) {
      return {
        doctorId,
        date,
        slots: [],
        supportsWalkIn: false,
      };
    }

    // Deduplicated, clean slots by period
    const slots: DoctorSlot[] = [
      // Morning
      { id: `${doctorId}_${date}_0900`, time: '09:00 AM', period: 'morning', isAvailable: true },
      { id: `${doctorId}_${date}_0930`, time: '09:30 AM', period: 'morning', isAvailable: true },
      { id: `${doctorId}_${date}_1030`, time: '10:30 AM', period: 'morning', isAvailable: false }, // marked Full
      { id: `${doctorId}_${date}_1130`, time: '11:30 AM', period: 'morning', isAvailable: true },
      // Afternoon
      { id: `${doctorId}_${date}_1330`, time: '01:30 PM', period: 'afternoon', isAvailable: true },
      { id: `${doctorId}_${date}_1430`, time: '02:30 PM', period: 'afternoon', isAvailable: false }, // marked Full
      { id: `${doctorId}_${date}_1530`, time: '03:30 PM', period: 'afternoon', isAvailable: true },
      // Evening
      { id: `${doctorId}_${date}_1700`, time: '05:00 PM', period: 'evening', isAvailable: true },
      { id: `${doctorId}_${date}_1800`, time: '06:00 PM', period: 'evening', isAvailable: true },
    ];

    return {
      doctorId,
      date,
      slots,
      supportsWalkIn: doctor.isPartner,
      walkInEstimatedWaitMinutes: doctor.isPartner ? (doctor.estimatedWaitMinutes || 35) : undefined,
      walkInTokenNumber: doctor.isPartner ? (doctor.patientsAhead || 4) + 10 : undefined,
    };
  }

  public addBooking(patientId: string, booking: DoctorBookingResponse, doctorId: string): void {
    const list = this.bookings.get(patientId) || [];

    // Check for double booking: same patient with same doctor (only active bookings)
    const existing = list.find((b) => {
      return (
        (b.doctorId === doctorId || b.doctorName === booking.doctorName) &&
        b.status !== 'cancelled' &&
        b.status !== 'completed'
      );
    });

    if (existing) {
      const err = new Error('Double booking rejected: patient already has an active booking for this doctor.');
      (err as any).code = 'DOUBLE_BOOKING';
      throw err;
    }

    list.unshift({ ...booking, doctorId });
    this.bookings.set(patientId, list);
  }

  public getBookings(patientId: string): DoctorBookingResponse[] {
    return this.bookings.get(patientId) || [];
  }

  public getBookingById(bookingId: string): { booking: DoctorBookingResponse; patientId: string } | undefined {
    for (const [pId, list] of this.bookings.entries()) {
      const found = list.find((b) => b.bookingId === bookingId);
      if (found) {
        return { booking: found, patientId: pId };
      }
    }
    return undefined;
  }

  public cancelBooking(bookingId: string, patientId?: string): DoctorBookingResponse {
    const record = this.getBookingById(bookingId);
    if (!record) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    record.booking.status = 'cancelled';
    record.booking.cancelledAt = new Date().toISOString();
    return record.booking;
  }

  public rescheduleBooking(
    bookingId: string,
    newSlotId: string,
    newDate: string,
    newTime: string,
    patientId?: string
  ): DoctorBookingResponse {
    const record = this.getBookingById(bookingId);
    if (!record) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    // Verify slot availability
    const slotsResponse = this.getSlots(record.booking.doctorId, newDate);
    const targetSlot = slotsResponse.slots.find((s) => s.id === newSlotId);
    if (targetSlot && !targetSlot.isAvailable) {
      const err = new Error('Selected slot is full. Please choose another time.');
      (err as any).code = 'SLOT_UNAVAILABLE';
      throw err;
    }

    record.booking.slotId = newSlotId;
    record.booking.date = newDate;
    record.booking.time = newTime;
    record.booking.status = 'confirmed';
    return record.booking;
  }

  public clearBookings(): void {
    this.bookings.clear();
  }
}

export const doctorsStore = new DoctorsStore();
