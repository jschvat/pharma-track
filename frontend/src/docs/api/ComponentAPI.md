# PharmaTraK Component API Reference

Complete API documentation for all PharmaTraK components with TypeScript definitions, props, and usage examples.

## Component Index

- [PharmaButton](#pharmabutton)
- [PharmaModal](#pharmamodal) 
- [PharmaForm](#pharmaform)
- [PharmaTable](#pharmatable)
- [PharmaSearch](#pharmasearch)
- [PharmaTooltip](#pharmatooltip)
- [PharmaBreadcrumbs](#pharmabreadcrumbs)
- [PharmaReportGenerator](#pharmareportgenerator)
- [PharmaErrorBoundary](#pharmaerrorboundary)
- [PharmaNotificationSystem](#pharmanotificationsystem)

---

## PharmaButton

Interactive buttons with pharmacy-specific actions and confirmations.

### Props

```typescript
interface PharmaButtonProps extends BaseComponentProps {
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

type ButtonVariant = 
  | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  | 'light' | 'dark' | 'outline-primary' | 'outline-secondary'
  | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info';

type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### Examples

```jsx
// Basic usage
<PharmaButton variant="primary" onClick={handleClick}>
  Save Changes
</PharmaButton>

// With confirmation
<PharmaButton
  variant="danger"
  confirmAction
  confirmMessage="Delete this medication?"
  onClick={handleDelete}
>
  Delete
</PharmaButton>

// Loading state
<PharmaButton loading loadingText="Saving...">
  Save
</PharmaButton>
```

### Predefined Buttons

```jsx
import { SaveButton, CancelButton, DeleteButton } from '@pharmatrak/component-library';

<SaveButton onClick={handleSave} />
<CancelButton onClick={handleCancel} />
<DeleteButton onClick={handleDelete} />
```

---

## PharmaModal

Accessible modal dialogs with pharmacy workflows.

### Props

```typescript
interface PharmaModalProps extends BaseComponentProps {
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
  closeButton?: boolean;
  footer?: ReactNode;
  preventClose?: boolean;
  onShow?: () => void;
  onShown?: () => void;
  onHidden?: () => void;
}

type ModalSize = 'sm' | 'lg' | 'xl';
type BreakpointFullscreen = 'sm-down' | 'md-down' | 'lg-down' | 'xl-down' | 'xxl-down';
```

### Examples

```jsx
// Basic modal
<PharmaModal show={showModal} onHide={() => setShowModal(false)} title="Edit Medication">
  <p>Modal content here</p>
</PharmaModal>

// Confirmation modal
<ConfirmationModal
  show={showConfirm}
  onHide={() => setShowConfirm(false)}
  title="Confirm Action"
  message="Are you sure you want to delete this prescription?"
  onConfirm={handleConfirm}
  onCancel={() => setShowConfirm(false)}
/>

// Form modal
<FormModal
  show={showForm}
  onHide={() => setShowForm(false)}
  title="Add New Patient"
  onSubmit={handleSubmit}
>
  <PatientForm />
</FormModal>
```

---

## PharmaForm

Advanced form handling with pharmacy-specific validation.

### Props

```typescript
interface PharmaFormProps extends BaseComponentProps {
  onSubmit: (data: any, event?: FormEvent) => void | Promise<void>;
  validationRules?: ValidationRules;
  initialValues?: Record<string, any>;
  resetOnSubmit?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  showProgress?: boolean;
  progressSteps?: string[];
  currentStep?: number;
}

interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
  when?: (formData: any) => boolean;
}

type ValidationType = 
  | 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'phone'
  | 'ndc' | 'dea' | 'npi' | 'custom' | 'asyncCustom';
```

### Examples

```jsx
// Basic form
<PharmaForm
  onSubmit={handleSubmit}
  validationRules={{
    name: [{ type: 'required', message: 'Name is required' }],
    email: [{ type: 'email', message: 'Valid email required' }]
  }}
>
  <PharmaFormGroup name="name" label="Full Name" required />
  <PharmaFormGroup name="email" label="Email" fieldType="email" required />
</PharmaForm>

// Multi-step form
<MultiStepForm
  steps={['Patient Info', 'Insurance', 'Prescriptions']}
  onSubmit={handleSubmit}
  onStepChange={handleStepChange}
>
  <PatientInfoStep />
  <InsuranceStep />
  <PrescriptionsStep />
</MultiStepForm>
```

---

## PharmaTable

High-performance data tables with virtual scrolling.

### Props

```typescript
interface PharmaTableProps<T = any> extends BaseComponentProps {
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
  rowClassName?: (row: T, index: number) => string;
}

interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  accessor?: (row: T) => any;
  format?: ColumnFormat;
}

type ColumnFormat = 
  | 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'datetime'
  | 'boolean' | 'badge' | 'link' | 'button' | 'ndc' | 'dea' | 'custom';
```

### Examples

```jsx
// Basic table
<PharmaTable
  data={medications}
  columns={[
    { key: 'name', label: 'Medication', sortable: true },
    { key: 'ndc', label: 'NDC', format: 'ndc' },
    { key: 'quantity', label: 'Quantity', format: 'number', align: 'right' },
    { key: 'expiration', label: 'Expires', format: 'date' }
  ]}
  pagination={{ enabled: true, pageSize: 25 }}
  sorting={{ enabled: true }}
/>

// Advanced table with actions
<PharmaTable
  data={inventory}
  columns={inventoryColumns}
  actions={[
    {
      key: 'edit',
      label: 'Edit',
      variant: 'primary',
      onClick: (row) => editItem(row.id)
    },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      confirmAction: true,
      onClick: (row) => deleteItem(row.id)
    }
  ]}
  selection={{
    enabled: true,
    mode: 'multiple',
    onSelectionChange: handleSelection
  }}
/>
```

---

## PharmaSearch

Intelligent search with autocomplete and filtering.

### Props

```typescript
interface PharmaSearchProps extends BaseComponentProps {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  debounce?: number;
  minLength?: number;
  maxResults?: number;
  showResults?: boolean;
  loading?: boolean;
  results?: SearchResult[];
  onResultSelect?: (result: SearchResult) => void;
  searchTypes?: SearchType[];
  filters?: SearchFilter[];
  advanced?: boolean;
}

interface SearchResult {
  id: string | number;
  title: string;
  description?: string;
  type?: string;
  data?: any;
}

type SearchType = 'drug' | 'ndc' | 'manufacturer' | 'patient' | 'prescriber' | 'prescription';
```

### Examples

```jsx
// Basic search
<PharmaSearch
  placeholder="Search medications..."
  onSearch={handleSearch}
  debounce={300}
  minLength={2}
/>

// Drug search with autocomplete
<DrugSearch
  onSearch={searchDrugs}
  onResultSelect={selectDrug}
  searchTypes={['drug', 'ndc', 'manufacturer']}
  showFilters={true}
/>

// Advanced search
<PharmaSearch
  advanced
  filters={[
    { key: 'category', label: 'Category', type: 'select', options: categories },
    { key: 'strength', label: 'Strength', type: 'text' },
    { key: 'dosageForm', label: 'Dosage Form', type: 'multiselect', options: dosageForms }
  ]}
  onSearch={handleAdvancedSearch}
/>
```

---

## PharmaTooltip

Context-aware tooltips with pharmacy information.

### Props

```typescript
interface PharmaTooltipProps extends BaseComponentProps {
  content: ReactNode | string | (() => ReactNode);
  position?: TooltipPosition;
  trigger?: TooltipTrigger;
  delay?: number;
  disabled?: boolean;
  show?: boolean;
  offset?: [number, number];
  arrow?: boolean;
  interactive?: boolean;
  maxWidth?: number;
  theme?: TooltipTheme;
}

type TooltipPosition = 
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  | 'auto';

type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';
type TooltipTheme = 'dark' | 'light' | 'info' | 'warning' | 'error';
```

### Examples

```jsx
// Basic tooltip
<PharmaTooltip content="This is helpful information">
  <button>Hover me</button>
</PharmaTooltip>

// Drug tooltip
<DrugTooltip
  drug={drugData}
  showInteractions={true}
  showContraindications={true}
>
  <span className="drug-name">{drug.name}</span>
</DrugTooltip>

// Interactive tooltip
<PharmaTooltip
  interactive
  trigger="click"
  content={
    <div>
      <h4>Drug Information</h4>
      <p>Detailed drug information...</p>
      <button onClick={viewFullInfo}>View Full Info</button>
    </div>
  }
>
  <i className="fas fa-info-circle" />
</PharmaTooltip>
```

---

## PharmaBreadcrumbs

Navigation breadcrumbs for pharmacy workflows.

### Props

```typescript
interface PharmaBreadcrumbsProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode | string;
  maxItems?: number;
  collapsible?: boolean;
  responsive?: boolean;
  showBackButton?: boolean;
  onNavigate?: (path: string) => void;
}

interface BreadcrumbItem {
  label: ReactNode | string;
  path?: string;
  icon?: ReactNode;
  current?: boolean;
  disabled?: boolean;
  data?: any;
}
```

### Examples

```jsx
// Basic breadcrumbs
<PharmaBreadcrumbs
  items={[
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Medications', path: '/inventory/medications' },
    { label: 'Edit', current: true }
  ]}
/>

// Responsive breadcrumbs
<PharmaBreadcrumbs
  items={breadcrumbItems}
  maxItems={4}
  collapsible
  responsive
  showBackButton
/>

// Specialized breadcrumbs
<InventoryBreadcrumbs
  category="Medications"
  subcategory="Analgesics"
  itemId={drugId}
/>
```

---

## PharmaReportGenerator

Dynamic report creation and export system.

### Props

```typescript
interface PharmaReportGeneratorProps extends BaseComponentProps {
  reportTypes?: ReportType[];
  outputFormats?: OutputFormat[];
  onGenerate?: (config: ReportConfig) => void | Promise<void>;
  onExport?: (report: ReportData, format: OutputFormat) => void;
  includeChart?: boolean;
  chartTypes?: ChartType[];
  filters?: ReportFilter[];
  templates?: ReportTemplate[];
  scheduling?: boolean;
}

interface ReportConfig {
  type: ReportType;
  title?: string;
  dateRange?: DateRange;
  filters?: Record<string, any>;
  outputFormat?: OutputFormat;
  chartType?: ChartType;
  includeChart?: boolean;
  template?: string;
}

type ReportType = 'inventory' | 'prescriptions' | 'financial' | 'audit' | 'compliance';
type OutputFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'print';
type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area';
```

### Examples

```jsx
// Basic report generator
<PharmaReportGenerator
  reportTypes={['inventory', 'prescriptions', 'financial']}
  outputFormats={['pdf', 'excel', 'csv']}
  onGenerate={handleReportGeneration}
/>

// Specialized report generators
<InventoryReportGenerator
  onGenerate={generateInventoryReport}
  includeChart
  chartTypes={['bar', 'pie']}
/>

<PrescriptionReportGenerator
  filters={prescriptionFilters}
  templates={reportTemplates}
  scheduling
/>
```

---

## PharmaErrorBoundary

Error boundary with pharmacy-specific error handling.

### Props

```typescript
interface PharmaErrorBoundaryProps extends BaseComponentProps {
  fallback?: ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  hasError: boolean;
}
```

### Examples

```jsx
// Basic error boundary
<PharmaErrorBoundary>
  <MyComponent />
</PharmaErrorBoundary>

// Custom error handling
<PharmaErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Pharmacy error:', error);
    logError(error, errorInfo);
  }}
  fallback={CustomErrorFallback}
>
  <PrescriptionWorkflow />
</PharmaErrorBoundary>

// Specialized error boundaries
<InventoryErrorBoundary>
  <InventoryManagement />
</InventoryErrorBoundary>
```

---

## PharmaNotificationSystem

Comprehensive notification management.

### Props

```typescript
interface PharmaNotificationSystemProps extends BaseComponentProps {
  position?: NotificationPosition;
  autoClose?: boolean;
  timeout?: number;
  maxNotifications?: number;
  enableSound?: boolean;
  persistCritical?: boolean;
  groupSimilar?: boolean;
}

interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message: string;
  actions?: NotificationAction[];
  persistent?: boolean;
  timeout?: number;
  data?: any;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'critical';
type NotificationPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### Examples

```jsx
// Basic notification system
<PharmaNotificationSystem
  position="top-right"
  autoClose
  timeout={5000}
/>

// Using notifications
const { addNotification } = useNotifications();

addNotification({
  type: 'success',
  title: 'Prescription Filled',
  message: 'Prescription #12345 has been successfully filled.',
  timeout: 3000
});

addNotification({
  type: 'critical',
  title: 'Drug Interaction Alert',
  message: 'Potential interaction detected between medications.',
  persistent: true,
  actions: [
    { label: 'Review', onClick: reviewInteraction },
    { label: 'Override', onClick: overrideInteraction }
  ]
});
```

---

## Common Types

### Base Component Props

```typescript
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}
```

### API Response Types

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

interface ApiError {
  field?: string;
  code: string;
  message: string;
  details?: any;
}
```

### Pharmacy Domain Types

```typescript
interface Drug {
  id: EntityId;
  ndc: NDCString;
  generic_name: string;
  brand_name?: string;
  strength: string;
  dosage_form: DosageForm;
  route: Route;
  manufacturer_name?: string;
  dea_schedule?: DEASchedule;
  is_active: boolean;
  active_ingredients?: ActiveIngredient[];
}

interface Patient {
  id: EntityId;
  first_name: string;
  last_name: string;
  date_of_birth: DateString;
  phone: PhoneString;
  email?: EmailString;
  allergies?: Allergy[];
  insurance?: Insurance[];
}

interface Prescription {
  id: EntityId;
  patient_id: EntityId;
  prescriber_id: EntityId;
  drug_id: EntityId;
  rx_number: string;
  quantity: number;
  days_supply: number;
  refills_remaining: number;
  status: PrescriptionStatus;
  date_written: DateString;
}
```

This API reference provides comprehensive documentation for all PharmaTraK components with TypeScript definitions, examples, and usage patterns specific to pharmacy workflows.