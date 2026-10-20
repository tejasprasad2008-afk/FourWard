import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage.ts';
import type {
  RecordFolder,
  MedicalDocument,
  VisitChecklistItem,
  RecordsDataResponse,
  RecordUploadRequest,
} from '../../../../packages/contracts/src/records.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const DEFAULT_FOLDERS: RecordFolder[] = [
  { id: 'fld_cardio', name: 'Cardiology', documentCount: 2, latestDate: '12 Oct 2026' },
  { id: 'fld_general', name: 'General & Lab', documentCount: 2, latestDate: '08 Oct 2026' },
  { id: 'fld_imaging', name: 'Imaging & Scans', documentCount: 1, latestDate: '28 Sep 2026' },
  { id: 'fld_discharge', name: 'Discharge & Summary', documentCount: 1, latestDate: '14 Aug 2026' },
];

export const DEFAULT_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc_cardio_echo',
    patientId: 'patient_std_01',
    title: 'Cardiac 2D Echo & Doppler',
    problemFolder: 'Cardiology',
    hospitalName: 'City Care Hospital',
    date: '12 Oct 2026',
    isLatest: true,
    summaryMetrics: 'EF: 58% • Stable',
    requiresHardCopy: true,
    summary: 'Normal left ventricular systolic function. Mild mitral regurgitation noted without structural wall motion abnormality.',
    keyFindings: {
      'Ejection Fraction': '58% (Normal: 55-70%)',
      'Mitral Valve': 'Mild regurgitation',
      'Aortic Root': '3.1 cm (Normal)',
    },
    doctorName: 'Dr. P. V. Ramana Rao',
  },
  {
    id: 'doc_cardio_ecg',
    patientId: 'patient_std_01',
    title: '12-Lead Resting ECG',
    problemFolder: 'Cardiology',
    hospitalName: 'City Care Hospital',
    date: '22 Sep 2026',
    isLatest: false,
    summaryMetrics: 'Sinus Rhythm • 72 bpm',
    requiresHardCopy: true,
    summary: 'Normal sinus rhythm, normal axis, no acute ST-T changes.',
    keyFindings: {
      'Heart Rate': '72 bpm',
      'PR Interval': '158 ms',
      'QRS Duration': '88 ms',
    },
    doctorName: 'Dr. P. V. Ramana Rao',
  },
  {
    id: 'doc_lab_lipid',
    patientId: 'patient_std_01',
    title: 'Fasting Lipid Profile',
    problemFolder: 'General & Lab',
    hospitalName: 'Metro Diagnostic Center',
    date: '08 Oct 2026',
    isLatest: true,
    summaryMetrics: 'LDL: 118 mg/dL • Improving',
    requiresHardCopy: false,
    summary: 'Serum lipid levels measured after 12-hour fast. Significant improvement compared to July baseline.',
    keyFindings: {
      'Total Cholesterol': '184 mg/dL (< 200)',
      'LDL Cholesterol': '118 mg/dL (Target < 100)',
      'HDL Cholesterol': '44 mg/dL (> 40)',
      'Triglycerides': '146 mg/dL (< 150)',
    },
    doctorName: 'Dr. Ananya Deshmukh',
  },
  {
    id: 'doc_lab_cbc',
    patientId: 'patient_std_01',
    title: 'Complete Blood Count & HbA1c',
    problemFolder: 'General & Lab',
    hospitalName: 'Sunrise Diagnostic Labs',
    date: '18 Sep 2026',
    isLatest: true,
    summaryMetrics: 'HbA1c: 6.8% • Controlled',
    requiresHardCopy: false,
    summary: 'Haemoglobin within standard limits. Glycemic control stable under current oral medication.',
    keyFindings: {
      'Haemoglobin': '13.8 g/dL (13.0-17.0)',
      'HbA1c': '6.8% (Target < 7.0%)',
      'Platelets': '240,000 /mcL',
    },
    doctorName: 'Dr. Ananya Deshmukh',
  },
  {
    id: 'doc_scan_chest',
    patientId: 'patient_std_01',
    title: 'Chest X-Ray PA View',
    problemFolder: 'Imaging & Scans',
    hospitalName: 'City Care Hospital',
    date: '28 Sep 2026',
    isLatest: true,
    summaryMetrics: 'Clear Lung Fields • Normal',
    requiresHardCopy: false,
    summary: 'Both lung fields are clear. Costophrenic angles are sharp. Cardiothoracic ratio is normal.',
    keyFindings: {
      'Lungs': 'Clear fields bilaterally',
      'Cardiothoracic Ratio': 'Normal (< 0.5)',
      'Bony Thorax': 'Intact',
    },
    doctorName: 'Dr. P. V. Ramana Rao',
  },
  {
    id: 'doc_discharge_aug',
    patientId: 'patient_std_01',
    title: 'Post-Angiogram Discharge Summary',
    problemFolder: 'Discharge & Summary',
    hospitalName: 'City Care Community Hospital',
    date: '14 Aug 2026',
    isLatest: true,
    summaryMetrics: 'Discharged Stable',
    requiresHardCopy: true,
    summary: 'Diagnostic coronary angiogram showed minor non-obstructive coronary disease. Conservative medical management recommended.',
    keyFindings: {
      'Procedure': 'Coronary Angiogram via right radial',
      'LAD': '20% proximal irregularity',
      'Recommendation': 'Dual antiplatelet therapy for 6 months',
    },
    doctorName: 'Dr. Srinivas Murthy',
  },
  {
    id: 'doc_arjun_vaccine',
    patientId: 'person_arjun',
    title: 'Pediatric Immunization Record',
    problemFolder: 'General & Lab',
    hospitalName: 'Sunrise Child Clinic',
    date: '02 Oct 2026',
    isLatest: true,
    summaryMetrics: 'MMR & DTP Up to Date',
    requiresHardCopy: true,
    summary: 'Age-appropriate immunization completed. Next booster scheduled at 5 years.',
    keyFindings: {
      'Vaccine': 'MMR Booster 2',
      'Site': 'Left Anterolateral Thigh',
      'Batch': 'VAX-2026-901',
    },
    doctorName: 'Dr. Ananya Reddy',
  },
  {
    id: 'doc_arjun_pediatric_growth',
    patientId: 'person_arjun',
    title: 'Child Growth & Developmental Assessment',
    problemFolder: 'General & Lab',
    hospitalName: 'Sunrise Child Clinic',
    date: '15 Sep 2026',
    isLatest: true,
    summaryMetrics: 'Weight 16.2 kg • 65th Percentile',
    requiresHardCopy: false,
    summary: 'Growth parameters within normal percentiles. Milestones normal for age.',
    keyFindings: {
      'Weight': '16.2 kg (65th percentile)',
      'Height': '104 cm (70th percentile)',
      'Development': 'Milestones age-appropriate',
    },
    doctorName: 'Dr. Ananya Reddy',
  },
];

