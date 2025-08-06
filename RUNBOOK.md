# CyberForge Sentinel - Development Runbook

**Ultima revisione:** 2025-08-06  
**Versione progetto:** 1.0.0  
**Repository:** https://github.com/Marco-Cricchio/CTI

Questa guida descrive la procedura esatta per avviare l'intero progetto CyberForge Sentinel da zero in un ambiente di sviluppo locale.

---

## 📋 Prerequisiti Software

I seguenti software devono essere installati sul sistema operativo prima di iniziare:

### Software di Base
- **Node.js** `>= 18.0.0` (testato con v20.19.1)
- **npm** `>= 9.0.0` (testato con v10.8.2)
- **PostgreSQL** `>= 13.0` 
- **Redis** `>= 6.0`

### Installazione su macOS (Homebrew)
```bash
# Installa Homebrew se non presente
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installa i prerequisiti
brew install node
brew install postgresql@15
brew install redis

# Verifica installazioni
node --version    # Dovrebbe mostrare v18+ 
npm --version     # Dovrebbe mostrare 9+
postgres --version
redis-server --version
```

### Installazione su Ubuntu/Debian
```bash
# Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Verifica installazioni
node --version
npm --version
sudo -u postgres psql --version
redis-server --version
```

---

## 🔧 Configurazione dell'Ambiente

### 1. Clonazione del Repository
```bash
git clone https://github.com/Marco-Cricchio/CTI
cd CTI
```

### 2. File di Configurazione (.env)

#### Server Environment (`server/.env`)
Crea il file `server/.env` copiando il template:
```bash
cp server/.env.example server/.env
```

**Variabili Obbligatorie da configurare:**
```bash
# Server Configuration
PORT=3001

# Database Configuration  
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cyberforge_dev

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECRET_KEY_REPLACE_ME_WITH_RANDOM_STRING
JWT_EXPIRES_IN=1d

# External APIs (Opzionale per enrichment)
ABUSEIPDB_API_KEY=YOUR_ABUSEIPDB_API_KEY
```

#### Client Environment (`client/.env`)
Il client **NON richiede** file `.env` per l'avvio di base. Tutte le configurazioni sono hardcoded per lo sviluppo locale.

**Note Importanti:**
- Sostituire `YOUR_PASSWORD` con la password del tuo utente PostgreSQL
- Sostituire `JWT_SECRET` con una stringa random di almeno 32 caratteri
- `ABUSEIPDB_API_KEY` è opzionale ma necessaria per l'enrichment automatico degli IP

---

## 🗄️ Avvio dei Servizi di Background

**IMPORTANTE:** I servizi devono essere avviati in quest'ordine specifico.

### 1. PostgreSQL
```bash
# macOS (Homebrew)
brew services start postgresql@15

# Ubuntu/Debian  
sudo systemctl start postgresql

# Verifica che sia attivo
brew services list | grep postgresql    # macOS
sudo systemctl status postgresql        # Linux
```

### 2. Redis  
```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Verifica che sia attivo
redis-cli ping    # Dovrebbe rispondere "PONG"
```

### 3. Creazione Database
```bash
# Accedi a PostgreSQL come superuser
psql -U postgres

# Dentro il prompt psql:
CREATE DATABASE cyberforge_dev;
CREATE USER cyberforge WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cyberforge_dev TO cyberforge;
\q
```

---

## 🚀 Avvio delle Applicazioni

### 1. Backend (NestJS)
```bash
# Naviga nella directory server
cd server

# Installa le dipendenze
npm install

# Esegui le migrazioni del database
npm run migration:run

# Avvia il server di sviluppo
npm run start:dev
```

**Verifica Backend:**
- Server attivo su: `http://localhost:3001`
- Test endpoint: `curl http://localhost:3001/api/auth/login`
- Dovrebbe restituire error 401 (normale senza credenziali)

### 2. Frontend (React)
```bash
# Apri un nuovo terminale e naviga nella directory client
cd client

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm start
```

**Verifica Frontend:**
- App attiva su: `http://localhost:3000`
- Il browser dovrebbe aprirsi automaticamente
- Dovresti vedere la schermata di login di CyberForge Sentinel

---

## ⚡ Quick Start - Comando Unico

Per sviluppatori esperti, puoi avviare tutto con questi comandi rapidi:

```bash
# Terminal 1: Servizi di background
brew services start postgresql@15 && brew services start redis

# Terminal 2: Backend
cd server && npm install && npm run migration:run && npm run start:dev

# Terminal 3: Frontend  
cd client && npm install && npm start
```

---

## 🔄 Ordine Corretto di Avvio

**SEQUENZA OBBLIGATORIA:**

1. **PostgreSQL** ← Database principale
2. **Redis** ← Cache e job queue  
3. **Backend** ← API server (porta 3001)
4. **Frontend** ← React app (porta 3000)

**⚠️ ATTENZIONE:** Il Frontend fallirà se il Backend non è già attivo e accessibile.

---

## 🧪 Verifica dell'Installazione

### Test Completo del Sistema
```bash
# 1. Test Database
psql -U postgres -d cyberforge_dev -c "SELECT version();"

# 2. Test Redis  
redis-cli ping

# 3. Test Backend
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 4. Test Frontend
curl http://localhost:3000
```

### Primo Utente di Test
```bash
# Crea un utente per test
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cyberforge.local","password":"admin123"}'
```

---

## 🛠️ Comandi di Sviluppo Utili

### Backend Commands
```bash
cd server

# Sviluppo
npm run start:dev          # Hot reload attivo
npm run start:debug        # Con debug attivo

# Testing
npm run test               # Unit tests
npm run test:e2e          # Integration tests
npm run test:cov          # Coverage report

# Database
npm run migration:generate # Genera nuova migrazione
npm run migration:run      # Esegui migrazioni
npm run migration:revert   # Rollback ultima migrazione

# Code Quality
npm run lint              # ESLint check
npm run format            # Prettier formatting
npm run typecheck         # TypeScript check
```

### Frontend Commands  
```bash
cd client

# Sviluppo
npm start                 # Hot reload attivo
npm run build            # Build produzione

# Testing
npm run test             # Jest unit tests
npm run cypress:open     # E2E tests interattivi
npm run cypress:run      # E2E tests headless
```

---

## 🔍 Troubleshooting Comune

### Backend non si avvia
```bash
# Verifica PostgreSQL
brew services restart postgresql@15
psql -U postgres -l

# Verifica Redis
brew services restart redis  
redis-cli ping

# Verifica dipendenze
cd server && npm install
```

### Frontend non si connette
```bash
# Verifica che backend sia attivo
curl http://localhost:3001/api/auth/login

# Verifica porte
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
```

### Database Connection Error
```bash
# Verifica connessione
psql -U postgres -d cyberforge_dev

# Reset database  
dropdb cyberforge_dev
createdb cyberforge_dev
npm run migration:run
```

---

## 📚 Prossimi Passi

Dopo aver completato l'avvio, puoi procedere con:

1. **Login** usando le credenziali di test create
2. **Aggiunta Indicatori** per testare il sistema
3. **Configurazione API Keys** per l'enrichment automatico
4. **Review del Codice** seguendo le guidelines in `CLAUDE.md`

---

**Supporto:** Per problemi specifici, consulta i log di applicazione o apri una issue su GitHub.

**Repository:** https://github.com/Marco-Cricchio/CTI