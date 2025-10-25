# fireGlobe Database Server

A comprehensive Node.js server that manages test run data storage, IPFS uploads, and FGC token rewards for the fireGlobe testing platform.

## 🌟 Features

- 🗄️ **Supabase Integration**: Stores user data and test run metadata
- 📦 **Lighthouse IPFS**: Uploads Knowledge Graphs and Metrics to decentralized storage
- 🔐 **Access Token Authentication**: Validates users via access tokens
- 📊 **Test Run Tracking**: Links users to their test results
- 💰 **FGC Token Rewards**: Automatically mints FGC tokens for completed test runs
- 🔗 **Data Linking**: Connects test results to user accounts and IPFS storage
- 📈 **Analytics Storage**: Stores comprehensive performance metrics and conversation data

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

## 🔄 Complete Data Flow & FGC Rewards Process

### Overview
The database server orchestrates the complete test run completion process, from data storage to user rewards:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────-┐
│   SDK Client    │    │   DB Server      │    │   IPFS Storage   │
│                 │    │                  │    │                  │
│ 1. Test Complete│───▶│ 2. Receive Token │    │                  │
│                 │    │ 3. Validate User │    │                  │
│                 │    │ 4. Fetch KG Data │───▶│ 5. Upload KG     │
│                 │    │ 6. Fetch Metrics │───▶│ 7. Upload Metrics│
│                 │    │ 8. Store Metadata│    │                  │
│                 │    │ 9. Mint FGC      │    │                  │
│                 │◀───│10. Return URLs   │    │                  │
└─────────────────┘    └──────────────────┘    └─────────────────-┘
```

### Detailed Process Flow

#### **Step 1: Test Completion**
- SDK completes agent testing with multiple personalities
- All conversation data, evaluations, and metrics are generated
- SDK calls `/upload-complete` endpoint with user's access token

#### **Step 2: User Validation**
- Server validates the access token against Supabase users table
- Ensures user exists and is authorized to store test data
- Creates user record if this is their first test run

#### **Step 3: Knowledge Graph Retrieval**
- Server fetches conversation data from fireGlobe backend
- Retrieves all conversation messages, personality data, and evaluations
- Formats data for IPFS storage

#### **Step 4: Metrics Retrieval**
- Server fetches comprehensive performance metrics from Metrics Generator
- Includes capability scores, efficiency metrics, and improvement recommendations
- Combines with Knowledge Graph data for complete test run record

#### **Step 5: IPFS Upload Process**
- **Knowledge Graph Upload**: Uploads conversation and evaluation data to Lighthouse IPFS
- **Metrics Upload**: Uploads performance metrics and analytics to Lighthouse IPFS
- Both uploads return unique IPFS hashes for permanent storage

#### **Step 6: Database Storage**
- Stores test run metadata in Supabase `test_runs` table
- Links user ID to both IPFS hashes (KG and Metrics)
- Records timestamp and test run details

#### **Step 7: FGC Token Rewards**
- **Automatic Minting**: Mints 1 FGC token to user's wallet address
- **Blockchain Integration**: Uses Viem to interact with FGC token contract
- **Transaction Recording**: Logs reward transaction for user tracking

#### **Step 8: Response & Frontend Integration**
- Returns IPFS URLs for both Knowledge Graph and Metrics
- Provides test run ID for frontend dashboard access
- Enables real-time updates in user dashboard

### Data Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Lighthouse IPFS                          │
├─────────────────────────────────────────────────────────────┤
│  Knowledge Graph Data:                                      │
│  - success: true                                            │
│  - entry_type: "comprehensive_test_run"                     │
│  - entry.conversations[]:                                   │
│    - conversation_id                                        │
│    - personality_name                                       │
│    - messages[] (role, content, timestamp, personality)     │
│    - transaction_analysis (hash, chain, analysis)           │
│    - transactions[] (hash, chain_id, analysis, raw_data)    │
│  - entry.transactions[]:                                    │
│    - transaction_hash                                       │
│    - chain_id                                               │
│    - analysis                                               │
│    - raw_data (BlockScout MCP data)                         │
│  - entry.total_conversations                                │
│  - entry.total_transactions                                 │
│  - entry.personalities[]                                    │
│  - entry.test_run_timestamp                                 │
│  - entry.test_run_id                                        │
├─────────────────────────────────────────────────────────────┤
│  Metrics Data:                                              │
│  - success: true                                            │
│  - conversation_id                                          │
│  - metrics.test_id                                          │
│  - metrics.personality_name                                 │
│  - metrics.network                                          │
│  - metrics.timestamp                                        │
│  - metrics.metrics:                                         │
│    - capability (action_success_rate, action_type_coverage) │
│    - efficiency (latency_ms, gas_used, gas_efficiency)      │
│    - reliability (recovery_rate, tool_reliability)          │
│    - interaction (response_latency, compliance_percent)     │
│    - defi_reasoning (defi_action_success_rate, etc.)        │
│    - aggregate_scores (capability_score, efficiency_score)  │
│  - metrics.summary (overall_score, execution_reliability)   │
│  - metrics.improvement_areas[] (area, scope, suggestion)    │
│  - agent_address                                            │
└─────────────────────────────────────────────────────────────┘
```


