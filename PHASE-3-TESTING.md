# Phase 3 Testing Guide

## 🧪 Complete Testing Checklist for Phase 3

---

## 1. Manual Directory Upload (Phase 3A)

### 1.1 CSV Upload Functionality

#### Test Case 1.1.1: Valid CSV Upload
```csv
directory,name,url,phone,hours,description,photoUrls
"Uber Eats","Pizza Palace","https://ubereats.com/restaurant/pizza-palace","555-1234","9am-9pm","Best pizza in town","https://photo1.jpg|https://photo2.jpg"
"DoorDash","Pizza Palace","https://doordash.com/restaurant/pizza-palace","555-1234","9am-9pm","Best pizza in town",""
"Instagram","Pizza Palace","https://instagram.com/pizzapalace","","","","https://photo3.jpg|https://photo4.jpg"
```

**Steps:**
1. Navigate to `/businesses/{businessId}/listings`
2. Click "Manual Upload" tab
3. Select CSV file
4. Verify preview shows 3 rows
5. Click "Upload Listings"

**Expected Results:**
- ✅ No errors
- ✅ Success message appears
- ✅ "Synced Listings" tab updated
- ✅ Shows 3 total listings
- ✅ Shows 3 directories (Uber Eats, DoorDash, Instagram)

---

#### Test Case 1.1.2: CSV with Quoted Fields
```csv
directory,name,url,phone,hours,description,photoUrls
"Uber Eats","Pizza, Pasta & More","https://ubereats.com/...","555-1234","9am-9pm","Best ""pizza"" in town",""
```

**Steps:**
1. Upload CSV with quoted fields containing commas and quotes
2. Check preview renders correctly
3. Upload successfully

**Expected Results:**
- ✅ Quotes handled correctly
- ✅ Commas in field values parsed correctly
- ✅ Escaped quotes preserved
- ✅ Data saves correctly

---

#### Test Case 1.1.3: CSV with Missing Optional Fields
```csv
directory,name,url
"Uber Eats","Pizza Palace","https://ubereats.com/..."
"DoorDash","Pizza Palace","https://doordash.com/..."
```

**Steps:**
1. Upload CSV with only required fields
2. Optional fields (phone, hours, etc.) left empty
3. Verify upload succeeds

**Expected Results:**
- ✅ Upload succeeds
- ✅ Optional fields set to null/empty
- ✅ No validation errors

---

#### Test Case 1.1.4: CSV with Invalid Data
```csv
directory,name,url
"Uber Eats","Pizza Palace"           (missing url)
"DoorDash",,"https://doordash.com"   (missing name)
```

**Steps:**
1. Upload CSV with missing required fields
2. Check error messages

**Expected Results:**
- ✅ Error indicates which rows failed
- ✅ Valid rows still uploaded
- ✅ Clear error message for user

---

### 1.2 Listing Management

#### Test Case 1.2.1: View All Listings
**Steps:**
1. Go to "Synced Listings" tab
2. View all uploaded listings

**Expected Results:**
- ✅ Table shows all listings
- ✅ Columns: Directory, Business Name, URL, Phone, Added Date
- ✅ Listings sorted by date (newest first)

---

#### Test Case 1.2.2: Filter by Directory
**Steps:**
1. Go to "Synced Listings" tab
2. Click on directory summary card (e.g., "Uber Eats - 5")
3. Verify only listings from that directory show

**Expected Results:**
- ✅ Table filters to selected directory
- ✅ Card is highlighted
- ✅ Can click again to clear filter
- ✅ Count is accurate

---

#### Test Case 1.2.3: Update Listing
**Steps:**
1. Click listing to view details
2. Edit name, phone, hours, description
3. Save changes

**Expected Results:**
- ✅ Changes saved to database
- ✅ "Updated" timestamp changes
- ✅ Changes visible in listing table

---

#### Test Case 1.2.4: Delete Listing
**Steps:**
1. View listing details or table
2. Click delete/trash icon
3. Confirm deletion

**Expected Results:**
- ✅ Listing removed from table
- ✅ Directory count decreases
- ✅ Confirmation message shows

