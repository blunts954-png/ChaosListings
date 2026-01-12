# 📋 Complete Action Plan to Launch

Everything you need to do to go from current state to **LIVE with first customers**.

---

## 🎯 Phase Overview & Timeline

| Phase | What | Time | Status |
|-------|------|------|--------|
| **1-2** | Backend + 7 API endpoints | ✅ Done | Complete |
| **3** | Frontend + Manual uploads + Dashboard | 5-7 hrs | Ready to build |
| **4** | Scheduled syncs + Error handling | 3-5 hrs | Ready to build |
| **5** | Deploy to production | 2-3 hrs | Ready |
| **6** | Testing & optimization | 2-3 hrs | Ready |
| **7** | Launch prep & first customer | 1-2 hrs | Ready |
| **TOTAL** | From zero to revenue | ~18-25 hours | **Can do this weekend!** |

---

## ✅ PHASE 3A: Manual Directory Upload Endpoint (2-3 hours)

For directories without free APIs (Uber Eats, DoorDash, Grubhub, etc).

### Database Schema Addition
Add to `backend/prisma/schema.prisma`:

```prisma
model DirectoryListing {
  id            String   @id @default(cuid())
  businessId    String
  business      Business @relation(fields: [businessId], references: [id])
  
  directory     String   // "Uber Eats", "DoorDash", "Instagram", etc
  name          String   // Business name on that directory
  url           String   // Link to listing
  phone         String?
  hours         String?  // JSON stringified hours
  description   String?  // Business description
  photoUrls     String[] // Photo URLs (stored as JSON array)
  
  lastUpdated   DateTime @updatedAt
  createdAt     DateTime @default(now())
  
  @@index([businessId])
  @@index([directory])
}
```

### API Endpoints to Create

```typescript
// POST /businesses/:id/listings/manual/upload
// Upload CSV with directory data
// Example CSV:
// directory,name,url,phone,hours,description
// "Uber Eats","My Restaurant","https://ubereats.com/...","555-1234","9am-9pm","Great food"
// "DoorDash","My Restaurant","https://doordash.com/...","555-1234","9am-9pm","Great food"

// GET /businesses/:id/listings/manual
// List all manual directory listings for a business

// PATCH /businesses/:id/listings/manual/:directoryId
// Update manual directory entry

// DELETE /businesses/:id/listings/manual/:directoryId
// Delete manual directory entry

// POST /businesses/:id/listings/manual/:directoryName/sync
// Sync a specific directory manually
```

### Implementation File

Create: `backend/src/modules/listings/services/manual-directories.service.ts`

```typescript
@Injectable()
export class ManualDirectoriesService {
  constructor(private prisma: PrismaService) {}

  // Parse CSV and create directory listings
  async uploadDirectoryData(businessId: string, csvData: string) {
    // Parse CSV string into rows
    // Validate each row
    // Create DirectoryListing records
    // Return created count and status
  }

  // Get all listings for a business
  async getDirectoryListings(businessId: string) {
    return this.prisma.directoryListing.findMany({
      where: { businessId }
    });
  }

  // Update a directory listing
  async updateListing(businessId: string, listingId: string, data: any) {
    return this.prisma.directoryListing.update({
      where: { id: listingId, businessId },
      data
    });
  }

  // Delete listing
  async deleteListing(businessId: string, listingId: string) {
    return this.prisma.directoryListing.delete({
      where: { id: listingId, businessId }
    });
  }
}
```

### Effort Breakdown
- [ ] Update Prisma schema (15 min)
- [ ] Run migration (5 min)
- [ ] Create ManualDirectoriesService (45 min)
- [ ] Add 4 endpoints to controller (30 min)
- [ ] Add to module (10 min)
- [ ] Test with sample CSV (15 min)
- **Total: 2 hours**

---

## ✅ PHASE 3B: Frontend Components (3-4 hours)

Build React components for the business dashboard.

### Components to Create

