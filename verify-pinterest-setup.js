#!/usr/bin/env node

/**
 * Pinterest Integration Setup Verification Script
 * Run this to check if your Pinterest credentials are properly configured
 */

require('dotenv').config();

console.log('\n🔍 Pinterest Integration Setup Verification\n');
console.log('='.repeat(50));

// Check required environment variables
const checks = {
  'PINTEREST_CLIENT_ID': process.env.PINTEREST_CLIENT_ID,
  'PINTEREST_CLIENT_SECRET': process.env.PINTEREST_CLIENT_SECRET,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
};

let allGood = true;

Object.entries(checks).forEach(([key, value]) => {
  const isSet = value && value !== 'YOUR_PINTEREST_APP_ID_HERE' && value !== 'YOUR_PINTEREST_APP_SECRET_HERE';
  const status = isSet ? '✅' : '❌';

  if (!isSet) allGood = false;

  if (isSet && key.includes('SECRET')) {
    console.log(`${status} ${key}: ${value.substring(0, 8)}...`);
  } else if (isSet) {
    console.log(`${status} ${key}: ${value}`);
  } else {
    console.log(`${status} ${key}: NOT SET`);
  }
});

console.log('='.repeat(50));

if (allGood) {
  console.log('\n✅ All Pinterest credentials are configured!');
  console.log('\n📋 Next steps:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Navigate to: http://localhost:3000/settings');
  console.log('   3. Click "Connect" on the Pinterest card');
  console.log('   4. Authorize on Pinterest');
  console.log('   5. You should be redirected back with success!');
} else {
  console.log('\n❌ Missing required credentials!');
  console.log('\n📋 To fix:');
  console.log('   1. Create a Pinterest app at: https://developers.pinterest.com/apps/');
  console.log('   2. Set redirect URI to: http://localhost:3000/api/auth/pinterest/callback');
  console.log('   3. Copy App ID and App Secret from Pinterest Developer Console');
  console.log('   4. Update your .env file with the credentials');
  console.log('   5. Run this script again to verify');
}

// Check if redirect URI is configured correctly
const expectedRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/pinterest/callback`;
console.log('\n📍 Expected Redirect URI in Pinterest App:');
console.log(`   ${expectedRedirectUri}`);
console.log('\n⚠️  Make sure this EXACTLY matches the redirect URI in your Pinterest app settings!\n');
