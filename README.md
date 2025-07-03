# PetSitterConnect Backend

Modern backend server for a pet-sitting platform with REST API,
TypeScript and comprehensive test coverage.

## 🚀 Features

- **REST API** for listings and applications with optimized database access
- **TypeScript 5.8** with strict typing
- **TypeORM** with SQLite database and SQL-level filtering
- **Validation** with class-validator/class-transformer
- **Rate Limiting** and CORS protection
- **Security** with Helmet (XSS, CSRF, etc.)
- **Global Exception Handling** for better error handling
- **>95% Test Coverage** (100% for Business Logic)

## 🛠️ Tech Stack

- **Framework**: NestJS 11 + Express
- **Language**: TypeScript 5.8 (ESM Module)
- **Database**: TypeORM + SQLite
- **Testing**: Vitest + Supertest
- **Validation**: class-validator + class-transformer
- **Security**: Helmet, Rate Limiting, CORS
- **Code Quality**: ESLint + Prettier + strict TypeScript

## ⚡ Quick Start

```bash
# Installation
npm install

# Environment Setup (optional)
cp .env.example .env

# Build & Run
npm run build
npm run start:dev

# Testing
npm test
npm run test:cov

# Code Quality
npm run lint:check
npm run format:check
npm run typecheck
```

Server runs on: `http://localhost:3000/api/v1`

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
POST   /listings/:listingId/applications    # Submit application
PATCH  /applications/:id                    # Update status
GET    /sitters/:sitterId/applications      # Get applications by sitter
GET    /listings/:listingId/applications    # Get applications for listing
```

## 🧪 Testing

- **212 Tests** (Unit + E2E + Integration + DTO Validation + Complex Scenarios)
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

## 🏗️ Project Structure

```text
src/
├── main.ts           # Application entry point
├── app/              # Main application module and configuration
├── common/           # Shared utilities and components
│   ├── filters/      # Global exception filters
│   └── validators/   # Custom validation classes
├── domain/           # Database entities and models
│   ├── applications/ # Application entity
│   └── listings/     # Listing entity
├── infrastructure/   # Database configuration and services
│   └── database/     # Database module and service
├── modules/          # Business logic modules
│   ├── listings/     # Listing management
│   └── applications/ # Application workflow
└── seeder/           # Database seeding service
```

## ⚙️ Configuration

### 🔧 Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# Security & Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
ALLOWED_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=debug
API_VERSION=2025.06.1
```
