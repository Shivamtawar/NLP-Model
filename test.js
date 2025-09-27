// test.js - Test script for the NLP-Model API

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Change to your server port

async function testAPI() {
  console.log('Testing NLP-Model API...\n');

  try {
    // Test Health Check
    console.log('1. Testing /health');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('   Status:', health.status);
    console.log('   Data:', health.data);
    console.log('');

    // Test Chat
    console.log('2. Testing /chat');
    const chat = await axios.post(`${BASE_URL}/chat`, { text: 'Hello, how are you?' });
    console.log('   Status:', chat.status);
    console.log('   Response:', chat.data.response);
    console.log('');

    // Test List Conversations
    console.log('3. Testing /conversations');
    const conversations = await axios.get(`${BASE_URL}/conversations`);
    console.log('   Status:', conversations.status);
    console.log('   Conversations:', conversations.data.conversations.length);
    console.log('');

    // If there are conversations, test getting one
    if (conversations.data.conversations.length > 0) {
      const id = conversations.data.conversations[0].id;
      console.log('4. Testing /conversations/:id');
      const convo = await axios.get(`${BASE_URL}/conversations/${id}`);
      console.log('   Status:', convo.status);
      console.log('   Conversation:', convo.data);
      console.log('');

      // Test Liking
      console.log('5. Testing /conversations/:id/like');
      const like = await axios.post(`${BASE_URL}/conversations/${id}/like`);
      console.log('   Status:', like.status);
      console.log('   Likes:', like.data.likes);
      console.log('');

      // Test Get Likes
      console.log('6. Testing /conversations/:id/likes');
      const likes = await axios.get(`${BASE_URL}/conversations/${id}/likes`);
      console.log('   Status:', likes.status);
      console.log('   Likes:', likes.data.likes);
      console.log('');
    }

    console.log('All tests passed!');

  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testAPI();