export const DEFAULT_CHECKLIST: VisitChecklistItem[] = [
  {
    id: 'chk_abha',
    label: 'Aadhaar / ABHA ID card (Digital or Card)',
    checked: true,
    requiresPaper: false,
  },
  {
    id: 'chk_ecg_paper',
    label: 'Previous ECG printout (Hard copy required)',
    checked: false,
    requiresPaper: true,
  },
  {
    id: 'chk_pills',
    label: 'Current pill strips & prescription bottles',
    checked: true,
    requiresPaper: false,
  },
  {
    id: 'chk_discharge_paper',
    label: 'Discharge summary from August visit (Hard copy)',
    checked: false,
    requiresPaper: true,
  },
];

let cachedFolders: RecordFolder[] = [...DEFAULT_FOLDERS];
let cachedDocuments: MedicalDocument[] = [...DEFAULT_DOCUMENTS];
let cachedChecklist: VisitChecklistItem[] = [...DEFAULT_CHECKLIST];
let isLoaded = false;

export function buildDepartmentChecklist(department?: string | null): VisitChecklistItem[] {
  const deptLower = (department || '').toLowerCase();

  if (deptLower.includes('cardio')) {
    return [
      { id: 'chk_id', label: 'Physical Government ID (Aadhaar / Voter ID)', checked: true, requiresPaper: false },
      { id: 'chk_ecg', label: 'Recent 12-lead ECG printout', checked: false, requiresPaper: true },
      { id: 'chk_cardio_summary', label: 'Past cardiology consultation summary', checked: false, requiresPaper: true },
      { id: 'chk_pills', label: 'Active medication pill strips', checked: true, requiresPaper: false },
    ];
  }

  if (deptLower.includes('ortho')) {
    return [
      { id: 'chk_id', label: 'Physical Government ID (Aadhaar / Voter ID)', checked: true, requiresPaper: false },
      { id: 'chk_xray', label: 'Printed X-ray film & scan envelope', checked: false, requiresPaper: true },
      { id: 'chk_ortho_summary', label: 'Past orthopedic summary & reports', checked: false, requiresPaper: true },
      { id: 'chk_pills', label: 'Active prescriptions list', checked: true, requiresPaper: false },
    ];
  }

  if (deptLower.includes('general') || deptLower.includes('internal') || deptLower.includes('medicine')) {
    return [
      { id: 'chk_id', label: 'Physical Government ID (Aadhaar / Voter ID)', checked: true, requiresPaper: false },
      { id: 'chk_blood', label: 'Recent blood work & lab reports', checked: false, requiresPaper: true },
      { id: 'chk_pills', label: 'Active pill strips & prescription bottles', checked: true, requiresPaper: false },
    ];
  }

  if (department && department.trim().length > 0) {
    return [
      { id: 'chk_id', label: 'Physical Government ID (Aadhaar / Voter ID)', checked: true, requiresPaper: false },
      { id: 'chk_dept_docs', label: `${department} previous consultation notes`, checked: false, requiresPaper: true },
      { id: 'chk_prescriptions', label: 'Active prescriptions list', checked: true, requiresPaper: false },
    ];
  }

  // No upcoming visit
  return [
    { id: 'chk_id', label: 'Physical Government ID (Aadhaar / Voter ID)', checked: true, requiresPaper: false },
    { id: 'chk_prescriptions', label: 'Active prescriptions list', checked: true, requiresPaper: false },
  ];
}

