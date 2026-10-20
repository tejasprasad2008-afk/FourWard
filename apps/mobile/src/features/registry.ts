export type TileTint = 'sageTint' | 'peachTint' | 'surface' | 'primaryTint' | 'clayTint';

export type FeatureId =
  | 'doctors'
  | 'records'
  | 'medicines'
  | 'diet'
  | 'family'
  | 'maternal'
  | 'checkin';

export const CHECKIN_NAME = 'Check-in';

export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  route: string;
  tileTitle: string;
  tileStatus: string;
  tint: TileTint;
  image: any;
  showInElderly: boolean;
  isTab: boolean;
  assistantSummary: string;
}

/**
 * Single source of truth for all feature names, routes, tiles, and assistant metadata.
 * Non-tab features: Check-in, Diet, Maternal Care, Family.
 */
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  doctors: {
    id: 'doctors',
    name: 'Doctors',
    route: '/(tabs)/doctors',
    tileTitle: 'Doctors',
    tileStatus: 'Check symptoms',
    tint: 'sageTint',
    image: require('../../assets/tiles/ref_triage_scope.webp'),
    showInElderly: true,
    isTab: true,
    assistantSummary: 'Search doctors and check symptoms to route to department',
  },
  records: {
    id: 'records',
    name: 'Records',
    route: '/(tabs)/records',
    tileTitle: 'Records',
    tileStatus: 'Lab reports & history',
    tint: 'sageTint',
    image: require('../../assets/tiles/ref_records.webp'),
    showInElderly: true,
    isTab: true,
    assistantSummary: 'View medical reports and visit checklist',
  },
  medicines: {
    id: 'medicines',
    name: 'Medicines',
    route: '/(tabs)/medicines',
    tileTitle: 'Medicines',
    tileStatus: 'Reminders & delivery',
    tint: 'peachTint',
    image: require('../../assets/tiles/ref_pills_bottle.webp'),
    showInElderly: true,
    isTab: true,
    assistantSummary: 'Track medicine reminders and order delivery refills',
  },
  checkin: {
    id: 'checkin',
    name: CHECKIN_NAME,
    route: '/features/consent',
    tileTitle: CHECKIN_NAME,
    tileStatus: 'Room consultation code',
    tint: 'sageTint',
    image: require('../../assets/tiles/lifted_security.webp'),
    showInElderly: true,
    isTab: false,
    assistantSummary: 'Enter 6-digit room code for consultation visit',
  },
  diet: {
    id: 'diet',
    name: 'Diet',
    route: '/features/diet',
    tileTitle: 'Diet',
    tileStatus: 'Personal meal plans',
    tint: 'sageTint',
    image: require('../../assets/tiles/ref_thali.webp'),
    showInElderly: true,
    isTab: false,
    assistantSummary: 'View regional meal plans and log daily intake',
  },
  maternal: {
    id: 'maternal',
    name: 'Maternal Care',
    route: '/features/maternal',
    tileTitle: 'Maternal Care',
    tileStatus: 'Vaccines & baby care',
    tint: 'peachTint',
    image: require('../../assets/tiles/ref_booties.webp'),
    showInElderly: true,
    isTab: false,
    assistantSummary: 'View vaccination deadlines and care guidelines',
  },
  family: {
    id: 'family',
    name: 'Family',
    route: '/features/family',
    tileTitle: 'Family',
    tileStatus: 'Linked profiles',
    tint: 'peachTint',
    image: require('../../assets/tiles/lifted_family.webp'),
    showInElderly: true,
    isTab: false,
    assistantSummary: 'Manage authorised family member records',
  },
};

export const FEATURE_LIST: FeatureDefinition[] = [
  FEATURES.doctors,
  FEATURES.records,
  FEATURES.medicines,
  FEATURES.checkin,
  FEATURES.diet,
  FEATURES.maternal,
  FEATURES.family,
];

export const NON_TAB_TILES: FeatureDefinition[] = [
  FEATURES.checkin,
  FEATURES.diet,
  FEATURES.maternal,
  FEATURES.family,
];

export function getFeature(id: FeatureId): FeatureDefinition {
  return FEATURES[id];
}

export function getFeatureByName(name: string): FeatureDefinition | undefined {
  return FEATURE_LIST.find((f) => f.name.toLowerCase() === name.toLowerCase());
}

export function getTileFeatures(isElderly: boolean): FeatureDefinition[] {
  return NON_TAB_TILES;
}
