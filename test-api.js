const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing UrbanCare API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', healthResponse.data.message);

    // Test auth endpoints
    console.log('\n2. Testing authentication...');
    
    // Login as admin
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@urbancare.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.token;
      const userId = loginResponse.data.data.user._id;
      
      // Test user profile endpoints
      console.log('\n3. Testing user profile endpoints...');
      
      // Get profile
      const profileResponse = await axios.get(`${API_BASE}/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Get user profile successful');
        console.log('👤 User:', profileResponse.data.data.user.firstName, profileResponse.data.data.user.lastName);
        
        // Update availability
        const updateResponse = await axios.put(`${API_BASE}/users/${userId}/profile`, {
          availability: {
            monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
            sunday: { enabled: false, startTime: '09:00', endTime: '13:00' }
          }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (updateResponse.data.success) {
          console.log('✅ Update availability successful');
        } else {
          console.log('❌ Update availability failed:', updateResponse.data.message);
        }
      } else {
        console.log('❌ Get profile failed:', profileResponse.data.message);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

    console.log('\n🎉 API test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
