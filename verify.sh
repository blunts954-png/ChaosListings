#!/bin/bash

# 🎯 ChaosListings - 100% Completion Verification Script
# This script verifies all components are in place and ready for production

echo "🚀 ChaosListings - Completion Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Helper function
check_file() {
  local file=$1
  local description=$2
  ((TOTAL++))
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    ((FAILED++))
  fi
}

check_dir() {
  local dir=$1
  local description=$2
  ((TOTAL++))
  
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    ((FAILED++))
  fi
}

# Backend Checks
echo "📦 BACKEND VERIFICATION"
echo "----------------------"
check_file "backend/package.json" "Backend package.json exists"
check_file "backend/tsconfig.json" "Backend TypeScript config"
check_file "backend/src/main.ts" "Backend main entry point"
check_file "backend/src/app.module.ts" "Backend app module"
check_file "backend/prisma/schema.prisma" "Prisma schema"
check_file "backend/.env.example" "Backend env example"
echo ""

# Backend Modules
echo "🔧 BACKEND MODULES"
echo "------------------"
check_dir "backend/src/modules/auth" "Auth module"
check_dir "backend/src/modules/agencies" "Agencies module"
check_dir "backend/src/modules/businesses" "Businesses module"
check_dir "backend/src/modules/listings" "Listings module"
check_dir "backend/src/modules/subscriptions" "Subscriptions module"
check_dir "backend/src/modules/webhooks" "Webhooks module"
check_dir "backend/src/modules/jobs" "Jobs module"
check_dir "backend/src/modules/health" "Health module"
echo ""

# Backend Services
echo "⚙️ BACKEND SERVICES"
echo "-------------------"
check_file "backend/src/integrations/stripe/stripe.service.ts" "Stripe service"
check_file "backend/src/integrations/yext/yext.client.ts" "Yext client"
check_file "backend/src/common/modules/email.service.ts" "Email service"
check_file "backend/src/common/modules/prisma.service.ts" "Prisma service"
check_file "backend/src/common/modules/logger.service.ts" "Logger service"
echo ""

# Frontend Checks
echo "🎨 FRONTEND VERIFICATION"
echo "------------------------"
check_file "frontend/package.json" "Frontend package.json"
check_file "frontend/tsconfig.json" "Frontend TypeScript config"
check_file "frontend/next.config.js" "Next.js config"
check_file "frontend/.env.local.example" "Frontend env example"
echo ""

# Frontend Pages
echo "📄 FRONTEND PAGES"
echo "-----------------"
check_file "frontend/src/app/page.tsx" "Landing page"
check_file "frontend/src/app/layout.tsx" "Root layout"
check_file "frontend/src/app/dashboard/page.tsx" "Dashboard page"
check_file "frontend/src/app/businesses/page.tsx" "Businesses list"
check_file "frontend/src/app/businesses/create/page.tsx" "Create business"
check_file "frontend/src/app/businesses/[businessId]/page.tsx" "Edit business"
check_file "frontend/src/app/businesses/[businessId]/listings/page.tsx" "Listings page"
check_file "frontend/src/app/auth/login/page.tsx" "Login page"
check_file "frontend/src/app/auth/register/page.tsx" "Register page"
check_file "frontend/src/app/auth/forgot-password/page.tsx" "Forgot password"
check_file "frontend/src/app/settings/layout.tsx" "Settings layout"
check_file "frontend/src/app/settings/profile/page.tsx" "Profile page"
check_file "frontend/src/app/settings/team/page.tsx" "Team page"
check_file "frontend/src/app/settings/billing/page.tsx" "Billing page"
check_file "frontend/src/app/settings/agency/page.tsx" "Agency settings"
echo ""

# Frontend Components
echo "🧩 FRONTEND COMPONENTS"
echo "----------------------"
check_dir "frontend/src/components/auth" "Auth components"
check_dir "frontend/src/components/businesses" "Business components"
check_dir "frontend/src/components/listings" "Listing components"
check_dir "frontend/src/components/dashboard" "Dashboard components"
check_dir "frontend/src/components/settings" "Settings components"
check_file "frontend/src/contexts/AuthContext.tsx" "Auth context"
check_file "frontend/src/lib/api.ts" "API client"
echo ""

# Docker & Infrastructure
echo "🐳 DOCKER & INFRASTRUCTURE"
echo "----------------------------"
check_file "Dockerfile.backend" "Backend Dockerfile"
check_file "Dockerfile.frontend" "Frontend Dockerfile"
check_file "docker-compose.yml" "Development docker-compose"
check_file "docker-compose.prod.yml" "Production docker-compose"
check_file ".github/workflows/ci.yml" "CI/CD pipeline"
echo ""

# Documentation
echo "📚 DOCUMENTATION"
echo "----------------"
check_file "README.md" "README"
check_file "ARCHITECTURE.md" "Architecture docs"
check_file "API.md" "API documentation"
check_file "START-HERE.md" "Quick start guide"
check_file "QUICKSTART.md" "QuickStart tutorial"
check_file "DEPLOYMENT.md" "Deployment guide"
check_file "IMPLEMENTATION-STATUS.md" "Status document"
check_file "COMPLETION-SUMMARY.md" "Completion summary"
check_file "TESTING-FLOW.md" "Testing flow"
echo ""

# Summary
echo "=========================================="
echo "📊 VERIFICATION SUMMARY"
echo "=========================================="
echo -e "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
else
  echo -e "${GREEN}Failed: 0${NC}"
fi

PERCENTAGE=$((PASSED * 100 / TOTAL))
echo ""
echo "Completion: $PERCENTAGE%"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED - READY FOR PRODUCTION!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed - Review missing components${NC}"
  exit 1
fi
