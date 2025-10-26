# 🎯 CDP Agent Metrics Generator

A comprehensive metrics generation agent for CDP Agent testing that analyzes conversations, transactions, and evaluations from the Knowledge Graph to produce detailed performance metrics.

## 📋 Overview

This agent generates comprehensive performance metrics based on the specification in `metrics.md`, including:

- **Capability Metrics**: Action success rate, coverage, contract accuracy, state verification
- **Efficiency Metrics**: Execution latency, gas usage, cost per action, transaction consistency
- **Reliability Metrics**: Recovery rate, tool reliability, execution determinism
- **Interaction Metrics**: Response latency, compliance, transparency, personality adherence
- **DeFi Reasoning Metrics**: DeFi action success, protocol selection, approval safety
- **Aggregate Scores**: Overall performance index and category scores
- **Summary Insights**: Qualitative assessment and improvement recommendations

## 🏗️ Architecture

```
Agent Metrics Generator/
├── agent.py                 # Main agent with metrics generation logic
├── metrics/
│   ├── __init__.py         # Module initialization
│   ├── knowledge.py        # Knowledge Graph structure
│   ├── metricsrag.py       # RAG interface for data retrieval
│   └── utils.py            # LLM integration and helper functions
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker deployment configuration
├── env_template.txt        # Environment variables template
└── README.md               # This file
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd "SDK/Agent Metrics Generator"
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file based on `env_template.txt`:

```bash
# Copy template
cp env_template.txt .env

# Edit with your API keys
ASI_ONE_API_KEY=your_asi_one_api_key_here
AGENTVERSE_API_KEY=your_agentverse_api_key_here  # Optional
BACKEND_URL=https://backend-739298578243.us-central1.run.app
```

### 3. Run the Agent

```bash
python agent.py
```

The agent will start on port 8081 and be ready to generate metrics.

## 📡 API Endpoints

### Generate Metrics

**POST** `http://localhost:8081/metrics/generate`

Generate comprehensive metrics for a conversation.

**Request Body:**
```json
{
  "conversation_id": "optional-conversation-id"
}
```

If `conversation_id` is not provided, the agent will use the last conversation from the Knowledge Graph.

**Response:**
```json
{
  "success": true,
  "conversation_id": "abc-123-def",
  "metrics": {
    "test_id": "abc-123-def",
    "personality_name": "Swift Transfer Enthusiast",
    "network": "Base Sepolia",
    "timestamp": "2025-10-19T20:00:00Z",
    "metrics": {
      "capability": {...},
      "efficiency": {...},
      "reliability": {...},
      "interaction": {...},
      "defi_reasoning": {...},
      "aggregate_scores": {
        "capability_score": 91.5,
        "efficiency_score": 88.2,
        "reliability_score": 86.7,
        "interaction_score": 95.3,
        "defi_reasoning_score": 77.8,
        "final_performance_index": 88.5
      }
    },
    "summary": {...},
    "improvement_areas": [...]
  },
  "timestamp": "2025-10-19T20:00:00Z",
  "agent_address": "agent1q..."
}
```

### Get Last Metrics

**GET** `http://localhost:8081/metrics/last`

Retrieve the last generated metrics.

**Response:**
```json
{
  "success": true,
  "conversation_id": "abc-123-def",
  "metrics": {...},
  "timestamp": "2025-10-19T20:00:00Z",
  "agent_address": "agent1q..."
}
```

## 🧪 Usage Examples

### Generate Metrics for Last Test

