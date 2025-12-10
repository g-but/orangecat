// Test script to verify connections loading
const testConnections = async () => {
  const userId = 'cec88bc9-557f-452b-92f1-e093092fecd6';

  console.log('Testing connections API endpoints...\n');

  try {
    // Test following endpoint
    console.log('1. Testing following endpoint...');
    const followingRes = await fetch(`http://localhost:3000/api/social/following/${userId}`);
    const followingData = await followingRes.json();

    if (followingRes.ok && followingData.success) {
      const following = followingData.data?.data || [];
      console.log(`✅ Following API: ${following.length} connections found`);

      // Test data transformation
      const transformed = following
        .map(item => {
          const profileData = item.profiles || (item.following_id ? null : item);
          if (!profileData) {
            console.log('❌ Missing profile data in following response', item);
            return null;
          }
          return {
            profile: {
              id: profileData.id || item.following_id,
              username: profileData.username,
              name: profileData.name,
              avatar_url: profileData.avatar_url,
              bio: profileData.bio,
              bitcoin_address: profileData.bitcoin_address,
              lightning_address: profileData.lightning_address,
            },
            created_at: item.created_at,
          };
        })
        .filter(Boolean);

      console.log(`✅ Following transformation: ${transformed.length} valid connections`);
    } else {
      console.log('❌ Following API failed:', followingData);
    }

    // Test followers endpoint
    console.log('\n2. Testing followers endpoint...');
    const followersRes = await fetch(`http://localhost:3000/api/social/followers/${userId}`);
    const followersData = await followersRes.json();

    if (followersRes.ok && followersData.success) {
      const followers = followersData.data?.data || [];
      console.log(`✅ Followers API: ${followers.length} connections found`);

      // Test data transformation
      const transformed = followers
        .map(item => {
          const profileData = item.profiles || (item.follower_id ? null : item);
          if (!profileData) {
            console.log('❌ Missing profile data in followers response', item);
            return null;
          }
          return {
            profile: {
              id: profileData.id || item.follower_id,
              username: profileData.username,
              name: profileData.name,
              avatar_url: profileData.avatar_url,
              bio: profileData.bio,
              bitcoin_address: profileData.bitcoin_address,
              lightning_address: profileData.lightning_address,
            },
            created_at: item.created_at,
          };
        })
        .filter(Boolean);

      console.log(`✅ Followers transformation: ${transformed.length} valid connections`);
    } else {
      console.log('❌ Followers API failed:', followersData);
    }

    console.log('\n🎉 Connections testing complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testConnections();




