## 💰 FGC Token Rewards System

### How FGC Rewards Work

The database server automatically rewards users with FGC tokens upon successful test completion:

#### **Reward Criteria**
- ✅ Test run must complete successfully
- ✅ All data must be uploaded to IPFS
- ✅ User must have a valid wallet address
- ✅ No previous rewards for the same test run

#### **Reward Amount**
- **1 FGC Token** per completed test run
- Fixed amount regardless of test performance
- Tokens are minted directly to user's wallet

#### **Blockchain Integration**
```javascript
// FGC Token Contract Details
const DATACOIN_ADDRESS = "0x3D2f760c3Bb59BC74B6BE357e3c20Aad708a9667";
const REWARD_AMOUNT = "1000000000000000000"; // 1 FGC (18 decimals)

// Minting Process
async function mintFgcToAddress(recipientAddress, humanAmount = '1') {
  const amount = parseUnits(humanAmount, 18);
  
  const hash = await walletClient.writeContract({
    address: DATACOIN_ADDRESS,
    abi: DataCoinAbi,
    functionName: 'mint',
    args: [recipientAddress, amount]
  });
  
  return hash;
}
```

#### **Reward Process Flow**
1. **Test Completion**: SDK completes agent testing
2. **Data Upload**: Knowledge Graph and Metrics uploaded to IPFS
3. **Database Storage**: Test run metadata stored in Supabase
4. **Wallet Verification**: Check user has valid wallet address
5. **FGC Minting**: Mint 1 FGC token to user's wallet
6. **Transaction Recording**: Store transaction hash in database
7. **Frontend Notification**: Update user dashboard with new balance


## 🔗 Integration with SDK

The SDK calls this server after test completion:

```typescript
// After tests complete
const response = await fetch('https://fireglobedb-739298578243.us-central1.run.app/upload-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: 'user-token' })
});

const result = await response.json();
console.log('Test Run ID:', result.runId);
console.log('KG URL:', result.kg.url);
console.log('Metrics URL:', result.metrics.url);
console.log('FGC Rewarded:', result.fgcRewarded);
console.log('FGC Transaction:', result.fgcTransactionHash);
```

### Response Format

```json
{
  "success": true,
  "runId": "uuid-test-run-id",
  "kg": {
    "hash": "QmHash123...",
    "url": "https://gateway.lighthouse.storage/ipfs/QmHash123..."
  },
  "metrics": {
    "hash": "QmHash456...",
    "url": "https://gateway.lighthouse.storage/ipfs/QmHash456..."
  },
  "fgcRewarded": true,
  "fgcTransactionHash": "0x1234567890abcdef...",
  "message": "Test run completed and rewards distributed"
}
```

## 📦 IPFS Storage Details

### Lighthouse IPFS Integration

The database server uses Lighthouse IPFS for decentralized storage of test data:

#### **Knowledge Graph Storage**
- **Content**: Complete conversation data, personality information, evaluations
- **Format**: JSON structure with nested conversation objects
- **Size**: Typically 50-500KB per test run
- **Persistence**: Permanent storage with content addressing

#### **Metrics Storage**
- **Content**: Performance metrics, capability scores, improvement recommendations
- **Format**: Structured JSON with calculated analytics
- **Size**: Typically 10-100KB per test run
- **Persistence**: Permanent storage linked to Knowledge Graph