export async function syncChecklistWithBookings(): Promise<VisitChecklistItem[]> {
  const visits = await getStorageItem<any[]>(STORAGE_KEYS.VISITS_LIST, []);
  const activeBooking = await getStorageItem<any | null>(STORAGE_KEYS.BOOKINGS, null);

  // Find next upcoming booked visit (confirmed or requested)
  let nextVisit = visits.find((v) => v.status === 'confirmed' || v.status === 'requested');
  if (!nextVisit && activeBooking && (activeBooking.status === 'confirmed' || activeBooking.status === 'requested')) {
    nextVisit = activeBooking;
  }

  const dept = nextVisit ? nextVisit.department : null;
  const newChecklist = buildDepartmentChecklist(dept);
  cachedChecklist = newChecklist;
  await setStorageItem(STORAGE_KEYS.VISIT_CHECKLIST, newChecklist);
  return newChecklist;
}

export async function fetchRecords(): Promise<RecordsDataResponse> {
  if (!isLoaded) {
    const storedDocs = await getStorageItem<MedicalDocument[]>(STORAGE_KEYS.RECORDS, DEFAULT_DOCUMENTS);
    cachedDocuments = storedDocs;
    isLoaded = true;
  }

  cachedChecklist = await syncChecklistWithBookings();

  // Attempt sync with backend API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/records`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiData = (await res.json()) as RecordsDataResponse;
      if (apiData.documents && apiData.documents.length >= cachedDocuments.length) {
        cachedDocuments = apiData.documents;
        cachedFolders = apiData.folders;
        cachedChecklist = apiData.visitChecklist;
        await setStorageItem(STORAGE_KEYS.RECORDS, cachedDocuments);
        await setStorageItem(STORAGE_KEYS.VISIT_CHECKLIST, cachedChecklist);
      }
    }
  } catch {
    // API offline - gracefully continue with cached records
  }

  return {
    folders: cachedFolders,
    documents: cachedDocuments,
    visitChecklist: cachedChecklist,
  };
}

export function getCachedRecords(): RecordsDataResponse {
  return {
    folders: cachedFolders,
    documents: cachedDocuments,
    visitChecklist: cachedChecklist,
  };
}

export async function fetchRecordsForPatient(patientId?: string): Promise<RecordsDataResponse> {
  const all = await fetchRecords();
  if (!patientId) return all;
  const filteredDocs = all.documents.filter(
    (d) => (d.patientId || 'patient_std_01') === patientId
  );
  return {
    ...all,
    documents: filteredDocs,
  };
}

export async function uploadReport(
  req: RecordUploadRequest
): Promise<{ newDoc: MedicalDocument; allDocuments: MedicalDocument[] }> {
  const docId = `doc_${Date.now()}`;
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  const newDoc: MedicalDocument = {
    id: docId,
    patientId: req.patientId || 'patient_std_01',
    title: req.title.trim(),
    problemFolder: req.problemFolder.trim(),
    hospitalName: req.hospitalName || 'City Care Hospital',
    date: formattedDate,
    isLatest: true,
    summaryMetrics: req.summaryMetrics || 'Verified • Uploaded today',
    requiresHardCopy: Boolean(req.requiresHardCopy),
    summary: req.summary || 'Patient uploaded clinical report for upcoming hospital consultation.',
    keyFindings: req.keyFindings || {
      'Status': 'Uploaded',
      'Source': req.hospitalName || 'City Care Hospital',
    },
  };

  // Mark older versions superseded
  cachedDocuments.forEach((d) => {
    if (d.problemFolder === newDoc.problemFolder && d.title.toLowerCase() === newDoc.title.toLowerCase()) {
      d.isLatest = false;
    }
  });

  cachedDocuments = [newDoc, ...cachedDocuments];

  // Update folder count
  const folder = cachedFolders.find(
    (f) => f.name.toLowerCase() === newDoc.problemFolder.toLowerCase()
  );
  if (folder) {
    folder.documentCount += 1;
    folder.latestDate = formattedDate;
  } else {
    cachedFolders.push({
      id: `fld_${Date.now()}`,
      name: newDoc.problemFolder,
      documentCount: 1,
      latestDate: formattedDate,
    });
  }

  await setStorageItem(STORAGE_KEYS.RECORDS, cachedDocuments);

  // Sync to API in background
  fetch(`${API_BASE_URL}/records/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).catch(() => {});

  return { newDoc, allDocuments: [...cachedDocuments] };
}

export async function toggleChecklistItem(
  itemId: string,
  checked?: boolean
): Promise<VisitChecklistItem[]> {
  const item = cachedChecklist.find((c) => c.id === itemId);
  if (item) {
    item.checked = checked !== undefined ? checked : !item.checked;
    await setStorageItem(STORAGE_KEYS.VISIT_CHECKLIST, cachedChecklist);

    // Sync to API
    fetch(`${API_BASE_URL}/records/checklist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, checked: item.checked }),
    }).catch(() => {});
  }
  return [...cachedChecklist];
}
