# ListingsIQ

A free local business directory management platform that automatically syncs your Google My Business and Yelp listings across 15+ directories. Built by Chaotically Organized AI.

## 🚀 Overview

ListingsIQ helps local businesses:
- Automatically sync Google My Business and Yelp listings
- Manage business information across 15+ directories
- Upload additional directories via CSV
- Keep business info accurate everywhere, automatically
- Free forever with no credit card required

### Key Features

✅ **Multi-tenant Architecture** - Agency-based isolation with JWT authentication
✅ **Listings Engine Integration** - Yext API for managing 15+ directories
✅ **Optimization Scoring** - 0-100 score based on profile completeness and directory coverage
✅ **Background Job Processing** - BullMQ workers for async sync operations
✅ **Stripe Billing** - Subscription management with webhooks
✅ **GoHighLevel-style UX** - Onboarding steps, optimization score, directories table
✅ **Production-ready** - TypeScript, Prisma ORM, comprehensive error handling

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [Running the Application](#running-the-application)
9. [API Documentation](#api-documentation)
10. [Frontend Components](#frontend-components)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## 🏗 Architecture

### System Components

```
┌─────────────┐
│   Next.js   │  ← React frontend with Tailwind CSS
│   Frontend  │
└──────┬──────┘
       │ HTTPS/REST
┌──────▼──────┐
│   NestJS    │  ← TypeScript API server
│   Backend   │  ← JWT auth, multi-tenant guards
└──────┬──────┘
       │
   ┌───┴────┬─────────┐
   │        │         │
┌──▼───┐ ┌─▼──┐ ┌────▼────┐
│ Postgres│ │Redis│ │ BullMQ  │
│ (Prisma)│ │Queue│ │ Workers │
└─────────┘ └────┘ └─────────┘
       │               │
   ┌───┴───┐      ┌────┴─────┐
   │ Yext  │      │  Stripe  │
   │  API  │      │   API    │
   └───────┘      └──────────┘
```

### Data Flow: Activating Listings

1. User clicks "Boost My Visibility Now"
2. API creates Stripe subscription (14-day trial)
3. Worker creates Yext location with business profile
4. Yext distributes to Google, Yelp, Facebook, Bing, etc.
5. Webhooks update directory statuses (pending → live)
6. Optimization score recalculates automatically
7. Frontend shows live updates (polling every 30s)

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design decisions.**

---

## 🛠 Tech Stack

### Backend
- **NestJS** - Enterprise Node.js framework with DI
- **TypeScript** - Type-safe development
- **Prisma** - Next-gen ORM for PostgreSQL
- **BullMQ** - Redis-backed job queue
- **Passport JWT** - Authentication
- **Stripe SDK** - Subscription billing
- **Axios** - HTTP client for Yext API

### Frontend
- **Next.js 14** - React framework with App Router
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Modern icon library
- **Zod** - Runtime type validation

### Infrastructure
- **PostgreSQL 14+** - Relational database
- **Redis 7+** - Cache and job queue
- **Docker** - Containerization
- **AWS/GCP** - Cloud hosting (recommended)

---

## 📁 Project Structure

```
ChaosListings/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT authentication
│   │   │   ├── listings/       # Core listings logic
│   │   │   │   ├── listings.service.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── optimization-score.service.ts
│   │   │   │   │   └── directories.service.ts
│   │   │   ├── businesses/     # Business CRUD
│   │   │   ├── agencies/       # Agency management
│   │   │   └── subscriptions/  # Billing
│   │   ├── integrations/
│   │   │   ├── yext/           # Yext API client
│   │   │   └── stripe/         # Stripe billing
│   │   ├── workers/            # Background jobs
│   │   │   ├── listings-sync.worker.ts
│   │   │   └── refresh-status.worker.ts
│   │   ├── common/
│   │   │   ├── services/       # Prisma, Logger
│   │   │   ├── guards/         # Auth guards
│   │   │   └── filters/        # Exception filters
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── package.json
│
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   └── businesses/[businessId]/listings/
│   │   │       └── page.tsx    # Main Listings page
│   │   ├── components/
│   │   │   ├── listings/
│   │   │   │   ├── OnboardingSteps.tsx
│   │   │   │   ├── OptimizationScore.tsx
│   │   │   │   ├── DirectoriesTable.tsx
│   │   │   │   ├── ActivateButton.tsx
│   │   │   │   └── SyncButton.tsx
│   │   │   └── ui/             # Reusable UI components
│   │   └── lib/
│   │       └── api/            # API client
│   └── package.json
│
├── database/
│   └── schema.sql              # PostgreSQL schema (raw SQL)
│
├── ARCHITECTURE.md             # Detailed architecture docs
└── README.md                   # This file
```

---

## ✅ Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+**
- **PostgreSQL 14+** (local or cloud)
- **Redis 7+** (local or cloud)
- **Yext account** with API credentials ([sign up](https://www.yext.com))
- **Stripe account** with test keys ([sign up](https://stripe.com))
- **Git** installed

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/chaos-listings.git
cd chaos-listings
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/listings_engine
DATABASE_POOL_SIZE=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Yext (get from https://www.yext.com/s/me/apps)
YEXT_API_KEY=your_yext_api_key
YEXT_ACCOUNT_ID=your_yext_account_id
YEXT_API_URL=https://api.yext.com/v2
YEXT_WEBHOOK_SECRET=your_webhook_secret

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LISTINGS_PRICE_ID=price_...  # Create product in Stripe first

# Frontend
FRONTEND_URL=http://localhost:3001

# API
API_URL=http://localhost:3000

# Rate limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## 🗄 Database Setup

### Option 1: Using Prisma (Recommended)

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed directories
npm run prisma:seed
```

### Option 2: Using Raw SQL

```bash
psql -U postgres -d listings_engine -f database/schema.sql
```

### Verify Setup

```bash
cd backend
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

You should see these tables:
- agencies
- users
- businesses
- directories (with 15 pre-seeded directories)
- business_directory_status
- subscriptions
- jobs
- optimization_scores

---

## 🚀 Running the Application

### Development Mode

**Terminal 1: Start Backend**
```bash
cd backend
npm run start:dev
```
API runs at http://localhost:3000
Swagger docs at http://localhost:3000/api/docs

**Terminal 2: Start Workers**
```bash
cd backend
npm run worker:dev
```

**Terminal 3: Start Frontend**
```bash
cd frontend
npm run dev
```
Frontend runs at http://localhost:3001

### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Workers:**
```bash
cd backend
npm run build
node dist/workers/index.js
```

**Frontend:**
```bash
cd frontend
npm run build
npm run start
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register new agency and admin user.

**Request:**
```json
{
  "agencyName": "Acme Marketing",
  "agencySlug": "acme-marketing",
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "agency": {
        "id": "uuid",
        "name": "Acme Marketing",
        "slug": "acme-marketing"
      },
      "role": "owner"
    }
  }
}
```

#### POST /api/v1/auth/login
Login existing user.

**Request:**
```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

### Listings Endpoints

#### GET /api/v1/businesses/:businessId/listings/summary
Get optimization score and summary.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessId": "uuid",
    "businessName": "Acme Plumbing",
    "optimizationScore": 67,
    "rating": "Good",
    "breakdown": {
      "score": 67,
      "baseScore": 35.0,
      "completenessBonus": 20,
      "priorityPublisherBonus": 8,
      "metrics": {
        "totalDirectories": 15,
        "liveDirectories": 8,
        "pendingDirectories": 2,
        "errorDirectories": 0
      }
    },
    "subscription": {
      "id": "sub_xxx",
      "status": "active",
      "planName": "Listings Starter"
    }
  }
}
```

#### GET /api/v1/businesses/:businessId/listings/directories
Get directories table data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "directoryId": "uuid",
      "directoryName": "Google Business Profile",
      "status": "live",
      "businessName": "Acme Plumbing",
      "phone": "+1-555-0123",
      "address": "123 Main St, San Francisco, CA, 94105",
      "externalUrl": "https://g.page/acme-plumbing"
    }
  ]
}
```

#### POST /api/v1/businesses/:businessId/listings/activate
Activate Listings (creates subscription and syncs to Yext).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Listings activation in progress",
    "jobId": "job_123"
  }
}
```

#### POST /api/v1/businesses/:businessId/listings/sync
Trigger manual sync to Yext.

**Full API docs:** http://localhost:3000/api/docs (when backend running)

---

## 🎨 Frontend Components

### Component Tree

```
ListingsPage
├── OnboardingSteps           # Shows 4-step progress
├── OptimizationScore         # Score display + breakdown
│   ├── MetricCard (x4)
│   └── ChecklistItem (x9)
├── ActivateButton            # "Boost My Visibility Now" CTA
├── SyncButton                # Manual sync trigger
└── DirectoriesTable          # 15 directories with status
    └── StatusBadge (x15)
```

### Key Components

**OnboardingSteps** (`frontend/src/components/listings/OnboardingSteps.tsx`)
- Displays: Scan → Review → Correct & Elevate → Complete
- Highlights current step with blue circle
- Shows completed steps with checkmarks

**OptimizationScore** (`frontend/src/components/listings/OptimizationScore.tsx`)
- Color-coded by rating (Bad=red, Poor=orange, Fair=yellow, Good=blue, Excellent=green)
- Shows score breakdown with bonuses and penalties
- Profile completeness checklist
- Priority publishers status (Google, Yelp, Facebook)

**DirectoriesTable** (`frontend/src/components/listings/DirectoriesTable.tsx`)
- Displays all 15 directories in sortable table
- Status badges with tooltips for errors
- External links to live listings
- Last synced timestamp

**ActivateButton** (`frontend/src/components/listings/ActivateButton.tsx`)
- Gradient blue button: "Boost My Visibility Now"
- Shows loading spinner during activation
- Disabled state when processing

**SyncButton** (`frontend/src/components/listings/SyncButton.tsx`)
- Secondary button for manual sync
- Shows "Last synced: X minutes ago"
- Rotating icon during sync

---

## 🚢 Deployment

### Docker Deployment

**Create `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: listings_engine
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/listings_engine
      REDIS_HOST: redis

  worker:
    build: ./backend
    command: node dist/workers/index.js
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000/api/v1
```

**Run:**
```bash
docker-compose up -d
```

### AWS Deployment Example

1. **Database:** RDS PostgreSQL (Multi-AZ)
2. **Cache:** ElastiCache Redis (Cluster mode)
3. **API:** ECS Fargate (2-10 tasks, auto-scaling)
4. **Workers:** ECS Fargate (1-5 tasks)
5. **Frontend:** Vercel or CloudFront + S3
6. **Load Balancer:** ALB with SSL (ACM certificate)

**Environment setup:**
- Create `.env.production` with production credentials
- Update `FRONTEND_URL` to your domain
- Configure Stripe webhooks to point to your API
- Set up Yext webhook endpoint

---

## 🧪 Testing

### Run Tests

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

### Manual Testing Checklist

- [ ] Register new agency
- [ ] Login with credentials
- [ ] Create new business
- [ ] View Listings page (score should be 0%)
- [ ] Click "Boost My Visibility Now"
- [ ] Verify Stripe subscription created
- [ ] Wait for sync to complete (~2 mins)
- [ ] Refresh page - score should increase
- [ ] Check directories table - statuses should update
- [ ] Click "Sync Now" - verify manual sync works
- [ ] Check database - `business_directory_status` updated
- [ ] Check Yext dashboard - location should exist

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -l

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Issue: "Yext API 401 Unauthorized"

**Solution:**
- Verify `YEXT_API_KEY` in `.env`
- Check API key has correct permissions in Yext dashboard
- Ensure account ID matches your Yext account

### Issue: "Optimization score not updating"

**Solution:**
```bash
# Check if workers are running
ps aux | grep worker

# Check BullMQ queue
redis-cli
> KEYS bull:*
> LLEN bull:sync-listings:waiting

# Restart workers
npm run worker:dev
```

### Issue: "Directories table empty"

**Solution:**
```bash
# Seed directories
cd backend
npm run prisma:seed

# Or run SQL manually
psql $DATABASE_URL -f database/schema.sql
```

### Issue: "Frontend can't connect to API"

**Solution:**
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify backend is running on port 3000
- Check browser console for CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL

---

## 📝 Additional Resources

- **Yext API Docs:** https://developer.yext.com/docs/api-reference/
- **Stripe API Docs:** https://stripe.com/docs/api
- **NestJS Docs:** https://docs.nestjs.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

## 🤝 Contributing

This is a production template. Customize for your needs:

1. Update branding (colors, logo, company name)
2. Add custom directories beyond the 15 defaults
3. Implement additional features:
   - Review management integration
   - Automated posting to directories
   - Analytics dashboard
   - White-label client portals
4. Extend billing plans (Starter, Pro, Enterprise)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 💬 Support

For questions or issues:
- Create an issue on GitHub
- Email: support@yourcompany.com
- Slack: #listings-engine

---

**Built with ❤️ for agencies managing local businesses**
