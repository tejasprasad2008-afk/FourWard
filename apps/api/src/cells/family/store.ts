import type {
  CaregiverItem,
  FamilyAuditEntry,
  FamilyDataResponse,
  CaregiverAccessLevel,
  ManagedPerson,
  AddPersonRequest,
  PersonPermissions,
} from '../../../../../packages/contracts/src/family.ts';

export class FamilyStore {
  private caregivers: CaregiverItem[] = [
    {
      id: 'fam_ramesh',
      name: 'K. Ramesh',
      relation: 'Son',
      phone: '+91 98480 22341',
      accessLevel: 'view_records',
      expiresAt: 'Continuous until revoked',
      linkedSince: '12 Jun 2026',
    },
    {
      id: 'fam_lakshmi',
      name: 'K. Lakshmi',
      relation: 'Spouse',
      phone: '+91 98481 99120',
      accessLevel: 'view_records',
      expiresAt: 'Continuous until revoked',
      linkedSince: '04 Jan 2026',
    },
    {
      id: 'fam_suresh',
      name: 'P. Suresh',
      relation: 'Brother',
      phone: '+91 94401 55678',
      accessLevel: 'revoked',
      expiresAt: 'Revoked on 18 Mar 2026',
      linkedSince: '18 Mar 2026',
    },
  ];

  private managedPersons: ManagedPerson[] = [
    {
      id: 'patient_std_01',
      name: 'Tejas',
      relation: 'Self',
      ageBand: 'adult',
      phone: '+91 98490 28143',
      isOwner: true,
      status: 'active',
      permissions: {
        canBookVisits: true,
        canViewRecords: true,
      },
      linkedSince: 'Primary account',
    },
    {
      id: 'person_arjun',
      name: 'Arjun Prasad',
      relation: 'Son',
      ageBand: 'child',
      isOwner: false,
      status: 'active',
      permissions: {
        canBookVisits: true,
        canViewRecords: true,
      },
      linkedSince: '12 Jan 2026',
    },
    {
      id: 'person_lakshmi',
      name: 'Lakshmi Prasad',
      relation: 'Spouse',
      ageBand: 'adult',
      phone: '+91 98481 99120',
      isOwner: false,
      status: 'active',
      permissions: {
        canBookVisits: true,
        canViewRecords: true,
      },
      linkedSince: '04 Jan 2026',
    },
  ];

  private auditLog: FamilyAuditEntry[] = [
    {
      id: 'aud_1',
      event: 'Doctor Consultation Access',
      actor: 'Dr. P. V. Ramana Rao (City Care Hospital)',
      timestamp: 'Today, 10:45 AM',
      detail: 'Accessed Cardiac 2D Echo & Resting ECG during OPD consult.',
    },
    {
      id: 'aud_2',
      event: 'Caregiver Record View',
      actor: 'K. Ramesh (Son)',
      timestamp: 'Yesterday, 8:15 PM',
      detail: 'Viewed Fasting Lipid Profile & Discharge Summary.',
    },
    {
      id: 'aud_3',
      event: 'You allowed access',
      actor: 'K. Lakshmi (Spouse)',
      timestamp: '14 Oct 2026, 4:20 PM',
      detail: 'Verified prescription list and dose reminder schedule.',
    },
    {
      id: 'aud_4',
      event: 'Access Revocation',
      actor: 'Patient (Self)',
      timestamp: '18 Mar 2026, 11:10 AM',
      detail: 'Revoked record view permissions for P. Suresh (Brother).',
    },
  ];

  public getFamilyData(): FamilyDataResponse {
    return {
      caregivers: [...this.caregivers],
      managedPersons: [...this.managedPersons],
      auditLog: [...this.auditLog],
    };
  }

  public getManagedPersons(): ManagedPerson[] {
    return [...this.managedPersons];
  }

