#!/usr/bin/env bash

# Phase 3 Database Migration Script
# Applies Prisma schema changes for DirectoryListing model

set -e

echo "🔄 Running Phase 3 Database Migration..."
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run from backend/ directory"
  exit 1
fi

# Run Prisma migration
echo "📋 Generating migration from schema changes..."
npx prisma migrate dev --name add_directory_listing_model

echo ""
echo "✅ Migration complete!"
echo ""
echo "Changes applied:"
echo "  ✓ Created DirectoryListing table"
echo "  ✓ Added directoryListings relation to Business"
echo "  ✓ Added indexes on businessId and directory"
echo "  ✓ Added unique constraint on (businessId, directory)"
echo ""
echo "📚 Next steps:"
echo "  1. Test manual directory upload endpoint"
echo "  2. Verify sync status displays correctly"
echo "  3. Test admin dashboard queries"
echo ""