#### **IPFS Upload Process**
```javascript
// Knowledge Graph Upload
const kgUpload = await lighthouse.uploadBuffer(
  Buffer.from(JSON.stringify(kgData)),
  apiKey
);

// Metrics Upload
const metricsUpload = await lighthouse.uploadBuffer(
  Buffer.from(JSON.stringify(metricsData)),
  apiKey
);

// Return IPFS hashes
return {
  kgHash: kgUpload.data.Hash,
  metricsHash: metricsUpload.data.Hash
};
```

#### **Data Retrieval**
- **Gateway Access**: `https://gateway.lighthouse.storage/ipfs/{hash}`
- **Direct IPFS**: `ipfs://{hash}` (requires IPFS node)
- **Caching**: Lighthouse provides CDN-like performance
- **Availability**: 99.9% uptime with global distribution

### Data Structure Examples

#### **Knowledge Graph Data**
```json
{
  "success": true,
  "entry_type": "comprehensive_test_run",
  "entry": {
    "conversations": [
      {
        "conversation_id": "test_run_224d45d6-f619-4572-ab9a-a3f4ac6735ac_trading_knowledge_seeker",
        "personality_name": "Trading Knowledge Seeker",
        "messages": [
          {
            "role": "user",
            "content": "Hey there! Could you first check your wallet balance on Base Sepolia? I'm curious to see what funds you're working with for some testnet DeFi fun.",
            "timestamp": "2025-10-25T11:30:38.921Z",
            "personality": "Trading Knowledge Seeker"
          },
          {
            "role": "agent",
            "content": "I had a balance of 0 ETH, but I have just requested funds from the faucet and successfully received some ETH. \n\nTransaction hash for the faucet request: **0x6fc1d8b89cfcd56940ed0f4e2d1c569ce6fea0c235ea89d722ba8eda646af095**.\n\nNow we can proceed with your DeFi fun! What's next?",
            "timestamp": "2025-10-25T11:30:45.493Z"
          },
          {
            "role": "agent",
            "content": "[Transaction Analysis for 0x6fc1d8b89cfcd56940ed0f4e2d1c569ce6fea0c235ea89d722ba8eda646af095]",
            "timestamp": "2025-10-25T06:01:08.966Z",
            "transaction_analysis": {
              "transaction_hash": "0x6fc1d8b89cfcd56940ed0f4e2d1c569ce6fea0c235ea89d722ba8eda646af095",
              "chain": "84532",
              "analysis": "Hey! So I see you were checking out my transaction after I grabbed some testnet ETH from the faucet—nice proactive move! 😊 Let's break down exactly what happened, why it matters for your DeFi exploration, and what you might want to do next...",
              "timestamp": "2025-10-25T11:31:08.966022"
            }
          }
        ],
        "transactions": [
          {
            "transaction_hash": "0x6fc1d8b89cfcd56940ed0f4e2d1c569ce6fea0c235ea89d722ba8eda646af095",
            "chain_id": "84532",
            "analysis": "Hey! So I see you were checking out my transaction after I grabbed some testnet ETH from the faucet—nice proactive move! 😊 Let's break down exactly what happened, why it matters for your DeFi exploration, and what you might want to do next...",
            "timestamp": "2025-10-25T11:31:08.966022",
            "raw_data": {
              "data": {
                "from": "0x6Cd01c0F55ce9E0Bf78f5E90f72b4345b16d515d",
                "to": "0x3e4ed2D6d6235f9D26707fd5d5AF476fb9C91B0F",
                "token_transfers": [],
                "decoded_input": {
                  "method_call": "claim(address receiver, uint256 amount)",
                  "method_id": "aad3ec96",
                  "parameters": [
                    {
                      "name": "receiver",
                      "type": "address",
                      "value": "0xBCB036545043db8ED2E5EE9f78b8d05EDb7A9290"
                    },
                    {
                      "name": "amount",
                      "type": "uint256",
                      "value": "100000000000000"
                    }
                  ]
                },
                "gas_used": "117000",
                "status": "ok",
                "fee": {
                  "type": "actual",
                  "value": "117009126092"
                }
              }
            },
            "success": true
          }
        ],
        "timestamp": "2025-10-25T11:32:13.808117"
      }
    ],
    "transactions": [
      {
        "transaction_hash": "0x6fc1d8b89cfcd56940ed0f4e2d1c569ce6fea0c235ea89d722ba8eda646af095",
        "chain_id": "84532",
        "analysis": "Hey! So I see you were checking out my transaction after I grabbed some testnet ETH from the faucet—nice proactive move! 😊 Let's break down exactly what happened, why it matters for your DeFi exploration, and what you might want to do next...",
        "timestamp": "2025-10-25T11:31:08.966022",
        "raw_data": { /* Complete BlockScout transaction data */ },
        "success": true
      }
    ],
    "total_conversations": 3,
    "total_transactions": 4,
    "personalities": [
      "Trading Knowledge Seeker",
      "DeFi Feature Explorer", 
      "Budget-Conscious Yield Enthusiast"
    ],
    "test_run_timestamp": "2025-10-25T11:32:13.808098",
    "test_run_id": "test_run_224d45d6-f619-4572-ab9a-a3f4ac6735ac"
  },
  "timestamp": "2025-10-25T11:32:13.808098",
  "message": "Retrieved comprehensive test run data with 3 conversations from 3 personalities and 4 transactions. Raw data fetched for 4/4 transactions."
}
```

