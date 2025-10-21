/**
 * @fileoverview Test Runner Script for All Use Cases
 * @description Runs all unit tests and generates coverage report
 * @author UrbanCare Development Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting UrbanCare Unit Test Suite...\n');

const testSuites = [
  {
    name: 'Patient Account Management',
    file: 'tests/unit/PatientAccountManagement.test.js',
    description: 'Tests patient registration, login, profile management'
  },
  {
    name: 'Make an Appointment',
    file: 'tests/unit/MakeAppointment.test.js',
    description: 'Tests appointment booking, slot management, payments'
  },
  {
    name: 'Patient Identification and Record Access',
    file: 'tests/unit/PatientIdentificationRecordAccess.test.js',
    description: 'Tests patient search, record access, security'
  },
  {
    name: 'Generate Reports',
    file: 'tests/unit/GenerateReports.test.js',
    description: 'Tests report generation, analytics, exports'
  }
];

async function runTests() {
  try {
    console.log('📋 Test Suites to Execute:');
    testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   📄 ${suite.description}`);
      console.log(`   📁 ${suite.file}\n`);
    });

    console.log('🔧 Running all tests with coverage...\n');
    
    // Run all tests with coverage
    const testCommand = `jest ${testSuites.map(s => s.file).join(' ')} --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=json --verbose`;
    
    console.log(`Executing: ${testCommand}\n`);
    
    const output = execSync(testCommand, { 
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'inherit'
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Coverage report generated in ./coverage/ directory');
    console.log('📄 Open ./coverage/lcov-report/index.html to view detailed coverage');

  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run individual test suites for detailed analysis
async function runIndividualTests() {
  console.log('\n🔍 Running individual test suites for detailed analysis...\n');
  
  for (const suite of testSuites) {
    try {
      console.log(`\n🧪 Testing: ${suite.name}`);
      console.log(`📄 ${suite.description}`);
      console.log('─'.repeat(60));
      
      const command = `jest ${suite.file} --coverage --coverageReporters=text`;
      execSync(command, { 
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      console.log(`✅ ${suite.name} - PASSED\n`);
      
    } catch (error) {
      console.error(`❌ ${suite.name} - FAILED`);
      console.error(`Error: ${error.message}\n`);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--individual')) {
    runIndividualTests();
  } else {
    runTests();
  }
}

module.exports = { runTests, runIndividualTests, testSuites };
