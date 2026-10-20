import express from 'express';
import type { Request, Response } from 'express';
import { spineRegistry } from './registry.ts';

export interface AssistantRequest {
  message: string;
  currentRoute?: string;
}

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

export const assistantRouter = express.Router();

export function processAssistantMessage(req: AssistantRequest): AssistantResponse {
  const msg = (req.message || '').trim();
  const lower = msg.toLowerCase();

  // 1. Emergency Safety Rule: Immediate Alert & 108 referral
  const emergencyRegex = /\b(?:chest\s*pain|heart\s*attack|unconscious|collapsed|breathless|can'?t\s*breathe|difficulty\s*breathing|bleeding|emergency|108)\b/i;
  if (emergencyRegex.test(lower)) {
    return {
      isEmergency: true,
      reply: 'This sounds like a medical emergency. Call 108 immediately.',
      proposal: null,
      immediateAction: null,
    };
  }

  // 2. OTP / Check-in Privacy & Safety Rule: Strictly refuse
  const otpRegex = /\b(?:otp|check-?in\s*code|consultation\s*code|enter\s*code|approve\s*code|bypass\s*otp|verify\s*otp)\b/i;
  if (otpRegex.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Consultation check-in codes must be entered directly by the patient on the Check-in screen for privacy and consent.',
      proposal: null,
      immediateAction: null,
    };
  }

  // 3. Mutating Intents: MUST return structured Proposal requiring Accept/Dismiss
  if (/\b(?:book|consult|appointment|token)\b/i.test(lower) && /\b(?:dr|doctor|cardio|physician|appointment)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'I prepared an OPD consultation booking proposal for your approval. Tap Accept to confirm or Dismiss to cancel.',
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

  // 4. Read-only Navigation / Lookup Actions
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
      reply: 'Opening your region-aware diet tracker and doctor dietary restrictions.',
      immediateAction: {
        toolName: 'view_diet',
        route: '/features/diet',
        summary: 'Opening region-aware diet tracker',
      },
      proposal: null,
    };
  }

  if (/\b(?:maternal|pregnancy|trimester|vaccine|nis|baby|anc|pmsma)\b/i.test(lower)) {
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
      reply: 'Opening family caregiver access and record viewing audit logs.',
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
      reply: 'Opening active prescriptions, daily dose schedules, and refill status.',
      immediateAction: {
        toolName: 'view_medicines',
        route: '/(tabs)/medicines',
        summary: 'Opening active medicines',
      },
      proposal: null,
    };
  }

  if (/\b(?:cart|checkout|order)\b/i.test(lower)) {
    return {
      isEmergency: false,
      reply: 'Opening medicine refill cart and pharmacy checkout.',
      immediateAction: {
        toolName: 'open_cart',
        route: '/features/cart',
        summary: 'Opening medicine cart',
      },
      proposal: null,
    };
  }

  // General fallback
  return {
    isEmergency: false,
    reply: 'I can help you find doctors, view medical reports, order refills, track region-aware meals, or inspect maternal NIS milestones. What would you like to do?',
    immediateAction: null,
    proposal: null,
  };
}

assistantRouter.post('/', (req: Request, res: Response) => {
  const result = processAssistantMessage(req.body || { message: '' });
  res.json(result);
});