---

#### Test Case 1.2.5: Refresh Status
**Steps:**
1. Click refresh icon in "Synced Listings" tab
2. Wait for data to reload

**Expected Results:**
- ✅ Loading spinner shows
- ✅ Data reloads from server
- ✅ Latest changes reflected

---

## 2. Google My Business Integration (Phase 3B)

### 2.1 Authentication Flow

#### Test Case 2.1.1: Get Google Auth URL
**Steps:**
1. Go to "Google My Business" tab
2. Click "Connect Google"
3. Check network tab - verify auth URL generated

**Expected Results:**
- ✅ Auth URL contains correct parameters
- ✅ Includes redirect URI
- ✅ Includes client_id

---

#### Test Case 2.1.2: Complete OAuth Flow
**Steps:**
1. Click "Connect Google"
2. Sign in with Google account
3. Grant permissions to Google My Business
4. Redirected back to app

**Expected Results:**
- ✅ Redirected to callback URL
- ✅ Auth code captured and exchanged
- ✅ Access token stored in localStorage
- ✅ Connection status updated

---

#### Test Case 2.1.3: Disconnect Google
**Steps:**
1. Click "Disconnect" button
2. Verify disconnection

**Expected Results:**
- ✅ Access token removed
- ✅ Status shows "Not connected"
- ✅ Can re-connect

---

### 2.2 Sync Functionality

#### Test Case 2.2.1: Sync Google Locations
**Steps:**
1. Connect Google account (Test 2.1.2)
2. Click "Sync Google Locations"
3. Wait for sync to complete

**Expected Results:**
- ✅ Loading spinner shows
- ✅ Locations retrieved from Google
- ✅ Count shows number of locations found
- ✅ Details show location names and phone numbers

---

## 3. Yelp Integration (Phase 3B)

### 3.1 Business Search

#### Test Case 3.1.1: Find Existing Business
**Steps:**
1. Go to "Yelp Business" tab
2. Enter business name: "Pizza Palace"
3. Enter location: "San Francisco, CA"
4. Click "Search on Yelp"

**Expected Results:**
- ✅ Business found
- ✅ Shows rating (e.g., 4.5★)
- ✅ Shows review count (e.g., 127 reviews)
- ✅ Shows phone number
- ✅ Shows address
- ✅ "View on Yelp" link works

---

#### Test Case 3.1.2: Business Not Found
**Steps:**
1. Enter business name: "ZZZNonexistentBusiness123XYZ"
2. Enter location: "San Francisco, CA"
3. Click "Search on Yelp"

**Expected Results:**
- ✅ Shows "Business not found on Yelp"
- ✅ No error message (graceful handling)
- ✅ Suggests manual directory upload alternative

---

#### Test Case 3.1.3: Search with Missing Fields
**Steps:**
1. Enter only business name (no location)
2. Try to click "Search on Yelp"

**Expected Results:**
- ✅ Search button disabled
- ✅ Validation message shown
- ✅ Cannot submit without required fields

---

## 4. Competitive Analysis (Phase 3B)

### 4.1 Competitor Search

#### Test Case 4.1.1: Analyze Competitors
**Steps:**
1. Go to "Competitive Analysis" tab
2. Enter your business: "Pizza Palace"
3. Enter location: "San Francisco, CA"
4. Click "Analyze Competitors"

**Expected Results:**
- ✅ Loading spinner shows
- ✅ Returns 10 nearby competitors
- ✅ Shows market average rating
- ✅ Shows your rating vs market
- ✅ Lists competitors with:
  - ✓ Name
  - ✓ Rating (stars)
  - ✓ Review count
  - ✓ Address
  - ✓ Phone
  - ✓ Link to Yelp

---

#### Test Case 4.1.2: Market Position Analysis
**Steps:**
1. Complete search (Test 4.1.1)
2. Check market position indicator

**Expected Results:**
- ✅ If your rating > market avg: "📈 Above average"
- ✅ If your rating = market avg: "➡️ At market average"
- ✅ If your rating < market avg: "📉 Below average"
- ✅ Shows difference in stars

