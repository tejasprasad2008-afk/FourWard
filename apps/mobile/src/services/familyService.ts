import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage.ts';
import type {
  FamilyDataResponse,
  CaregiverItem,
  FamilyAuditEntry,
  CaregiverAccessLevel,
  ManagedPerson,
  AddPersonRequest,
  PersonPermissions,
} from '../../../../packages/contracts/src/family.ts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const DEFAULT_MANAGED_PERSONS: ManagedPerson[] = [
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

export const DEFAULT_FAMILY_DATA: FamilyDataResponse = {
  caregivers: [
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
  ],
  managedPersons: DEFAULT_MANAGED_PERSONS,
  auditLog: [
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
  ],
};

let cachedFamily: FamilyDataResponse = DEFAULT_FAMILY_DATA;
let isLoaded = false;

// Subscribers for active person changes
const activePersonListeners = new Set<(person: ManagedPerson) => void>();

export function onActivePersonChange(listener: (person: ManagedPerson) => void): () => void {
  activePersonListeners.add(listener);
  return () => {
    activePersonListeners.delete(listener);
  };
}

function notifyActivePersonChange(person: ManagedPerson) {
  activePersonListeners.forEach((listener) => {
    try {
      listener(person);
    } catch (err) {
      console.warn('Error in activePersonListener', err);
    }
  });
}

export async function fetchFamilyData(): Promise<FamilyDataResponse> {
  if (!isLoaded) {
    const stored = await getStorageItem<FamilyDataResponse>(
      STORAGE_KEYS.FAMILY,
      DEFAULT_FAMILY_DATA
    );
    cachedFamily = {
      caregivers: stored.caregivers || DEFAULT_FAMILY_DATA.caregivers,
      managedPersons: stored.managedPersons || DEFAULT_MANAGED_PERSONS,
      auditLog: stored.auditLog || DEFAULT_FAMILY_DATA.auditLog,
    };
    isLoaded = true;
  }

  // Sync with API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/family`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiData = (await res.json()) as FamilyDataResponse;
      cachedFamily = {
        caregivers: apiData.caregivers || cachedFamily.caregivers,
        managedPersons: apiData.managedPersons || cachedFamily.managedPersons,
        auditLog: apiData.auditLog || cachedFamily.auditLog,
      };
      await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);
      return cachedFamily;
    }
  } catch {
    // API offline
  }

  return cachedFamily;
}

export async function fetchManagedPersons(): Promise<ManagedPerson[]> {
  const data = await fetchFamilyData();
  return data.managedPersons;
}

export async function getActivePersonId(): Promise<string> {
  return await getStorageItem<string>(STORAGE_KEYS.ACTIVE_PERSON_ID, 'patient_std_01');
}

export async function getActivePerson(): Promise<ManagedPerson> {
  const activeId = await getActivePersonId();
  const persons = await fetchManagedPersons();
  const found = persons.find((p) => p.id === activeId);
  if (found) return found;
  return persons[0] || DEFAULT_MANAGED_PERSONS[0];
}

export async function setActivePersonId(personId: string): Promise<ManagedPerson> {
  const persons = await fetchManagedPersons();
  const target = persons.find((p) => p.id === personId);
  if (!target) {
    throw new Error(`Person ${personId} not found`);
  }
  await setStorageItem(STORAGE_KEYS.ACTIVE_PERSON_ID, personId);
  notifyActivePersonChange(target);
  return target;
}

export async function updateSelfPersonName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  DEFAULT_MANAGED_PERSONS[0].name = trimmed;
  await fetchFamilyData();
  const selfPerson = cachedFamily.managedPersons.find(
    (p) => p.isOwner || p.relation === 'Self' || p.id === 'patient_std_01'
  );
  if (selfPerson) {
    selfPerson.name = trimmed;
    await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);
    const activeId = await getActivePersonId();
    if (activeId === selfPerson.id) {
      notifyActivePersonChange(selfPerson);
    }
  }
}

