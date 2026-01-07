# API Reference

Complete API documentation for the Local Listings Engine.

**Base URL:** `http://localhost:3000/api/v1` (development)

**Authentication:** Bearer token (JWT) in `Authorization` header

---

## Table of Contents

1. [Authentication](#authentication)
2. [Agencies](#agencies)
3. [Businesses](#businesses)
4. [Listings](#listings)
5. [Subscriptions](#subscriptions)
6. [Webhooks](#webhooks)
7. [Error Handling](#error-handling)

---

## Authentication

### POST /auth/register

Register new agency and create admin user.

**Request Body:**
```typescript
{
  agencyName: string;      // 2-255 chars
  agencySlug: string;      // lowercase, numbers, hyphens only
  email: string;           // Valid email
  password: string;        // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  firstName: string;       // 1-100 chars
  lastName: string;        // 1-100 chars
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "agency": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Acme Marketing",
        "slug": "acme-marketing"
      },
      "role": "owner"
    }
  }
}
```

**Errors:**
- `409 Conflict` - Email or agency slug already exists

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK` (same format as /register)

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `401 Unauthorized` - Account not active

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### GET /auth/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@acme.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "phone": "+1-555-0123",
    "emailVerified": false,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "memberships": [
      {
        "role": "owner",
        "agency": {
          "id": "uuid",
          "name": "Acme Marketing",
          "slug": "acme-marketing",
          "logoUrl": null,
          "plan": "starter"
        }
      }
    ]
  }
}
```

---

## Businesses

### GET /businesses

Get all businesses for the authenticated agency.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Plumbing",
      "legalName": "Acme Plumbing LLC",
      "phone": "+1-555-0123",
      "email": "info@acmeplumbing.com",
      "website": "https://acmeplumbing.com",
      "addressLine1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "status": "active",
      "onboardingStep": "complete",
      "createdAt": "2024-01-01T00:00:00Z",
      "subscriptions": [
        {
          "id": "uuid",
          "status": "active",
          "planName": "Listings Starter"
        }
      ]
    }
  ]
}
```

---

### GET /businesses/:id

Get single business by ID.

**Parameters:**
- `id` (path) - Business UUID

**Response:** `200 OK` (single business object with full details)

**Errors:**
- `404 Not Found` - Business not found or doesn't belong to agency

---

### POST /businesses

Create new business.

**Request Body:**
```json
{
  "name": "Acme Plumbing",
  "legalName": "Acme Plumbing LLC",
  "phone": "+1-555-0123",
  "email": "info@acmeplumbing.com",
  "website": "https://acmeplumbing.com",
  "addressLine1": "123 Main St",
  "addressLine2": "Suite 100",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94105",
  "country": "US",
  "industry": "Plumbing",
  "description": "Professional plumbing services in SF Bay Area",
  "logoUrl": "https://example.com/logo.png",
  "categories": ["Plumbing", "Emergency Services", "Residential"],
  "hours": {
    "monday": {"open": "09:00", "close": "17:00", "isClosed": false},
    "tuesday": {"open": "09:00", "close": "17:00", "isClosed": false},
    "wednesday": {"open": "09:00", "close": "17:00", "isClosed": false},
    "thursday": {"open": "09:00", "close": "17:00", "isClosed": false},
    "friday": {"open": "09:00", "close": "17:00", "isClosed": false},
    "saturday": {"open": "10:00", "close": "14:00", "isClosed": false},
    "sunday": {"open": null, "close": null, "isClosed": true}
  }
}
```

**Response:** `201 Created` (business object)

---

### PUT /businesses/:id

Update business profile.

**Request Body:** Same as POST (partial updates allowed)

**Response:** `200 OK` (updated business object)

---

### DELETE /businesses/:id

Soft delete business.

**Response:** `200 OK`

**Note:** Business is marked as deleted but data is retained for 30 days.

---

## Listings

### GET /businesses/:businessId/listings/summary

Get optimization score and sync status for a business.

**Parameters:**
- `businessId` (path) - Business UUID

**Response:** `200 OK`
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
      "penalties": 0,
      "rating": "Good",
      "metrics": {
        "totalDirectories": 15,
        "liveDirectories": 8,
        "pendingDirectories": 2,
        "errorDirectories": 0
      },
      "completeness": {
        "hasHours": true,
        "hasCategory": true,
        "hasWebsite": true,
        "hasDescription": true,
        "hasPhotos": true,
        "hasLogo": true
      },
      "priorityPublishers": {
        "googleLive": true,
        "yelpLive": true,
        "facebookLive": false
      }
    },
    "subscription": {
      "id": "sub_xxx",
      "status": "active",
      "planName": "Listings Starter",
      "currentPeriodEnd": "2024-02-15T00:00:00Z"
    },
    "syncStatus": {
      "yextLocationId": "loc_123",
      "yextSyncStatus": "synced",
      "yextLastSyncedAt": "2024-01-15T10:30:00Z",
      "yextSyncError": null
    },
    "onboardingStep": "complete"
  }
}
```

---

### GET /businesses/:businessId/listings/directories

Get directory statuses for a business.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "directoryId": "uuid",
      "directoryName": "Google Business Profile",
      "directorySlug": "google_business",
      "directoryLogo": "https://www.google.com/favicon.ico",
      "directoryPriority": 100,
      "status": "live",
      "businessName": "Acme Plumbing",
      "phone": "+1-555-0123",
      "address": "123 Main St, San Francisco, CA, 94105",
      "externalListingId": "gbp_123",
      "externalUrl": "https://g.page/acme-plumbing",
      "lastSyncedAt": "2024-01-15T10:30:00Z",
      "lastErrorAt": null,
      "errorMessage": null,
      "retryCount": 0
    },
    {
      "directoryId": "uuid",
      "directoryName": "Yelp",
      "directorySlug": "yelp",
      "status": "pending",
      "businessName": "Acme Plumbing",
      "phone": "+1-555-0123",
      "address": "123 Main St, San Francisco, CA, 94105",
      "externalListingId": null,
      "externalUrl": null,
      "lastSyncedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status Values:**
- `unavailable` - Not yet activated
- `pending` - Sync in progress
- `live` - Successfully published
- `error` - Failed to sync
- `inactive` - Subscription canceled
- `under_review` - Directory is reviewing

---

### POST /businesses/:businessId/listings/activate

Activate Listings for a business.

**What it does:**
1. Creates Stripe subscription (14-day trial, $39/mo after)
2. Creates Yext location
3. Initiates sync to all 15 directories
4. Returns immediately (processing is async)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "message": "Listings activation in progress",
    "jobId": "job_123",
    "businessId": "uuid"
  }
}
```

**Errors:**
- `400 Bad Request` - Listings already activated
- `400 Bad Request` - Business profile incomplete (missing required fields)
- `404 Not Found` - Business not found

---

### POST /businesses/:businessId/listings/sync

Trigger manual sync of business profile to Yext.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Sync job enqueued",
    "jobId": "job_456",
    "businessId": "uuid"
  }
}
```

**Errors:**
- `400 Bad Request` - Listings not activated yet
- `404 Not Found` - Business not found

---

### POST /businesses/:businessId/listings/refresh

Fetch latest publisher statuses from Yext.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Refresh status job enqueued",
    "jobId": "job_789"
  }
}
```

---

## Webhooks

### POST /webhooks/yext

Receive webhook events from Yext.

**Headers:**
- `X-Yext-Signature` - HMAC signature for verification

**Request Body:**
```json
{
  "meta": {
    "eventId": "evt_123",
    "timestamp": "2024-01-15T10:30:00Z",
    "eventType": "LISTING_PUBLISHED"
  },
  "locationId": "loc_123",
  "publisherId": "GOOGLEMYBUSINESS",
  "status": "LIVE",
  "liveUrl": "https://g.page/acme-plumbing"
}
```

**Response:** `200 OK`

**Note:** Webhooks are processed asynchronously. Status updates appear in 1-2 minutes.

---

### POST /webhooks/stripe

Receive webhook events from Stripe.

**Headers:**
- `Stripe-Signature` - Stripe signature for verification

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response:** `200 OK`

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per agency
- 1000 requests per minute globally

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320600
```

**Response when exceeded:** `429 Too Many Requests`

---

## Pagination

For endpoints returning lists (future enhancement):

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Testing with cURL

### Register Agency
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "agencyName": "Test Agency",
    "agencySlug": "test-agency",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Get Listings Summary
```bash
curl -X GET http://localhost:3000/api/v1/businesses/{businessId}/listings/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Activate Listings
```bash
curl -X POST http://localhost:3000/api/v1/businesses/{businessId}/listings/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import this collection for easier testing:

**[Download Postman Collection](./postman_collection.json)**

---

## SDK (Future)

We plan to release official SDKs for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby

**Example (TypeScript):**
```typescript
import { ListingsClient } from '@listings-engine/sdk';

const client = new ListingsClient({
  apiKey: 'your-api-key',
});

const summary = await client.listings.getSummary(businessId);
console.log(`Optimization Score: ${summary.optimizationScore}%`);
```

---

**For questions or support, contact: api-support@yourcompany.com**
