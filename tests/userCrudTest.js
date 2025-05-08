const axios = require('axios');
const { BASE_URL, TEST_AUTH0_ID, generateTestUser } = require('./utils/testUtils');

async function testUserCRUD() {
  console.log('\n=== Starting User CRUD Tests ===\n');
  console.log('Using API URL:', BASE_URL);
  const testUser = generateTestUser();
  let userId;

  try {
    // Test 1: Create User
    console.log('Testing User Creation...');
    const createResponse = await axios.post(`${BASE_URL}/users`, testUser);
    userId = createResponse.data._id;
    console.log('✓ User created successfully:', userId);

    // Test 2: Read User
    console.log('\nTesting User Retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/users/${TEST_AUTH0_ID}`);
    console.log('User data:', getResponse.data);
    console.log('✓ User retrieved successfully');

    // Test 3: Update User
    console.log('\nTesting User Update...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      email: testUser.email,
      phoneNumber: '555-9999',
      profile: testUser.profile,
      address: testUser.address
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/users/${TEST_AUTH0_ID}`, updateData);
    console.log('✓ User updated successfully');

    // Verify user before deletion
    console.log('\nVerifying user before deletion...');
    const verifyResponse = await axios.get(`${BASE_URL}/users/${TEST_AUTH0_ID}`);
    console.log('User to be deleted:', verifyResponse.data);

    // Test 3: Delete User
    console.log('\nTesting User Deletion...');
    try {
      console.log('Attempting to delete user...');
      console.log('MongoDB _id:', userId);
      console.log('Auth0 ID:', TEST_AUTH0_ID);

      // Use the correct endpoint format
      const deleteResponse = await axios.delete(`${BASE_URL}/users/${userId}`); // Use MongoDB ID
      // OR
      // const deleteResponse = await axios.delete(`${BASE_URL}/users/auth/${TEST_AUTH0_ID}`); // Use Auth0 ID

      if (deleteResponse.status === 200) {
        console.log('✓ User deleted successfully');
      } else {
        console.log('✗ Unexpected status code:', deleteResponse.status);
      }
    } catch (error) {
      console.log('✗ User deletion failed:', {
        message: error.response?.data || error.message,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      });
    }

    console.log('\n✓ All user tests passed successfully!');
    return true;
  } catch (error) {
    console.error('\n✗ User test failed:', {
      message: error.response?.data || error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Additional error debugging
    if (error.response) {
      console.log('\nFull error response:', error.response);
    }
    return false;
  }
}

module.exports = testUserCRUD;

if (require.main === module) {
  testUserCRUD();
}





