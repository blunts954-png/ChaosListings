#!/bin/bash
export DATABASE_URL="postgresql://listingsiq_user:secure_password_123@localhost:5432/listingsiq?schema=public"
npx prisma db push --skip-generate
