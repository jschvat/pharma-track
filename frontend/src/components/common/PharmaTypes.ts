/**
 * PharmaTypes - Comprehensive TypeScript Type Definitions
 * 
 * Complete type definitions for the PharmaTraK component library
 * with pharmacy-specific interfaces, utility types, and advanced
 * type guards for type-safe medical data handling.
 * 
 * Features:
 * - Comprehensive component prop interfaces
 * - Pharmacy-specific data models (drugs, prescriptions, patients)
 * - Advanced utility types for medical validations
 * - Type guards for runtime safety
 * - Generic types for flexible component APIs
 * - Event handler type definitions
 * - API response interfaces
 * - Performance optimization types
 * 
 * @module PharmaTypes
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import { ReactNode, ComponentProps, MouseEvent, ChangeEvent, FormEvent } from 'react';

// =============================================================================
// Core Utility Types
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonEmptyArray<T> = [T, ...T[]];
export type StringKeys<T> = Extract<keyof T, string>;

// Generic ID types
export type EntityId = string | number;
export type TimestampString = string; // ISO 8601 format
export type DateString = string; // YYYY-MM-DD format
export type EmailString = string;
export type PhoneString = string;
export type NDCString = string; // National Drug Code format
export type DEAString = string; // DEA registration number

// =============================================================================
// Pharmacy Domain Types
// =============================================================================

// User and Authentication Types
export interface User {
  id: EntityId;
  name: string;
  email: EmailString;
  phone?: PhoneString;
  address?: string;
  role: UserRole;
  store_id?: EntityId;
  active_store_id?: EntityId;
  store_name?: string;
  active_store_name?: string;
  is_active: boolean;
  date_created: TimestampString;
  last_login?: TimestampString;
  permissions?: Permission[];
}

export type UserRole = 'admin' | 'user' | 'pharmacist' | 'technician' | 'god_mode';

export interface Permission {
  id: EntityId;
  name: string;
  description: string;
  category: 'inventory' | 'prescriptions' | 'users' | 'reports' | 'settings';
}

// Store Types
export interface Store {
  id: EntityId;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone: PhoneString;
  fax?: PhoneString;
  email?: EmailString;
  dea_registration_number?: DEAString;
  npi?: string;
  is_active: boolean;
  settings?: StoreSettings;
}

export interface StoreSettings {
  id: EntityId;
  store_id: EntityId;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  is_active: boolean;
  updated_at: TimestampString;
}

// Drug Types
export interface Drug {
  id: EntityId;
  ndc: NDCString;
  generic_name: string;
  brand_name?: string;
  strength: string;
  dosage_form: DosageForm;
  route: Route;
  manufacturer_name?: string;
  substance_name?: string;
  dea_schedule?: DEASchedule;
  is_active: boolean;
  date_created: TimestampString;
  last_updated: TimestampString;
  active_ingredients?: ActiveIngredient[];
  packaging_info?: PackagingInfo[];
  therapeutic_class?: string;
  indication?: string;
  contraindications?: string[];
  side_effects?: string[];
  interactions?: DrugInteraction[];
}

export type DosageForm = 
  | 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'CREAM' | 'OINTMENT'
  | 'PATCH' | 'INHALER' | 'DROPS' | 'SPRAY' | 'SUPPOSITORY' | 'POWDER';

export type Route = 
  | 'ORAL' | 'TOPICAL' | 'INJECTION' | 'INHALATION' | 'SUBLINGUAL'
  | 'RECTAL' | 'OPHTHALMIC' | 'OTIC' | 'NASAL' | 'TRANSDERMAL';

export type DEASchedule = 'CI' | 'CII' | 'CIII' | 'CIV' | 'CV';

export interface ActiveIngredient {
  name: string;
  strength: string;
  unit: string;
}

export interface PackagingInfo {
  package_ndc: string;
  description: string;
  marketing_start_date?: DateString;
  marketing_end_date?: DateString;
  sample: boolean;
}

export interface DrugInteraction {
  id: EntityId;
  drug_id: EntityId;
  interacting_drug_id?: EntityId;
  interacting_substance?: string;
  severity: InteractionSeverity;
  description: string;
  mechanism?: string;
  management?: string;
  references?: string[];
}

export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';

// Inventory Types
export interface InventoryItem {
  id: EntityId;
  store_id: EntityId;
  drug_id: EntityId;
  quantity_on_hand: number;
  reorder_level: number;
  max_level?: number;
  unit_cost?: number;
  selling_price?: number;
  lot_number?: string;
  expiration_date?: DateString;
  supplier_id?: EntityId;
  location?: string;
  is_active: boolean;
  date_created: TimestampString;
  last_updated: TimestampString;
  drug?: Drug;
  store?: Store;
  audit_logs?: InventoryAuditLog[];
}

export interface InventoryAuditLog {
  id: EntityId;
  inventory_id: EntityId;
  store_id: EntityId;
  drug_id: EntityId;
  transaction_type: TransactionType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  reference_number?: string;
  performed_by: EntityId;
  transaction_date: TimestampString;
  user?: User;
  drug?: Drug;
}

export type TransactionType = 
  | 'prescription_fill' | 'return_to_stock' | 'expire' | 'audit'
  | 'shipment_received' | 'initial_inventory' | 'transfer_out' | 'transfer_in'
  | 'damaged' | 'recalled' | 'donation';

// Prescription Types
export interface Prescription {
  id: EntityId;
  patient_id: EntityId;
  prescriber_id: EntityId;
  drug_id: EntityId;
  store_id: EntityId;
  rx_number: string;
  quantity: number;
  days_supply: number;
  refills_remaining: number;
  refills_authorized: number;
  sig: string; // Prescription directions
  date_written: DateString;
  date_filled?: DateString;
  date_dispensed?: DateString;
  status: PrescriptionStatus;
  priority: PrescriptionPriority;
  insurance_id?: EntityId;
  copay_amount?: number;
  insurance_paid?: number;
  patient_paid?: number;
  is_controlled_substance: boolean;
  generic_substitution_allowed: boolean;
  notes?: string;
  patient?: Patient;
  prescriber?: Prescriber;
  drug?: Drug;
  fills?: PrescriptionFill[];
}

export type PrescriptionStatus = 
  | 'pending' | 'in_progress' | 'ready' | 'dispensed' | 'partial'
  | 'cancelled' | 'returned' | 'on_hold' | 'expired';

export type PrescriptionPriority = 'routine' | 'urgent' | 'stat' | 'asap';

export interface PrescriptionFill {
  id: EntityId;
  prescription_id: EntityId;
  fill_number: number;
  quantity_dispensed: number;
  date_filled: DateString;
  pharmacist_id: EntityId;
  technician_id?: EntityId;
  lot_number?: string;
  expiration_date?: DateString;
  ndc_dispensed?: NDCString;
  cost?: number;
  price?: number;
  insurance_claim_id?: string;
}

// Patient Types
export interface Patient {
  id: EntityId;
  first_name: string;
  last_name: string;
  date_of_birth: DateString;
  gender: Gender;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone: PhoneString;
  email?: EmailString;
  emergency_contact?: EmergencyContact;
  allergies?: Allergy[];
  insurance?: Insurance[];
  medical_conditions?: MedicalCondition[];
  is_active: boolean;
  date_created: TimestampString;
  last_visit?: DateString;
  preferred_language?: string;
  communication_preferences?: CommunicationPreference[];
}

export type Gender = 'male' | 'female' | 'other' | 'unknown' | 'not_specified';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: PhoneString;
  email?: EmailString;
}

export interface Allergy {
  id: EntityId;
  patient_id: EntityId;
  allergen: string;
  allergy_type: AllergyType;
  severity: AllergySeverity;
  reaction?: string;
  onset_date?: DateString;
  notes?: string;
}

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';

export interface Insurance {
  id: EntityId;
  patient_id: EntityId;
  insurance_name: string;
  policy_number: string;
  group_number?: string;
  member_id: string;
  plan_type: InsurancePlanType;
  effective_date: DateString;
  expiration_date?: DateString;
  copay_amount?: number;
  deductible?: number;
  is_primary: boolean;
  is_active: boolean;
}

export type InsurancePlanType = 
  | 'commercial' | 'medicare' | 'medicaid' | 'tricare' | 'workers_comp'
  | 'cash' | 'manufacturer_coupon' | 'patient_assistance';

export interface MedicalCondition {
  id: EntityId;
  patient_id: EntityId;
  condition_name: string;
  icd_code?: string;
  severity?: string;
  status: ConditionStatus;
  diagnosis_date?: DateString;
  notes?: string;
}

export type ConditionStatus = 'active' | 'resolved' | 'chronic' | 'episodic' | 'remission';

// Prescriber Types
export interface Prescriber {
  id: EntityId;
  first_name: string;
  last_name: string;
  title: string;
  specialty?: string;
  dea_number: DEAString;
  npi: string;
  phone: PhoneString;
  fax?: PhoneString;
  email?: EmailString;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  is_active: boolean;
  date_created: TimestampString;
}

// =============================================================================
// Component Prop Types
// =============================================================================

// Base Component Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Button Component Types
export interface PharmaButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  tooltip?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
}

export type ButtonVariant = 
  | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  | 'light' | 'dark' | 'outline-primary' | 'outline-secondary'
  | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Form Component Types
export interface PharmaFormGroupProps extends BaseComponentProps {
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  fieldType?: FieldType;
  value?: any;
  onChange?: (value: any, event?: ChangeEvent) => void;
  onBlur?: (event: any) => void;
  onFocus?: (event: any) => void;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
}

export type FieldType = 
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch'
  | 'date' | 'datetime-local' | 'time' | 'file' | 'hidden'
  | 'ndc' | 'dea' | 'npi' | 'phone' | 'zipcode';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  data?: any;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
  when?: (formData: any) => boolean;
}

export type ValidationType = 
  | 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'phone'
  | 'ndc' | 'dea' | 'npi' | 'custom' | 'asyncCustom';

// Modal Component Types
export interface PharmaModalProps extends BaseComponentProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  size?: ModalSize;
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  fullscreen?: boolean | BreakpointFullscreen;
  animation?: boolean;
  dialogClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onShow?: () => void;
  onShown?: () => void;
  onHidden?: () => void;
  closeButton?: boolean;
  footer?: ReactNode;
  preventClose?: boolean;
}

export type ModalSize = 'sm' | 'lg' | 'xl';
export type BreakpointFullscreen = 'sm-down' | 'md-down' | 'lg-down' | 'xl-down' | 'xxl-down';

// Table Component Types
export interface PharmaTableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig<T>;
  actions?: TableAction<T>[];
  emptyMessage?: string;
  loadingMessage?: string;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  responsive?: boolean;
  size?: TableSize;
  variant?: TableVariant;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  accessor?: (row: T) => any;
  className?: string;
  headerClassName?: string;
  hidden?: boolean;
  resizable?: boolean;
  format?: ColumnFormat;
}

export type ColumnFormat = 
  | 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'datetime'
  | 'boolean' | 'badge' | 'link' | 'button' | 'custom';

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  position?: 'top' | 'bottom' | 'both';
}

export interface SortingConfig {
  enabled: boolean;
  defaultSort?: SortConfig;
  multiSort?: boolean;
  sortIcons?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilteringConfig {
  enabled: boolean;
  globalSearch?: boolean;
  columnFilters?: boolean;
  advancedFilters?: boolean;
  filterDebounce?: number;
}

export interface SelectionConfig<T = any> {
  enabled: boolean;
  mode: 'single' | 'multiple';
  onSelectionChange: (selected: T[]) => void;
  selectedRows?: T[];
  selectableRowFilter?: (row: T) => boolean;
  preserveSelection?: boolean;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  onClick: (row: T, index: number) => void;
  visible?: (row: T, index: number) => boolean;
  disabled?: (row: T, index: number) => boolean;
  tooltip?: string | ((row: T, index: number) => string);
}

export type TableSize = 'sm' | 'md' | 'lg';
export type TableVariant = 'light' | 'dark';

// Alert Component Types
export interface PharmaAlertProps extends BaseComponentProps {
  variant?: AlertVariant;
  dismissible?: boolean;
  onClose?: () => void;
  show?: boolean;
  title?: string;
  icon?: ReactNode;
  actions?: AlertAction[];
  timeout?: number;
  position?: AlertPosition;
  animation?: boolean;
}

export type AlertVariant = 
  | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export interface AlertAction {
  label: string;
  variant?: ButtonVariant;
  onClick: () => void;
}

export type AlertPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Card Component Types
export interface PharmaCardProps extends BaseComponentProps {
  variant?: CardVariant;
  size?: ComponentSize;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: CardAction[];
  footer?: ReactNode;
  loading?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  hoverable?: boolean;
  bordered?: boolean;
  shadow?: CardShadow;
}

export type CardVariant = 
  | 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  | 'light' | 'dark' | 'gradient' | 'glass';

export interface CardAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

export type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// =============================================================================
// API and Data Types
// =============================================================================

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  filters?: FilterCriteria[];
  sort?: SortConfig[];
  page?: number;
  pageSize?: number;
}

export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType?: DataType;
}

export type FilterOperator = 
  | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'nin' | 'like' | 'nlike'
  | 'startsWith' | 'endsWith' | 'contains' | 'between' | 'exists' | 'nexists';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array' | 'object';

// =============================================================================
// Performance and Utility Types
// =============================================================================

// Performance Types
export interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  category: PerformanceCategory;
  details?: any;
}

export type PerformanceCategory = 
  | 'component-render' | 'api-call' | 'data-processing' | 'user-interaction'
  | 'navigation' | 'calculation' | 'validation' | 'search';

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollThreshold?: number;
  cacheSize?: number;
}

// Event Handler Types
export type PharmaEventHandler<T = any> = (data: T, event?: Event) => void;
export type PharmaAsyncEventHandler<T = any> = (data: T, event?: Event) => Promise<void>;
export type PharmaFormEventHandler = (event: FormEvent<HTMLFormElement>) => void;
export type PharmaChangeEventHandler<T = any> = (value: T, event?: ChangeEvent) => void;

// Theme and Styling Types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
  infoColor: string;
  lightColor: string;
  darkColor: string;
  fontFamily: string;
  fontSize: ComponentSize;
  borderRadius: string;
  spacing: SpacingConfig;
  breakpoints: BreakpointConfig;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// =============================================================================
// Type Guards and Utility Functions
// =============================================================================

// Type Guards
export const isUser = (obj: any): obj is User => {
  return typeof obj === 'object' && obj !== null && 
         typeof obj.id !== 'undefined' && 
         typeof obj.email === 'string' &&
         typeof obj.role === 'string';
};

export const isDrug = (obj: any): obj is Drug => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.ndc === 'string' &&
         typeof obj.generic_name === 'string';
};

export const isInventoryItem = (obj: any): obj is InventoryItem => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.store_id !== 'undefined' &&
         typeof obj.drug_id !== 'undefined' &&
         typeof obj.quantity_on_hand === 'number';
};

export const isPrescription = (obj: any): obj is Prescription => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.rx_number === 'string' &&
         typeof obj.patient_id !== 'undefined' &&
         typeof obj.drug_id !== 'undefined';
};

export const isPatient = (obj: any): obj is Patient => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.first_name === 'string' &&
         typeof obj.last_name === 'string' &&
         typeof obj.date_of_birth === 'string';
};

// Validation Type Guards
export const isValidNDC = (ndc: string): ndc is NDCString => {
  const cleaned = ndc.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

export const isValidDEA = (dea: string): dea is DEAString => {
  return /^[A-Z]{2}[0-9]{7}$/.test(dea);
};

export const isValidEmail = (email: string): email is EmailString => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): phone is PhoneString => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

// Export all types
export default {
  // Core types
  User,
  Store,
  Drug,
  InventoryItem,
  Prescription,
  Patient,
  Prescriber,
  
  // Component types
  PharmaButtonProps,
  PharmaFormGroupProps,
  PharmaModalProps,
  PharmaTableProps,
  PharmaAlertProps,
  PharmaCardProps,
  
  // API types
  ApiResponse,
  SearchParams,
  
  // Type guards
  isUser,
  isDrug,
  isInventoryItem,
  isPrescription,
  isPatient,
  isValidNDC,
  isValidDEA,
  isValidEmail,
  isValidPhone
};