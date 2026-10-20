import { addMealCalories } from './dietService.ts';
import { submitDoctorBooking } from './triageService.ts';
import { syncChecklistWithBookings } from './recordsService.ts';
import { addToCart } from './cartService.ts';
import { toggleReminder } from './remindersService.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface AssistantImmediateAction {
  toolName: string;
  route: string;
  summary: string;
}

export interface AssistantProposal {
  id: string;
  toolName: string;
  title: string;
  summary: string;
  args: Record<string, any>;
  targetRoute: string;
}

export interface AssistantResponse {
  isEmergency: boolean;
  reply: string;
  immediateAction?: AssistantImmediateAction | null;
  proposal?: AssistantProposal | null;
}

export async function executeAssistantAction(
  toolName: string,
  args: Record<string, any> = {}
): Promise<{ success: boolean; result: any; receipt: string }> {
  if (toolName === 'log_meal') {
    const cals = args.calories || 520;
    const mealName = args.mealName || 'Lunch';
    const updatedDiet = await addMealCalories(cals, mealName);
    return {
      success: true,
      result: updatedDiet,
      receipt: `Logged ${mealName} (${cals} kcal) to daily nutrition plan.`,
    };
  }

  if (toolName === 'book_appointment') {
    const booking = await submitDoctorBooking(
      args.doctorId || 'doc_cardio_01',
      args.doctorName || 'Dr. P. V. Ramana Rao',
      args.hospitalName || 'City Care Hospital',
      args.department || 'Cardiology',
      args.room || 'Room 204',
      args.patientId || 'patient_std_01',
      args.patientName || 'Patient',
      args.slotId || 'slot_cardio_today_1630',
      args.date || 'Today',
      args.time || '4:30 PM'
    );
    const checklist = await syncChecklistWithBookings();
    return {
      success: true,
      result: { booking, checklist },
      receipt: `Confirmed appointment with Dr. ${booking.doctorName} for ${booking.patientName} (${booking.date} · ${booking.time}). Carry checklist updated.`,
    };
  }

  if (toolName === 'add_to_cart') {
    const cart = await addToCart({
      id: args.medicineId || 'med-2',
      name: args.name || 'Metformin 500mg (10 Tablets)',
      price: args.price || 68.0,
      details: 'Refill Pack • City Care Pharmacy',
    });
    return {
      success: true,
      result: cart,
      receipt: `Added ${args.name || 'Metformin 500mg'} to cart.`,
    };
  }

  if (toolName === 'set_reminder') {
    const rem = await toggleReminder(args.prescriptionId || 'rem-1');
    return {
      success: true,
      result: rem,
      receipt: 'Dose reminder updated.',
    };
  }

  return {
    success: false,
    result: null,
    receipt: 'Unknown action.',
  };
}

