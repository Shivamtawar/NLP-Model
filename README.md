# NLP-Model Open Source API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node.js NLP chatbot server with Retrieval-Augmented Generation (RAG) and LangChain, supporting open source API endpoints for conversation storage, retrieval, and feedback. Designed for safe, context-aware AI interactions with built-in safety filters.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features
- **RESTful API**: Clean endpoints for chat, conversation management, and feedback
- **Retrieval-Augmented Generation (RAG)**: Context-aware responses using past conversations
- **Conversation Storage**: In-memory storage with optional vector embeddings via OpenAI
- **Safety Filters**: Profanity, toxicity, topic restrictions, and prompt injection defense
- **NLP Processing**: Node-NLP for intent classification and response generation
- **Extensible**: Easy to add new features, models, or storage backends
- **Open Source**: MIT licensed, community-driven development

## Architecture

### Overview
The application is built with Node.js and Express.js, featuring a modular architecture:

- **Server (`server.js`)**: Main Express server with middleware chain for safety checks
- **RAG Store (`ragStore.js`)**: Handles conversation logging, retrieval, and likes
- **Models**: Node-NLP for classification, optional OpenAI embeddings for RAG
- **Safety Layers**: Multiple middleware for input validation and content filtering

### Data Flow
1. User sends message to `/chat`
2. Request passes through safety middlewares (profanity, toxicity, topic, injection)
3. NLP processes intent and generates base response
4. RAG retrieves relevant past conversations for context
5. Response is logged for future retrieval
6. Final response sent to user

## Installation

### Prerequisites
- Node.js 18+ (for ES modules support)
- npm or yarn
- OpenAI API key (optional, for embeddings)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Piyush11204/NLP-Model.git
   cd NLP-Model
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables (see [Configuration](#configuration))

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3003` by default.

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key for embeddings (required for full RAG)
  - Get from: https://platform.openai.com/api-keys
  - Without this, the system uses simple in-memory storage

### Server Configuration
- Port: Change `const port = 3003;` in `server.js`
- NLP Threshold: Adjust `threshold: 0.7` in `loadModels()`

### Storage
- Currently uses in-memory storage
- For production, implement persistent storage (e.g., database) in `ragStore.js`

## Usage

### Basic Chat
```bash
curl -X POST http://localhost:3003/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?"}'
```

### Get Health Status
```bash
curl http://localhost:3003/health
```

### List Conversations
```bash
curl "http://localhost:3003/conversations?limit=10&offset=0"
```

### Like a Conversation
```bash
curl -X POST http://localhost:3003/conversations/{id}/like
```

## API Reference

### Health Check
- **GET** `/health`
- Returns server status and NLP readiness

### Chat
- **POST** `/chat`
- **Body**: `{"text": "message", "userId": "optional"}`
- **Response**: `{"response": "bot reply", "metadata": {...}}`

### Conversations
- **GET** `/conversations?limit=20&offset=0`
  - List conversations with pagination
- **GET** `/conversations/:id`
  - Get specific conversation
- **POST** `/conversations/:id/like`
  - Like a conversation
- **GET** `/conversations/:id/likes`
  - Get like count

### Response Codes
- `200`: Success
- `400`: Bad request (safety violation)
- `404`: Not found
- `500`: Server error

## Security

### Safety Features
1. **Profanity Filter**: Masks bad words using `bad-words` library
2. **Toxicity Detection**: Uses `text-toxicity-detector` for harmful content
3. **Topic Restrictions**: Blocks restricted topics (violence, crime, etc.) via Node-NLP
4. **Contextual Safety**: Sentiment analysis for dangerous combinations
5. **Prompt Injection Defense**: Detects and blocks injection attempts

### Input Validation
- Sanitization with `validator` library
- Rate limiting (not implemented, add as needed)
- CORS (not configured, add for production)

### Best Practices
- Always validate user input
- Monitor logs for suspicious activity
- Use HTTPS in production
- Implement authentication for sensitive endpoints

## Testing

Run the included test script:
```bash
node test.js
```

This tests all API endpoints and reports results.

For development testing:
```bash
npm test  # (if you add test scripts)
```

## Deployment

### Local Development
```bash
npm start
```

### Production
1. Set production environment variables
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name nlp-model
   ```
3. Configure reverse proxy (nginx) for production
4. Add SSL/TLS certificates

### Docker (Optional)
Add a `Dockerfile` and `docker-compose.yml` for containerized deployment.

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow ESLint rules (add if not present)
- Write clear commit messages
- Update documentation for API changes
- Test your changes thoroughly

### Areas for Improvement
- Persistent storage backend
- User authentication
- Rate limiting
- Advanced NLP models
- Web UI for testing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This is an experimental AI system. Use responsibly and monitor for safety. Not intended for production use without further security audits.

For questions or support, open an issue on GitHub.
