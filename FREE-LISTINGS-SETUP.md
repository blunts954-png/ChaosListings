# Free Listings Engine Setup Guide

This guide walks you through setting up the **free, zero-cost** listings integration for ChaosListings.

## Cost Breakdown

| API | Free Tier | Monthly Cost |
|-----|-----------|-------------|
| Google My Business | Unlimited locations | **$0** |
| Yelp Business | 5,000 calls/day | **$0** |
| **Total** | - | **$0/month** ✅ |

---

## 1. Google My Business Setup (15 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Enter project name: `ChaosListings`
4. Click **Create**

### Step 2: Enable Google My Business API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for `Google My Business`
3. Click on **Google My Business API**
4. Click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Desktop Application**
4. Fill in:
   - **Name**: `ChaosListings Desktop Client`
5. Click **Create**
6. You'll see a dialog with:
   - **Client ID** (copy this)
   - **Client Secret** (copy this)

### Step 4: Add Redirect URI (for testing)

1. In Credentials, find your OAuth 2.0 Client ID
2. Click it to edit
3. Add **Authorized Redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:3000/listings/free/google-callback
   ```
4. Save

### Step 5: Update .env

```bash
# backend/.env.local (or .env.prod)
GOOGLE_BUSINESS_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_BUSINESS_CLIENT_SECRET="your-client-secret-here"
```

**Test it:**
```bash
curl http://localhost:3000/api/businesses/123/listings/free/google-auth-url?redirectUri=http://localhost:3000
```

---

## 2. Yelp Business API Setup (5 minutes)

### Step 1: Create Yelp Developer Account

1. Go to [Yelp Developers](https://www.yelp.com/developers/)
2. Click **Get Started**
3. Sign in or create account
4. Accept terms

### Step 2: Create Your App

1. Go to [Yelp App Management](https://www.yelp.com/developers/v3/manage_app)
2. Click **Create App**
3. Fill in:
   - **App Name**: `ChaosListings`
   - **Display Name**: `ChaosListings`
   - **Application Type**: Select appropriate type
   - **Website**: `http://localhost:3000`
4. Click **Create App**

### Step 3: Get API Key

1. You'll see your **API Key** displayed
2. Copy it (starts with `Bearer` or just the key)

### Step 4: Update .env

```bash
# backend/.env.local (or .env.prod)
YELP_API_KEY="your-api-key-here"
```

**Test it:**
```bash
curl -X POST http://localhost:3000/api/businesses/123/listings/free/find-on-yelp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"businessName": "Pizza Place", "location": "San Francisco, CA"}'
```

---

## 3. Using the Free APIs

### A. Google My Business Integration

#### 1. Get Authorization URL

```bash
# User clicks this link to authorize
curl http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/google-auth-url \
  ?redirectUri=http://localhost:3000/dashboard
```

Returns:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

#### 2. Handle OAuth Callback

After user authorizes, exchange code for token:

```bash
curl -X POST http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/google-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "AUTH_CODE_FROM_REDIRECT",
    "redirectUri": "http://localhost:3000/dashboard"
  }'
```

Returns:
```json
{
  "success": true,
  "data": {
    "accessToken": "ya29.a0...",
    "refreshToken": "1//0g...",
    "expiresIn": 3599
  }
}
```

#### 3. Sync Google Locations

```bash
curl -X POST http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/sync-google \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "accessToken": "ya29.a0...",
    "accountId": "ACCOUNT_ID_FROM_GOOGLE"
  }'
```

Returns:
```json
{
  "success": true,
  "data": {
    "source": "google",
    "locationsFound": 3,
    "locations": [
      {
        "name": "accounts/123/locations/456",
        "title": "Main Location",
        "phoneNumber": "+1-555-0123",
        "address": {
          "address1": "123 Main St",
          "city": "San Francisco",
          "stateCode": "CA"
        }
      }
    ],
    "syncedAt": "2024-01-09T12:00:00Z"
  }
}
```

### B. Yelp Integration

#### 1. Find Business on Yelp