export async function sendAssistantMessage(
  message: string,
  currentRoute?: string
): Promise<AssistantResponse> {
  const msg = message.trim();
  const lower = msg.toLowerCase();

  // Local safety rule check in case of network issues
  const emergencyRegex = /\b(?:chest\s*pain|heart\s*attack|unconscious|collapsed|breathless|can'?t\s*breathe|difficulty\s*breathing|bleeding|emergency|108)\b/i;
  if (emergencyRegex.test(lower)) {
    return {
      isEmergency: true,
      reply: 'This sounds like a medical emergency. Call 108 immediately.',
      proposal: null,
      immediateAction: null,
    };
  }

  const otpRegex = /\b(?:otp|check-?in\s*code|consultation\s*code|enter\s*code|approve\s*code|bypass\s*otp|verify\s*otp)\b/i;
  if (otpRegex.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Consultation check-in codes must be entered directly by the patient on the Check-in screen for privacy and consent.',
      proposal: null,
      immediateAction: null,
    };
  }

  // Attempt sync with backend Spine assistant
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE_URL}/spine/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, currentRoute }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return (await res.json()) as AssistantResponse;
    }
  } catch {
    // API offline - fallback to local rules
  }

  // Fallback local proposals
  if (/\b(?:book|consult|appointment|token)\b/i.test(lower) && /\b(?:dr|doctor|cardio|physician|appointment)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'I prepared an OPD consultation booking proposal. Tap Accept to confirm or Dismiss to cancel.',
      immediateAction: null,
      proposal: {
        id: `prop_book_${Date.now()}`,
        toolName: 'book_appointment',
        title: 'Book OPD Token with Dr. P. V. Ramana Rao',
        summary: 'Cardiology Room 204 at City Care Hospital (Fee ₹450 • Estimated wait 35 min)',
        args: { doctorId: 'doc_cardio_01' },
        targetRoute: '/(tabs)/doctors',
      },
    };
  }

  if (/\b(?:order|refill|buy|add\s*to\s*cart)\b/i.test(lower) && /\b(?:medicine|med|metformin|telmisartan|strip|pill)\b/i.test(lower)) {
    const isMetformin = /metformin/i.test(lower);
    const medName = isMetformin ? 'Metformin 500mg' : 'Telmisartan 40mg';
    const medId = isMetformin ? 'med_metformin_500' : 'med_telmi_40';
    const price = isMetformin ? 68 : 142;

    return {
      isEmergency: false,
      reply: 'I prepared a medicine cart refill proposal. Tap Accept to proceed to checkout or Dismiss to cancel.',
      immediateAction: null,
      proposal: {
        id: `prop_refill_${Date.now()}`,
        toolName: 'add_to_cart',
        title: `Add ${medName} to Cart`,
        summary: `${medName} (1 strip, 10 tablets • ₹${price}) from City Care Pharmacy`,
        args: { medicineId: medId, quantity: 1 },
        targetRoute: '/features/cart',
      },
    };
  }

  if (/\b(?:reminder|alarm|dose\s*alert|set\s*reminder)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'I prepared a dose reminder proposal. Tap Accept to enable or Dismiss to cancel.',
      immediateAction: null,
      proposal: {
        id: `prop_rem_${Date.now()}`,
        toolName: 'set_reminder',
        title: 'Enable Daily Dose Reminder',
        summary: 'Daily 2:00 PM dose reminder for Telmisartan 40mg after lunch',
        args: { prescriptionId: 'med_telmi_40', enabled: true },
        targetRoute: '/(tabs)/medicines',
      },
    };
  }

  if (/\b(?:log\s*meal|log\s*lunch|log\s*breakfast|log\s*dinner|ate\s*lunch)\b/i.test(lower)) {
    const isBreakfast = /breakfast/i.test(lower);
    const isDinner = /dinner/i.test(lower);
    const mealName = isBreakfast ? 'Breakfast' : isDinner ? 'Dinner' : 'Lunch';
    const cals = isBreakfast ? 340 : isDinner ? 470 : 520;

    return {
      isEmergency: false,
      reply: `I prepared a proposal to log your ${mealName}. Tap Accept to record calories or Dismiss to cancel.`,
      immediateAction: null,
      proposal: {
        id: `prop_meal_${Date.now()}`,
        toolName: 'log_meal',
        title: `Log ${mealName} (${cals} kcal)`,
        summary: `Mark ${mealName} as consumed in your region-tailored meal plan`,
        args: { mealName },
        targetRoute: '/features/diet',
      },
    };
  }

  if (/\b(?:record|records|report|reports|echo|ecg|blood\s*test|lipid|scan|lab)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening your medical documents, lab reports, and visit checklist.',
      immediateAction: {
        toolName: 'open_document',
        route: '/(tabs)/records',
        summary: 'Opening medical documents & reports',
      },
      proposal: null,
    };
  }

  if (/\b(?:doctor|doctors|dr|cardiologist|pediatric|opd|specialist)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening the doctor directory and OPD token status.',
      immediateAction: {
        toolName: 'search_doctors',
        route: '/(tabs)/doctors',
        summary: 'Opening doctor directory',
      },
      proposal: null,
    };
  }

  if (/\b(?:diet|nutrition|food|calories|sodium|jowar|ragi|meal)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening your region-aware diet tracker.',
      immediateAction: {
        toolName: 'view_diet',
        route: '/features/diet',
        summary: 'Opening region-aware diet tracker',
      },
      proposal: null,
    };
  }

  if (/\b(?:maternal|pregnancy|trimester|vaccine|nis|baby|anc)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening maternal care, ANC schedule, and NIS immunization milestones.',
      immediateAction: {
        toolName: 'maternal_care',
        route: '/features/maternal',
        summary: 'Opening maternal care milestones',
      },
      proposal: null,
    };
  }

  if (/\b(?:family|caregiver|member|grant\s*access|revoke)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening family caregiver access permissions.',
      immediateAction: {
        toolName: 'family_access',
        route: '/features/family',
        summary: 'Opening family access permissions',
      },
      proposal: null,
    };
  }

  if (/\b(?:medicine|medicines|prescription|dose|pills)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening active prescriptions and dose schedules.',
      immediateAction: {
        toolName: 'view_medicines',
        route: '/(tabs)/medicines',
        summary: 'Opening active medicines',
      },
      proposal: null,
    };
  }

  return {
    isEmergency: false,
    reply: 'I can help you find doctors, view medical reports, order refills, track region-aware meals, or inspect maternal NIS milestones. What would you like to do?',
    immediateAction: null,
    proposal: null,
  };
}
