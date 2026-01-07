# Local Listings Engine - Architecture Overview

## Executive Summary

This is a multi-tenant SaaS platform enabling agencies to manage local directory listings (Google Business Profile, Yelp, Bing Places, etc.) for their clients through a centralized Listings Engine (Yext/Uberall). The system mirrors the GoHighLevel Listings UX pattern.

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Next.js React SPA (Agency Dashboard)                   │   │
│  │   - Auth (JWT)                                            │   │
│  │   - Business Management                                   │   │
│  │   - Listings Overview (Optimization Score, Directories)   │   │
│  │   - Billing/Subscription Management                       │   │
│  └────────────────┬─────────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────────┘
                    │ HTTPS/REST API
┌───────────────────▼─────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   NestJS REST API                                        │   │
│  │   - Multi-tenant Auth Middleware (JWT validation)        │   │
│  │   - Rate Limiting & Request Validation                   │   │
│  │   - Tenant Isolation (Row-Level Security)                │   │
│  └────────────────┬─────────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐   │
│  │   Auth       │  Agencies    │  Businesses  │  Listings   │   │
│  │   Module     │  Module      │  Module      │  Module     │   │
│  └──────────────┴──────────────┴──────────────┴─────────────┘   │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐   │
│  │  Billing     │   Jobs       │  Webhooks    │  Reporting  │   │
│  │  Module      │   Module     │  Module      │  Module     │   │
│  └──────────────┴──────────────┴──────────────┴─────────────┘   │
└───────────────────┬────────────────────┬────────────────────────┘
                    │                    │
        ┌───────────▼──────────┐    ┌───▼────────────────────┐
        │  PostgreSQL DB       │    │  Redis Cache & Queues  │
        │  (Prisma ORM)        │    │  - BullMQ Workers      │
        │  - Multi-tenant data │    │  - Session store       │
        │  - Audit logs        │    │  - Job queue           │
        └──────────────────────┘    └────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                   Background Workers                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   BullMQ Job Processors                                  │   │
│  │   - Listings Sync Worker (on profile change)             │   │
│  │   - Status Refresh Worker (scheduled daily)              │   │
│  │   - Bulk Operations Worker                               │   │
│  │   - Webhook Handler Worker                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬────────────────────────────┬────────────────────────┘
            │                            │
    ┌───────▼──────────┐        ┌───────▼──────────────┐
    │  Listings Engine │        │  Stripe API          │
    │  (Yext/Uberall)  │        │  - Subscriptions     │
    │  - Create/Update │        │  - Webhooks          │
    │  - Sync Trigger  │        │  - Customer Portal   │
    │  - Status Fetch  │        └──────────────────────┘
    │  - Webhooks      │
    └──────────────────┘
```

## Core Design Principles

### 1. Multi-Tenancy & Data Isolation

**Agency-Based Tenancy Model:**
- Each request validates JWT containing `agencyId` and `userId`
- All queries filtered by agency ownership via middleware
- Database queries use `WHERE agency_id = :agencyId` clause automatically
- No cross-agency data leakage possible

**Isolation Layers:**
1. **Application Layer**: NestJS guards check JWT claims
2. **Service Layer**: All queries scoped to agency context
3. **Database Layer**: Foreign keys enforce referential integrity
4. **API Layer**: Rate limits per agency, not global

### 2. Listings Engine Integration Pattern

**Assumption**: We use **Yext** as the primary listings engine (could swap for Uberall with minimal changes).

**Why Not Direct API Integration?**
- Maintaining 50+ directory APIs (Google, Yelp, Facebook, Bing, etc.) is unsustainable
- Yext/Uberall handle OAuth flows, schema mapping, and compliance
- We focus on business value, not API maintenance

**Integration Flow:**
```
1. User updates business profile in our system
   ↓
2. System enqueues `SYNC_TO_ENGINE` job
   ↓
3. Worker sends PUT /locations/{id} to Yext API
   ↓
4. Yext distributes to configured publishers (Google, Yelp, etc.)
   ↓
5. Yext webhooks notify us of status changes
   ↓
6. We update `business_directory_status` table
   ↓
7. Frontend polls or uses WebSockets to show live status
```

### 3. Billing & Subscription Model

**Cost Structure:**
- **Our cost**: Pay Yext/Uberall per location/month (~$10-20 per location)
- **Client pricing**: Charge $30-50/month per business for Listings feature
- **Margin**: 50-70% gross margin per location

**Stripe Integration:**
- Each `business` has a Stripe Customer ID
- Activating Listings creates a Subscription
- Subscription metadata includes `businessId` and `agencyId`
- Webhook events update `subscriptions` table status
- Failed payments → pause syncs, show banner in UI

**Subscription States:**
- `trial` → 14-day free trial, full sync enabled
- `active` → Paid, syncs running
- `past_due` → Payment failed, 7-day grace period, syncs paused
- `canceled` → User canceled, syncs stopped, data retained 30 days
- `unpaid` → Hard fail, syncs disabled

### 4. Optimization Score Algorithm

**Formula:**
```
Base Score = (Live Directories / Total Available Directories) × 70

