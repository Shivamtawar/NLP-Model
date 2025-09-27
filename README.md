# NLP-Model Open Source API

A Node.js NLP chatbot server with Retrieval-Augmented Generation (RAG) and LangChain, supporting open source API endpoints for conversation storage, retrieval, and feedback.

## Features
- RESTful API for chat, conversation history, and feedback (like)
- Stores user conversations using LangChain and ChromaDB
- Retrieval-Augmented Generation (RAG) for context-aware responses
- Profanity, toxicity, and topic restriction filters
- Easy to extend and contribute

## API Endpoints

### Health Check
- `GET /health` — Returns server and NLP status

### Chat
- `POST /chat`
  - Request: `{ "text": "your message", "userId": "optional user id" }`
  - Response: `{ "response": "bot reply", ... }`

### Conversations
- `GET /conversations?limit=20&offset=0` — List recent conversations
- `GET /conversations/:id` — Get a single conversation by ID
- `POST /conversations/:id/like` — Like a conversation
- `GET /conversations/:id/likes` — Get like count for a conversation

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. **Required**: Set your OpenAI API key for embeddings (get from https://platform.openai.com/api-keys):
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   ```
   Without this, RAG will use simple in-memory storage without embeddings.
3. Start the server:
   ```bash
   npm start
   ```
4. (Optional) Run tests:
   ```bash
   node test.js
   ```

## Contribution
- Fork and submit pull requests
- See `CONTRIBUTING.md` for guidelines (to be added)

## License
MIT (or your choice)

---
For more details, see the code and comments. PRs and issues welcome!