---

## 5. Frontend UI/UX (Phase 3B)

### 5.1 Tab Navigation

#### Test Case 5.1.1: Tab Switching
**Steps:**
1. Navigate to `/businesses/{businessId}/listings`
2. Click each tab in sequence
3. Verify correct content loads

**Expected Results:**
- ✅ Tab content switches correctly
- ✅ Active tab is highlighted
- ✅ Previous tab state retained (if applicable)
- ✅ All tabs load without errors

---

#### Test Case 5.1.2: Responsive Design
**Steps:**
1. View listings page on mobile (375px width)
2. View on tablet (768px width)
3. View on desktop (1920px width)
4. Test on different devices

**Expected Results:**
- ✅ Mobile: Single column layout
- ✅ Tablet: 2-column layout
- ✅ Desktop: Full layout
- ✅ Tables scroll horizontally on mobile
- ✅ No horizontal scroll on desktop
- ✅ Text is readable on all sizes
- ✅ Buttons are tappable (44px+)

---

### 5.2 Error Handling

#### Test Case 5.2.1: Network Error Handling
**Steps:**
1. Disable network (DevTools)
2. Try to upload CSV
3. Try to search Yelp
4. Check error messages

**Expected Results:**
- ✅ Clear error message displayed
- ✅ No blank screens
- ✅ Retry button available
- ✅ No data corruption

---

#### Test Case 5.2.2: Form Validation
**Steps:**
1. Try to upload empty CSV
2. Try to search Yelp with blank fields
3. Try to upload very large file (>10MB)

**Expected Results:**
- ✅ Clear validation errors
- ✅ User cannot submit invalid data
- ✅ File size limit enforced
- ✅ Helpful error messages

---

## 6. Admin Dashboard (Phase 3C)

### 6.1 Statistics Display

#### Test Case 6.1.1: View Dashboard
**Steps:**
1. Navigate to `/admin/listings`
2. Check if user has admin role
3. View statistics cards

**Expected Results:**
- ✅ All stats load correctly
- ✅ Numbers are accurate
- ✅ Cards display with proper icons
- ✅ Page loads quickly

---

#### Test Case 6.1.2: Statistics Accuracy
**Steps:**
1. Upload 5 listings to different directories
2. Go to admin dashboard
3. Check statistics

**Expected Results:**
- ✅ "Active Listings" = 5
- ✅ "Directories Synced" = number of unique directories
- ✅ "Success Rate" = 100% (for successful syncs)

---

### 6.2 Sync History

#### Test Case 6.2.1: View Sync History
**Steps:**
1. Go to admin dashboard
2. Scroll to "Recent Sync Activity" table
3. Check recent operations

**Expected Results:**
- ✅ Table shows recent syncs
- ✅ Shows business name
- ✅ Shows source (Google, Yelp, Manual)
- ✅ Shows status with proper badge
- ✅ Shows items processed
- ✅ Shows timestamp

---

#### Test Case 6.2.2: Filter by Status
**Steps:**
1. View sync history table
2. (Optional) Filter by status if implemented

**Expected Results:**
- ✅ Success: Green badge ✓
- ✅ Failed: Red badge ✗
- ✅ Pending: Yellow badge ⟳

---

### 6.3 Data Refresh

#### Test Case 6.3.1: Auto-Refresh
**Steps:**
1. Go to admin dashboard
2. Upload a CSV to a business
3. Wait for auto-refresh (30 seconds)
4. Check if stats updated

**Expected Results:**
- ✅ Stats update automatically every 30 seconds
- ✅ New sync appears in history
- ✅ "Active Listings" count increases

---

#### Test Case 6.3.2: Manual Refresh
**Steps:**
1. Go to admin dashboard
2. Click refresh button (circle arrows)
3. Wait for data to reload

**Expected Results:**
- ✅ Loading spinner shows
- ✅ Data reloads from server
- ✅ Latest stats displayed
- ✅ No loading spinner after complete

---

## 7. API Testing (Backend)

### 7.1 Manual Directory Endpoints

