export interface RecordFolder {
  id: string;
  name: string;
  documentCount: number;
  latestDate: string;
}

export interface MedicalDocument {
  id: string;
  patientId?: string;
  title: string;
  problemFolder: string;
  hospitalName: string;
  date: string;
  isLatest: boolean;
  summaryMetrics: string;
  requiresHardCopy: boolean;
  summary?: string;
  keyFindings?: Record<string, string>;
  doctorName?: string;
}

export interface VisitChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  requiresPaper: boolean;
}

export interface RecordsDataResponse {
  folders: RecordFolder[];
  documents: MedicalDocument[];
  visitChecklist: VisitChecklistItem[];
}

export interface RecordUploadRequest {
  patientId?: string;
  title: string;
  problemFolder: string;
  hospitalName?: string;
  summary?: string;
  summaryMetrics?: string;
  requiresHardCopy?: boolean;
  keyFindings?: Record<string, string>;
}

export interface ChecklistToggleRequest {
  itemId: string;
  checked?: boolean;
}
