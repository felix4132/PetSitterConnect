# PetSitterConnect Backend

Ein moderner Backend-Server für die PetSitterConnect-Plattform,
gebaut mit Nest.js, TypeScript und ESM.

## 🚀 Features

- **Modulare Architektur** - Saubere Trennung von Geschäftslogik und Infrastruktur
- **TypeScript 5.8** - Vollständig typisiert mit strengen Einstellungen
- **ESM (ES Modules)** - Moderne JavaScript-Module-Syntax
- **Vitest** - Schnelles und modernes Testing-Framework
- **SWC** - Schneller TypeScript/JavaScript-Compiler
- **Rate Limiting** - Schutz vor zu vielen Anfragen
- **CORS** - Konfigurierbare Cross-Origin Resource Sharing
- **Validation** - Automatische Request-Validierung
- **Security Headers** - Helmet für Sicherheits-Headers

## 🛠️ Technologie-Stack

- **Framework**: Nest.js 11
- **Sprache**: TypeScript 5.8
- **Runtime**: Node.js 22+
- **Compiler**: SWC
- **Testing**: Vitest 3
- **Linting**: ESLint mit TypeScript-ESLint
- **Formatierung**: Prettier
- **Sicherheit**: Helmet, Rate Limiting, CORS
- **Architektur**: Layered Architecture mit Domain-Driven Design

## 📋 Voraussetzungen

- Node.js >= 22.16.0
- npm >= 11.4.2

## ⚡ Installation & Setup

```bash
# Repository klonen
git clone <repository-url>
cd PetSitterConnect

# Dependencies installieren
npm install

# Environment-Datei erstellen (optional)
cp .env.example .env
```

## ⚙️ Konfiguration

Der Server kann über Umgebungsvariablen konfiguriert werden.
Diese können über eine `.env`-Datei im Projektverzeichnis definiert werden.

Eine `.env.example`-Datei zeigt alle verfügbaren Optionen:

```bash
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
API_VERSION=1.0.0
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
# ... weitere Konfigurationen
```

## 🏗️ Projektstruktur

```text
src/
├── app/
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── app.service.ts
├── domain/
│   ├── listings/
│   │   └── listing.entity.ts
│   └── applications/
│       └── application.entity.ts
├── infrastructure/
│   └── database/
│       ├── database.module.ts
│       └── database.service.ts
├── modules/
│   ├── listings/
│   │   ├── listings.controller.ts
│   │   ├── listings.module.ts
│   │   └── listings.service.ts
│   └── applications/
│       ├── applications.controller.ts
│       ├── applications.module.ts
│       └── applications.service.ts
└── main.ts

test/
├── *.spec.ts            # Unit-Tests
└── *.e2e-spec.ts        # E2E-Tests
```

## 🏛️ Architektur-Pattern

Die Anwendung folgt einer **Layered Architecture** mit **Domain-Driven Design** Prinzipien:

```text
┌─────────────────────────────────────┐
│            AppModule                │
│  (Globale Konfiguration & Setup)    │
├─────────────────────────────────────┤
│  Feature Modules:                   │
│  ├── ListingsModule                 │
│  ├── ApplicationsModule             │
│  └── DatabaseModule                 │
├─────────────────────────────────────┤
│  Controllers (HTTP Layer):          │
│  ├── AppController                  │
│  ├── ListingsController             │
│  └── ApplicationsController         │
├─────────────────────────────────────┤
│  Services (Business Logic):         │
│  ├── AppService                     │
│  ├── ListingsService                │
│  └── ApplicationsService            │
├─────────────────────────────────────┤
│  Domain Entities:                   │
│  ├── Listing                        │
│  └── Application                    │
├─────────────────────────────────────┤
│  Infrastructure Layer:              │
│  └── DatabaseService                │
└─────────────────────────────────────┘
```

### Schichten-Verantwortlichkeiten

- **AppModule**: Zentraler Orchestrator für alle Module und globale Konfiguration
- **Controller Layer**: HTTP-Request-Handling und Response-Formatting
- **Service Layer**: Business-Logik und Datenverarbeitung
- **Domain Layer**: Entitäten und Geschäftsregeln
- **Infrastructure Layer**: Datenpersistierung und externe Services

### Datenfluss

```text
HTTP Request → Controller → Service → Infrastructure → Domain
     ↓              ↓          ↓            ↓           ↓
HTTP Response ← Controller ← Service ← Infrastructure ← Domain
```

## 🏃‍♂️ Entwicklung

```bash
# Build erstellen
npm run build

# Entwicklungsserver starten
npm run start:dev

# Produktionsserver starten
npm run start:prod
```

## 📚 API-Dokumentation

Der Server läuft standardmäßig auf `http://localhost:3000/api/v1`

### Listings

- `POST /listings` – legt ein neues Inserat an
- `GET /listings` – sucht nach Inseraten (mit Query-Parametern)
- `GET /listings/:id` – ruft ein Inserat per ID ab
- `GET /listings/owner/:ownerId` – zeigt alle Inserate eines Besitzers

**Query-Parameter für `GET /listings`:**

- `id`, `price`, `age` (Zahlen)
- `sitterVerified` (boolean: `true`/`false`)
- `ownerId`, `title`, `description`, `species`, `listingType`, `startDate`,
  `endDate`, `breed`, `size`, `feeding`, `medication` (Strings)

### Applications

- `POST /listings/:id/applications` – bewirbt sich auf ein Inserat
- `PATCH /applications/:id` – aktualisiert den Status einer Bewerbung
- `GET /sitters/:sitterId/applications` – Bewerbungen eines Sitters
- `GET /listings/:listingId/applications` – Bewerbungen zu einem Inserat

## 🧪 Testing

Das Projekt implementiert eine umfassende Test-Strategie mit
**Unit Tests** und **End-to-End Tests**.

### Test-Kategorien

**Unit Tests** (`*.spec.ts`): Testen isolierter Komponenten ohne externe Dependencies

- Sehr schnell (< 50ms pro Test)
- Verwenden Mocks für Dependencies
- Hohe Code-Coverage für Business Logic

**End-to-End Tests** (`*.e2e-spec.ts`): Testen der gesamten Anwendung über HTTP-Requests

- Starten komplette NestJS-Anwendung
- Verwenden echte HTTP-Requests mit `supertest`
- Testen End-to-End Workflows

### Test-Ausführung

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# E2E Tests
npm run test:e2e

# Coverage Report
npm run test:cov

# Tests einmalig ausführen (CI)
npm run test:run
```

### Coverage-Ergebnisse

- **Branches**: 96.96% ✅
- **Functions**: 100% ✅
- **Lines**: 100% ✅
- **Statements**: 100% ✅

**Aktuelle Gesamt-Coverage: 100%** 🎉

## 📝 Code-Qualität

```bash
# Code formatieren
npm run format

# Code-Format überprüfen (CI)
npm run format:check

# Linting
npm run lint

# Linting überprüfen (CI)
npm run lint:check

# TypeScript-Typen überprüfen
npm run typecheck
```

## 🚀 Deployment

```bash
# Build erstellen
npm run build

# Produktions-Dependencies installieren
npm ci --only=production

# Server starten
npm run start:prod
```

### Umgebungsvariablen für Produktion

Stellen Sie sicher, dass folgende Variablen in der Produktionsumgebung gesetzt sind:

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
API_VERSION=1.0.0
ALLOWED_ORIGINS=https://your-frontend-domain.com
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
LOG_LEVEL=warn
```