  public addPerson(req: AddPersonRequest): ManagedPerson {
    const normName = req.name.trim();
    const normRel = req.relation.trim();
    const normPhone = req.phone?.trim();

    // Check duplicate phone (if provided)
    if (normPhone) {
      const cleanPhone = normPhone.replace(/\D/g, '');
      const existingPhone = this.managedPersons.find(
        (p) => p.status !== 'revoked' && p.phone && p.phone.replace(/\D/g, '') === cleanPhone
      );
      if (existingPhone) {
        throw new Error('DUPLICATE_PHONE: A person with this phone number already exists.');
      }
    }

    // Check duplicate name and relation
    const existingNameRel = this.managedPersons.find(
      (p) =>
        p.status !== 'revoked' &&
        p.name.toLowerCase() === normName.toLowerCase() &&
        p.relation.toLowerCase() === normRel.toLowerCase()
    );
    if (existingNameRel) {
      throw new Error('DUPLICATE_PERSON: A person with this name and relation already exists.');
    }

    const isChild = req.ageBand === 'child';
    const status = isChild ? 'active' : 'waiting_approval';
    const approvalCode = isChild ? undefined : '4821';

    const newPerson: ManagedPerson = {
      id: `person_${Date.now()}`,
      name: normName,
      relation: normRel,
      ageBand: req.ageBand,
      phone: normPhone,
      isOwner: false,
      status,
      approvalCode,
      permissions: {
        canBookVisits: req.canBookVisits ?? true,
        canViewRecords: req.canViewRecords ?? true,
      },
      linkedSince: 'Today',
    };

    this.managedPersons.push(newPerson);

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: isChild ? 'Child Dependant Added' : 'Adult Approval Pending',
      actor: 'Primary Account (Self)',
      timestamp: todayStr,
      detail: isChild
        ? `Added child ${normName} (${normRel}) under guardian management.`
        : `Sent approval code to ${normPhone || 'phone'} for ${normName} (${normRel}).`,
    });

    return { ...newPerson };
  }

  public approvePerson(personId: string, code: string): ManagedPerson {
    const person = this.managedPersons.find((p) => p.id === personId);
    if (!person) {
      throw new Error(`Person ${personId} not found`);
    }

    if (person.approvalCode && code !== person.approvalCode && code !== '4821') {
      throw new Error('INVALID_APPROVAL_CODE: The code provided does not match.');
    }

    person.status = 'active';
    person.approvalCode = undefined;

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: 'Adult Management Approved',
      actor: `${person.name} (${person.relation})`,
      timestamp: todayStr,
      detail: `Approved management access for visits and records by primary account.`,
    });

    return { ...person };
  }

  public updatePersonPermissions(
    personId: string,
    permissions: Partial<PersonPermissions>
  ): ManagedPerson {
    const person = this.managedPersons.find((p) => p.id === personId);
    if (!person) {
      throw new Error(`Person ${personId} not found`);
    }

    if (permissions.canBookVisits !== undefined) {
      person.permissions.canBookVisits = permissions.canBookVisits;
    }
    if (permissions.canViewRecords !== undefined) {
      person.permissions.canViewRecords = permissions.canViewRecords;
    }

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: 'Permissions Updated',
      actor: 'Primary Account (Self)',
      timestamp: todayStr,
      detail: `Updated permissions for ${person.name}: canBook=${person.permissions.canBookVisits}, canView=${person.permissions.canViewRecords}.`,
    });

    return { ...person };
  }

  public revokePerson(personId: string): ManagedPerson {
    const person = this.managedPersons.find((p) => p.id === personId);
    if (!person) {
      throw new Error(`Person ${personId} not found`);
    }

    person.status = 'revoked';

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: 'Person Management Revoked',
      actor: 'Primary Account (Self)',
      timestamp: todayStr,
      detail: `Revoked managed profile access for ${person.name} (${person.relation}).`,
    });

    return { ...person };
  }

  public toggleAccess(caregiverId: string, accessLevel?: CaregiverAccessLevel): CaregiverItem {
    const item = this.caregivers.find((c) => c.id === caregiverId);
    if (!item) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }

    if (accessLevel !== undefined) {
      item.accessLevel = accessLevel;
    } else {
      item.accessLevel = item.accessLevel === 'view_records' ? 'revoked' : 'view_records';
    }

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.expiresAt = item.accessLevel === 'view_records' ? 'Continuous until revoked' : `Revoked ${todayStr}`;

    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: item.accessLevel === 'view_records' ? 'Access Restored' : 'Access Revoked',
      actor: 'Patient (Self)',
      timestamp: todayStr,
      detail: `${item.accessLevel === 'view_records' ? 'Restored' : 'Revoked'} record viewing permissions for ${item.name} (${item.relation}).`,
    });

    return { ...item };
  }

  public addCaregiver(name: string, relation: string, phone: string): CaregiverItem {
    const newCaregiver: CaregiverItem = {
      id: `fam_${Date.now()}`,
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      accessLevel: 'view_records',
      expiresAt: 'Continuous until revoked',
      linkedSince: 'Today',
    };

    this.caregivers.unshift(newCaregiver);

    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: 'New Caregiver Linked',
      actor: 'Patient (Self)',
      timestamp: todayStr,
      detail: `Granted record view permissions to ${newCaregiver.name} (${newCaregiver.relation}).`,
    });

    return newCaregiver;
  }
}

export const familyStore = new FamilyStore();
