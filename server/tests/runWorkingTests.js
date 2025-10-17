#!/usr/bin/env node

/**
 * Test runner for working tests only
 * Runs tests that are known to be working and stable
 */

const { spawn } = require('child_process');
const path = require('path');

const workingTests = [
  'tests/unit/services/PaymentService.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${testFile}`);
    console.log('='.repeat(50));
    
    const child = spawn('npm', ['test', testFile, '--silent'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} - PASSED`);
        resolve({ test: testFile, status: 'PASSED' });
      } else {
        console.log(`❌ ${testFile} - FAILED`);
        resolve({ test: testFile, status: 'FAILED' });
      }
    });

    child.on('error', (error) => {
      console.error(`Error running ${testFile}:`, error);
      reject(error);
    });
  });
}

async function runAllWorkingTests() {
  console.log('🚀 Running UrbanCare Working Test Suite');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const testFile of workingTests) {
    try {
      const result = await runTest(testFile);
      results.push(result);
    } catch (error) {
      console.error(`Failed to run ${testFile}:`, error);
      results.push({ test: testFile, status: 'ERROR' });
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(30));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💥 Errors: ${errors}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (passed === results.length) {
    console.log('\n🎉 All working tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed or had errors');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllWorkingTests().catch(console.error);
}

module.exports = { runAllWorkingTests, runTest };
