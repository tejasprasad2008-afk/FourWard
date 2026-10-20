import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';
import type {
  MaternalDataResponse,
  MaternalMilestone,
  PhysicalDocumentCheck,
} from '../../../../packages/contracts/src/maternal';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const DEFAULT_MATERNAL_DATA: MaternalDataResponse = {
  stage: 'Week 26 • Second Trimester',
  gestationalWeeks: 26,
  trimesterAlert: 'Glucose Challenge Test recommended between Weeks 24-28.',
  pmsmaBanner: 'Free clinic check-up on the 9th of every month',
  milestones: [
    {
      id: 'mil_td1',
      name: 'Tetanus & Diphtheria (Td-1)',
      category: 'trimester_1',
      scheduleWindow: 'Early pregnancy / Week 12',
      hospitalCounter: 'City Care Hospital • Immunization OPD',
      completed: true,
      dueDate: '14 Aug 2026',
      notes: 'Administered in left deltoid.',
    },
    {
      id: 'mil_scan_anomaly',
      name: 'Anomaly Ultrasound Scan',
      category: 'trimester_2',
      scheduleWindow: 'Weeks 18-20',
      hospitalCounter: 'Metro Diagnostic Center',
      completed: true,
      dueDate: '22 Sep 2026',
      notes: 'Fetal anatomy normal. Hard copy report archived.',
    },
    {
      id: 'mil_td2',
      name: 'Tetanus & Diphtheria (Td-2)',
      category: 'trimester_2',
      scheduleWindow: '4 weeks after Td-1 (Week 26-28)',
      hospitalCounter: 'City Care Hospital • Immunization OPD',
      completed: false,
      dueDate: '24 Oct 2026',
      notes: 'Second dose essential for maternal-neonatal immunity.',
    },
    {
      id: 'mil_gtt',
      name: 'Oral Glucose Tolerance Test (OGTT)',
      category: 'trimester_2',
      scheduleWindow: 'Weeks 24-28 screening',
      hospitalCounter: 'Sunrise Diagnostic Labs',
      completed: false,
      dueDate: '28 Oct 2026',
      notes: 'Fasting + 2hr post 75g glucose drink.',
    },
    {
      id: 'mil_growth_scan',
      name: 'Third Trimester Growth Doppler Scan',
      category: 'trimester_3',
      scheduleWindow: 'Weeks 32-34',
      hospitalCounter: 'City Care Hospital • Radiology',
      completed: false,
      dueDate: '28 Nov 2026',
      notes: 'Evaluates fetal growth velocity and amniotic fluid index.',
    },
    {
      id: 'mil_bcg',
      name: 'BCG (Bacillus Calmette-Guérin)',
      category: 'newborn',
      scheduleWindow: 'At birth / within first 48 hours',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: 'Single dose intradermal for tuberculosis protection.',
    },
    {
      id: 'mil_opv0',
      name: 'Oral Polio Vaccine (OPV-0)',
      category: 'newborn',
      scheduleWindow: 'At birth',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: '2 oral drops.',
    },
    {
      id: 'mil_hepb',
      name: 'Hepatitis B (Birth Dose)',
      category: 'newborn',
      scheduleWindow: 'Within 24 hours of birth',
      hospitalCounter: 'Maternity Ward Delivery Suite',
      completed: false,
      dueDate: 'At delivery',
      notes: 'Intramuscular dose for perinatal protection.',
    },
  ],
  physicalDocuments: [
    {
      id: 'doc_mcp_yellow',
      title: 'Mother & Child Protection (MCP) Yellow Card',
      subtitle: 'Original paper booklet issued by PHC / Hospital. Required at every visit.',
      hasPhysicalCopy: true,
    },
    {
      id: 'doc_usg_printout',
      title: 'Anomaly Scan Printout (Thermal sheets)',
      subtitle: 'Required by obstetrician for comparative growth evaluation.',
      hasPhysicalCopy: true,
    },
  ],
};

let cachedMaternal: MaternalDataResponse = DEFAULT_MATERNAL_DATA;
let isLoaded = false;

export async function fetchMaternalData(): Promise<MaternalDataResponse> {
  if (!isLoaded) {
    const stored = await getStorageItem<MaternalDataResponse>(
      STORAGE_KEYS.MATERNAL,
      DEFAULT_MATERNAL_DATA
    );
    cachedMaternal = stored;
    isLoaded = true;
  }

  // Sync with API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/maternal`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiData = (await res.json()) as MaternalDataResponse;
      cachedMaternal = apiData;
      await setStorageItem(STORAGE_KEYS.MATERNAL, apiData);
      return apiData;
    }
  } catch {
    // API offline
  }

  return cachedMaternal;
}

export async function toggleVaccineMilestone(
  milestoneId: string
): Promise<MaternalDataResponse> {
  const milestones = [...cachedMaternal.milestones];
  const item = milestones.find((m) => m.id === milestoneId);
  if (item) {
    item.completed = !item.completed;
  }

  cachedMaternal = {
    ...cachedMaternal,
    milestones,
  };

  await setStorageItem(STORAGE_KEYS.MATERNAL, cachedMaternal);

  // Sync to API
  fetch(`${API_BASE_URL}/maternal/toggle-vaccine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ milestoneId, completed: item ? item.completed : true }),
  }).catch(() => {});

  return cachedMaternal;
}