Profile Completeness Bonus (up to +20):
- Has business hours: +5
- Has category/industry: +3
- Has website: +3
- Has description (>50 chars): +3
- Has 3+ photos: +3
- Has logo: +3

Priority Publishers Bonus (up to +10):
- Google Business live: +5
- Yelp live: +3
- Facebook live: +2

TOTAL = min(100, Base + Completeness + Priority)
```

**Penalties:**
- Each directory in `error` state: -2 points
- No activity in 90 days: -10 points

**Example:**
- 5 live / 10 available = 35 base
- Complete profile = +20
- Google + Yelp live = +8
- **Total = 63** → "Good Optimization Rate"

### 5. Job Queue Architecture

**Queue Types:**
1. **sync-listings** (high priority)
   - Triggered on business profile update
   - Max retries: 3 with exponential backoff
   - Timeout: 30s

2. **refresh-status** (low priority)
   - Scheduled daily via cron
   - Fetches latest status from Yext for all active businesses
   - Batch size: 50 businesses per job

3. **webhook-processing** (critical priority)
   - Process Yext/Stripe webhooks asynchronously
   - Idempotency via webhook event ID
   - No retries (events are immutable)

**Worker Scaling:**
- Horizontal: Multiple worker processes can consume same queue
- Vertical: Increase concurrency per worker based on CPU
- Auto-scale: Add workers when queue depth > 1000

## Data Flow Examples

### Scenario 1: Agency Onboards New Client Business

```
1. Agency user creates business via POST /businesses
   → Business record created with status = 'draft'
   → Stripe customer created automatically

2. User fills master profile (name, address, phone, hours, photos)
   → Each save triggers validation
   → No sync yet (subscription not active)

3. User clicks "Scan Your Business"
   → GET /businesses/:id/listings/preview
   → System queries Yext "publisher suggestions" API
   → Returns ~15-20 available directories for that business type/location
   → Creates `business_directory_status` rows with status = 'unavailable'

4. User reviews suggested directories table
   → Shows "0 of 18 live" → Optimization Rate = 0%

5. User clicks "Activate Listings" button
   → POST /businesses/:id/listings/activate
   → Creates Stripe subscription ($39/mo)
   → Enqueues `CREATE_YEXT_LOCATION` job
   → Worker creates location in Yext API
   → Yext responds with location ID
   → Worker enqueues `INITIAL_SYNC` job
   → Updates business_directory_status to 'pending' for all publishers
   → Returns subscription details to frontend

6. Background sync runs (takes 5-30 minutes)
   → Yext propagates to Google, Yelp, etc.
   → Status updates flow back via webhooks
   → business_directory_status updated to 'live' as each publisher confirms
   → Optimization score recalculated on each update

7. User refreshes page
   → Sees "12 of 18 live" → Optimization Rate = 67% → "Good"
```

### Scenario 2: Business Profile Update Triggers Re-Sync

```
1. Agency user edits business phone number
   → PUT /businesses/:id with { phone: "+1-555-0199" }
   → Business record updated
   → `updated_at` timestamp changed

2. After-update hook triggers
   → Enqueue `SYNC_TO_ENGINE` job with payload:
     { businessId, changedFields: ['phone'] }

3. Worker picks up job
   → Fetches business + current Yext location ID
   → Sends PUT /v2/accounts/{accountId}/locations/{locationId}
     with updated phone number
   → Yext API responds 200 OK
   → Job marked complete

4. Yext distributes change to publishers (5-60 minutes)
   → Each publisher updates asynchronously
   → Yext sends webhook per publisher: "UPDATED", "LIVE"
   → Our webhook handler updates business_directory_status.last_synced_at

5. User sees in UI:
   → "Last synced: 2 minutes ago"
   → All directories still "live" (no status change, just data refresh)
```

### Scenario 3: Subscription Cancellation

```
1. User clicks "Cancel Subscription" in billing UI
   → POST /subscriptions/:id/cancel
   → Calls Stripe API: subscription.update({ cancel_at_period_end: true })
   → Updates local subscriptions.status = 'canceling'

2. Stripe webhook fires on renewal date
   → POST /webhooks/stripe with event 'customer.subscription.deleted'
   → Webhook handler updates subscriptions.status = 'canceled'
   → Enqueues `DISABLE_YEXT_LOCATION` job

3. Worker processes disable job
   → Calls Yext API: PATCH /locations/{id} { status: 'CLOSED' }
   → Yext suppresses all publishers
   → business_directory_status updated to 'inactive'

4. Frontend shows
   → "Listings subscription canceled. Reactivate to restore visibility."
   → Optimization score grayed out
   → CTA: "Reactivate Listings"