#### 1. **GoogleAuthFlow.tsx** (45 min)
```typescript
// What it does:
// - Shows "Connect to Google" button
// - Redirects to Google OAuth
// - Handles callback with auth code
// - Stores access token securely
// - Shows connected status

export default function GoogleAuthFlow({ businessId }) {
  const handleConnect = () => {
    // Fetch auth URL from API
    // Redirect user
    // Handle callback
  };
}
```

#### 2. **YelpSearch.tsx** (45 min)
```typescript
// What it does:
// - Search form (business name + location)
// - Display results (rating, reviews, hours)
// - Show Yelp link
// - Competitive analysis

export default function YelpSearch({ businessId }) {
  const [results, setResults] = useState(null);
  
  const handleSearch = async (name, location) => {
    // Call /listings/free/find-on-yelp
    // Display results
  };
}
```

#### 3. **ManualUploadForm.tsx** (45 min)
```typescript
// What it does:
// - File upload for CSV
// - Preview parsed data
// - Upload and show status
// - List uploaded directories

export default function ManualUploadForm({ businessId }) {
  const handleUpload = async (file) => {
    // Parse CSV
    // Call /listings/manual/upload
    // Show confirmation
  };
}
```

#### 4. **SyncStatus.tsx** (30 min)
```typescript
// What it does:
// - Show all synced directories
// - Last sync time
// - Sync status (success/pending/error)
// - Resync button for each

export default function SyncStatus({ businessId }) {
  // Fetch status from API
  // Display in nice table/cards
}
```

#### 5. **CompetitiveAnalysis.tsx** (30 min)
```typescript
// What it does:
// - Show competitor businesses
// - Rankings, ratings, counts
// - Market positioning

export default function CompetitiveAnalysis({ businessId }) {
  // Show top 10 competitors
  // Average rating
  // Recommendations
}
```

### Page Integration

Update: `frontend/src/app/businesses/[id]/listings/page.tsx`

```typescript
export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <h1>Listings Management</h1>
      
      <GoogleAuthFlow />
      <YelpSearch />
      <ManualUploadForm />
      <SyncStatus />
      <CompetitiveAnalysis />
    </div>
  );
}
```

### Effort Breakdown
- [ ] GoogleAuthFlow component (45 min)
- [ ] YelpSearch component (45 min)
- [ ] ManualUploadForm component (45 min)
- [ ] SyncStatus component (30 min)
- [ ] CompetitiveAnalysis component (30 min)
- [ ] Create new page (15 min)
- [ ] Style with Tailwind (15 min)
- [ ] Test all flows (15 min)
- **Total: 4 hours**

---

## ✅ PHASE 3C: Admin Dashboard (2 hours)

Show sync history and status across all businesses.

### Dashboard Components

```typescript
// backend/src/modules/listings/dto/sync-history.dto.ts
export class SyncHistoryDto {
  id: string;
  businessId: string;
  businessName: string;
  source: 'google' | 'yelp' | 'manual'; // Source
  status: 'success' | 'pending' | 'failed'; // Status
  locationsFound: number;
  lastSync: Date;
  nextSync?: Date;
  errorMessage?: string;
}

// API endpoint
GET /listings/admin/sync-history
// Returns all syncs across all businesses in agency
// Sortable, filterable, paginated
```

### Frontend Dashboard

```typescript
// frontend/src/app/admin/listings-dashboard/page.tsx
export default function ListingsDashboard() {
  return (
    <div className="space-y-6">
      <h1>Listings Admin Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Businesses" value={businessCount} />
        <Card title="Synced This Week" value={syncedCount} />
        <Card title="Active Syncs" value={activeCount} />
        <Card title="Failed Syncs" value={failedCount} />
      </div>
      
      {/* Recent Activity */}
      <SyncHistoryTable data={syncHistory} />
      
      {/* Business Status */}
      <BusinessListingsTable data={businesses} />
    </div>
  );
}
```