#### **Metrics Data**
```json
{
  "success": true,
  "conversation_id": "0d6c7bca-f56c-4cee-a359-c0887cdbfaf6",
  "metrics": {
    "test_id": "0d6c7bca-f56c-4cee-a359-c0887cdbfaf6",
    "personality_name": "DeFi Efficiency Tester",
    "network": "Base Sepolia",
    "timestamp": "2025-10-20T11:48:21.820876+00:00",
    "metrics": {
      "capability": {
        "action_success_rate": 100,
        "action_type_coverage": ["faucet", "balance_check", "wrap"],
        "contract_interaction_accuracy": 100,
        "state_verification_accuracy": 100,
        "adaptive_error_recovery": 100,
        "network_handling_score": 100
      },
      "efficiency": {
        "avg_execution_latency_ms": 6920.5,
        "avg_gas_used": 117007.5,
        "gas_efficiency_percent": 17.95,
        "cost_per_successful_action_eth": 0.000117,
        "transaction_consistency_percent": 99.99,
        "failure_rate_percent": 0
      },
      "reliability": {
        "recovery_rate_percent": 100,
        "tool_reliability_percent": 100,
        "execution_determinism_percent": 88,
        "network_adaptability_score": 100
      },
      "interaction": {
        "response_latency_ms": 6920.5,
        "instruction_compliance_percent": 100,
        "transparency_score_percent": 100,
        "personality_adherence_percent": 100,
        "proactive_initiative_count": 1,
        "conversation_stability_score": 97
      },
      "defi_reasoning": {
        "defi_action_success_rate": 33.33,
        "protocol_selection_accuracy": 60,
        "approval_safety_score": 100,
        "sequencing_logic_accuracy": 70,
        "slippage_awareness": 50
      },
      "aggregate_scores": {
        "capability_score": 100,
        "efficiency_score": 72.65,
        "reliability_score": 96,
        "interaction_score": 100,
        "defi_reasoning_score": 67.78,
        "final_performance_index": 90.51
      }
    },
    "summary": {
      "overall_score": 90.51,
      "execution_reliability": "Exceptional",
      "transaction_efficiency": "Highly optimized",
      "response_behavior": "Highly responsive and transparent",
      "defi_competence": "Moderate DeFi capabilities",
      "general_assessment": "Performs well for faucet, balance_check, wrap; needs better handling of advanced DeFi tasks."
    },
    "improvement_areas": [
      {
        "area": "DeFi Action Success",
        "scope": "DeFi action success rate is low at 33.33% despite successful base operations",
        "suggestion": "Implement better balance validation before DeFi operations and add pre-flight checks for transaction feasibility",
        "priority": "CRITICAL"
      },
      {
        "area": "Execution Determinism",
        "scope": "Execution determinism score is 88%, indicating occasional inconsistent behavior",
        "suggestion": "Add state verification checks before each operation and implement idempotent transaction handling",
        "priority": "HIGH"
      }
    ]
  },
  "timestamp": "2025-10-20T11:48:28.786468+00:00",
  "agent_address": "agent1qvx8fqtw9jp48pl3c22h7dzgeu78ksp3vnuk748lep3m6hjc3tt3g0wdfya"
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional context"
}
```


