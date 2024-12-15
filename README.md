# WhatsApp ChatGPT Bot

A WhatsApp bot that uses OpenAI's GPT model to respond to messages with conversation memory.

## Features

- Responds to all WhatsApp messages using GPT-4
- Maintains conversation history
- Rate limiting to manage API usage
- Supports viewing conversation history
- Production-ready with Docker support

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- OpenAI API key
- Docker (for production deployment)

## Environment Variables

Create a `.env` file with:

```env
GITHUB_TOKEN=your_openai_api_key
DATABASE_URL=your_postgres_connection_string
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the bot:
```bash
npm start
```

3. Scan the QR code with WhatsApp to authenticate

## Database Management

The bot uses PostgreSQL for storing:
- User information
- Message history
- Conversation sessions

Tables are automatically created on first run.

## Rate Limiting

- 45 messages per user per day
- Resets at midnight
- History viewing doesn't count towards limit

## Commands

- `!history` - View conversation history
- Natural language queries like "what did we talk about?"

## Error Handling

- Graceful handling of API rate limits
- Auto-reconnection for WhatsApp
- Database connection retry logic
