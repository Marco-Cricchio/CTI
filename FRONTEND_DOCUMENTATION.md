# CyberForge Sentinel - Frontend Documentation

**Repository:** https://github.com/Marco-Cricchio/CTI  
**Framework:** React 19.1.1 + TypeScript  
**Testing Framework:** React Testing Library (included) + Jest (for unit tests)  
**State Management:** React Context API  
**Routing:** React Router v7.7.1  
**HTTP Client:** Axios  
**UI Library:** CSS Modules + Custom Design System  

---

## 1. Architecture Overview

### Directory Structure
```
client/
├── package.json                   # Dependencies e scripts
├── tsconfig.json                  # TypeScript configuration
├── public/                        # Static assets
│   └── index.html                 # Single page entry point
└── src/
    ├── App.tsx                    # Main app component with routing
    ├── index.tsx                  # React DOM render entry point
    ├── style-guide.css            # Design system variables
    ├── index.css                  # Global styles
    ├── contexts/
    │   └── AuthContext.tsx        # Authentication state management
    ├── services/
    │   └── api.ts                 # Axios HTTP client configuration
    ├── hooks/
    │   └── useDashboardStats.ts   # Custom hook for dashboard data
    ├── pages/
    │   └── LoginPage.tsx          # Login page component
    ├── components/
    │   ├── Layout/
    │   │   ├── Header.tsx         # Top navigation bar
    │   │   └── Sidebar.tsx        # Left navigation sidebar
    │   ├── Dashboard/
    │   │   ├── MetricCard.tsx     # Stats card component
    │   │   └── IndicatorTable.tsx # Main data table component
    │   ├── Indicators/
    │   │   └── AddIndicatorForm.tsx # Form for create/edit IOCs
    │   └── shared/
    │       ├── Modal.tsx          # Reusable modal component
    │       └── Pagination.tsx     # Table pagination component
    └── styles/
        └── globals.css            # Additional global styles
```

### Technology Stack Analysis
- **React 19.1.1:** Latest stable version with concurrent features
- **TypeScript 5.9.2:** Full type safety across codebase
- **React Router v7.7.1:** Client-side routing with protected routes
- **Axios:** HTTP client with interceptors for JWT authentication
- **React Hot Toast:** User-friendly notification system
- **JWT-Decode:** Client-side JWT token parsing
- **CSS Modules:** Component-scoped styling architecture

### Key Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.7.1",
  "typescript": "^5.9.2",
  "jwt-decode": "^4.0.0",
  "react-hot-toast": "^2.5.2",
  "@types/jest": "^30.0.0"
}
```

---

## 2. Authentication Flow & Selectors

### Authentication Architecture
**Context:** `AuthContext.tsx` (React Context API)  
**Storage:** `localStorage` con chiave `accessToken`  
**Token Format:** JWT con payload `{ sub, email, role }`  
**Protected Routes:** Componente `ProtectedRoute` con redirect automatico  

### Login Flow
1. **Login Page:** `/login` - Rendering condizionale se utente non autenticato
2. **Login Form Submission:** POST `/auth/login` con `{ email, password }`
3. **JWT Storage:** `localStorage.setItem('accessToken', token)`
4. **User State Update:** Decode JWT e aggiorna context state
5. **Redirect:** Automatic redirect to `/` (Dashboard)

### Cypress Selectors per Authentication

#### LoginPage.tsx Selectors
```typescript
// Form Container
'[data-cy="login-container"]'           // styles.loginContainer
'[data-cy="login-card"]'                // styles.loginCard
'[data-cy="login-form"]'                // styles.loginForm

// Input Fields
'input[type="email"]'                   // Email input field
'input[type="password"]'                // Password input field
'#email'                                // Email input by ID
'#password'                             // Password input by ID

// Form Actions
'button[type="submit"]'                 // Login submit button
'[data-cy="login-button"]'              // Login button (needs to be added)

// Text Elements
'h1'                                    // "CyberForge Sentinel" title
'.subtitle'                             // "Threat Intelligence Platform" subtitle

// Loading States
'button:disabled'                       // Button during submission
'button:contains("Signing in...")'      // Loading button text
```

#### Authentication Status Selectors
```typescript
// User Authentication State
'[data-cy="user-email"]'                // Welcome message with email
'[data-cy="logout-button"]'             // Header logout button
'[data-cy="protected-content"]'         // Dashboard content (authenticated)

