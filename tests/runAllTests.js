const testUserCRUD = require('./userCrudTest');
const testCalendarCRUD = require('./calendarCrudTest');

async function runAllTests() {
  console.log('=== Starting All Tests ===\n');
  
  try {
    // Run user tests
    const userTestResult = await testUserCRUD();
    if (!userTestResult) {
      throw new Error('User tests failed');
    }

    // Run calendar tests
    const calendarTestResult = await testCalendarCRUD();
    if (!calendarTestResult) {
      throw new Error('Calendar tests failed');
    }

    console.log('\n=== All Tests Completed Successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Test Suite Failed ===');
    console.error(error.message);
    process.exit(1);
  }
}

runAllTests();