```bash
curl -X POST http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/find-on-yelp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessName": "Acme Plumbing",
    "location": "San Francisco, CA"
  }'
```

Returns:
```json
{
  "success": true,
  "data": {
    "source": "yelp",
    "found": true,
    "yelpId": "acme-plumbing-san-francisco",
    "yelpUrl": "https://www.yelp.com/biz/acme-plumbing-san-francisco",
    "rating": 4.5,
    "reviewCount": 127,
    "phone": "+1-555-0123",
    "address": {
      "address1": "123 Main St",
      "city": "San Francisco",
      "state": "CA"
    },
    "hours": [...],
    "recentReviews": [...]
  }
}
```

#### 2. Get Competitive Analysis

```bash
curl -X POST http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/competitive-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category": "Plumbing",
    "location": "San Francisco, CA"
  }'
```

Returns:
```json
{
  "success": true,
  "data": {
    "competitorCount": 10,
    "avgRating": 4.2,
    "competitors": [
      {
        "name": "Best Plumbing",
        "rating": 4.7,
        "reviewCount": 200,
        "phone": "+1-555-0456"
      }
    ]
  }
}
```

### C. Full Business Sync

Combine Google + Yelp + Competitive Analysis in one call:

```bash
curl -X POST http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/full-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessName": "Acme Plumbing",
    "location": "San Francisco, CA",
    "googleAccessToken": "ya29.a0...",
    "googleAccountId": "ACCOUNT_ID"
  }'
```

Returns comprehensive data from all sources.

---

## 4. Dashboard Integration

### Frontend Setup

The free listings endpoints are already integrated. Add this to your business dashboard:

```typescript
// frontend/src/components/listings/FreeListingsSync.tsx
import { useState } from 'react';

export default function FreeListingsSync({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const syncGoogle = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/free/google-auth-url`,
        { method: 'GET' }
      );
      const { data } = await response.json();
      
      // Redirect user to Google auth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to sync Google:', error);
    } finally {
      setLoading(false);
    }
  };

  const findOnYelp = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/free/find-on-yelp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: 'Your Business',
            location: 'Your Location'
          })
        }
      );
      const { data } = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to find on Yelp:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={syncGoogle}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sync Google Locations
      </button>

      <button
        onClick={findOnYelp}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Find on Yelp
      </button>

      {result && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

---

## 5. API Rate Limits

| API | Free Tier | Resets |
|-----|-----------|--------|
| Google My Business | Unlimited reads | Never |
| Yelp Business | 5,000 calls/day | Daily (midnight UTC) |

**Monitor your usage:**
```bash
# Yelp provides headers in responses
# X-API-Calls-Used: 1
# X-API-Calls-Remaining: 4999
```

---

## 6. Troubleshooting

### Google Authentication Issues

**Error:** `REDIRECT_URI_MISMATCH`
- **Fix**: Ensure redirect URI in Google Cloud Console matches exactly what you're using

**Error:** `Invalid authentication token`
- **Fix**: Token expired. Call `/free/refresh-google-token` with refresh token

### Yelp API Issues

**Error:** `Unauthorized`
- **Fix**: Check `YELP_API_KEY` is set correctly in `.env`

**Error:** `429 Too Many Requests`
- **Fix**: You've exceeded 5,000 calls/day. Rate limit resets at midnight UTC

### Network Issues

**Error:** `Failed to sync Google locations`
- **Fix**: Check API is enabled in Google Cloud Console: https://console.cloud.google.com/apis

---

## 7. Next Steps

### Phase 2: Manual Directory Upload
For directories without free APIs (Uber Eats, DoorDash, etc), build CSV upload feature.

### Phase 3: Expand Free APIs
Add: Apple Maps, Facebook Business, Instagram Business

### Phase 4: Premium Features
- Scheduled syncs (daily/weekly)
- Automated review responses
- Multi-location bulk updates
- Advanced analytics

---

## Questions?

- **Google My Business Docs**: https://developers.google.com/my-business/content/overview
- **Yelp API Docs**: https://docs.developer.yelp.com/
- **ChaosListings Issues**: Open a GitHub issue
