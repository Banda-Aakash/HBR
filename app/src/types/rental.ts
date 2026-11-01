// ── Rental State Machine Types ──
// Based on the platform build spec §5

export type TenancyState =
  | 'onboarding'
  | 'marketing'
  | 'agreement'
  | 'occupied'
  | 'notice'
  | 'move_out';

export const TENANCY_STATES: TenancyState[] = [
  'onboarding',
  'marketing',
  'agreement',
  'occupied',
  'notice',
  'move_out',
];

export const TENANCY_STATE_LABELS: Record<TenancyState, string> = {
  onboarding: 'Onboarding',
  marketing: 'Marketing',
  agreement: 'Agreement',
  occupied: 'Occupied',
  notice: 'Notice Period',
  move_out: 'Move Out',
};

export const TENANCY_STATE_COLORS: Record<TenancyState, string> = {
  onboarding: '#8B5CF6',   // purple
  marketing: '#F59E0B',    // amber
  agreement: '#3B82F6',    // blue
  occupied: '#10B981',     // green
  notice: '#EF4444',       // red
  move_out: '#6B7280',     // gray
};

// ── Guard types ──

export interface TransitionGuard {
  id: string;
  label: string;
  description: string;
  isSatisfied: boolean;
}

export interface TransitionResult {
  allowed: boolean;
  targetState: TenancyState;
  guards: TransitionGuard[];
  unmetGuards: TransitionGuard[];
}

// ── Domain types (from spec §4) ──

export interface Party {
  id: string;
  type: 'individual' | 'company';
  name: string;
  phone: string;
  email: string;
  residencyStatus: 'resident' | 'nri';
  pan?: string;
  countryOfResidence: string;
  roles: ('buyer' | 'owner' | 'tenant' | 'vendor' | 'investor')[];
  avatar?: string;
}

export interface RentalProperty {
  id: string;
  type: 'residential' | 'commercial';
  unitNo: string;
  block?: string;
  tower?: string;
  floor: number;
  carpetArea: number;
  facing?: string;
  address: string;
  locality: string;
  city: string;
  image: string;
  ownerPartyId: string;
}

export interface RentalDocument {
  id: string;
  type: DocumentType;
  subjectType: 'party' | 'property' | 'tenancy';
  subjectId: string;
  fileName: string;
  uploadedBy: string;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  isOnFile: boolean;
}

export type DocumentType =
  | 'poa'
  | 'ownership_deed'
  | 'society_noc'
  | 'baseline_photos'
  | 'screening_report'
  | 'agreement'
  | 'deposit_receipt'
  | 'police_verification'
  | 'move_in_inventory'
  | 'notice_document'
  | 'move_out_inspection'
  | 'deposit_settlement'
  | 'final_statement'
  | 'other';

export interface TaxProfile {
  id: string;
  landlordResidency: 'resident' | 'nri';
  has197Certificate: boolean;
  certificateRate?: number;
  certificateValidTo?: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  tenancyId: string;
  type: 'movein' | 'periodic' | 'moveout';
  conductedBy: string;
  conductedAt: string;
  items: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  room: string;
  item: string;
  condition: 'good' | 'fair' | 'poor' | 'damaged';
  photoKey?: string;
}

export interface LedgerEntry {
  id: string;
  tenancyId: string;
  partyId: string;
  date: string;
  direction: 'in' | 'out';
  amount: number;
  category: string;
  description: string;
  documentId?: string;
  createdBy: string;
  createdAt: string;
}

// ── Tenancy (the main rental entity) ──

export interface Tenancy {
  id: string;
  property: RentalProperty;
  owner: Party;
  tenant?: Party;
  state: TenancyState;
  startDate?: string;
  endDate?: string;
  rent: number;
  deposit: number;
  escalationPct?: number;
  taxProfile?: TaxProfile;
  documents: RentalDocument[];
  inspections: Inspection[];
  ledger: LedgerEntry[];
  maintenanceSpendLimit?: number;
  ownerApproval?: boolean;
  depositReceived?: boolean;
  depositSettled?: boolean;
  duesCleared?: boolean;
  createdAt: string;
}
