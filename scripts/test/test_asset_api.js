// Test the assets API
async function testAssetAPI() {
  try {
    // First get a session
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();

    if (!sessionData.session?.access_token) {
      console.log('No session found, need to authenticate first');
      return;
    }

    const token = sessionData.session.access_token;

    // Test GET assets
    console.log('Testing GET /api/assets...');
    const getResponse = await fetch('http://localhost:3000/api/assets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('GET Status:', getResponse.status);
    const getData = await getResponse.text();
    console.log('GET Response:', getData);

    // Test POST asset
    console.log('Testing POST /api/assets...');
    const postResponse = await fetch('http://localhost:3000/api/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Asset',
        type: 'real_estate',
        description: 'Test description',
        location: 'Test location',
        estimated_value: 100000,
        currency: 'USD'
      })
    });

    console.log('POST Status:', postResponse.status);
    const postData = await postResponse.text();
    console.log('POST Response:', postData);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAssetAPI();

































