# Phase 3 Quick Reference Guide

## 🚀 Quick Start

### For Backend Developers

**Setup Database**
```bash
cd backend
npm run migrate
```

**Start Development Server**
```bash
npm run start:dev
```

**Test API Endpoints**
```bash
curl http://localhost:3000/api/businesses/{businessId}/listings/manual \
  -H "Authorization: Bearer {token}"
```

---

## 📁 Key Files Reference

### Backend

| File | Purpose | Lines |
|------|---------|-------|
| `src/modules/listings/services/manual-directories.service.ts` | CSV parsing & CRUD | 250 |
| `src/modules/listings/listings.controller.ts` | 7 manual endpoints | +200 |
| `src/modules/admin/admin-listings.controller.ts` | Admin stats endpoints | 200 |
| `prisma/schema.prisma` | DirectoryListing model | +40 |

### Frontend

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/listings/GoogleAuthFlow.tsx` | Google OAuth | 280 |
| `src/components/listings/YelpSearch.tsx` | Yelp search | 240 |
| `src/components/listings/ManualUploadForm.tsx` | CSV upload | 280 |
| `src/components/listings/SyncStatus.tsx` | List all synced | 320 |
| `src/components/listings/CompetitiveAnalysis.tsx` | Competitor analysis | 300 |
| `src/app/businesses/[id]/listings/page.tsx` | Main listings page | 250 |
| `src/app/admin/listings/page.tsx` | Admin dashboard | 450 |

---

## 🔌 API Endpoints Summary

### Manual Directory Endpoints
```
POST   /businesses/:id/listings/manual/upload              Upload CSV
GET    /businesses/:id/listings/manual                     List all
GET    /businesses/:id/listings/manual/summary             Get counts
GET    /businesses/:id/listings/manual/:dir                Filter by directory
GET    /businesses/:id/listings/manual/:id/detail          Get details
PATCH  /businesses/:id/listings/manual/:id                 Update
DELETE /businesses/:id/listings/manual/:id                 Delete
```

### Free Listings Endpoints (Already Exist)
```
GET    /businesses/:id/listings/free/google-auth-url      Get OAuth URL
POST   /businesses/:id/listings/free/google-callback       Handle OAuth
POST   /businesses/:id/listings/free/sync-google           Sync locations
POST   /businesses/:id/listings/free/find-on-yelp          Search Yelp
POST   /businesses/:id/listings/free/competitive-analysis  Analyze competitors
```

### Admin Endpoints
```
GET    /admin/listings/stats                              Get statistics
GET    /admin/listings/sync-history                       View syncs
GET    /admin/listings/business-listings-summary          Per-business
GET    /admin/listings/directory-breakdown                Directory usage
```

---

## 📊 Database Schema

### DirectoryListing Model
```typescript
model DirectoryListing {
  id        String   @id @default(uuid())
  businessId String
  directory String   @db.VarChar(100)  // e.g., "Uber Eats"
  name      String                     // Business name
  url       String                     // Directory link
  phone     String?                    // Optional phone
  hours     String?                    // Optional hours
  description String? @db.Text
  photoUrls String[] @default([])
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([businessId, directory])
  @@index([businessId])
  @@index([directory])
}
```

---

## 🎯 Component Usage Examples

### GoogleAuthFlow
```tsx
<GoogleAuthFlow businessId={businessId} />
```

### YelpSearch
```tsx
<YelpSearch businessId={businessId} />
```

### ManualUploadForm
```tsx
<ManualUploadForm 
  businessId={businessId}
  onUploadSuccess={() => console.log('Done!')}
/>
```

### SyncStatus
```tsx
<SyncStatus businessId={businessId} />
```

### CompetitiveAnalysis
```tsx
<CompetitiveAnalysis businessId={businessId} />
```

---

## 📋 CSV Format

### Headers (Required)
```
directory,name,url,phone,hours,description,photoUrls
```

### Example Row
```csv
"Uber Eats","Pizza Palace","https://ubereats.com/...","555-1234","9am-9pm","Best pizza","photo1.jpg|photo2.jpg"
```

### Notes
- Quote strings that contain commas
- Use pipe (|) to separate multiple photo URLs
- Phone, hours, description, photoUrls are optional

---

## 🔐 Authentication

### Required Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Getting Token
```typescript
const token = localStorage.getItem('auth_token');
```

### Using in Fetch
```typescript
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 🧪 Common Test Cases

### Upload CSV
```bash
curl -X POST http://localhost:3000/api/businesses/{id}/listings/manual/upload \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"csvData":"directory,name,url\n\"Uber Eats\",\"Pizza\",\"https://...\""}'
```