// Navigation Protection
'[data-cy="login-redirect"]'            // Redirect behavior from protected routes
```

---

## 3. Dashboard Components & Selectors

### Dashboard Architecture
**Route:** `/` (default protected route)  
**Components:** `DashboardPage` → `Header` + `Sidebar` + `MetricCard` + `IndicatorTable`  
**Data Flow:** `useDashboardStats` hook → API calls → Context state → UI rendering  

### Component Structure
```typescript
DashboardPage
├── Sidebar                             // Left navigation menu
├── Header                              // Top bar with user actions
├── MetricCard (x4)                     // Statistics cards
│   ├── New IOCs (24h)
│   ├── Critical Alerts
│   ├── Active Investigations
│   └── Data Feeds
└── IndicatorTable                      // Main data table with CRUD operations
    ├── Filters (Type, Threat Level)
    ├── Table Rows
    └── Pagination
```

### Cypress Selectors per Dashboard

#### Layout Components
```typescript
// Main Layout
'[data-cy="app-container"]'             // layoutStyles.appContainer
'[data-cy="main-content"]'              // layoutStyles.mainContent
'[data-cy="page-content"]'              // layoutStyles.pageContent
'[data-cy="dashboard-grid"]'            // dashboardStyles.dashboardGrid

// Header Component
'[data-cy="header"]'                    // styles.header
'[data-cy="new-indicator-button"]'      // + New Indicator button
'[data-cy="logout-button"]'             // Logout button
'[data-cy="welcome-message"]'           // Welcome user message

// Sidebar Component
'[data-cy="sidebar"]'                   // Navigation sidebar
'[data-cy="nav-dashboard"]'             // Dashboard navigation link
'[data-cy="nav-indicators"]'            // Indicators navigation link
```

#### MetricCard Selectors
```typescript
// Statistics Cards
'[data-cy="metric-card"]'               // Generic metric card
'[data-cy="metric-new-iocs"]'           // New IOCs (24h) card
'[data-cy="metric-critical-alerts"]'    // Critical Alerts card
'[data-cy="metric-investigations"]'     // Active Investigations card
'[data-cy="metric-data-feeds"]'         // Data Feeds card

// Card Content
'[data-cy="metric-title"]'              // Card title text
'[data-cy="metric-value"]'              // Card value number
'[data-cy="metric-loading"]'            // Loading state indicator
```

---

## 4. Indicators CRUD Components & Selectors

### CRUD Operations Architecture
**Table Component:** `IndicatorTable.tsx` - Lista, filtri, paginazione, delete  
**Form Component:** `AddIndicatorForm.tsx` - Crea/modifica indicatori  
**Modal Wrapper:** `Modal.tsx` - Container per form operations  
**API Integration:** `/indicators` endpoint con autenticazione JWT  

### Data Flow CRUD
1. **Create:** Header button → Modal → AddIndicatorForm → POST `/indicators`
2. **Read:** IndicatorTable → GET `/indicators` con paginazione e filtri
3. **Update:** Table Edit button → Modal → AddIndicatorForm → PATCH `/indicators/:id`
4. **Delete:** Table Delete button → Confirm dialog → DELETE `/indicators/:id`

### Cypress Selectors per Indicators

#### IndicatorTable.tsx Selectors
```typescript
// Table Container
'[data-cy="indicator-table"]'           // styles.container
'[data-cy="table-header"]'              // styles.tableHeader
'[data-cy="table-title"]'               // "Latest Indicators" title
'[data-cy="table-wrapper"]'             // styles.tableWrapper

// Filters
'[data-cy="filter-type"]'               // Type dropdown filter
'[data-cy="filter-threat-level"]'       // Threat level dropdown filter
'select[name="type"]'                   // Type filter by name attribute
'select[name="threat_level"]'           // Threat level filter by name attribute

// Table Structure
'[data-cy="indicators-table"]'          // styles.table
'[data-cy="table-header-ioc"]'          // "IOC Value" column header
'[data-cy="table-header-type"]'         // "Type" column header
'[data-cy="table-header-threat"]'       // "Threat Level" column header
'[data-cy="table-header-actions"]'      // "Actions" column header

