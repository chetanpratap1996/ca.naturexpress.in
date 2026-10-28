const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

// Dynamically import or require compiled/ts
async function runTests() {
  console.log('--- Running Enterprise Auth Test Suite ---');
  const { 
    authenticateClientEntity, 
    authenticateStaffUser, 
    updateClientPin 
  } = require('../src/lib/auth/enterpriseAuth.ts');

  // Test 1: Client login with Phone + Default PIN (0715)
  console.log('\n[Test 1] Client Login with Phone 8077170715 and PIN 0715...');
  const res1 = await authenticateClientEntity('8077170715', '0715');
  console.log('Result 1:', res1.success ? 'PASSED ✓' : 'FAILED ✗', res1.user ? `${res1.user.name} (${res1.user.role})` : res1.error);

  // Test 2: Client login with PAN + PIN (0715)
  console.log('\n[Test 2] Client Login with PAN AANCP9915B and PIN 0715...');
  const res2 = await authenticateClientEntity('AANCP9915B', '0715');
  console.log('Result 2:', res2.success ? 'PASSED ✓' : 'FAILED ✗', res2.user ? `${res2.user.name} (${res2.user.role})` : res2.error);

  // Test 3: Client login with Wrong PIN
  console.log('\n[Test 3] Client Login with Phone 8077170715 and Wrong PIN 9999...');
  const res3 = await authenticateClientEntity('8077170715', '9999');
  console.log('Result 3 (Expected to fail):', !res3.success ? 'PASSED ✓' : 'FAILED ✗', res3.error);

  // Test 4: Partner Staff Login
  console.log('\n[Test 4] Staff Login: partner@brainsandtaxes.com + Partner@2026...');
  const res4 = await authenticateStaffUser('partner@brainsandtaxes.com', 'Partner@2026');
  console.log('Result 4:', res4.success ? 'PASSED ✓' : 'FAILED ✗', res4.user ? `${res4.user.name} (${res4.user.role})` : res4.error);

  // Test 5: Article Staff Login
  console.log('\n[Test 5] Staff Login: audit.trainee@brainsandtaxes.com + Article@2026...');
  const res5 = await authenticateStaffUser('audit.trainee@brainsandtaxes.com', 'Article@2026');
  console.log('Result 5:', res5.success ? 'PASSED ✓' : 'FAILED ✗', res5.user ? `${res5.user.name} (${res5.user.role})` : res5.error);

  // Test 6: Check Auth Audit Log
  const { getDatabaseClient } = require('./db-client');
  const client = getDatabaseClient();
  await client.connect();
  const { rows: logs } = await client.query('SELECT identifier, role, status, created_at FROM auth_audit_log ORDER BY created_at DESC LIMIT 5;');
  console.log('\n[Test 6] Recent Auth Audit Trail in PostgreSQL:');
  console.table(logs);
  await client.end();

  console.log('\n--- All Enterprise Auth Tests Completed ---');
}

runTests().catch(console.error);
