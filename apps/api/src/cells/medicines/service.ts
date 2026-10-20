import type {
  MedicinesDataResponse,
  MedicineReminder,
  CartItem,
  CheckoutRequest,
  CheckoutResponse,
} from '../../../../../packages/contracts/src/medicines.ts';
import { medicinesStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

export class MedicinesService {
  public getMedicinesData(): MedicinesDataResponse {
    return {
      prescriptions: medicinesStore.getPrescriptions(),
      reminders: medicinesStore.getReminders(),
      cartItems: medicinesStore.getCartItems(),
    };
  }

  public toggleReminder(
    prescriptionId: string,
    enabled?: boolean,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { reminder: MedicineReminder; reminders: MedicineReminder[] } {
    const updated = medicinesStore.toggleReminder(prescriptionId, enabled);

    auditLedger.recordEntry({
      action: 'MEDICINE_REMINDER_TOGGLED',
      patientId,
      visitId: prescriptionId,
      actor,
      metadata: {
        prescriptionId,
        medicineName: updated.medicineName,
        enabled: updated.enabled,
      },
    });

    return {
      reminder: updated,
      reminders: medicinesStore.getReminders(),
    };
  }

  public markDoseTaken(
    reminderId: string,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { reminder: MedicineReminder; reminders: MedicineReminder[] } {
    const updated = medicinesStore.markDoseTaken(reminderId, true);

    auditLedger.recordEntry({
      action: 'MEDICINE_DOSE_TAKEN',
      patientId,
      visitId: reminderId,
      actor,
      metadata: {
        reminderId,
        medicineName: updated.medicineName,
        takenToday: true,
      },
    });

    return {
      reminder: updated,
      reminders: medicinesStore.getReminders(),
    };
  }

  public updateCart(
    medicineId: string,
    quantity: number,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { cartItems: CartItem[]; total: number } {
    const items = medicinesStore.updateCartItem(medicineId, quantity);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    auditLedger.recordEntry({
      action: 'CART_UPDATED',
      patientId,
      visitId: medicineId,
      actor,
      metadata: {
        medicineId,
        quantity,
        cartCount: items.length,
        cartTotal: total,
      },
    });

    return { cartItems: items, total };
  }

  public checkout(
    req: CheckoutRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): CheckoutResponse {
    const currentCart = medicinesStore.getCartItems();
    if (currentCart.length === 0) {
      throw new Error('Cart is empty. Add medicines before checkout.');
    }

    const itemsTotal = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = req.deliveryMode === 'doorstep' ? 30.0 : 0.0;
    const grandTotal = itemsTotal + deliveryFee;
    const orderNumber = Math.floor(Math.random() * 900 + 100);
    const orderId = `FW-${orderNumber}`;
    const pharmacyName = req.pharmacyName || 'City Care Pharmacy';

    const response: CheckoutResponse = {
      orderId,
      itemsCount: currentCart.reduce((sum, item) => sum + item.quantity, 0),
      itemsTotal,
      deliveryFee,
      grandTotal,
      deliveryMode: req.deliveryMode,
      pharmacyName,
      paymentStatus: 'pending_user_payment',
      estimatedDelivery: req.deliveryMode === 'doorstep' ? 'Arriving by 6:30 PM' : 'Ready for pickup in 20 mins',
      orderedAt: new Date().toISOString(),
    };

    // Record order in Spine append-only hash-chained audit ledger
    auditLedger.recordEntry({
      action: 'MEDICINE_ORDER_CREATED',
      patientId,
      visitId: orderId,
      actor,
      metadata: {
        orderId,
        itemsCount: response.itemsCount,
        grandTotal,
        deliveryMode: req.deliveryMode,
        pharmacyName,
        paymentStatus: response.paymentStatus,
      },
    });

    // Clear cart upon checkout
    medicinesStore.clearCart();

    return response;
  }
}

export const medicinesService = new MedicinesService();
