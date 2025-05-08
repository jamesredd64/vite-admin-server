const axios = require('axios');

const testUserEndpoint = async (auth0Id) => {
  const BASE_URL = 'admin-backend-eta.vercel.app'; // Update with your Vercel URL
  
  try {
    console.log(`Testing user endpoint with auth0Id: ${auth0Id}`);
    
    // Test health endpoint first
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('Health check status:', healthResponse.status);
    console.log('Health check response:', healthResponse.data);

    // Test user fetch by auth0Id
    console.log('\nTesting user endpoint...');
    const response = await axios.get(`${BASE_URL}/users/${auth0Id}`);
    
    console.log('\nResponse:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
  } catch (error) {
    console.error('Error during test:', error.response?.data || error.message);
  }
};

// Get auth0Id from command line argument or use default test ID
const auth0Id = process.argv[2] || 'auth0|67bb70c5eedb5c4b0ea1ec93';
testUserEndpoint(auth0Id);


