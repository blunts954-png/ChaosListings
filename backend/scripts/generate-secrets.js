#!/usr/bin/env node
/**
 * Generate secure secrets for production deployment
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('🔐 PRODUCTION SECRETS GENERATOR\n');
console.log('Copy these values to your production environment variables:\n');
console.log('─'.repeat(80));

console.log('\n# JWT Configuration');
console.log(`JWT_SECRET="${generateSecret(48)}"`);

console.log('\n# Redis Configuration (if using Redis)');
console.log(`REDIS_PASSWORD="${generateSecret(24)}"`);

console.log('\n# Webhook Secrets');
console.log(`YEXT_WEBHOOK_SECRET="${generateHexSecret(32)}"`);

console.log('\n# Session Secret (if needed)');
console.log(`SESSION_SECRET="${generateSecret(32)}"`);

console.log('\n─'.repeat(80));
console.log('\n⚠️  SECURITY NOTES:');
console.log('  - Never commit these secrets to git');
console.log('  - Store them securely in your deployment platform (Railway/Render/etc)');
console.log('  - Rotate secrets periodically (every 90 days recommended)');
console.log('  - Use different secrets for staging and production\n');