### List All Listings
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual \
  -H "Authorization: Bearer {token}"
```

### Get Summary
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual/summary \
  -H "Authorization: Bearer {token}"
```

### Filter by Directory
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual/Uber%20Eats \
  -H "Authorization: Bearer {token}"
```

### Update Listing
```bash
curl -X PATCH http://localhost:3000/api/businesses/{id}/listings/manual/{listingId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-5678"}'
```

### Delete Listing
```bash
curl -X DELETE http://localhost:3000/api/businesses/{id}/listings/manual/{listingId} \
  -H "Authorization: Bearer {token}"
```

### Admin Stats
```bash
curl http://localhost:3000/api/admin/listings/stats \
  -H "Authorization: Bearer {admin_token}"
```

---

## 🐛 Common Issues & Solutions

### CSV Upload Fails
**Issue**: "Failed to parse CSV"
**Solution**: 
- Check for unmatched quotes
- Ensure commas separate fields
- Use double quotes to escape quotes within fields

### Google Auth Not Working
**Issue**: "Invalid redirect URI"
**Solution**:
- Verify redirect URI in Google Cloud Console
- Must match exactly (scheme, host, path)
- http://localhost:3000 vs https://api.domain.com

### Yelp Search Returns No Results
**Issue**: "Business not found on Yelp"
**Solution**:
- Try different business name variations
- Include city/state in location
- Check Yelp API rate limit (5k/day free)

### Admin Dashboard No Data
**Issue**: "No statistics"
**Solution**:
- Verify user is admin role
- Check database has directory listings
- Verify business has directoryListings relation
- Check auth token is valid

---

## 📈 Performance Tips

### Optimize CSV Uploads
- Batch operations (1000+ rows at once)
- Index on (businessId, directory) is key
- Use pagination for large result sets

### Optimize Admin Dashboard
- Auto-refresh every 30 seconds (not constantly)
- Aggregate stats at database level
- Cache results for 10+ seconds

### Optimize Frontend
- Lazy load tabs (only load when clicked)
- Memoize components with useMemo
- Use pagination for large lists

---

## 🚀 Deployment Checklist

- [ ] Apply Prisma migration: `npx prisma migrate deploy`
- [ ] Build backend: `npm run build`
- [ ] Build frontend: `npm run build`
- [ ] Set environment variables
- [ ] Test all endpoints
- [ ] Run security scan
- [ ] Monitor error logs
- [ ] Load test before going live

---

## 📚 Documentation Links

- **Complete Guide**: [PHASE-3-COMPLETE.md](PHASE-3-COMPLETE.md)
- **Testing Guide**: [PHASE-3-TESTING.md](PHASE-3-TESTING.md)
- **Summary**: [PHASE-3-SUMMARY.md](PHASE-3-SUMMARY.md)

---

## 🎯 Next Steps (Phase 4)

After Phase 3, next work:
1. Create BullMQ workers for scheduled syncs
2. Set up daily Google sync job
3. Set up daily Yelp sync job
4. Add error handling & retry logic
5. Create sync history tracking
6. Deploy to production

---

## 💡 Tips for Developers

### Working with CSV Data
```typescript
// In ManualDirectoriesService
private parseCSVRow(row: string): ManualDirectoryData {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  // Handle quotes and commas properly
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  // ... rest of logic
}
```

### React Component Error Handling
```typescript
// In frontend components
try {
  const response = await fetch('/api/endpoint', { /* ... */ });
  if (!response.ok) {
    const { message } = await response.json();
    throw new Error(message || 'Request failed');
  }
  const { data } = await response.json();
  // Use data
} catch (err: any) {
  setError(err.message);
}
```

### Type Safety in NestJS
```typescript
// Always return typed responses
async uploadDirectoryData(
  @Param('businessId') businessId: string,
  @Body() body: { csvData: string },
): Promise<{ success: boolean; data: UploadResult }> {
  // Endpoint implementation
}
```

---

## 🎓 Learning Resources

- CSV Parsing: Check `manual-directories.service.ts` for quote handling
- OAuth2: Check `google-business.service.ts` for implementation
- React Patterns: Check components in `src/components/listings/`
- Admin Features: Check `admin-listings.controller.ts`
- Responsive Design: Check Tailwind classes in `ListingsPage`

---

**Last Updated**: January 10, 2026  
**Status**: Phase 3 Complete, Ready for Phase 4  
**Questions?** See PHASE-3-COMPLETE.md or PHASE-3-TESTING.md