#### Test Case 7.1.1: POST /manual/upload
```bash
curl -X POST http://localhost:3000/api/businesses/{id}/listings/manual/upload \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"csvData":"directory,name,url\n\"Uber Eats\",\"Pizza Palace\",\"https://ubereats.com/...\""}' 
```

**Expected:**
- ✅ 200 OK
- ✅ Response includes: created, updated, failed counts
- ✅ Database has new DirectoryListing entries

---

#### Test Case 7.1.2: GET /manual
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- ✅ 200 OK
- ✅ Returns array of DirectoryListing objects
- ✅ Each has: id, directory, name, url, phone, createdAt

---

#### Test Case 7.1.3: GET /manual/summary
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual/summary \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- ✅ 200 OK
- ✅ Returns: { summary: [{ directory: "Uber Eats", count: 5 }, ...] }

---

#### Test Case 7.1.4: GET /manual/{directoryName}
```bash
curl http://localhost:3000/api/businesses/{id}/listings/manual/Uber%20Eats \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- ✅ 200 OK
- ✅ Returns filtered listings for that directory only

---

#### Test Case 7.1.5: PATCH /manual/{listingId}
```bash
curl -X PATCH http://localhost:3000/api/businesses/{id}/listings/manual/{listingId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-5678","hours":"10am-10pm"}'
```

**Expected:**
- ✅ 200 OK
- ✅ Database updated
- ✅ Returns updated listing object

---

#### Test Case 7.1.6: DELETE /manual/{listingId}
```bash
curl -X DELETE http://localhost:3000/api/businesses/{id}/listings/manual/{listingId} \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- ✅ 200 OK
- ✅ Listing removed from database
- ✅ Returns success message

---

### 7.2 Admin Endpoints

#### Test Case 7.2.1: GET /admin/listings/stats
```bash
curl http://localhost:3000/api/admin/listings/stats \
  -H "Authorization: Bearer {admin_token}"
```

**Expected:**
- ✅ 200 OK (admin only)
- ✅ 403 Forbidden (non-admin)
- ✅ Returns: totalBusinesses, activeListings, directoriesSynced, successRate

---

#### Test Case 7.2.2: GET /admin/listings/sync-history
```bash
curl http://localhost:3000/api/admin/listings/sync-history \
  -H "Authorization: Bearer {admin_token}"
```

**Expected:**
- ✅ 200 OK
- ✅ Returns array of sync operations
- ✅ Each has: id, businessId, businessName, source, status, itemsProcessed, syncedAt

---

## 8. Security Testing

### 8.1 Authentication

#### Test Case 8.1.1: Missing Token
**Steps:**
1. Call endpoint without Authorization header
2. Check response

**Expected Results:**
- ✅ 401 Unauthorized
- ✅ Clear error message

---

#### Test Case 8.1.2: Invalid Token
**Steps:**
1. Call endpoint with garbage token
2. Check response

**Expected Results:**
- ✅ 401 Unauthorized
- ✅ No data leaked

---

### 8.2 Authorization

#### Test Case 8.2.1: Cross-Agency Access
**Steps:**
1. Login as agency A
2. Try to access business from agency B
3. Check response

**Expected Results:**
- ✅ 403 Forbidden
- ✅ Cannot access other agency's data

---

#### Test Case 8.2.2: Non-Admin Access to Admin Endpoints
**Steps:**
1. Login as regular user
2. Call /admin/listings/stats
3. Check response

**Expected Results:**
- ✅ 403 Forbidden
- ✅ Clear error message

---

## 9. Performance Testing

### 9.1 Load Testing

#### Test Case 9.1.1: Large CSV Upload (1000 rows)
**Steps:**
1. Create CSV with 1000 listings
2. Upload file
3. Measure time and verify all rows saved

**Expected Results:**
- ✅ Completes in < 5 seconds
- ✅ All rows saved to database
- ✅ No timeout errors
- ✅ API remains responsive

---

#### Test Case 9.1.2: List All Listings (1000+ items)
**Steps:**
1. Create 1000+ directory listings
2. Call GET /manual endpoint
3. Check response time

