# PetSitterConnect Backend

Modern backend server for a pet-sitting platform with REST API,
TypeScript and comprehensive test coverage.

This project was created as part of an eBusiness course.

## 🚀 Features

- **REST API** for listings and applications with optimized database access
- **TypeScript 5.9** with strict typing and centralized shared types
- **TypeORM** with SQLite database and SQL-level filtering
- **Validation** with class-validator/class-transformer and reusable base DTOs
- **Configuration Management** with type-safe environment validation
- **Rate Limiting** and CORS protection
- **Security** with Helmet (security headers)
- **Global Exception Handling** for better error handling
- **High test coverage** (see coverage report)

## 🛠️ Tech Stack

- **Framework**: NestJS 11 + Express
- **Language**: TypeScript 5.9 (ESM Module)
- **Database**: TypeORM + SQLite
- **Testing**: Vitest + Supertest
- **Validation**: class-validator + class-transformer
- **Security**: Helmet, Rate Limiting, CORS
- **Code Quality**: ESLint + Prettier + strict TypeScript

## ⚡ Quick Start

```bash
# Installation (uses exact versions from package-lock.json)
npm ci

# Environment Setup (optional)
# macOS/Linux
cp .env.example .env
# Windows PowerShell
Copy-Item .env.example .env
# Windows CMD
copy .env.example .env

# Run (Development)
npm run start:dev

# Build & Run (Production)
npm run build
npm run start:prod

# Testing
npm test
npm run test:cov

# Code Quality
npm run lint:check
npm run format:check
npm run typecheck
```

Server runs on: `http://localhost:3000/api/v1`

Note: The base path is configurable via `API_PREFIX`.

## 📚 API Endpoints

### Listings

```http
POST   /listings                            # Create listing
GET    /listings                            # Search listings (with filters)
GET    /listings/:id                        # Get listing
GET    /listings/:id/with-applications      # Get listing with applications (optimized)
GET    /listings/owner/:ownerId             # Get listings by owner
```

### Applications

```http
POST   /listings/:id/applications        # Submit application
PATCH  /applications/:id                    # Update status
GET    /sitters/:sitterId/applications      # Get applications by sitter
GET    /listings/:listingId/applications    # Get applications for listing
```

## 🧪 Testing

- **Comprehensive test suite** (Unit, E2E, Integration, DTO validation, complex scenarios)
- **Comprehensive E2E Tests** for CORS, Rate Limiting, APIs
- **Complex Integration Tests** for multi-step workflows
- **DTO Validation Tests** for all input parameters
- **Exception Handling Tests** for robust error handling
- **Database Edge Case Tests** for filter validation and type conversion
- **Error Handling Tests** for SeederService with database failures

```bash
npm test              # All tests
npm run test:cov      # With coverage report
npm run test:e2e      # E2E tests only
npm run test:watch    # Watch mode for development
```

After `npm run test:cov`, open `coverage/index.html` for the coverage report.

## 🏗️ Project Structure

```text
src/
├── main.ts           # Application entry point
├── app/              # Main application module and configuration
├── shared/           # Framework-agnostic utilities, types, and base DTO classes
│   ├── types/        # Centralized type definitions (Species, ListingType, etc.)
│   └── dto/          # Reusable base DTO classes
├── config/           # Configuration management and validation
├── common/           # Cross-cutting NestJS components
│   └── filters/      # Global exception filters (Nest-specific)
├── domain/           # Database entities and models
│   ├── applications/ # Application entity
│   └── listings/     # Listing entity
├── infrastructure/   # Database configuration and services
│   └── database/     # Database module and service
├── modules/          # Business logic modules
│   ├── listings/     # Listing management
│   │   └── dto/      # DTOs with co-located tests
│   └── applications/ # Application workflow
│       └── dto/      # DTOs with co-located tests
└── seeder/           # Database seeding service
```

Note on folders:

- Use `common` for Nest-specific cross-cutting concerns (filters, pipes,
  guards, interceptors).
- Use `shared` for framework-agnostic DTO bases and types.

## ⚙️ Configuration

### ✅ Prerequisites

- Node.js 22.x (>= 22.0)
- npm 11.x (>= 11.0)

### 🔧 Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# Security & Rate Limiting
# RATE_LIMIT_TTL is in milliseconds (>= 1000). Example: 60000 = 60s
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=100

# Allowed Origins - Comma-separated list
# Example: `https://a.com, https://b.com`.
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8081

# Logging
LOG_LEVEL=debug
API_VERSION=1.0.0
```

### 🗄️ Database

- Default configuration uses SQLite in-memory (`:memory:`) for convenience.
 Data is not persisted across restarts.
- To enable persistence, configure a file-based SQLite database (e.g., set a
 `DB_PATH`) and update
 `src/infrastructure/database/database.module.ts` accordingly.

### 🧬 Seeder

- The seeding service populates initial demo data on application startup.
 With in-memory SQLite, data is reseeded on every restart.
