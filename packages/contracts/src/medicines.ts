export type MedicineImageType = 'strip' | 'bottle' | 'syrup' | 'inhaler' | 'drops';

export interface PrescriptionItem {
  id: string;
  patientId?: string;
  name: string;
  dosage: string;
  schedule: string;
  daysLeft: number;
  refillUrgent: boolean;
  pricePerStrip: number;
  hospital: string;
  doctor: string;
  instructions: string;
  image?: MedicineImageType;
}

export interface MedicineReminder {
  id: string;
  patientId?: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  time: string;
  mealContext: string;
  enabled: boolean;
  takenToday: boolean;
  isNextDose?: boolean;
  nextDoseTime?: string;
  image?: MedicineImageType;
}

export interface CartItem {
  id: string;
  medicineId: string;
  name: string;
  dosage: string;
  price: number;
  quantity: number;
  details?: string;
  image?: MedicineImageType;
}

export interface MedicinesDataResponse {
  prescriptions: PrescriptionItem[];
  reminders: MedicineReminder[];
  cartItems: CartItem[];
}

export interface ReminderToggleRequest {
  prescriptionId: string;
  enabled?: boolean;
}

export interface CartUpdateRequest {
  medicineId: string;
  quantity: number;
}

export interface CheckoutRequest {
  deliveryMode: 'doorstep' | 'pickup';
  paymentMethod?: 'upi' | 'cod';
  pharmacyName?: string;
  deliveryAddress?: string;
}

export interface CheckoutResponse {
  orderId: string;
  itemsCount: number;
  itemsTotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliveryMode: 'doorstep' | 'pickup';
  pharmacyName: string;
  paymentStatus: 'pending_user_payment' | 'confirmed';
  estimatedDelivery: string;
  orderedAt: string;
}