```bash
curl -X POST http://localhost:8081/metrics/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Generate Metrics for Specific Conversation

```bash
curl -X POST http://localhost:8081/metrics/generate \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "abc-123-def-456"}'
```

### Get Last Generated Metrics

```bash
curl http://localhost:8081/metrics/last
```

## 📊 Metrics Explanation

### Capability Metrics
- **Action Success Rate**: Percentage of successful blockchain operations
- **Action Type Coverage**: Types of actions performed (transfer, swap, etc.)
- **Contract Interaction Accuracy**: Correctness of contract method calls
- **State Verification Accuracy**: How often reported balance matches on-chain
- **Adaptive Error Recovery**: How often agent retried or handled failed operations
- **Network Handling Score**: Correctness in adapting to network constraints

### Efficiency Metrics
- **Avg Execution Latency**: Time from intent to transaction confirmation
- **Avg Gas Used**: Mean gas units used per transaction
- **Gas Efficiency**: Relative to expected baseline for transaction type
- **Cost per Action**: Average ETH cost per confirmed transaction
- **Transaction Consistency**: Stability of gas and latency across transactions
- **Failure Rate**: Percentage of attempted actions that failed

### Reliability Metrics
- **Recovery Rate**: Percentage of failed operations successfully retried
- **Tool Reliability**: Percentage of external tool calls executed correctly
- **Execution Determinism**: Percentage of identical tasks producing consistent results
- **Network Adaptability**: Ability to continue when network limitations arise

### Interaction Metrics
- **Response Latency**: Average time from user message to agent response
- **Instruction Compliance**: Percentage of user requests correctly followed
- **Transparency Score**: Percentage of actions with tx hash or result summary
- **Personality Adherence**: Consistency in maintaining persona tone
- **Proactive Initiative Count**: Times agent offered helpful suggestions
- **Conversation Stability**: Ability to maintain coherent context

### DeFi Reasoning Metrics
- **DeFi Action Success Rate**: Percentage of DeFi-specific actions that succeeded
- **Protocol Selection Accuracy**: Correct DEX/protocol choice for task
- **Approval Safety Score**: Minimal necessary token spend approval
- **Sequencing Logic Accuracy**: Correct ordering of dependent steps
- **Slippage Awareness**: Proper slippage tolerance management

### Aggregate Scores
- **Capability Score**: Weighted average of capability metrics
- **Efficiency Score**: Weighted average of efficiency metrics
- **Reliability Score**: Weighted average of reliability metrics
- **Interaction Score**: Weighted average of interaction metrics
- **DeFi Reasoning Score**: Weighted average of DeFi metrics
- **Final Performance Index (FPI)**: Overall weighted performance score

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t cdp-agent-metrics-generator .
```

### Run Container

```bash
docker run -p 8081:8081 \
  -e ASI_ONE_API_KEY=your_key \
  -e BACKEND_URL=https://backend-739298578243.us-central1.run.app \
  cdp-agent-metrics-generator
```

## 🔧 Integration with Testing Flow

The metrics generator integrates with the CDP Agent testing flow:

1. **Test Execution**: Agent runs tests using personalities
2. **Data Storage**: Conversations and transactions stored in Knowledge Graph
3. **Metrics Generation**: This agent fetches data and generates metrics
4. **Display**: Metrics displayed in terminal with detailed breakdown
5. **Storage**: Metrics stored back in Knowledge Graph for historical analysis

## 🎯 Terminal Output

When metrics are generated, you'll see a beautiful terminal output with:

```
================================================================================
🎯 CDP AGENT PERFORMANCE METRICS
================================================================================

🆔 Test ID: abc-123-def
👤 Personality: Swift Transfer Enthusiast
🌐 Network: Base Sepolia
⏰ Generated: 2025-10-19T20:00:00Z

================================================================================
📊 AGGREGATE SCORES
================================================================================

  🎯 Final Performance Index (FPI): 88.5/100
  💪 Capability Score:               91.5/100
  ⚡ Efficiency Score:               88.2/100
  🛡️  Reliability Score:              86.7/100
  💬 Interaction Score:              95.3/100
  🏦 DeFi Reasoning Score:           77.8/100

[... detailed metrics for each category ...]

================================================================================
📝 SUMMARY & INSIGHTS
================================================================================

  🎯 Overall Score:        88.5/100
  🛡️  Execution Reliability: High
  ⚡ Transaction Efficiency: Above average
  💬 Response Behavior:     Highly responsive and transparent
  🏦 DeFi Competence:       Moderate DeFi capabilities

  📋 Assessment: Performs well for transfer, balance_check, faucet; 
                 demonstrates solid fundamentals with room for complex operations.

================================================================================
🔧 IMPROVEMENT AREAS
================================================================================

  1. DeFi Coverage
     Scope: Limited to basic operations; no complex DeFi interactions
     Suggestion: Add test scenarios for swaps, approvals, and multi-step DeFi

[... more improvement suggestions ...]
```

## 🧠 Technology Stack

- **uAgents Framework**: Agent infrastructure
- **MeTTa (Hyperon)**: Knowledge Graph for metrics storage
- **ASI:One API**: LLM for advanced analysis
- **Python 3.12**: Core runtime
- **Docker**: Containerization

## 📝 Notes

- The agent uses the same Knowledge Graph structure as the backend
- Metrics are calculated using both rule-based logic and LLM analysis
- All metrics follow the specification in `metrics.md`
- Historical metrics are stored in local MeTTa KG for trend analysis

## 🤝 Contributing

When adding new metrics:
1. Add calculation function in `agent.py`
2. Update metric categories as needed
3. Update terminal display format
4. Document new metrics in this README

## 📄 License

Part of the CDP Agent Testing SDK