**Expected Results:**
- ✅ Completes in < 1 second
- ✅ All listings returned
- ✅ Proper pagination (if implemented)

---

## 10. Integration Testing

### 10.1 Cross-Feature Workflows

#### Test Case 10.1.1: Complete Workflow
**Steps:**
1. Create business
2. Upload manual directory CSV
3. Search business on Yelp
4. Analyze competitors
5. View admin dashboard

**Expected Results:**
- ✅ All steps complete successfully
- ✅ Data flows correctly between components
- ✅ Admin sees updated stats

---

## 🎯 Acceptance Criteria

### All Tests Must Pass ✅
- [ ] 1.1.1 - Valid CSV upload
- [ ] 1.1.2 - CSV with quoted fields
- [ ] 1.1.3 - CSV with missing optional fields
- [ ] 1.1.4 - CSV with invalid data
- [ ] 1.2.1 - View all listings
- [ ] 1.2.2 - Filter by directory
- [ ] 1.2.3 - Update listing
- [ ] 1.2.4 - Delete listing
- [ ] 1.2.5 - Refresh status
- [ ] 2.1.1 - Get Google auth URL
- [ ] 2.1.2 - Complete OAuth flow
- [ ] 2.1.3 - Disconnect Google
- [ ] 2.2.1 - Sync Google locations
- [ ] 3.1.1 - Find existing business on Yelp
- [ ] 3.1.2 - Business not found on Yelp
- [ ] 3.1.3 - Search with missing fields
- [ ] 4.1.1 - Analyze competitors
- [ ] 4.1.2 - Market position analysis
- [ ] 5.1.1 - Tab navigation
- [ ] 5.1.2 - Responsive design
- [ ] 5.2.1 - Network error handling
- [ ] 5.2.2 - Form validation
- [ ] 6.1.1 - View dashboard
- [ ] 6.1.2 - Statistics accuracy
- [ ] 6.2.1 - View sync history
- [ ] 6.3.1 - Auto-refresh
- [ ] 6.3.2 - Manual refresh
- [ ] 7.1.1 - POST /manual/upload
- [ ] 7.1.2 - GET /manual
- [ ] 7.1.3 - GET /manual/summary
- [ ] 7.1.4 - GET /manual/{directoryName}
- [ ] 7.1.5 - PATCH /manual/{listingId}
- [ ] 7.1.6 - DELETE /manual/{listingId}
- [ ] 7.2.1 - GET /admin/listings/stats
- [ ] 7.2.2 - GET /admin/listings/sync-history
- [ ] 8.1.1 - Missing token
- [ ] 8.1.2 - Invalid token
- [ ] 8.2.1 - Cross-agency access
- [ ] 8.2.2 - Non-admin access
- [ ] 9.1.1 - Large CSV upload
- [ ] 9.1.2 - List 1000+ items
- [ ] 10.1.1 - Complete workflow

---

## 📊 Test Results Summary

| Test Suite | Passed | Failed | Coverage |
|-----------|--------|--------|----------|
| Manual Upload | ?/5 | ?/5 | ?% |
| Listing Management | ?/6 | ?/6 | ?% |
| Google Integration | ?/4 | ?/4 | ?% |
| Yelp Integration | ?/3 | ?/3 | ?% |
| Competitive Analysis | ?/2 | ?/2 | ?% |
| Frontend UI/UX | ?/4 | ?/4 | ?% |
| Admin Dashboard | ?/5 | ?/5 | ?% |
| API Testing | ?/8 | ?/8 | ?% |
| Security | ?/4 | ?/4 | ?% |
| Performance | ?/2 | ?/2 | ?% |
| Integration | ?/1 | ?/1 | ?% |
| **TOTAL** | **?/50** | **?/50** | **?%** |

---

## 📝 Notes

- Run tests in order for best results
- Each test depends on previous ones in some cases
- Use consistent test data (same business name, location)
- Test with different user roles (regular, admin)
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on multiple devices (mobile, tablet, desktop)

---

**Status**: Ready for testing  
**Last Updated**: January 10, 2026  
**Tester**: (To be filled)  
**Date Tested**: (To be filled)