// Table Rows
'[data-cy="indicator-row"]'             // styles.row (table row)
'[data-cy="indicator-value"]'           // styles.value (IOC value cell)
'[data-cy="indicator-type"]'            // styles.type (Type cell)
'[data-cy="threat-badge"]'              // styles.threatBadge (Threat level badge)
'[data-cy="threat-badge-low"]'          // Low threat level badge
'[data-cy="threat-badge-medium"]'       // Medium threat level badge
'[data-cy="threat-badge-high"]'         // High threat level badge
'[data-cy="threat-badge-critical"]'     // Critical threat level badge

// Actions
'[data-cy="edit-button"]'               // Edit indicator button
'[data-cy="delete-button"]'             // Delete indicator button
'[data-cy="delete-confirm"]'            // Delete confirmation dialog

// Loading & Empty States
'[data-cy="table-loading"]'             // Loading indicators message
'[data-cy="table-empty"]'               // Empty table state
```

#### AddIndicatorForm.tsx Selectors
```typescript
// Form Container
'[data-cy="indicator-form"]'            // styles.form
'[data-cy="form-group-value"]'          // Value input group
'[data-cy="form-group-type"]'           // Type select group
'[data-cy="form-group-threat"]'         // Threat level select group

// Form Inputs
'#value'                                // Indicator value input (by ID)
'#type'                                 // Type select (by ID)
'#threat_level'                         // Threat level select (by ID)
'input[type="text"]'                    // Indicator value input (by type)

// Input Options
'option[value="ip"]'                    // IP address option
'option[value="domain"]'                // Domain option
'option[value="url"]'                   // URL option
'option[value="file_hash"]'             // File hash option
'option[value="email"]'                 // Email option

'option[value="low"]'                   // Low threat level option
'option[value="medium"]'                // Medium threat level option
'option[value="high"]'                  // High threat level option
'option[value="critical"]'              // Critical threat level option

// Form Actions
'[data-cy="submit-button"]'             // styles.submitButton
'button[type="submit"]'                 // Submit button (by type)
'[data-cy="form-cancel"]'               // Cancel button (needs to be added)

// Loading States
'button:disabled'                       // Disabled button during submission
'button:contains("Saving...")'          // Loading button text
'button:contains("Update Indicator")'   // Edit mode button text
'button:contains("Add Indicator")'      // Create mode button text
```

#### Modal.tsx Selectors
```typescript
// Modal Structure
'[data-cy="modal-overlay"]'             // styles.overlay
'[data-cy="modal"]'                     // styles.modal
'[data-cy="modal-header"]'              // styles.header
'[data-cy="modal-content"]'             // styles.content

// Modal Actions
'[data-cy="modal-close"]'               // styles.closeButton (× button)
'[data-cy="modal-title"]'               // Modal title (h2)

// Modal States
'[data-cy="modal-add-indicator"]'       // "Add New Indicator" modal
'[data-cy="modal-edit-indicator"]'      // "Edit Indicator" modal
```

#### Pagination.tsx Selectors
```typescript
// Pagination Container
'[data-cy="pagination"]'                // Pagination component
'[data-cy="pagination-prev"]'           // Previous page button
'[data-cy="pagination-next"]'           // Next page button
'[data-cy="pagination-page"]'           // Page number buttons
'[data-cy="pagination-current"]'        // Current page indicator
'[data-cy="pagination-info"]'           // Items count information
```

---

## 5. Critical User Flows for E2E Testing

### Flow 1: Authentication Journey
```typescript
// Test: Full login and logout cycle
1. Visit '/' → Should redirect to '/login'
2. Fill email: 'test@cyberforge.com'
3. Fill password: 'testpassword123'
4. Click login button
5. Should redirect to '/' (Dashboard)
6. Verify user welcome message displays
7. Click logout button
8. Should redirect to '/login'
```

### Flow 2: Indicator Creation (Happy Path)
```typescript
// Test: Complete create indicator workflow
1. Login as authenticated user
2. Navigate to Dashboard '/'
3. Click '+ New Indicator' button
4. Modal should open with "Add New Indicator" title
5. Fill form:
   - Value: '192.168.1.1'
   - Type: 'ip'
   - Threat Level: 'high'
