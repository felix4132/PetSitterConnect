# PetSitterConnect Backend

Ein moderner Backend-Server für die PetSitterConnect-Plattform,
gebaut mit Nest.js, TypeScript und ESM.

## 🚀 Features

- **Nest.js 11** - Modularer und skalierbarer Backend-Framework
- **TypeScript 5.8** - Vollständig typisiert mit strengen Einstellungen
- **ESM (ES Modules)** - Moderne JavaScript-Module-Syntax
- **Vitest** - Schnelles und modernes Testing-Framework
- **SWC** - Schneller TypeScript/JavaScript-Compiler
- **Rate Limiting** - Schutz vor zu vielen Anfragen
- **CORS** - Konfigurierbare Cross-Origin Resource Sharing
- **Validation** - Automatische Request-Validierung
- **Security Headers** - Helmet für Sicherheits-Headers

## 📋 Voraussetzungen

- Node.js >= 22.16.0
- npm >= 11.4.2

## 🛠️ Installation

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
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
# ... weitere Konfigurationen
```

## 🏃‍♂️ Entwicklung

```bash
# Entwicklungsserver starten
npm run start:dev

# Build erstellen
npm run build

# Produktionsserver starten
npm run start:prod
```

## 🧪 Testing

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

## 📚 API-Dokumentation

Der Server läuft standardmäßig auf `http://localhost:3000/api/v1`

## 🏗️ Projektstruktur

```text
src/
├── app.controller.ts    # Haupt-Controller
├── app.module.ts        # Haupt-Modul
├── app.service.ts       # Haupt-Service
└── main.ts              # Anwendungs-Einstiegspunkt

test/
├── app.controller.spec.ts  # Unit-Tests
└── *.e2e-spec.ts           # E2E-Tests
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

## 📦 Technologie-Stack

- **Framework**: Nest.js 11
- **Sprache**: TypeScript 5.8
- **Runtime**: Node.js 22+
- **Compiler**: SWC
- **Testing**: Vitest 3
- **Linting**: ESLint mit TypeScript-ESLint
- **Formatierung**: Prettier
- **Sicherheit**: Helmet, Rate Limiting, CORS
