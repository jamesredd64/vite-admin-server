const BASE_URL = 'http://localhost:5000/api';
const TEST_AUTH0_ID = 'auth0|test_user_123';

const generateTestUser = () => ({
  firstName: 'Test',
  lastName: 'User',
  email: `test.user.${Date.now()}@example.com`,
  phoneNumber: '555-0123',
  auth0Id: TEST_AUTH0_ID,
  profile: {
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Other',
    marketingBudget: {
      amount: 5000,
      frequency: 'monthly',
      adCosts: 2500
    }
  },
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  }
});

const generateTestEvent = () => ({
  title: `Test Event ${Date.now()}`,
  start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  end: new Date(Date.now() + 90000000).toISOString(),
  allDay: false,
  auth0Id: TEST_AUTH0_ID,
  extendedProps: {
    calendar: 'primary',
    description: 'Test event description',
    location: 'Test Location'
  }
});

module.exports = {
  BASE_URL,
  TEST_AUTH0_ID,
  generateTestUser,
  generateTestEvent
};
