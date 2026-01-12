#!/bin/bash
# Free Listings API Quick Start Script
# Tests all free APIs endpoints

# Configuration
BACKEND_URL="http://localhost:3000/api"
BUSINESS_ID="YOUR_BUSINESS_ID_HERE"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

echo "🚀 ChaosListings Free Listings API Testing"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Google Auth URL
echo -e "${BLUE}[1] Getting Google Authorization URL...${NC}"
curl -s -X GET "$BACKEND_URL/businesses/$BUSINESS_ID/listings/free/google-auth-url?redirectUri=http://localhost:3000/auth/callback" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo ""

# Test 2: Find Business on Yelp
echo -e "${BLUE}[2] Finding Business on Yelp...${NC}"
curl -s -X POST "$BACKEND_URL/businesses/$BUSINESS_ID/listings/free/find-on-yelp" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Pizza Place",
    "location": "San Francisco, CA"
  }' | jq .

echo ""

# Test 3: Competitive Analysis
echo -e "${BLUE}[3] Getting Competitive Analysis...${NC}"
curl -s -X POST "$BACKEND_URL/businesses/$BUSINESS_ID/listings/free/competitive-analysis" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pizza",
    "location": "San Francisco, CA"
  }' | jq .

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Replace BUSINESS_ID with your actual business UUID"
echo "2. Replace JWT_TOKEN with a valid auth token"
echo "3. Update business name and location"
echo "4. Run this script to test all endpoints"
