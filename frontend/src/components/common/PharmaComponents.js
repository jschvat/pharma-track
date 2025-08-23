/**
 * PharmaTraK Custom Components Index
 * 
 * Centralized export for all custom PharmaTraK components.
 * Provides easy importing and consistent component availability.
 * 
 * Usage:
 * import { PharmaButton, PharmaModal, PharmaFormGroup } from './common/PharmaComponents';
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

// Button Components
export { default as PharmaButton } from './PharmaButton';
export {
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  WarningButton,
  InfoButton,
  SaveButton,
  CancelButton,
  DeleteButton,
  EditButton,
  ViewButton
} from './PharmaButton';

// Modal Components
export { default as PharmaModal } from './PharmaModal';
export {
  ConfirmationModal,
  FormModal as PharmaFormModal,
  InfoModal,
  LoadingModal
} from './PharmaModal';

// Form Components
export { default as PharmaFormGroup } from './PharmaFormGroup';
export {
  EmailField,
  PasswordField,
  PhoneField,
  NumberField,
  TextAreaField,
  SelectField,
  FileField,
  NDCField,
  DEANumberField,
  PharmacyLicenseField
} from './PharmaFormGroup';

// Card Components (Phase 2)
export { default as PharmaCard } from './PharmaCard';
export {
  StatsCard,
  DashboardCard,
  SettingsCard,
  GradientCard,
  LoadingCard,
  AlertCard
} from './PharmaCard';

// Table Components (Phase 2)
export { default as PharmaTable } from './PharmaTable';
export {
  DataTable as PharmaDataTable,
  SelectableTable,
  ActionTable,
  CompactTable
} from './PharmaTable';

// Alert Components (Phase 2)
export { default as PharmaAlert } from './PharmaAlert';
export {
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  ToastAlert,
  ActionAlert,
  useNotification
} from './PharmaAlert';

// Dropdown Components (existing)
export { default as PharmaDropdown } from './PharmaDropdown';
export { default as MultiSelectDropdown } from './MultiSelectDropdown';

// Phase 4: Advanced Components
export { default as PharmaForm } from './PharmaForm';
export {
  LoginForm,
  UserForm,
  DrugForm,
  InventoryForm,
  MultiStepForm
} from './PharmaForm';

export { default as PharmaProgressBar } from './PharmaProgressBar';
export {
  InventoryProgress,
  ExpirationProgress,
  PrescriptionProgress,
  AuditProgress,
  LoadingProgress,
  FormProgress
} from './PharmaProgressBar';

export { default as PharmaTabs } from './PharmaTabs';
export {
  InventoryTabs,
  UserManagementTabs,
  PrescriptionWorkflowTabs,
  ReportTabs,
  SettingsTabs
} from './PharmaTabs';

export { default as PharmaDataGrid } from './PharmaDataGrid';
export {
  InventoryDataGrid,
  UserDataGrid,
  AuditDataGrid
} from './PharmaDataGrid';

export { default as PharmaDatePicker } from './PharmaDatePicker';
export {
  ExpirationDatePicker,
  PrescriptionDatePicker,
  AuditDatePicker,
  ShipmentDatePicker
} from './PharmaDatePicker';

// Phase 6: Production-Ready Components
export { default as PharmaSearch } from './PharmaSearch';
export {
  DrugSearch,
  NDCSearch,
  ManufacturerSearch,
  PrescriptionSearch,
  PatientSearch
} from './PharmaSearch';

export { default as PharmaFileUpload } from './PharmaFileUpload';
export {
  PrescriptionUpload,
  InvoiceUpload,
  ReportUpload,
  ImageUpload
} from './PharmaFileUpload';

export { default as PharmaNotificationSystem } from './PharmaNotificationSystem';
export {
  NotificationProvider,
  NotificationBell,
  useNotifications
} from './PharmaNotificationSystem';

export { default as PharmaErrorBoundary } from './PharmaErrorBoundary';
export {
  ErrorProvider,
  useErrorHandler,
  withErrorBoundary,
  InventoryErrorBoundary,
  PrescriptionErrorBoundary,
  UserManagementErrorBoundary,
  ErrorLogger
} from './PharmaErrorBoundary';

export { default as PharmaDashboardWidget } from './PharmaDashboardWidget';
export {
  StatsWidget,
  ProgressWidget,
  AlertWidget,
  QuickActionWidget,
  InventoryStatsWidget,
  PrescriptionAlertsWidget,
  PharmacyQuickActionsWidget,
  WIDGET_SIZES,
  WIDGET_TYPES,
  REFRESH_INTERVALS
} from './PharmaDashboardWidget';

// Phase 7: Advanced UI Components
export { default as PharmaTooltip } from './PharmaTooltip';
export {
  TooltipProvider,
  DrugTooltip,
  DosageTooltip,
  InteractionTooltip,
  InventoryTooltip,
  HelpTooltip,
  useTooltips,
  POSITIONS,
  TOOLTIP_TYPES,
  TooltipPositioner
} from './PharmaTooltip';

export { default as PharmaBreadcrumbs } from './PharmaBreadcrumbs';
export {
  BreadcrumbProvider,
  DashboardBreadcrumbs,
  InventoryBreadcrumbs,
  PrescriptionBreadcrumbs,
  CompactBreadcrumbs,
  MobileBreadcrumbs,
  useBreadcrumbs,
  BreadcrumbUtils,
  BREADCRUMB_TYPES,
  ROUTE_PATTERNS,
  BreadcrumbGenerator
} from './PharmaBreadcrumbs';

export { default as PharmaReportGenerator } from './PharmaReportGenerator';
export {
  ReportProvider,
  InventoryReportGenerator,
  PrescriptionReportGenerator,
  FinancialReportGenerator,
  AuditReportGenerator,
  QuickReportButton,
  useReports,
  ReportUtils,
  REPORT_TYPES,
  OUTPUT_FORMATS,
  CHART_TYPES,
  ReportGenerator
} from './PharmaReportGenerator';

// Performance Optimization Components
export { default as PharmaPerformanceOptimizer } from './PharmaPerformanceOptimizer';
export {
  PerformanceMonitor,
  PharmaMemo,
  usePharmaDebounce,
  usePharmaThrottle,
  VirtualizedPharmaList,
  PharmaLazyImage,
  PharmaOptimizedSearch,
  useCleanup,
  usePerformanceMonitor,
  useBatchedUpdates,
  usePharmaPreloader,
  PerformanceProvider,
  usePerformance,
  createPharmaLazyComponent,
  BundleOptimizer
} from './PharmaPerformanceOptimizer';

// TypeScript Type Definitions
// Note: Types are imported from PharmaTypes.ts when using TypeScript
// For JavaScript users, these provide runtime type validation through exported type guards
export {
  isUser,
  isDrug,
  isInventoryItem,
  isPrescription,
  isPatient,
  isValidNDC,
  isValidDEA,
  isValidEmail,
  isValidPhone
} from './PharmaTypes';

// Other Common Components (existing)
export { default as FormField } from './FormField';
export { default as FormModal } from './FormModal';
export { default as DataTable } from './DataTable';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as AlertMessage } from './AlertMessage';
export { default as EmptyState } from './EmptyState';
export { default as StatusBadge } from './StatusBadge';
export { default as TransactionBadge } from './TransactionBadge';
export { default as CardHeader } from './CardHeader';
export { default as ActionButtonGroup } from './ActionButtonGroup';
export { default as SearchFilterBar } from './SearchFilterBar';
export { default as FormattedDate } from './FormattedDate';
export { default as NavIcon } from './NavIcon';