6. Click 'Add Indicator' button
7. Success toast should appear
8. Modal should close
9. Table should refresh and show new indicator
10. Verify indicator appears in table with correct data
```

### Flow 3: Indicator Edit & Update
```typescript
// Test: Edit existing indicator workflow
1. Login and navigate to Dashboard
2. Ensure at least one indicator exists in table
3. Click 'Edit' button on first indicator
4. Modal should open with "Edit Indicator" title
5. Form should be pre-populated with existing data
6. Modify threat level from 'medium' to 'critical'
7. Click 'Update Indicator' button
8. Success toast should appear
9. Modal should close
10. Table should refresh
11. Verify threat level badge updated to 'critical'
```

### Flow 4: Indicator Deletion
```typescript
// Test: Delete indicator with confirmation
1. Login and navigate to Dashboard
2. Ensure at least one indicator exists
3. Click 'Delete' button on first indicator
4. Confirmation dialog should appear
5. Click 'OK' to confirm deletion
6. Success toast should appear
7. Table should refresh
8. Indicator should no longer appear in table
9. Total count should decrease by 1
```

### Flow 5: Table Filtering & Pagination
```typescript
// Test: Filter and pagination functionality
1. Login and create multiple indicators with different types/levels
2. Use type filter to select 'ip' only
3. Table should show only IP indicators
4. Use threat level filter to select 'critical' only
5. Table should show only critical threats
6. Clear filters
7. If more than 10 indicators, test pagination:
   - Click 'Next' page button
   - Verify URL parameters change
   - Verify different indicators load
   - Click 'Previous' to return
```

### Flow 6: Error Handling & Validation
```typescript
// Test: Form validation and error states
1. Login and open "Add New Indicator" modal
2. Try to submit empty form
3. Should show validation error
4. Fill invalid email format in value field for email type
5. Backend should return validation error
6. Error toast should appear
7. Test network error simulation:
   - Disconnect network
   - Try to submit form
   - Should show network error message
```

---

## 6. API Integration Patterns

### HTTP Client Configuration (api.ts)
```typescript
baseURL: 'http://localhost:3001/api'
Authentication: Bearer token from localStorage['accessToken']
Request Interceptor: Automatic JWT attachment
Error Handling: Axios interceptors for 401/403 responses
```

### API Endpoints Used
```typescript
// Authentication
POST /auth/login              // User login
POST /auth/register           // User registration (if needed)

// Indicators CRUD
GET  /indicators              // List indicators (with pagination/filters)
GET  /indicators/:id          // Get single indicator
POST /indicators              // Create new indicator
PATCH /indicators/:id         // Update indicator
DELETE /indicators/:id        // Soft delete indicator

// Dashboard Stats
GET /indicators/stats         // Dashboard statistics
```

### Request/Response Patterns
```typescript
// List Indicators Response
{
  data: Indicator[],
  total: number,
  page: number,
  limit: number
}

// Single Indicator
{
  id: string,
  value: string,
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email',
  threat_level: 'low' | 'medium' | 'high' | 'critical',
  is_active: boolean,
  first_seen: string,
  last_seen: string,
  created_by: { id: string, email: string, role: string }
}

// Dashboard Stats Response
{
  newIocs24h: number,
  criticalAlerts: number,
  totalActiveIndicators: number,
  activeInvestigations: number,
  dataFeeds: number
}
```

---

## 7. Design System & Styling

### CSS Architecture
**Primary:** CSS Modules per component  
**Global:** `style-guide.css` con variabili CSS  
**Structure:** BEM-like naming convention  

### Key CSS Variables (style-guide.css)
```css
/* Colors */
--bg-primary: #0d1117         /* Main background */
--bg-secondary: #161b22       /* Cards, containers */
--bg-tertiary: #21262d        /* Inputs, modals */
--text-primary: #f0f6fc       /* Main text */
--text-secondary: #8b949e     /* Secondary text */
--accent-blue: #3b82f6        /* Primary actions */
--accent-orange: #fb923c      /* Warnings */
--accent-red: #ff4757         /* Errors, critical */

/* Spacing */
--spacing-xs: 0.25rem         /* 4px */
--spacing-sm: 0.5rem          /* 8px */
--spacing-md: 1rem            /* 16px */
--spacing-lg: 1.5rem          /* 24px */
--spacing-xl: 2rem            /* 32px */

