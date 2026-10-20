import type {
  FamilyDataResponse,
  CaregiverItem,
  ToggleAccessRequest,
  AddFamilyMemberRequest,
  ManagedPerson,
  AddPersonRequest,
  PersonPermissions,
} from '../../../../../packages/contracts/src/family.ts';
import { familyStore } from './store.ts';
import { auditLedger } from '../../spine/audit.ts';

export class FamilyService {
  public getFamilyData(): FamilyDataResponse {
    return familyStore.getFamilyData();
  }

  public getManagedPersons(): ManagedPerson[] {
    return familyStore.getManagedPersons();
  }

  public addPerson(
    req: AddPersonRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { person: ManagedPerson; data: FamilyDataResponse } {
    if (!req.name || !req.relation || !req.ageBand) {
      throw new Error('Name, relation, and ageBand are required');
    }

    const added = familyStore.addPerson(req);

    auditLedger.recordEntry({
      action: 'FAMILY_PERSON_ADDED',
      patientId,
      visitId: added.id,
      actor,
      metadata: {
        personId: added.id,
        name: added.name,
        relation: added.relation,
        ageBand: added.ageBand,
        status: added.status,
      },
    });

    return {
      person: added,
      data: familyStore.getFamilyData(),
    };
  }

  public approvePerson(
    personId: string,
    code: string,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { person: ManagedPerson; data: FamilyDataResponse } {
    const approved = familyStore.approvePerson(personId, code);

    auditLedger.recordEntry({
      action: 'FAMILY_PERSON_APPROVED',
      patientId,
      visitId: approved.id,
      actor,
      metadata: {
        personId: approved.id,
        name: approved.name,
        relation: approved.relation,
        status: approved.status,
      },
    });

    return {
      person: approved,
      data: familyStore.getFamilyData(),
    };
  }

  public updatePermissions(
    personId: string,
    permissions: Partial<PersonPermissions>,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { person: ManagedPerson; data: FamilyDataResponse } {
    const updated = familyStore.updatePersonPermissions(personId, permissions);

    auditLedger.recordEntry({
      action: 'FAMILY_PERSON_PERMISSIONS_UPDATED',
      patientId,
      visitId: updated.id,
      actor,
      metadata: {
        personId: updated.id,
        name: updated.name,
        permissions: updated.permissions,
      },
    });

    return {
      person: updated,
      data: familyStore.getFamilyData(),
    };
  }

  public revokePerson(
    personId: string,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { person: ManagedPerson; data: FamilyDataResponse } {
    const revoked = familyStore.revokePerson(personId);

    auditLedger.recordEntry({
      action: 'FAMILY_PERSON_REVOKED',
      patientId,
      visitId: revoked.id,
      actor,
      metadata: {
        personId: revoked.id,
        name: revoked.name,
        status: revoked.status,
      },
    });

    return {
      person: revoked,
      data: familyStore.getFamilyData(),
    };
  }

  public toggleAccess(
    req: ToggleAccessRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { caregiver: CaregiverItem; data: FamilyDataResponse } {
    const updated = familyStore.toggleAccess(req.caregiverId, req.accessLevel);

    auditLedger.recordEntry({
      action: 'FAMILY_ACCESS_UPDATED',
      patientId,
      visitId: req.caregiverId,
      actor,
      metadata: {
        caregiverId: updated.id,
        name: updated.name,
        relation: updated.relation,
        accessLevel: updated.accessLevel,
      },
    });

    return {
      caregiver: updated,
      data: familyStore.getFamilyData(),
    };
  }

  public addMember(
    req: AddFamilyMemberRequest,
    actor = 'patient_std_01',
    patientId = 'patient_std_01'
  ): { caregiver: CaregiverItem; data: FamilyDataResponse } {
    if (!req.name || !req.relation || !req.phone) {
      throw new Error('Name, relation, and phone are required');
    }

    const added = familyStore.addCaregiver(req.name, req.relation, req.phone);

    auditLedger.recordEntry({
      action: 'FAMILY_MEMBER_ADDED',
      patientId,
      visitId: added.id,
      actor,
      metadata: {
        caregiverId: added.id,
        name: added.name,
        relation: added.relation,
        phone: added.phone,
        accessLevel: added.accessLevel,
      },
    });

    return {
      caregiver: added,
      data: familyStore.getFamilyData(),
    };
  }
}

export const familyService = new FamilyService();
