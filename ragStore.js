// ragStore.js
// Simple in-memory store for conversations (for demo, replace with vector store later)

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

let conversations = [];

// Fallback file for likes
const likesFile = path.join(__dirname, 'conversation_likes.json');
function readLikes() {
  if (!fs.existsSync(likesFile)) return {};
  return JSON.parse(fs.readFileSync(likesFile, 'utf8'));
}
function writeLikes(likes) {
  fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2));
}

// Function to add a conversation
function logConversation(userId, userMessage, botResponse) {
  const id = uuidv4();
  const doc = {
    id,
    userId,
    userMessage,
    botResponse,
    timestamp: new Date().toISOString(),
  };
  conversations.push(doc);
  return doc;
}

// Function to retrieve relevant past conversations (simple: return last 3)
function retrieveRelevantConversations(query, k = 3) {
  return conversations.slice(-k);
}

// List all conversations
function listConversations(limit = 20, offset = 0) {
  return conversations.slice(offset, offset + limit);
}

// Get a single conversation by ID
function getConversation(id) {
  return conversations.find(c => c.id === id) || null;
}

// Like a conversation
function likeConversation(id) {
  const likes = readLikes();
  likes[id] = (likes[id] || 0) + 1;
  writeLikes(likes);
  return likes[id];
}

// Get likes for a conversation
function getLikes(id) {
  const likes = readLikes();
  return likes[id] || 0;
}

module.exports = {
  logConversation,
  retrieveRelevantConversations,
  listConversations,
  getConversation,
  likeConversation,
  getLikes,
};