### Effort Breakdown
- [ ] Add sync history DTO (15 min)
- [ ] Add sync history endpoint (30 min)
- [ ] Create dashboard page (30 min)
- [ ] Build components (30 min)
- [ ] Add charts (15 min)
- **Total: 2 hours**

---

## ✅ PHASE 4A: Scheduled Syncs (2-3 hours)

Auto-sync business data on a schedule.

### Setup

```typescript
// backend/src/workers/scheduled-listings-sync.worker.ts
// Similar to existing workers

@Processor('scheduled-listings-sync')
export class ScheduledListingsSyncWorker {
  @Process()
  async handleSync(job: Job) {
    // Get all active businesses
    // For each, check if sync needed (daily/weekly)
    // If needed, trigger sync
    // Store result in database
  }
}
```

### UI for Schedule Management

```typescript
// Component: ScheduleSettings.tsx
// Allow users to set:
// - Sync frequency (daily/weekly/monthly)
// - Preferred time
// - What to sync (Google, Yelp, Manual)
// - Enable/disable
```

### Database

```prisma
model SyncSchedule {
  id            String   @id @default(cuid())
  businessId    String
  business      Business @relation(fields: [businessId], references: [id])
  
  frequency     String   // "daily", "weekly", "monthly"
  dayOfWeek     Int?     // 0-6 if weekly
  timeOfDay     String?  // "09:00" format
  
  enableGoogle  Boolean  @default(true)
  enableYelp    Boolean  @default(true)
  enableManual  Boolean  @default(false)
  
  lastRun       DateTime?
  nextRun       DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Effort Breakdown
- [ ] Add SyncSchedule model (15 min)
- [ ] Run migration (5 min)
- [ ] Create scheduled sync worker (45 min)
- [ ] Add schedule endpoints (30 min)
- [ ] UI component (30 min)
- [ ] Testing (15 min)
- **Total: 2.5 hours**

---

## ✅ PHASE 4B: Error Handling & Monitoring (1-2 hours)

Better error messages and automatic retry logic.

### Improvements

```typescript
// Enhanced error handling
- Add detailed error messages
- Log all sync attempts
- Auto-retry failed syncs (3 times with exponential backoff)
- Email alerts on failures
- Dashboard shows error details

