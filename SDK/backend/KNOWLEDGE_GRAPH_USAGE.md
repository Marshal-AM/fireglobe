# Knowledge Graph Integration - Usage Guide

## Overview

The CDP Agent Tester Backend now includes a **MeTTa-powered Knowledge Graph** that stores all conversations, personality data, and BlockScout transaction analyses with proper relationships.

## What's Stored

### 1. Conversations
- **Conversation ID**: Unique identifier for each conversation
- **Personality Name**: The personality that participated in the conversation
- **Messages**: Complete message history (stored as JSON)
- **Timestamp**: When the conversation was stored
- **Evaluation**: Optional evaluation results if available

### 2. BlockScout Transaction Analyses
- **Transaction Hash**: Unique blockchain transaction identifier
- **Analysis**: Full analysis text from BlockscoutAgent
- **Conversation ID**: Linked to the conversation that generated the transaction
- **Chain ID**: Blockchain network identifier
- **Timestamp**: When the analysis was performed

### 3. Relationships
The Knowledge Graph maintains proper relationships between:
- **Conversations ↔ Personalities**: Each conversation is linked to its personality
- **Conversations ↔ Transactions**: Transactions are properly linked to their originating conversations
- **Transactions ↔ Analyses**: Each transaction has its associated BlockScout analysis

## Automatic Storage

The Knowledge Graph automatically stores data when:

1. **Conversations are stored** via `/rest/store-conversation`
   - The conversation, messages, and personality are saved to the KG
   - A bidirectional link is created between personality and conversation

2. **BlockScout analyses are received** via deployed BlockScoutAgent service
   - The analysis is automatically linked to its conversation
   - Both the transaction and conversation maintain references to each other
   - Uses deployed service at: `https://blockscoutagent-739298578243.us-central1.run.app`

## REST API Endpoints

All endpoints follow the uAgents framework pattern and return structured responses.

### 1. Query Specific Conversation
**Endpoint**: `POST /rest/kg/query-conversation`

**Request**:
```json
{
  "conversation_id": "216b4d11-b4e5-48ff-84d4-d201cb920786"
}
```

**Response**:
```json
{
  "success": true,
  "conversation": {
    "conversation_id": "216b4d11-b4e5-48ff-84d4-d201cb920786",
    "personality_name": "TransferInitiator",
    "timestamp": "2025-10-19T06:47:09.123456",
    "messages": [
      {"role": "user", "content": "Hello!"},
      {"role": "assistant", "content": "Hi there!"}
    ],
    "evaluation": {
      "score": 85,
      "criteria": {...}
    },
    "transactions": [
      {
        "transaction_hash": "0xabc123...",
        "analysis": "This transaction...",
        "timestamp": "2025-10-19T06:48:10.123456",
        "chain_id": "84532"
      }
    ]
  },
  "message": "Successfully retrieved conversation: 216b4d11-b4e5-48ff-84d4-d201cb920786"
}
```

### 2. Query by Personality
**Endpoint**: `POST /rest/kg/query-by-personality`

**Request**:
```json
{
  "personality_name": "TransferInitiator"
}
```

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "conversation_id": "...",
      "personality_name": "TransferInitiator",
      "messages": [...],
      "transactions": [...]
    }
  ],
  "count": 5,
  "message": "Found 5 conversations for personality: TransferInitiator"
}
```

### 3. Get All Conversations
**Endpoint**: `GET /rest/kg/all-conversations`

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "conversation_id": "...",
      "personality_name": "...",
      "messages": [...],
      "transactions": [...]
    }
  ],
  "count": 25,
  "message": "Successfully retrieved 25 conversations"
}
```

### 4. Get All Transactions
**Endpoint**: `GET /rest/kg/all-transactions`

**Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "transaction_hash": "0xabc123...",
      "analysis": "This transaction represents...",
      "timestamp": "2025-10-19T06:48:10.123456",
      "chain_id": "84532"
    }
  ],
  "count": 15,
  "message": "Successfully retrieved 15 transaction analyses"
}
```

## Usage Examples

### Python Example

```python
import httpx

BASE_URL = "http://localhost:8000"

async def query_conversation(conversation_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/rest/kg/query-conversation",
            json={"conversation_id": conversation_id}
        )
        return response.json()

async def get_all_conversations():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/rest/kg/all-conversations"
        )
        return response.json()

async def query_by_personality(personality_name: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/rest/kg/query-by-personality",
            json={"personality_name": personality_name}
        )
        return response.json()

# Usage
conversation = await query_conversation("216b4d11-b4e5-48ff-84d4-d201cb920786")
all_convos = await get_all_conversations()
personality_convos = await query_by_personality("TransferInitiator")
```

### cURL Examples

```bash
# Query specific conversation
curl -X POST http://localhost:8000/rest/kg/query-conversation \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "216b4d11-b4e5-48ff-84d4-d201cb920786"}'

# Query by personality
curl -X POST http://localhost:8000/rest/kg/query-by-personality \
  -H "Content-Type: application/json" \
  -d '{"personality_name": "TransferInitiator"}'

# Get all conversations
curl -X GET http://localhost:8000/rest/kg/all-conversations

# Get all transactions
curl -X GET http://localhost:8000/rest/kg/all-transactions
```

## Technical Details

### BlockScoutAgent Integration

The backend is configured to use the deployed BlockScoutAgent service:
- **URL**: `https://blockscoutagent-739298578243.us-central1.run.app`
- **Chain ID**: `84532` (Base Sepolia testnet)
- **Communication**: HTTP POST requests to `/rest/get-analysis`
- **A2A**: Agent-to-Agent communication for real-time analysis requests

### MeTTa Schema

The Knowledge Graph uses the following MeTTa schema:

```
# Conversation entities
(conversation_id <conv_id> <original_id>)
(conversation_personality <conv_id> <personality_name>)
(conversation_timestamp <conv_id> <timestamp>)
(conversation_messages <conv_id> <messages_json>)
(conversation_evaluation <conv_id> <evaluation_json>)

# Transaction entities
(transaction_hash <tx_id> <hash>)
(transaction_analysis <tx_id> <analysis_text>)
(transaction_timestamp <tx_id> <timestamp>)
(transaction_chain <tx_id> <chain_id>)

# Relationships
(personality_conversation <personality_id> <conv_id>)
(transaction_conversation <tx_id> <conv_id>)
(conversation_transaction <conv_id> <tx_id>)
```

### Data Persistence

- The Knowledge Graph is stored in-memory using MeTTa
- All conversations are also saved to JSON files in `./storage/` directory as backup
- The KG provides fast querying capabilities while JSON files provide data persistence

## Benefits

1. **Proper Relationships**: Conversations and transactions are properly linked
2. **Fast Queries**: MeTTa provides efficient graph traversal and queries
3. **Rich Data Model**: Store complete conversation context with BlockScout analyses
4. **uAgents Integration**: All endpoints follow uAgents framework patterns
5. **Automatic Storage**: Data is automatically stored during normal operation

## Error Handling

All endpoints include proper error handling:
- If a conversation is not found, `success: false` is returned with a descriptive message
- Errors during KG operations don't affect file-based storage (dual persistence)
- All errors are logged for debugging

## Next Steps

You can now:
1. Store conversations and they'll automatically be indexed in the KG
2. Query conversations by ID or personality
3. Retrieve all BlockScout analyses with their associated conversations
4. Build analytics and reporting tools on top of the KG data

