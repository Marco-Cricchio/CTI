# CyberForge Sentinel - Development Guide

**Progetto:** Piattaforma di Threat Intelligence per analisti di cybersecurity  
**Target:** CERT e team di sicurezza informatica  
**Tecnologie:** React + TypeScript (Frontend), NestJS + TypeScript (Backend), PostgreSQL (Database)
**Repository GitHub:** https://github.com/Marco-Cricchio/CTI

---

## 1. Stile di Codice e Design System

### Design System
- **Source of Truth:** `style-guide.css` - Tutte le nuove componenti UI devono aderire strettamente alle variabili CSS definite
- **Palette Colori:**
  - Background: `--bg-primary` (#0d1117), `--bg-secondary` (#161b22), `--bg-tertiary` (#21262d)
  - Accenti: `--accent-blue` (#3b82f6), `--accent-orange` (#fb923c)
  - Testo: `--text-primary` (#f0f6fc), `--text-secondary` (#8b949e), `--text-tertiary` (#6e7681)
- **Tipografia:** Inter con pesi sottili (`--font-thin: 100`, `--font-light: 300`) per look professionale

### Framework e Tecnologie
- **Frontend:** React 18+ con TypeScript per type-safety e componenti riutilizzabili
- **Backend:** NestJS con TypeScript per architettura modulare e decorators
- **Database:** PostgreSQL per relazioni complesse tra IOC, investigazioni e report
- **Styling:** CSS Modules + variabili CSS native (no Tailwind, seguire `style-guide.css`)

### Formattazione e Linting
```bash
# Comandi di formattazione
npm run format    # Prettier
npm run lint      # ESLint
npm run typecheck # TypeScript compiler

# Pre-commit hooks obbligatori
npm run test      # Jest test suite
npm run build     # Build di produzione
```

### Convenzioni di Naming
- **Componenti React:** `PascalCase` (es. `IndicatorTable.tsx`, `LiveAlerts.tsx`)
- **Variabili e funzioni:** `camelCase` (es. `fetchIndicators`, `alertSeverity`)
- **File CSS Modules:** `kebab-case.module.css` (es. `indicator-table.module.css`)
- **Tipi TypeScript:** `PascalCase` con suffisso `Type` (es. `IndicatorType`, `AlertSeverityType`)
- **Costanti:** `SCREAMING_SNAKE_CASE` (es. `MAX_INDICATORS_PER_PAGE`)

---

## 2. Convenzioni del Repository

### Branching Model (Git-Flow)
```
main              # Produzione - solo merge da release/hotfix
develop           # Sviluppo principale - integrazione feature
feature/*         # Nuove funzionalità (es. feature/ioc-enrichment)
fix/*            # Correzione bug (es. fix/dashboard-chart-rendering)
refactor/*       # Migliorie codice (es. refactor/api-error-handling)
docs/*           # Documentazione (es. docs/api-specification)
release/*        # Preparazione release (es. release/v1.2.0)
hotfix/*         # Fix urgenti produzione (es. hotfix/critical-security-patch)
```

### Conventional Commits (Obbligatorio)
```bash
# Struttura: type(scope): description
feat(api): add IOC enrichment endpoint with VirusTotal integration
fix(dashboard): resolve chart rendering issue with empty datasets
refactor(auth): improve JWT token validation logic
docs(readme): update installation and deployment instructions
test(indicators): add unit tests for IOC parsing utilities
perf(database): optimize queries for large indicator datasets
security(api): implement rate limiting for public endpoints
```

### Pre-commit Checklist
- [ ] Codice formattato con Prettier
- [ ] Nessun errore ESLint
- [ ] TypeScript compila senza errori
- [ ] Test esistenti passano
- [ ] Nuovi test scritti per funzionalità aggiunte
- [ ] Build di produzione funziona

---

## 3. Istruzioni di Testing

### Approccio Test-Driven Development (TDD)
**Regola Fondamentale:** I test devono essere scritti PRIMA del codice di implementazione.

### Frontend Testing (React)
```bash
# Framework: Jest + React Testing Library
npm test                    # Esegue tutti i test
npm run test:watch         # Watch mode per sviluppo
npm run test:coverage      # Report copertura

# Struttura test file
src/components/IndicatorTable/__tests__/IndicatorTable.test.tsx
src/hooks/__tests__/useIndicators.test.ts
src/utils/__tests__/iocParser.test.ts
```

### Backend Testing (NestJS)
```bash
# Framework: Jest + Supertest
npm run test               # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report

# Struttura test file
src/indicators/__tests__/indicators.controller.spec.ts
src/indicators/__tests__/indicators.service.spec.ts
test/indicators.e2e-spec.ts
```

### Testing Guidelines
- **Unit Tests:** Ogni componente, service, e utility function
- **Integration Tests:** Interazioni tra moduli (es. controller + service)
- **E2E Tests:** Flussi utente completi (es. creazione investigazione)
- **Copertura Minima:** 80% per unit tests, 70% per integration tests

### Test Examples
```typescript
// Frontend component test
describe('IndicatorTable', () => {
  it('should display indicators with correct threat level colors', () => {
    const mockIndicators = [
      { id: '1', value: '192.168.1.1', type: 'ip', threatLevel: 'high' }
    ];
    render(<IndicatorTable indicators={mockIndicators} />);
    expect(screen.getByText('192.168.1.1')).toHaveClass('threat-level-high');
  });
});

// Backend service test
describe('IndicatorsService', () => {
  it('should enrich IOC with external threat intelligence', async () => {
    const ioc = { value: 'malicious.com', type: 'domain' };
    const enrichedIOC = await service.enrichIndicator(ioc);
    expect(enrichedIOC.reputation).toBeDefined();
    expect(enrichedIOC.sources).toContain('VirusTotal');
  });
});
```

---

## 4. Architettura di Base

### Frontend Architecture (React SPA)
```
src/
├── components/           # Componenti riutilizzabili
│   ├── Dashboard/
│   ├── IndicatorTable/
│   ├── LiveAlerts/
│   └── shared/          # Componenti condivisi (Button, Modal, etc.)
├── pages/               # Pagine principali
│   ├── DashboardPage/
│   ├── IndicatorsPage/
│   ├── InvestigationsPage/
│   └── ReportsPage/
├── hooks/               # Custom React hooks
├── services/            # API calls e business logic
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # CSS modules e theme
```

### Backend Architecture (NestJS Monolith)
```
src/
├── main.ts              # Bootstrap applicazione
├── app.module.ts        # Root module
├── common/              # Shared utilities, guards, interceptors
├── config/              # Configuration management
├── database/            # Database connections, migrations
├── auth/                # Autenticazione e autorizzazione
├── indicators/          # Gestione IOC
├── investigations/      # Casi di analisi
├── reports/             # Generazione report
├── alerts/              # Sistema alerting real-time
├── integrations/        # API esterne (VirusTotal, etc.)
└── websocket/           # WebSocket gateway per real-time
```

### Database Schema (PostgreSQL)
```sql
-- Tabelle principali
indicators (id, value, type, threat_level, first_seen, last_seen, sources)
investigations (id, title, description, status, assigned_to, created_at)
reports (id, investigation_id, content, generated_at, format)
alerts (id, indicator_id, severity, message, acknowledged, created_at)
users (id, email, role, permissions, created_at)

-- Relazioni
investigation_indicators (investigation_id, indicator_id)
indicator_sources (indicator_id, source_name, confidence, last_updated)
```

### Comunicazione Real-time
- **REST API:** Operazioni CRUD standard
- **WebSocket:** Live alerts, dashboard updates, investigation collaboration
- **Server-Sent Events:** Stream di nuovi indicatori

---

## 5. Mappatura dei Componenti UI (SoundForge → CyberForge Sentinel)

| Elemento SoundForge | Elemento CyberForge | Componente React | Funzionalità |
|-------------------|-------------------|------------------|--------------|
| `+ New Track` | `+ New Investigation` | `CreateInvestigationButton` | Modal per creare nuovo caso di analisi |
| `Studio` | `Dashboard` | `DashboardPage` | Vista principale con metriche e grafici |
| `Beats` | `Indicators (IOCs)` | `IndicatorsPage` | Gestione e visualizzazione IOC |
| `Streaming` | `Live Alerts` | `LiveAlertsPanel` | Feed real-time di alert critici |
| `Artists` | `Reports` | `ReportsPage` | Generazione e gestione report |
| `Mixer Settings` | `Data Feeds & API` | `IntegrationsPage` | Configurazione fonti esterne |
| `Total Tracks` | `New IOCs (24h)` | `MetricCard` | Contatore indicatori recenti |
| `Revenue` | `Critical Alerts` | `AlertCounter` | Numero alert ad alta priorità |
| `Genre Distribution` | `Indicator Type Distribution` | `IOCTypeChart` | Grafico distribuzione tipi IOC |
| `Artists Table` | `Latest Indicators Table` | `IndicatorTable` | Tabella ultimi IOC rilevati |

### Componenti UI Specifici CyberForge

#### Dashboard Components
```typescript
// MetricCard - Statistiche principali
interface MetricCardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// ThreatLevelBadge - Badge livello minaccia
interface ThreatLevelBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
}

// IOCTypeChart - Distribuzione tipi indicatori
interface IOCTypeChartProps {
  data: Array<{ type: string; count: number; color: string }>;
  timeRange: '24h' | '7d' | '30d';
}
```

#### Indicator Components
```typescript
// IndicatorTable - Tabella principale IOC
interface IndicatorTableProps {
  indicators: Indicator[];
  onSelect: (indicators: Indicator[]) => void;
  filters: IndicatorFilters;
  sortBy: keyof Indicator;
  sortOrder: 'asc' | 'desc';
}

// IOCEnrichmentPanel - Pannello arricchimento
interface IOCEnrichmentPanelProps {
  indicator: Indicator;
  sources: ThreatIntelSource[];
  onEnrich: (indicator: Indicator, sources: string[]) => void;
}
```

#### Alert Components
```typescript
// LiveAlertsPanel - Feed alert real-time
interface LiveAlertsPanelProps {
  maxAlerts: number;
  autoRefresh: boolean;
  filters: AlertFilters;
  onAcknowledge: (alertId: string) => void;
}

// AlertSeverityIcon - Icona severità
interface AlertSeverityIconProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  size: number;
  animated?: boolean;
}
```

---

## 6. Convenzioni Sicurezza e Performance

### Sicurezza
- **Nessun dato sensibile nei log** - Mascherare sempre API keys, tokens, PII
- **Validazione input rigorosa** - Sanitizzazione dati utente e API esterne
- **Rate limiting** - Protezione endpoint pubblici
- **CORS configurato** - Whitelist domini autorizzati
- **Headers di sicurezza** - HSTS, CSP, X-Frame-Options

### Performance
- **React.memo** per componenti con rendering pesante
- **Lazy loading** per componenti non critici
- **Paginazione** per tabelle con > 100 righe
- **Debouncing** per ricerche e filtri
- **WebSocket connection pooling** per scalabilità

### Monitoring e Logging
```typescript
// Structured logging
logger.info('IOC enrichment completed', {
  indicatorId: ioc.id,
  sources: enrichmentSources,
  duration: executionTime,
  threatLevel: result.threatLevel
});

// Error tracking
logger.error('External API timeout', {
  service: 'VirusTotal',
  indicator: ioc.value,
  timeout: 5000,
  error: error.message
});
```

---

## 7. Comandi di Sviluppo

### Setup Iniziale
```bash
# Clone e setup
git clone https://github.com/Marco-Cricchio/CTI
cd cyberforge-sentinel
npm install

# Database setup
createdb cyberforge_dev
npm run db:migrate
npm run db:seed

# Environment setup
cp .env.example .env
# Configurare API keys per servizi esterni
```

### Comandi Quotidiani
```bash
# Sviluppo
npm run dev              # Start dev servers (frontend + backend)
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Testing
npm test                 # Run all tests
npm run test:frontend    # Frontend tests only
npm run test:backend     # Backend tests only
npm run test:e2e         # End-to-end tests

# Build e Deploy
npm run build            # Build produzione
npm run start            # Start server produzione
npm run lint:fix         # Fix linting issues automaticamente
```

### Git Hooks (Husky)
```bash
# Pre-commit (automatico)
npm run lint
npm run typecheck
npm run test:changed

# Pre-push (automatico)  
npm run test
npm run build
```

---

## 8. Esempi di Codice

### Componente React con Design System
```typescript
// components/IndicatorTable/IndicatorTable.tsx
import React from 'react';
import styles from './indicator-table.module.css';

interface IndicatorTableProps {
  indicators: Indicator[];
  onIndicatorSelect: (indicator: Indicator) => void;
}

export const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  onIndicatorSelect
}) => {
  return (
    <div className="card"> {/* Using global design system class */}
      <h3 className="text-xl text-light mb-4">Latest Indicators</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className="text-secondary">IOC Value</th>
            <th className="text-secondary">Type</th>
            <th className="text-secondary">Threat Level</th>
            <th className="text-secondary">First Seen</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map(indicator => (
            <tr 
              key={indicator.id}
              className={styles.row}
              onClick={() => onIndicatorSelect(indicator)}
            >
              <td className="text-primary">{indicator.value}</td>
              <td className="text-secondary">{indicator.type}</td>
              <td>
                <span className={`${styles.threatBadge} ${styles[indicator.threatLevel]}`}>
                  {indicator.threatLevel}
                </span>
              </td>
              <td className="text-tertiary">{indicator.firstSeen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### NestJS Controller
```typescript
// indicators/indicators.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IndicatorsService } from './indicators.service';

@Controller('api/indicators')
@UseGuards(JwtAuthGuard)
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  async getIndicators(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('type') type?: string,
    @Query('threatLevel') threatLevel?: string
  ) {
    return this.indicatorsService.findMany({
      page,
      limit,
      filters: { type, threatLevel }
    });
  }

  @Post('enrich')
  async enrichIndicator(@Body() enrichRequest: EnrichIndicatorDto) {
    return this.indicatorsService.enrichIndicator(enrichRequest.indicatorId);
  }
}
```

---

---

## 9. Repository Information

### Repository URL
- **GitHub Repository:** https://github.com/Marco-Cricchio/CTI
- **Project Name:** CyberForge Sentinel (CTI - Cyber Threat Intelligence)
- **Branch principale:** `main`

### Comandi Git Essenziali
```bash
# Aggiungere remote repository (se non già configurato)
git remote add origin https://github.com/Marco-Cricchio/CTI

# Push al repository
git push -u origin main

# Clone del repository
git clone https://github.com/Marco-Cricchio/CTI
```

---

**Ultimo aggiornamento:** 2025-08-04  
**Versione:** 1.0.0  
**Maintainer:** Development Team CyberForge Sentinel  
**Repository:** https://github.com/Marco-Cricchio/CTI