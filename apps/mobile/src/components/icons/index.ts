import React from 'react';
import type { StyleProp, ViewStyle, ColorValue } from 'react-native';
import {
  House,
  Stethoscope,
  FolderOpen,
  Pill,
  UserRound,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Plus,
  Minus,
  Trash2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Info,
  TriangleAlert,
  WifiOff,
  MapPin,
  LocateFixed,
  Navigation,
  Mic,
  MicOff,
  SendHorizontal,
  Ambulance,
  PhoneCall,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Clock,
  Hospital,
  FileText,
  FlaskConical,
  Scan,
  Activity,
  ClipboardList,
  Upload,
  Camera,
  BellRing,
  BellOff,
  ShoppingCart,
  Truck,
  Store,
  Utensils,
  Apple,
  Baby,
  Syringe,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldCheck,
  Lock,
  LockOpen,
  Eye,
  KeyRound,
  BedDouble,
  Droplet,
  HeartPulse,
  Ear,
  Bone,
  Folder,
  Settings,
  LifeBuoy,
  IdCard,
  CreditCard,
  Languages,
  Bell,
  ALargeSmall,
  Type,
  LucideIcon,
} from 'lucide-react-native';
import { colors } from '../../theme/tokens';

/**
 * Strict FourWard Semantic Icon Map
 * Rules:
 * - Lucide is imported ONLY in this file.
 * - StrokeWidth 1.75 with round caps and joins.
 * - danger tone only for emergency actions.
 * - Icons sit inline beside text or in nav, never in a box above a heading.
 */
export const icons = {
  // Tabs
  home: House,
  doctors: Stethoscope,
  records: FolderOpen,
  medicines: Pill,
  account: UserRound,

  // Actions
  back: ArrowLeft,
  next: ChevronRight,
  dropdown: ChevronDown,
  close: X,
  check: Check,
  add: Plus,
  remove: Minus,
  delete: Trash2,
  search: Search,
  filter: SlidersHorizontal,
  sort: ArrowUpDown,
  refresh: RefreshCw,
  info: Info,
  warning: TriangleAlert,
  offline: WifiOff,

  // Location
  pin: MapPin,
  myLocation: LocateFixed,
  directions: Navigation,

  // Assistant
  mic: Mic,
  micOff: MicOff,
  send: SendHorizontal,

  // Emergency
  ambulance: Ambulance,
  call: PhoneCall,

  // Visits
  calendar: Calendar,
  confirmed: CalendarCheck,
  addToCalendar: CalendarPlus,
  cancelled: CalendarX,
  time: Clock,
  hospital: Hospital,

  // Records
  document: FileText,
  lab: FlaskConical,
  scan: Scan,
  ecg: Activity,
  checklist: ClipboardList,
  upload: Upload,
  camera: Camera,

  // Medicines
  reminderOn: BellRing,
  reminderOff: BellOff,
  cart: ShoppingCart,
  delivery: Truck,
  pickup: Store,

  // Diet
  meal: Utensils,
  fruit: Apple,

  // Maternal
  baby: Baby,
  vaccine: Syringe,

  // Family
  family: Users,
  addPerson: UserPlus,
  approved: UserCheck,
  revoked: UserX,
  access: ShieldCheck,
  locked: Lock,
  unlocked: LockOpen,
  whoSaw: Eye,

  // Check-in
  code: KeyRound,

  // Hospital status
  beds: BedDouble,
  blood: Droplet,

  // Departments (no icon for Gynecology: text only per AGENTS.md)
  cardiology: HeartPulse,
  ent: Ear,
  orthopedics: Bone,
  pediatrics: Baby,
  general: Stethoscope,

  // Account
  visits: Calendar,
  documents: Folder,
  settings: Settings,
  help: LifeBuoy,
  card: IdCard || CreditCard,
  language: Languages,
  notifications: Bell,
  seniorUi: ALargeSmall || Type,
} as const;

export type IconSemanticName = keyof typeof icons;

export type IconTone = 'ink' | 'muted' | 'primary' | 'danger' | 'surface';
export type IconSize = 20 | 24 | 32 | number;

const TONE_COLORS: Record<IconTone, string> = {
  ink: colors.ink,
  muted: colors.muted,
  primary: colors.primary,
  danger: colors.danger,
  surface: colors.surface,
};

export interface IconProps {
  name: IconSemanticName;
  size?: IconSize;
  tone?: IconTone;
  color?: string | ColorValue; // override tone if specifically needed
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number; // strictly defaults to 1.75 per design rules
}

export function Icon({
  name,
  size = 24,
  tone = 'ink',
  color,
  style,
  strokeWidth = 1.75,
}: IconProps) {
  const Component: LucideIcon = icons[name] || icons.info;
  const iconColor = color || TONE_COLORS[tone] || colors.ink;

  return React.createElement(Component, {
    size,
    color: iconColor,
    strokeWidth: 1.75,
    style,
  });
}

export default Icon;