```

## Security & Compliance

### Authentication Flow
```
1. POST /auth/login { email, password }
   → Validate credentials against users table
   → Fetch agency_memberships for user
   → Generate JWT with claims:
     {
       userId: "uuid",
       email: "user@example.com",
       agencyId: "uuid",  // Primary agency
       role: "admin" | "member",
       iat: timestamp,
       exp: timestamp + 24h
     }
   → Return { accessToken, refreshToken }

2. Client stores token in httpOnly cookie or localStorage
   → Sends via Authorization: Bearer <token> on each request

3. API validates JWT on every request
   → Extracts agencyId from token
   → Injects into request context
   → All queries auto-scope to that agency
```

### Multi-Tenant Security Checklist
- ✅ **JWT validation**: Every route checks token validity
- ✅ **Agency scoping**: All queries filtered by `agency_id`
- ✅ **RBAC**: Roles determine write permissions
- ✅ **Rate limiting**: 100 req/min per agency, 1000/min global
- ✅ **Input validation**: Zod schemas on all endpoints
- ✅ **SQL injection prevention**: Prisma parameterized queries only
- ✅ **XSS prevention**: React auto-escapes, CSP headers
- ✅ **CSRF protection**: SameSite cookies + CSRF tokens on mutations

### Assumptions & Design Decisions

**Assumptions:**
1. **Single-agency users**: Each user belongs to one primary agency (can extend to multi-agency later)
2. **One subscription per business**: A business can only have one active Listings subscription
3. **Yext as primary engine**: Code structured to swap engines, but Yext is MVP choice
4. **US-market focus**: Address format is US-centric (can internationalize later)
5. **Service businesses**: Optimized for SABs (service area businesses) like plumbers, not retail chains
6. **Self-service billing**: Agencies pay us; we don't bill end clients directly

**Tech Stack Decisions:**
- **NestJS over Express**: Better DI, module system, TypeScript-first, scalable
- **Prisma over TypeORM**: Modern DX, type-safe, excellent migrations
- **BullMQ over Agenda**: Redis-backed, better observability, scales horizontally
- **Next.js over CRA**: SSR for SEO, API routes for BFF patterns, better performance
- **React Query over Redux**: Simpler data fetching, built-in caching, less boilerplate

## Deployment Architecture

### Production Setup (AWS Example)

```
┌─────────────────────────────────────────────┐
│  CloudFront CDN                              │
│  - Next.js static assets                     │
│  - Image optimization                        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Application Load Balancer                   │
│  - SSL termination                           │
│  - Health checks                             │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼─────┐  ┌─────▼──────┐
│  ECS Tasks  │  │ ECS Tasks   │
│  (API)      │  │ (Workers)   │
│  - Auto-scale│  │ - Auto-scale│
│  - 2-10 pods│  │ - 1-5 pods  │
└─────────────┘  └─────────────┘
       │               │
       └───────┬───────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌──────▼──────┐
│  RDS        │   │ ElastiCache │
│  Postgres   │   │ Redis       │
│  Multi-AZ   │   │ Cluster     │
└─────────────┘   └─────────────┘
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/listings_engine
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379
REDIS_TLS=true

# JWT
JWT_SECRET=<256-bit-secret>
JWT_EXPIRY=24h

# Yext
YEXT_API_KEY=<api-key>
YEXT_ACCOUNT_ID=<account-id>
YEXT_API_URL=https://api.yext.com/v2

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LISTINGS_PRICE_ID=price_...

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.example.com
API_URL=https://api.example.com
```

## Scalability & Performance

### Bottlenecks & Solutions

| Bottleneck | Solution |
|------------|----------|
| Database writes on sync | Batch updates, use upserts, index properly |
| Yext API rate limits | Queue with exponential backoff, cache responses |
| Optimization score calc | Cache in Redis, invalidate on status change |
| Worker overload | Horizontal scaling, priority queues |
| Frontend re-renders | React.memo, useMemo, code splitting |

### Monitoring & Observability

**Metrics to Track:**
- API response times (p50, p95, p99)
- Job queue depth and processing time
- Yext API error rates
- Stripe webhook delivery success
- Database query performance
- Active subscriptions count
- Revenue metrics (MRR, churn)

**Tools:**
- **APM**: Datadog or New Relic
- **Logs**: CloudWatch or Logtail
- **Errors**: Sentry
- **Uptime**: Pingdom

## Next Steps for MVP

1. ✅ Schema design (this document)
2. Scaffold NestJS backend + Prisma migrations
3. Implement auth module + JWT guards
4. Build Listings module core logic
5. Integrate Yext sandbox API
6. Implement BullMQ workers
7. Scaffold Next.js frontend
8. Build Listings dashboard page
9. Stripe subscription flow
10. End-to-end testing
11. Deploy to staging
12. Load testing
13. Production launch