// Database for tracking
model SyncLog {
  id            String   @id @default(cuid())
  businessId    String
  
  source        String   // "google", "yelp", "manual"
  status        String   // "success", "failed", "pending"
  locationsFound Int?
  errorMessage  String?
  errorCode     String?
  
  attempt       Int      @default(1) // Retry count
  nextRetry     DateTime?
  
  createdAt     DateTime @default(now())
  
  @@index([businessId, createdAt])
}
```

### Effort Breakdown
- [ ] Add SyncLog model (10 min)
- [ ] Implement retry logic (30 min)
- [ ] Add error emails (20 min)
- [ ] Dashboard display (30 min)
- [ ] Testing (15 min)
- **Total: 1.75 hours**

---

## ✅ PHASE 5A: Deploy to Production (1-2 hours)

Get live on Render + Vercel.

### Backend on Render

1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Select branch: `claude/local-listings-engine-3jfLj`
5. Build: `npm install && npm run build`
6. Start: `npm run start`
7. Environment variables (copy from `.env.prod`)
8. Deploy

### Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Import project from GitHub
3. Framework: Next.js
4. Build settings: Default
5. Environment: Copy from `.env.prod`
6. Deploy

### Custom Domain

1. Add domain to both Render and Vercel
2. Update DNS records
3. Enable SSL

### Effort Breakdown
- [ ] Deploy backend to Render (30 min)
- [ ] Deploy frontend to Vercel (20 min)
- [ ] Set up custom domain (20 min)
- [ ] Enable SSL/HTTPS (10 min)
- [ ] Test production URLs (10 min)
- **Total: 1.5 hours**

---

## ✅ PHASE 5B: Monitoring & Observability (1 hour)

Set up error tracking and logging.

### Sentry Setup

Already configured in code, just add DSN:
```bash
SENTRY_DSN="https://key@sentry.io/project"
```

### CloudWatch Logs (or similar)

Monitor:
- API response times
- Error rates
- Database connection pool
- Redis queue health

### Effort Breakdown
- [ ] Configure Sentry (10 min)
- [ ] Add custom error tracking (10 min)
- [ ] Set up alerts (10 min)
- [ ] Test error reporting (10 min)
- [ ] Dashboard setup (10 min)
- **Total: 50 min**

---

## ✅ PHASE 6: Testing & QA (2-3 hours)

Comprehensive testing before launch.

### Manual Testing Checklist

- [ ] Google auth flow (can authenticate)
- [ ] Google sync (gets locations)
- [ ] Yelp search (finds businesses, shows ratings)
- [ ] Manual CSV upload (stores correctly)
- [ ] Scheduled syncs (runs on time)
- [ ] Error retry (handles failures gracefully)
- [ ] Admin dashboard (shows all data)
- [ ] Mobile responsive (works on phones)

### Load Testing

```bash
# Test with 100 concurrent users
ab -n 1000 -c 100 https://your-domain.com/api/health
```

### Performance

- API response time < 200ms (target)
- Page load < 3s (target)
- Database queries optimized (add indexes as needed)

### Effort Breakdown
- [ ] Manual testing (60 min)
- [ ] Load testing (30 min)
- [ ] Bug fixes (30 min)
- [ ] Performance optimization (30 min)
- **Total: 2.5 hours**

---

## ✅ PHASE 7: Launch Prep (1-2 hours)

Final checklist before taking first payment.

### Pre-Launch Checklist

- [ ] Pricing page is live
- [ ] Terms of Service added
- [ ] Privacy Policy added
- [ ] Stripe configured (webhooks, error handling)
- [ ] First customer onboarded
- [ ] Payment test processed
- [ ] Confirmation emails working
- [ ] Support email setup
- [ ] Documentation published
- [ ] Status page created

### First Customer Checklist

- [ ] Get real credentials (Google + Yelp)
- [ ] Connect Google My Business
- [ ] Search Yelp for their business
- [ ] Upload manual directories
- [ ] Verify data synced correctly
- [ ] Schedule daily syncs
- [ ] Show admin dashboard
- [ ] Confirm happy

### Effort Breakdown
- [ ] Legal docs (15 min - can use templates)
- [ ] Stripe webhook testing (15 min)
- [ ] Onboarding first customer (30 min)
- [ ] Documentation finalization (15 min)
- **Total: 1.25 hours**

---

## 📊 Complete Timeline

```
Day 1 (Saturday) - 8 hours
├─ Phase 3A: Manual uploads (2-3 hrs)
├─ Phase 3B: Frontend components (3-4 hrs)
└─ Phase 3C: Admin dashboard (2 hrs)

Day 2 (Sunday) - 8 hours
├─ Phase 4A: Scheduled syncs (2-3 hrs)
├─ Phase 4B: Error handling (1-2 hrs)
├─ Phase 5A: Deploy (1.5 hrs)
├─ Phase 5B: Monitoring (1 hr)
└─ Phase 6: Testing (2-3 hrs)

Day 3 (Monday) - 2 hours
└─ Phase 7: Launch prep (1-2 hrs)

TOTAL: 18-25 HOURS (Can do this weekend + Monday!)
```

---

## 💰 Revenue Ready

Once complete:
- ✅ $0 cost to operate
- ✅ $9-$50/month price to customers
- ✅ $7-$48/month profit per customer
- ✅ First customer = profitable
- ✅ 100 customers = $700-$4,800/month
- ✅ Ready to scale

---

## 🎯 Let's Go!

Which phase do you want to tackle first?

**Pick one:**
- [ ] Phase 3A: Manual Directory Upload (2-3 hours)
- [ ] Phase 3B: Frontend Components (3-4 hours)
- [ ] All of Phase 3 together (5-7 hours)

Let me know and I'll code it for you! 🚀