/* Typography */
--font-thin: 100
--font-light: 300
--font-normal: 400
--font-bold: 700
```

### Threat Level Badge Colors
```css
.threatBadge.low { background-color: var(--accent-blue); }
.threatBadge.medium { background-color: var(--accent-orange); }
.threatBadge.high { background-color: var(--accent-red); }
.threatBadge.critical { background-color: #dc2626; }
```

---

## 8. State Management Patterns

### Authentication State (AuthContext)
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Usage Pattern
const { user, login, logout, isAuthenticated } = useAuth();
```

### Local Component State
```typescript
// IndicatorTable.tsx
const [indicators, setIndicators] = useState<Indicator[]>([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [filters, setFilters] = useState({ type: '', threat_level: '' });

// AddIndicatorForm.tsx
const [value, setValue] = useState('');
const [type, setType] = useState('ip');
const [threatLevel, setThreatLevel] = useState('low');
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Custom Hooks
```typescript
// useDashboardStats.ts
const { stats, loading, refetch } = useDashboardStats();

// Returns:
interface DashboardStats {
  newIocs24h: number;
  criticalAlerts: number;
  totalActiveIndicators: number;
  activeInvestigations: number;
  dataFeeds: number;
}
```

---

## 9. Testing Strategy & Recommendations

### Current Testing Setup
- **Framework:** Jest + React Testing Library (included in react-scripts)
- **Coverage:** No current test files exist
- **Scripts:** `npm test` disponibile tramite react-scripts

### Recommended Cypress Test Structure
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  it('should login successfully with valid credentials')
  it('should redirect to login when accessing protected route')
  it('should logout and redirect to login')
  it('should show error with invalid credentials')
})

// cypress/e2e/indicators-crud.cy.ts  
describe('Indicators CRUD Operations', () => {
  it('should create new indicator successfully')
  it('should edit existing indicator')
  it('should delete indicator with confirmation')
  it('should filter indicators by type and threat level')
  it('should paginate through indicators list')
})

// cypress/e2e/dashboard.cy.ts
describe('Dashboard Functionality', () => {
  it('should display correct statistics')
  it('should refresh data when indicator added/updated/deleted')
  it('should show loading states appropriately')
})
```

### Data-testid Recommendations
Il codebase attualmente **NON** contiene attributi `data-testid`. Per Cypress E2E testing, raccomando di aggiungere:

```typescript
// High Priority - Authentication
data-cy="login-form"
data-cy="email-input"
data-cy="password-input"
data-cy="login-button"
data-cy="logout-button"

// High Priority - CRUD Operations  
data-cy="new-indicator-button"
data-cy="indicator-form"
data-cy="submit-button"
data-cy="edit-button"
data-cy="delete-button"
data-cy="delete-confirm"

// Medium Priority - Table & Filters
data-cy="indicator-table"
data-cy="filter-type"
data-cy="filter-threat-level"
data-cy="pagination-next"
data-cy="pagination-prev"

// Low Priority - UI Elements
data-cy="modal"
data-cy="toast-message"
data-cy="loading-spinner"
```

---

## 10. Development Commands

### Available Scripts
```bash
# Development
npm start                     # Start development server (http://localhost:3000)
npm run build                 # Production build
npm test                      # Run Jest tests (interactive watch mode)
npm run eject                 # Eject from react-scripts (irreversible)

# Recommended additions for CI/CD
npm run test:ci               # Non-interactive test run (needs to be added)
npm run lint                  # ESLint check (needs to be added)
npm run typecheck             # TypeScript compilation check (needs to be added)
```

### Environment Configuration
```bash
# Development
REACT_APP_API_URL=http://localhost:3001/api

# Production
REACT_APP_API_URL=https://api.cyberforge-sentinel.com/api
```

### Browser Support
```json
"browserslist": {
  "production": [">0.2%", "not dead", "not op_mini all"],
  "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
}
```

---

## 11. Next Steps for Cypress Implementation

### 1. Setup Cypress
```bash
cd client/
npm install --save-dev cypress @cypress/react
npx cypress open
```

### 2. Add data-cy Attributes
Aggiungere selettori Cypress ai componenti chiave seguendo la sezione "Data-testid Recommendations".

### 3. Create Test Files
Implementare i test flows descritti nella sezione "Critical User Flows".

### 4. CI/CD Integration
Integrare Cypress nel workflow GitHub Actions esistente per automated E2E testing.

### 5. Mock API Responses
Configurare Cypress per intercettare e mockare le API responses per test stabili e veloci.

---

**Ultimo aggiornamento:** 2025-08-05  
**Versione:** 1.0.0  
**Maintainer:** Development Team CyberForge Sentinel  
**Repository:** https://github.com/Marco-Cricchio/CTI