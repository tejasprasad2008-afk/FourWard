import type {
  PrescriptionItem,
  MedicineReminder,
  CartItem,
} from '../../../../../packages/contracts/src/medicines.ts';

export class MedicinesStore {
  private prescriptions: PrescriptionItem[] = [
    {
      id: 'med_telmi_40',
      name: 'Telmisartan',
      dosage: '40mg',
      schedule: 'After lunch • 2:00 PM',
      daysLeft: 16,
      refillUrgent: false,
      pricePerStrip: 142.0,
      hospital: 'City Care Hospital',
      doctor: 'Dr. P. V. Ramana Rao',
      instructions: '1 tablet with water after lunch.',
      image: 'strip',
    },
    {
      id: 'med_metformin_500',
      name: 'Metformin',
      dosage: '500mg',
      schedule: 'After dinner • 8:30 PM',
      daysLeft: 4,
      refillUrgent: true,
      pricePerStrip: 68.0,
      hospital: 'Metro General Hospital',
      doctor: 'Dr. Ananya Deshmukh',
      instructions: '1 tablet with food after dinner.',
      image: 'strip',
    },
    {
      id: 'med_atorva_10',
      name: 'Atorvastatin',
      dosage: '10mg',
      schedule: 'Bedtime • 9:30 PM',
      daysLeft: 22,
      refillUrgent: false,
      pricePerStrip: 142.0,
      hospital: 'City Care Hospital',
      doctor: 'Dr. P. V. Ramana Rao',
      instructions: '1 tablet at bedtime.',
      image: 'bottle',
    },
    {
      id: 'med_aspirin_75',
      name: 'Ecosprin (Aspirin)',
      dosage: '75mg',
      schedule: 'Morning • 9:00 AM',
      daysLeft: 3,
      refillUrgent: true,
      pricePerStrip: 32.0,
      hospital: 'City Care Hospital',
      doctor: 'Dr. P. V. Ramana Rao',
      instructions: '1 tablet post breakfast.',
      image: 'strip',
    },
  ];

  private reminders: MedicineReminder[] = [
    {
      id: 'rem_telmi',
      prescriptionId: 'med_telmi_40',
      medicineName: 'Telmisartan 40mg',
      dosage: '40mg',
      time: '2:00 PM',
      mealContext: 'After lunch',
      enabled: true,
      takenToday: false,
      isNextDose: true,
      nextDoseTime: '2:00 PM',
    },
    {
      id: 'rem_metformin',
      prescriptionId: 'med_metformin_500',
      medicineName: 'Metformin 500mg',
      dosage: '500mg',
      time: '8:30 PM',
      mealContext: 'After dinner',
      enabled: true,
      takenToday: false,
      isNextDose: false,
      nextDoseTime: '8:30 PM',
    },
    {
      id: 'rem_atorva',
      prescriptionId: 'med_atorva_10',
      medicineName: 'Atorvastatin 10mg',
      dosage: '10mg',
      time: '9:30 PM',
      mealContext: 'Bedtime',
      enabled: true,
      takenToday: false,
      isNextDose: false,
      nextDoseTime: '9:30 PM',
    },
    {
      id: 'rem_aspirin',
      prescriptionId: 'med_aspirin_75',
      medicineName: 'Ecosprin 75mg',
      dosage: '75mg',
      time: '9:00 AM',
      mealContext: 'Morning',
      enabled: false,
      takenToday: true,
      isNextDose: false,
      nextDoseTime: 'Tomorrow 9:00 AM',
    },
  ];

  private cartItems: CartItem[] = [
    {
      id: 'cart_1',
      medicineId: 'med_atorva_10',
      name: 'Atorvastatin 10mg (10 Tablets)',
      dosage: '10 Tablets',
      price: 142.0,
      quantity: 1,
      details: 'Batch: AT-2026-90 • Exp: 09/2028',
    },
    {
      id: 'cart_2',
      medicineId: 'med_telmi_40',
      name: 'Telmisartan 40mg (15 Tablets)',
      dosage: '15 Tablets',
      price: 142.0,
      quantity: 1,
      details: 'Batch: TL-2026-44 • Exp: 11/2028',
    },
  ];

  public getPrescriptions(): PrescriptionItem[] {
    return [...this.prescriptions];
  }

  public getPrescriptionById(id: string): PrescriptionItem | undefined {
    return this.prescriptions.find((p) => p.id === id);
  }

  public getReminders(): MedicineReminder[] {
    return [...this.reminders];
  }

  public toggleReminder(prescriptionId: string, enabled?: boolean): MedicineReminder {
    let reminder = this.reminders.find((r) => r.prescriptionId === prescriptionId || r.id === prescriptionId);
    if (!reminder) {
      // Find prescription and create new reminder if not present
      const prescription = this.prescriptions.find((p) => p.id === prescriptionId);
      if (!prescription) {
        throw new Error(`Prescription ${prescriptionId} not found`);
      }
      reminder = {
        id: `rem_${prescription.id}`,
        prescriptionId: prescription.id,
        medicineName: `${prescription.name} ${prescription.dosage}`,
        dosage: prescription.dosage,
        time: '8:00 AM',
        mealContext: 'After meal',
        enabled: true,
        takenToday: false,
      };
      this.reminders.push(reminder);
      return { ...reminder };
    }

    reminder.enabled = enabled !== undefined ? enabled : !reminder.enabled;
    return { ...reminder };
  }

  public markDoseTaken(reminderId: string, taken: boolean = true): MedicineReminder {
    const reminder = this.reminders.find((r) => r.id === reminderId || r.prescriptionId === reminderId);
    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }
    reminder.takenToday = taken;
    return { ...reminder };
  }

  public getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  public updateCartItem(medicineId: string, quantity: number): CartItem[] {
    const existingIndex = this.cartItems.findIndex((c) => c.medicineId === medicineId || c.id === medicineId);

    if (quantity <= 0) {
      if (existingIndex >= 0) {
        this.cartItems.splice(existingIndex, 1);
      }
      return [...this.cartItems];
    }

    if (existingIndex >= 0) {
      this.cartItems[existingIndex].quantity = quantity;
    } else {
      // Look up prescription for defaults
      const med = this.prescriptions.find((p) => p.id === medicineId);
      const name = med ? `${med.name} ${med.dosage}` : 'Medicine Strip';
      const price = med ? med.pricePerStrip : 142.0;
      const dosage = med ? med.dosage : '10 Tablets';

      this.cartItems.push({
        id: `cart_${Date.now()}`,
        medicineId,
        name,
        dosage,
        price,
        quantity,
        details: 'Refill Pack • Standard Strip',
      });
    }

    return [...this.cartItems];
  }

  public clearCart(): void {
    this.cartItems = [];
  }
}

export const medicinesStore = new MedicinesStore();
