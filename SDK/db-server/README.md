# CDP Agent Tester - Database Server

A lightweight Node.js server that handles Supabase database operations and Lighthouse IPFS uploads for the CDP Agent Tester.

## Features

- 🗄️ **Supabase Integration**: Stores user data and test run metadata
- 📦 **Lighthouse IPFS**: Uploads Knowledge Graphs and Metrics to decentralized storage
- 🔐 **Access Token Authentication**: Validates users via access tokens
- 📊 **Test Run Tracking**: Links users to their test results

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `schema.sql` in your Supabase SQL Editor
3. Get your project URL and anon key from Project Settings → API

### 3. Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `LIGHTHOUSE_API_KEY`: Your Lighthouse API key (provided)

### 4. Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### Health Check
```bash
GET /health
```


### Upload Knowledge Graph
```bash
POST /upload-kg
Content-Type: application/json

{
  "access_token": "your-access-token",
  "conversation_id": "optional-conversation-id"
}
```

Response includes `kg_hash` needed for next step.

### Upload Metrics (Complete Test Run)
```bash
POST /upload-metrics
Content-Type: application/json

{
  "access_token": "your-access-token",
  "kg_hash": "hash-from-upload-kg-response"
}
```

### Upload Complete (Combined)
```bash
POST /upload-complete
Content-Type: application/json

{
  "access_token": "your-access-token"
}
```

Uploads both KG and Metrics in one call.

### Get User Test Runs
```bash
GET /user/:access_token/test-runs
```

## Flow Diagram

```
1. SDK completes test
2. SDK calls /upload-complete with access_token
3. Server fetches KG from backend
4. Server fetches Metrics from metrics service
5. Server uploads both to Lighthouse IPFS
6. Server stores hashes in Supabase
7. Server returns IPFS URLs
```

## Database Schema

### users
- `user_id` (UUID, primary key)
- `access_token` (TEXT, unique)
- `created_at` (TIMESTAMP)

### test_runs
- `run_id` (UUID, primary key)
- `user_id` (UUID, foreign key → users)
- `kg_hash` (TEXT) - Lighthouse IPFS hash
- `metrics_hash` (TEXT) - Lighthouse IPFS hash
- `created_at` (TIMESTAMP)

## Integration with SDK

The SDK should call this server after test completion:

```typescript
// After tests complete
const response = await fetch('http://localhost:3001/upload-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: 'user-token' })
});

const result = await response.json();
console.log('KG URL:', result.kg.url);
console.log('Metrics URL:', result.metrics.url);
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `401`: Unauthorized (invalid access token)
- `409`: Conflict (duplicate user)
- `500`: Server error

## Development

Run with auto-reload:
```bash
npm run dev
```

## Production

Set `NODE_ENV=production` and use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name cdp-db-server
```

## License

MIT

