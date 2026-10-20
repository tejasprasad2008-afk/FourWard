export interface MaternalMilestone {
  id: string;
  name: string;
  category: 'trimester_1' | 'trimester_2' | 'trimester_3' | 'newborn';
  scheduleWindow: string;
  hospitalCounter: string;
  completed: boolean;
  dueDate: string;
  notes?: string;
}

export interface PhysicalDocumentCheck {
  id: string;
  title: string;
  subtitle: string;
  hasPhysicalCopy: boolean;
}

export interface MaternalDataResponse {
  stage: string;
  gestationalWeeks: number;
  trimesterAlert: string;
  pmsmaBanner: string;
  milestones: MaternalMilestone[];
  physicalDocuments: PhysicalDocumentCheck[];
}

export interface ToggleVaccineRequest {
  milestoneId: string;
  completed?: boolean;
}
