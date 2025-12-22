# 🤖 Chat API

## Overview

The Chat API provides access to OrangeCat's AI assistant powered by Google Gemini 2.0 Flash-Lite. This is the cheapest available LLM, making it cost-effective for user assistance.

## Endpoints

### POST `/api/chat`

Send a message to the AI assistant and receive a response.

#### Request

```javascript
POST /api/chat
Content-Type: application/json

{
  "message": "How does OrangeCat work?",
  "systemPrompt": "You are OrangeCat's AI assistant..." // optional
}
```

#### Parameters

| Parameter      | Type   | Required | Description                                       |
| -------------- | ------ | -------- | ------------------------------------------------- |
| `message`      | string | Yes      | The user's message (max 10,000 characters)        |
| `systemPrompt` | string | No       | Custom system prompt to override default behavior |

#### Response

**Success (200)**:

```javascript
{
  "message": "OrangeCat is a Bitcoin-native crowdfunding platform where users can fund projects directly with Bitcoin...",
  "model": "gemini-2.0-flash-lite",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

**Error Responses**:

**400 Bad Request**:

```javascript
{
  "error": "Message is required and must be a string"
}
```

**429 Rate Limited**:

```javascript
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 5,
  "remaining": 0,
  "resetTime": 1733740200000,
  "resetDate": "Mon, 09 Dec 2025 10:30:00 GMT"
}
```

**500 Internal Server Error**:

```javascript
{
  "error": "Failed to generate response"
}
```

### GET `/api/chat`

Get information about the chat service and current model.

#### Response

```javascript
{
  "status": "healthy",
  "model": "gemini-2.0-flash-lite",
  "provider": "Google Gemini",
  "pricing": {
    "input": "$0.075 per 1M tokens",
    "output": "$0.30 per 1M tokens"
  },
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

## Rate Limiting

- **5 requests per 5 minutes** per IP address
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets
  - `Retry-After`: Seconds until limit resets

## Error Handling

The API handles various error conditions:

- **Invalid Input**: Message validation failures
- **API Key Issues**: Authentication problems with Gemini API
- **Quota Exceeded**: Gemini API usage limits reached
- **Content Filtering**: Messages blocked by safety filters
- **Network Issues**: Connection problems with Gemini API

## Security

- API keys are stored server-side only
- Input validation prevents malicious payloads
- Rate limiting prevents abuse
- Content filtering through Gemini's safety features
- Error messages don't expose sensitive information

## Usage Examples

### Basic Chat

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is Bitcoin crowdfunding?',
  }),
});

const data = await response.json();
console.log(data.message);
```

### Custom System Prompt

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain Bitcoin to a beginner',
    systemPrompt: 'You are a patient teacher explaining complex topics simply.',
  }),
});
```

## Cost Information

- **Input**: $0.075 per 1 million tokens
- **Output**: $0.30 per 1 million tokens
- **Model**: Google Gemini 2.0 Flash-Lite
- **Context Window**: 128K tokens

## Frontend Integration

The chat feature is integrated as a floating chat widget available site-wide. The component handles:

- Real-time message exchange
- Auto-scrolling message history
- Error states and loading indicators
- Keyboard shortcuts and accessibility
- Responsive design for mobile and desktop

---

**Created**: 2025-12-09
**Last Modified**: 2025-12-09
**Last Modified Summary**: Initial API documentation for chat endpoint
