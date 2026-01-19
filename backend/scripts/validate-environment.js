#!/usr/bin/env node
/**
 * Production Environment Validation Script
 * Run before deploying to production to ensure all critical env vars are set
 *
 * Usage: node scripts/validate-environment.js
 */

const chalk = require('chalk'); // Optional: install with npm install chalk

const errors = [];
const warnings = [];
const info = [];

// Required environment variables for production
const REQUIRED_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
];

// Recommended but optional variables
const RECOMMENDED_VARS = [
  'SENTRY_DSN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'EMAIL_PROVIDER',
  'SENDGRID_API_KEY',
  'YEXT_API_KEY',
  'YELP_API_KEY',
];

// Security validation rules
const SECURITY_RULES = [
  {
    name: 'JWT_SECRET',
    validator: (value) => value && value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters long',
  },
  {
    name: 'NODE_ENV',
    validator: (value) => value === 'production',
    message: 'NODE_ENV must be set to "production"',
  },
  {
    name: 'DATABASE_URL',
    validator: (value) => value && value.startsWith('postgresql://'),
    message: 'DATABASE_URL must be a valid PostgreSQL connection string',
  },
  {
    name: 'FRONTEND_URL',
    validator: (value) => value && value.startsWith('http'),
    message: 'FRONTEND_URL must be a valid URL',
  },
];

console.log('\n🔍 PRODUCTION ENVIRONMENT VALIDATION\n');
console.log('═'.repeat(60));

// Check required variables
console.log('\n📋 Required Variables:');
REQUIRED_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    errors.push(`❌ ${varName} is not set`);
    console.log(`  ❌ ${varName}: NOT SET`);
  } else {
    console.log(`  ✅ ${varName}: SET`);
  }
});

// Check recommended variables
console.log('\n💡 Recommended Variables:');
RECOMMENDED_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    warnings.push(`⚠️  ${varName} is not set (recommended for production)`);
    console.log(`  ⚠️  ${varName}: NOT SET`);
  } else {
    console.log(`  ✅ ${varName}: SET`);
  }
});

// Run security validations
console.log('\n🔒 Security Validations:');
SECURITY_RULES.forEach((rule) => {
  const value = process.env[rule.name];
  if (value && !rule.validator(value)) {
    errors.push(`❌ ${rule.message}`);
    console.log(`  ❌ ${rule.name}: ${rule.message}`);
  } else if (value) {
    console.log(`  ✅ ${rule.name}: Valid`);
  }
});

// Additional checks
console.log('\n🔎 Additional Checks:');

// Check for default/placeholder values
const PLACEHOLDER_PATTERNS = [
  /your[_-]?key/i,
  /your[_-]?secret/i,
  /change[_-]?me/i,
  /change[_-]?this/i,
  /placeholder/i,
  /example/i,
];

const dangerousVars = [];
Object.keys(process.env).forEach((key) => {
  const value = process.env[key];
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    dangerousVars.push(key);
  }
});

if (dangerousVars.length > 0) {
  errors.push(`❌ Found placeholder values in: ${dangerousVars.join(', ')}`);
  console.log(`  ❌ Placeholder values found in: ${dangerousVars.join(', ')}`);
} else {
  console.log('  ✅ No placeholder values detected');
}

// Check Redis configuration
if (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost') {
  if (!process.env.REDIS_PASSWORD) {
    warnings.push('⚠️  REDIS_PASSWORD not set (recommended for remote Redis)');
    console.log('  ⚠️  REDIS_PASSWORD not set (recommended)');
  }
  if (process.env.REDIS_TLS !== 'true') {
    warnings.push('⚠️  REDIS_TLS should be "true" for production');
    console.log('  ⚠️  REDIS_TLS should be "true"');
  }
}

// Check email configuration
if (process.env.EMAIL_PROVIDER === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
  errors.push('❌ SENDGRID_API_KEY required when EMAIL_PROVIDER=sendgrid');
  console.log('  ❌ SENDGRID_API_KEY required for SendGrid');
} else if (process.env.EMAIL_PROVIDER === 'smtp') {
  const smtpVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingSmtp = smtpVars.filter((v) => !process.env[v]);
  if (missingSmtp.length > 0) {
    errors.push(`❌ Missing SMTP vars: ${missingSmtp.join(', ')}`);
    console.log(`  ❌ Missing SMTP configuration: ${missingSmtp.join(', ')}`);
  }
}

// Check Stripe configuration
if (process.env.STRIPE_SECRET_KEY) {
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    warnings.push('⚠️  Using Stripe TEST key in production');
    console.log('  ⚠️  Using Stripe TEST key');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('❌ STRIPE_WEBHOOK_SECRET required when using Stripe');
    console.log('  ❌ STRIPE_WEBHOOK_SECRET required');
  }
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 VALIDATION SUMMARY:\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Environment is ready for production.\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} CRITICAL ERROR(S):`);
    errors.forEach((err) => console.log(`   ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} WARNING(S):`);
    warnings.forEach((warn) => console.log(`   ${warn}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('🚫 DEPLOYMENT BLOCKED - Fix errors before deploying\n');
    process.exit(1);
  } else {
    console.log('⚠️  Warnings present but deployment can proceed\n');
    console.log('Consider addressing warnings for optimal security\n');
    process.exit(0);
  }
}
