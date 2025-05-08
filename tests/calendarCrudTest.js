const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_AUTH0_ID = 'auth0|test_user_123';

async function testCalendarCRUD() {
  // console.log('\n=== Starting Calendar Events CRUD Tests ===\n');
  // console.log('Using API URL:', BASE_URL);
  
  let eventId;
  const testEvent = {
    title: `Test Event ${Date.now()}`,
    start: new Date(Date.now() + 60000000).toISOString(),
    end: new Date(Date.now() + 63600000).toISOString(),
    allDay: false,
    auth0Id: TEST_AUTH0_ID,
    extendedProps: {
      calendar: 'primary',
      description: 'Test event description',
      location: 'Test Location'
    }
  };
  
  try {
    // Test 1: Create Event
    // console.log('Testing Event Creation...');
    // console.log('Sending event data:', JSON.stringify(testEvent, null, 2));
    const createEndpoint = `${BASE_URL}/calendar`;
    // console.log('To endpoint:', createEndpoint);
    
    const createResponse = await axios.post(createEndpoint, testEvent);
    eventId = createResponse.data.event._id;
    // console.log('✓ Event created successfully:', eventId);

    // Test 2: Read Events
    // console.log('\nTesting Events Retrieval...');
    const getEndpoint = `${BASE_URL}/calendar/user/${TEST_AUTH0_ID}`;
    // console.log('From endpoint:', getEndpoint);
    const getResponse = await axios.get(getEndpoint);
    // console.log('✓ Events retrieved successfully:', getResponse.data.length, 'events found');

    // Test 3: Update Event
    if (eventId) {
      // console.log('\nTesting Event Update...');
      const updateData = {
        ...testEvent,
        title: 'Updated Test Event'
      };
      const updateResponse = await axios.put(`${BASE_URL}/calendar/${eventId}`, updateData);
      // console.log('✓ Event updated successfully');

      // Test 4: Delete Event
      // console.log('\nTesting Event Deletion...');
      const deleteResponse = await axios.delete(`${BASE_URL}/calendar/${eventId}`);
      // console.log('✓ Event deleted successfully');
    }

    // console.log('\n✓ All calendar tests passed successfully!');
    return true;
  } catch (error) {
    // console.error('\n✗ Calendar test failed:', {
      message: error.response?.data || error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });
    return false;
  }
}

if (require.main === module) {
  testCalendarCRUD();
}

module.exports = testCalendarCRUD;

