# CyberForge Sentinel - API Documentation

**Progetto:** Piattaforma di Threat Intelligence per analisti di cybersecurity  
**Versione:** 1.0.0  
**Base URL:** `http://localhost:3001`  
**Generato da:** Analisi codebase branch `main`  

---

## 1. Documentazione API Endpoints

### 1.1. Registrazione Utente

- **Metodo e Path:** `POST /auth/register`
- **Autenticazione:** Non richiesta
- **Validazione:** ValidationPipe applicato automaticamente  

**Request Body (JSON):**
```json
{
  "email": "analyst@cyberforge.com",
  "password": "securepassword123"
}
```

**Validazioni Request:**
- `email`: Deve essere un formato email valido (`@IsEmail()`)
- `password`: Stringa minimo 8 caratteri (`@IsString()`, `@MinLength(8)`)

**Success Response (201 Created):**
```json
{
  "id": "uuid-string",
  "email": "analyst@cyberforge.com",
  "role": "analyst",
  "created_at": "2025-08-05T10:30:00.000Z",
  "updated_at": "2025-08-05T10:30:00.000Z"
}
```
*Nota: Il campo `password_hash` viene rimosso dalla response per sicurezza.*

**Error Response (409 Conflict - Utente già esistente):**
```json
{
  "message": "Email already registered",
  "error": "Conflict",
  "statusCode": 409
}
```

