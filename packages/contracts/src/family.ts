export type CaregiverAccessLevel = 'view_records' | 'revoked';

export interface CaregiverItem {
  id: string;
  name: string;
  relation: string;
  phone: string;
  accessLevel: CaregiverAccessLevel;
  expiresAt: string;
  linkedSince: string;
}

export type AgeBand = 'child' | 'adult' | 'senior';
export type PersonStatus = 'active' | 'waiting_approval' | 'revoked';

export interface PersonPermissions {
  canBookVisits: boolean;
  canViewRecords: boolean;
}

export interface ManagedPerson {
  id: string;
  name: string;
  relation: string;
  ageBand: AgeBand;
  phone?: string;
  isOwner: boolean;
  status: PersonStatus;
  approvalCode?: string;
  permissions: PersonPermissions;
  linkedSince: string;
}

export interface FamilyAuditEntry {
  id: string;
  event: string;
  actor: string;
  timestamp: string;
  detail: string;
}

export interface FamilyDataResponse {
  caregivers: CaregiverItem[];
  managedPersons: ManagedPerson[];
  auditLog: FamilyAuditEntry[];
}

export interface ToggleAccessRequest {
  caregiverId: string;
  accessLevel?: CaregiverAccessLevel;
}

export interface AddFamilyMemberRequest {
  name: string;
  relation: string;
  phone: string;
}

export interface AddPersonRequest {
  name: string;
  relation: string;
  ageBand: AgeBand;
  phone?: string;
  canBookVisits?: boolean;
  canViewRecords?: boolean;
}

export interface ApprovePersonRequest {
  personId: string;
  code: string;
}

export interface UpdatePersonPermissionsRequest {
  personId: string;
  canBookVisits?: boolean;
  canViewRecords?: boolean;
}

export interface RevokePersonRequest {
  personId: string;
}