export async function addManagedPerson(req: AddPersonRequest): Promise<ManagedPerson> {
  const persons = await fetchManagedPersons();
  const normName = req.name.trim();
  const normRel = req.relation.trim();
  const normPhone = req.phone?.trim();

  // Validate duplicate phone
  if (normPhone) {
    const cleanPhone = normPhone.replace(/\D/g, '');
    const existingPhone = persons.find(
      (p) => p.status !== 'revoked' && p.phone && p.phone.replace(/\D/g, '') === cleanPhone
    );
    if (existingPhone) {
      throw new Error('DUPLICATE_PHONE: A person with this phone number already exists.');
    }
  }

  // Validate duplicate name and relation
  const existingNameRel = persons.find(
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

  const updatedPersons = [...persons, newPerson];
  const auditLog = [...cachedFamily.auditLog];

  const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    event: isChild ? 'Child Dependant Added' : 'Adult Approval Pending',
    actor: 'Primary Account (Self)',
    timestamp: todayStr,
    detail: isChild
      ? `Added child ${normName} (${normRel}) under guardian management.`
      : `Sent approval code to ${normPhone || 'phone'} for ${normName} (${normRel}).`,
  });

  cachedFamily = {
    ...cachedFamily,
    managedPersons: updatedPersons,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // Sync to API
  fetch(`${API_BASE_URL}/family/persons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).catch(() => {});

  return newPerson;
}

export async function approveManagedPerson(personId: string, code: string): Promise<ManagedPerson> {
  const persons = await fetchManagedPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) {
    throw new Error(`Person ${personId} not found`);
  }

  if (person.approvalCode && code !== person.approvalCode && code !== '4821') {
    throw new Error('INVALID_APPROVAL_CODE: The code provided does not match.');
  }

  person.status = 'active';
  person.approvalCode = undefined;

  const auditLog = [...cachedFamily.auditLog];
  const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    event: 'Adult Management Approved',
    actor: `${person.name} (${person.relation})`,
    timestamp: todayStr,
    detail: `Approved management access for visits and records by primary account.`,
  });

  cachedFamily = {
    ...cachedFamily,
    managedPersons: persons,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // Sync to API
  fetch(`${API_BASE_URL}/family/persons/${encodeURIComponent(personId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }).catch(() => {});

  return person;
}

export async function updatePersonPermissions(
  personId: string,
  permissions: Partial<PersonPermissions>
): Promise<ManagedPerson> {
  const persons = await fetchManagedPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) {
    throw new Error(`Person ${personId} not found`);
  }

  if (permissions.canBookVisits !== undefined) {
    person.permissions.canBookVisits = permissions.canBookVisits;
  }
  if (permissions.canViewRecords !== undefined) {
    person.permissions.canViewRecords = permissions.canViewRecords;
  }

  const auditLog = [...cachedFamily.auditLog];
  const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    event: 'Permissions Updated',
    actor: 'Primary Account (Self)',
    timestamp: todayStr,
    detail: `Updated permissions for ${person.name}: canBook=${person.permissions.canBookVisits}, canView=${person.permissions.canViewRecords}.`,
  });

  cachedFamily = {
    ...cachedFamily,
    managedPersons: persons,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // Sync to API
  fetch(`${API_BASE_URL}/family/persons/${encodeURIComponent(personId)}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(permissions),
  }).catch(() => {});

  return person;
}

export async function revokeManagedPerson(personId: string): Promise<ManagedPerson> {
  const persons = await fetchManagedPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) {
    throw new Error(`Person ${personId} not found`);
  }

  person.status = 'revoked';

  const auditLog = [...cachedFamily.auditLog];
  const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    event: 'Person Management Revoked',
    actor: 'Primary Account (Self)',
    timestamp: todayStr,
    detail: `Revoked managed profile access for ${person.name} (${person.relation}).`,
  });

  cachedFamily = {
    ...cachedFamily,
    managedPersons: persons,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // If active person was revoked, reset to owner
  const activeId = await getActivePersonId();
  if (activeId === personId) {
    await setActivePersonId('patient_std_01');
  }

  // Sync to API
  fetch(`${API_BASE_URL}/family/persons/${encodeURIComponent(personId)}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});

  return person;
}

export async function toggleCaregiverAccess(
  caregiverId: string
): Promise<FamilyDataResponse> {
  const caregivers = [...cachedFamily.caregivers];
  const auditLog = [...cachedFamily.auditLog];

  const item = caregivers.find((c) => c.id === caregiverId);
  if (item) {
    item.accessLevel = item.accessLevel === 'view_records' ? 'revoked' : 'view_records';
    const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.expiresAt = item.accessLevel === 'view_records' ? 'Continuous until revoked' : `Revoked ${todayStr}`;

    auditLog.unshift({
      id: `aud_${Date.now()}`,
      event: item.accessLevel === 'view_records' ? 'Access Restored' : 'Access Revoked',
      actor: 'Patient (Self)',
      timestamp: todayStr,
      detail: `${item.accessLevel === 'view_records' ? 'Restored' : 'Revoked'} record viewing permissions for ${item.name} (${item.relation}).`,
    });
  }

  cachedFamily = {
    ...cachedFamily,
    caregivers,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // Sync to API
  fetch(`${API_BASE_URL}/family/toggle-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caregiverId }),
  }).catch(() => {});

  return cachedFamily;
}

export async function addFamilyMember(
  name: string,
  relation: string,
  phone: string
): Promise<FamilyDataResponse> {
  const caregivers = [...cachedFamily.caregivers];
  const auditLog = [...cachedFamily.auditLog];

  const newCaregiver: CaregiverItem = {
    id: `fam_${Date.now()}`,
    name: name.trim(),
    relation: relation.trim(),
    phone: phone.trim(),
    accessLevel: 'view_records',
    expiresAt: 'Continuous until revoked',
    linkedSince: 'Today',
  };

  caregivers.unshift(newCaregiver);

  const todayStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLog.unshift({
    id: `aud_${Date.now()}`,
    event: 'New Caregiver Linked',
    actor: 'Patient (Self)',
    timestamp: todayStr,
    detail: `Granted record view permissions to ${newCaregiver.name} (${newCaregiver.relation}).`,
  });

  cachedFamily = {
    ...cachedFamily,
    caregivers,
    auditLog,
  };

  await setStorageItem(STORAGE_KEYS.FAMILY, cachedFamily);

  // Sync to API
  fetch(`${API_BASE_URL}/family/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, relation, phone }),
  }).catch(() => {});

  return cachedFamily;
}