**Altri Error Response:**
```json
{
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 1.2. Login Utente

- **Metodo e Path:** `POST /auth/login`
- **Autenticazione:** Non richiesta
- **HTTP Code Success:** 200 (esplicito via `@HttpCode(HttpStatus.OK)`)

**Request Body (JSON):**
```json
{
  "email": "analyst@cyberforge.com",
  "password": "securepassword123"
}
```
*Nota: Riutilizza il `RegisterUserDto` per semplicità architetturale.*

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Nome esatto del campo JWT: `accessToken`*

**JWT Payload Structure:**
```json
{
  "sub": "user-uuid",
  "email": "analyst@cyberforge.com", 
  "role": "analyst",
  "iat": 1628000000,
  "exp": 1628086400
}
```

**Error Response (401 Unauthorized - Credenziali errate):**
```json
{
  "message": "Please check your login credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 1.3. Creazione Indicatore (IOC)

- **Metodo e Path:** `POST /indicators`
- **Autenticazione:** **OBBLIGATORIA** - `Header: Authorization: Bearer <accessToken>`
- **Guard:** `AuthGuard('jwt')` applicato a livello controller
- **User Injection:** `@GetUser()` decorator fornisce l'utente autenticato

**Request Body (JSON):**
```json
{
  "value": "192.168.1.1",
  "type": "ip",
  "threat_level": "high"
}
```

**Validazioni Request:**
- `value`: Stringa non vuota (`@IsString()`, `@IsNotEmpty()`)
- `type`: Enum IndicatorType (`@IsEnum(IndicatorType)`)
  - Valori possibili: `"ip"`, `"domain"`, `"url"`, `"file_hash"`, `"email"`
- `threat_level`: Enum ThreatLevel (`@IsEnum(ThreatLevel)`)
  - Valori possibili: `"low"`, `"medium"`, `"high"`, `"critical"`

**Success Response (201 Created):**
```json
{
  "id": "indicator-uuid",
  "value": "192.168.1.1",
  "type": "ip", 
  "threat_level": "high",
  "is_active": true,
  "created_by": {
    "id": "user-uuid",
    "email": "analyst@cyberforge.com",
    "role": "analyst"
  },
  "first_seen": "2025-08-05T10:30:00.000Z",
  "last_seen": "2025-08-05T10:30:00.000Z"
}
```
*Nota: `created_by` viene popolato automaticamente via eager loading della relazione.*

**Error Response (401 Unauthorized - Token non valido/mancante):**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Error Response (400 Bad Request - Validazione fallita):**
```json
{
  "message": [
    "value should not be empty",
    "type must be one of the following values: ip, domain, url, file_hash, email"
  ],
  "error": "Bad Request", 
  "statusCode": 400
}
```

---

### 1.4. Recupero Indicatori (Paginato e Filtrato)

- **Metodo e Path:** `GET /indicators`
- **Autenticazione:** **OBBLIGATORIA** - JWT Bearer Token
- **Query Parameters:** Tutti opzionali, con valori di default

**Query Parameters:**
```
?page=1&limit=10&type=ip&threat_level=high&search=192.168
```

**Parametri Disponibili:**
- `page`: Numero pagina (default: 1, minimo: 1)
- `limit`: Elementi per pagina (default: 10, minimo: 1)  
- `type`: Filtro per tipo (`ip`, `domain`, `url`, `file_hash`, `email`)
- `threat_level`: Filtro per livello minaccia (`low`, `medium`, `high`, `critical`)
- `search`: Ricerca testuale nel campo `value` (ILIKE PostgreSQL)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "indicator-uuid-1",
      "value": "192.168.1.1", 
      "type": "ip",
      "threat_level": "high",
      "is_active": true,
      "created_by": {
        "id": "user-uuid",
        "email": "analyst@cyberforge.com"
      },
      "first_seen": "2025-08-05T10:30:00.000Z",
      "last_seen": "2025-08-05T10:35:00.000Z"
    }
  ],
  "total": 150
}
```
*Nota: La response include `data` (array di indicatori) e `total` (totale elementi per paginazione).*

---

### 1.5. Recupero Singolo Indicatore

- **Metodo e Path:** `GET /indicators/:id`
- **Autenticazione:** **OBBLIGATORIA** - JWT Bearer Token
- **Path Parameter:** `id` (UUID dell'indicatore)

**Success Response (200 OK):**
```json
{
  "id": "indicator-uuid",
  "value": "malicious.com",
  "type": "domain",
  "threat_level": "critical", 
  "is_active": true,
  "created_by": {
    "id": "user-uuid",
    "email": "analyst@cyberforge.com",
    "role": "analyst"
  },
  "first_seen": "2025-08-05T10:30:00.000Z",
  "last_seen": "2025-08-05T10:35:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Indicator with ID \"invalid-uuid\" not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 1.6. Aggiornamento Indicatore

- **Metodo e Path:** `PATCH /indicators/:id` 
- **Autenticazione:** **OBBLIGATORIA** - JWT Bearer Token
- **Path Parameter:** `id` (UUID dell'indicatore)

**Request Body (JSON) - Tutti i campi opzionali:**
```json
{
  "value": "updated-malicious.com",
  "type": "domain", 
  "threat_level": "critical"
}
```
*Nota: Utilizza `UpdateIndicatorDto` che estende `PartialType(CreateIndicatorDto)`.*

**Success Response (200 OK):**
```json
{
  "id": "indicator-uuid",
  "value": "updated-malicious.com",
  "type": "domain",
  "threat_level": "critical",
  "is_active": true,
  "created_by": {
    "id": "user-uuid",
    "email": "analyst@cyberforge.com"
  },
  "first_seen": "2025-08-05T10:30:00.000Z",
  "last_seen": "2025-08-05T11:00:00.000Z"
}
```

---

### 1.7. Eliminazione Indicatore (Soft Delete)

- **Metodo e Path:** `DELETE /indicators/:id`
- **Autenticazione:** **OBBLIGATORIA** - JWT Bearer Token  
- **Path Parameter:** `id` (UUID dell'indicatore)
- **Tipo:** Soft delete (imposta `is_active: false`)

**Success Response (200 OK):**
```json
// Nessun body di response (void)
```

**Error Response (404 Not Found):**
```json
{
  "message": "Indicator with ID \"invalid-uuid\" not found", 
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 1.8. Statistiche Dashboard

- **Metodo e Path:** `GET /indicators/stats`
- **Autenticazione:** **OBBLIGATORIA** - JWT Bearer Token
- **Scopo:** Metriche per la dashboard principale

**Success Response (200 OK):**
```json
{
  "newIocs24h": 23,
  "criticalAlerts": 5, 
  "totalActiveIndicators": 1247,
  "activeInvestigations": 5,
  "dataFeeds": 8
}
```
*Nota: `activeInvestigations` e `dataFeeds` sono valori fittizi per sviluppi futuri.*

---

## 2. Configurazione Ambiente di Test

### 2.1. Database di Test

**Configurazione Attuale:**
- **Framework di Test:** Jest con configurazione E2E in `test/jest-e2e.json`
- **Database:** Non esiste attualmente un ambiente di test separato
- **Configurazione DB:** TypeORM utilizza la configurazione principale

**Raccomandazioni per Test E2E:**
1. **Database Separato:** Creare un database PostgreSQL dedicato ai test
2. **Variabili Ambiente:** Utilizzare file `.env.test` con:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cyberforge_test
   DB_USERNAME=test_user
   DB_PASSWORD=test_password
   JWT_SECRET=test_jwt_secret_key
   ```

### 2.2. Strategia di Pulizia Database

**Strategia Consigliata - Database Reset Pattern:**

```typescript
// Pulire le tabelle prima di ogni test file
beforeEach(async () => {
  await dataSource.query('TRUNCATE TABLE indicators RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
});
```

**Ordine di Pulizia (per evitare errori di foreign key):**
1. `indicators` (ha foreign key verso `users`)
2. `users` (tabella referenziata)

**Pattern Alternativo - Test Database Isolation:**
```typescript
// Utilizzo di transazioni rollback per isolamento
beforeEach(async () => {
  await app.get(DataSource).query('BEGIN');
});

afterEach(async () => {
  await app.get(DataSource).query('ROLLBACK');
});
```

---

## 3. Struttura del Codice per i Test

### 3.1. Posizione dei File di Test

**Directory Standard:** `server/test/`

**File E2E Consigliati:**
- `auth.e2e-spec.ts` - Test per registrazione, login, autenticazione JWT
- `indicators.e2e-spec.ts` - Test CRUD completo per indicatori  
- `indicators-filtering.e2e-spec.ts` - Test paginazione e filtri
- `indicators-security.e2e-spec.ts` - Test security e autorizzazioni

### 3.2. Configurazione Jest E2E Esistente

**File:** `test/jest-e2e.json`
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node", 
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### 3.3. Esempio di Setup Test

**Pattern Consigliato:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Test cases...
});
```

---

## 4. Architettura di Sicurezza per Testing

### 4.1. JWT Strategy per Test

**Strategia Attualmente Implementata:**
- **Secret:** Configurabile via `JWT_SECRET` environment variable
- **Validation:** Automatic user fetch da database via `JwtStrategy.validate()`
- **User Object:** Viene iniettato via `@GetUser()` decorator

**Considerazioni per Test:**
- Utilizzare un JWT_SECRET dedicato per i test
- I test devono includere scenari con token validi, scaduti, e malformati

### 4.2. Database Relations per Test

**Relazioni Critiche:**
- `Indicator.created_by` → `User` (ManyToOne, eager loading)
- `User.role` → Enum UserRole (default: 'analyst')

**Implicazioni per Test:**
- Ogni test che crea indicatori deve prima creare un utente
- L'eager loading della relazione `created_by` significa che i test riceveranno sempre l'oggetto user completo

---

## 5. Enumerazioni e Costanti

### 5.1. UserRole Enum
```typescript
enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst', 
  VIEWER = 'viewer'
}
```

### 5.2. IndicatorType Enum  
```typescript
enum IndicatorType {
  IP = 'ip',
  DOMAIN = 'domain',
  URL = 'url', 
  FILE_HASH = 'file_hash',
  EMAIL = 'email'
}
```

### 5.3. ThreatLevel Enum
```typescript
enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

---

## 6. Scripts NPM per Testing

**Comandi Disponibili:**
```bash
# Test E2E
npm run test:e2e

# Test unitari
npm run test

# Test con coverage
npm run test:cov

# Test in watch mode
npm run test:watch
```

---

**Documento generato il:** 2025-08-05  
**Fonte:** Analisi codebase branch `main`  
**Stato repository:** Commit `b9980e1` - "fix(frontend): prevent sending empty filter params in API calls"  
**Prossimo step:** Implementazione test E2E basati su questa documentazione