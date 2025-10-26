# fireGlobe

A comprehensive testing framework for on-chain agents that evaluates DeFi capabilities using AI-generated personalities, real-time transaction analysis, and comprehensive performance metrics.

## 🏗️ How the SDK Works

### Core Architecture

fireGlobe is built on a distributed architecture with multiple specialized components working together to provide comprehensive agent testing:

#### 1. **SDK Client** (`/SDK/cdp-agent-tester-sdk/`)
- **TypeScript library** that provides the main interface for agent integration
- Implements the `IUniversalAgent` interface for framework-agnostic testing
- Handles real-time conversation orchestration and event emission
- Manages transaction detection and analysis requests
- Provides adapters for popular agent frameworks (currently CDP AgentKit)

#### 2. **Backend Agent** (`/SDK/backend/server.py`)
- **ASI uAgents service** powered by ASI:One AI
- Generates 5-10 unique test personalities tailored to agent capabilities
- Creates context-aware conversation messages using conversation history
- Evaluates agent performance across multiple criteria using AI analysis
- Manages Knowledge Graph storage using MeTTa for conversation and transaction data
- Implements A2A (Agent-to-Agent) communication with BlockscoutAgent

#### 3. **BlockscoutAgent** (`/SDK/BlockscoutAgent/main.py`)
- **Specialized transaction analysis agent** using BlockScout MCP
- Fetches detailed transaction data from multiple blockchain networks
- Provides AI-powered transaction analysis using ASI:One
- Creates conversation-aware analysis that considers user personality and context
- Supports Base Sepolia, Ethereum, Polygon, Arbitrum, and Optimism networks

#### 4. **Database Server** (`/SDK/db-server/server.js`)
- **Node.js service** for data persistence and IPFS integration
- Validates user access tokens and manages user sessions
- Uploads Knowledge Graph and metrics data to Lighthouse IPFS
- Stores test run metadata in Supabase database
- Implements FGC token rewards system for completed test runs

#### 5. **Metrics Generator** (`/SDK/metricsgen/agent.py`)
- **Python service** for comprehensive performance analysis
- Calculates capability, efficiency, reliability, interaction, and DeFi reasoning metrics
- Generates AI-powered improvement recommendations
- Provides detailed performance insights and scoring

### Communication Flow

```
Agent Code → SDK Client → Backend Agent → BlockscoutAgent → BlockScout MCP
     ↓              ↓           ↓              ↓
Event Listeners → Real-time → Knowledge → Transaction
     ↓              ↓           ↓         Analysis
Local Storage ← Results ← Graph Storage ← AI Analysis
     ↓
Database Server → IPFS → Supabase → User Dashboard
```

## 🔧 Backend Implementation Details

### ASI:One AI Integration

The backend leverages ASI:One AI for multiple critical functions:

#### **Personality Generation**
```python
# Generates tailored test personalities based on agent capabilities
prompt = f"""Generate {num_personalities} personalities that will test:
- Agent Description: {agent_description}
- Agent Capabilities: {agent_capabilities}
- Focus: Base Sepolia testnet operations with existing funds
- Each personality must make EXACTLY ONE tool call"""
```

#### **Message Generation**
```python
# Creates context-aware conversation messages
def generate_personality_message(personality, conversation_history, is_initial):
    if is_initial:
        # Generate opening message based on personality traits
    else:
        # Generate follow-up considering full conversation context
```

#### **Performance Evaluation**
```python
# Evaluates agent performance across multiple criteria
evaluation_criteria = {
    "toolUsage": "Did the agent make tool calls?",
    "balanceAwareness": "Did the agent check balance?",
    "defiCapability": "Did the agent demonstrate DeFi knowledge?",
    "responsiveness": "Did the agent respond appropriately?",
    "baseSepoliaFocus": "Did the agent focus on Base Sepolia?"
}
```

### BlockScout Agent Integration

The BlockscoutAgent provides comprehensive transaction analysis:

#### **Transaction Data Fetching**
```python
# Uses BlockScout MCP with SSE streaming for real-time data
async def get_transaction(self, tx_hash: str, chain_id: str):
    result = await self.call_tool("get_transaction_info", {
        "chain_id": str(chain_id),
        "transaction_hash": tx_hash,
        "include_raw_input": False
    })
```

#### **AI-Powered Analysis**
```python
# Creates conversation-aware transaction analysis
async def _create_conversation_aware_analysis(self, conversation_messages, 
                                            personality_name, tx_hash, tx_data):
    analysis_prompt = f"""
    Analyze this transaction in context of:
    - User Personality: {personality_name}
    - Conversation: {conversation_text}
    - Transaction Data: {tx_data}
    
    Provide insights tailored to their goals and personality.
    """
```

## 💾 Database Server & Lighthouse Integration

### IPFS Storage Architecture

The database server implements a sophisticated storage system:

#### **Knowledge Graph Upload**
```javascript
// Fetches conversation data from backend Knowledge Graph
const kgUrl = `${BACKEND_URL}/rest/kg/last-entry`;
const kgData = await axios.get(kgUrl);

// Uploads to Lighthouse IPFS
const lighthouseResult = await uploadToLighthouse(kgData, `kg_${userId}_${timestamp}`);
```

#### **Metrics Storage**
```javascript
// Fetches comprehensive metrics from Metrics Generator
const metricsUrl = `${METRICS_URL}/metrics/last`;
const metricsData = await axios.get(metricsUrl);

// Stores both datasets in Supabase with IPFS references
const testRun = await storeTestRun(userId, kgHash, metricsHash);
```

### FGC Token Rewards System

The system automatically rewards users for completed test runs:

```javascript
// Mints FGC tokens to user's wallet address
async function mintFgcToAddress(recipientAddress, humanAmount = '1') {
  const hash = await walletClient.writeContract({
    address: DATACOIN_ADDRESS,
    abi: DataCoinAbi,
    functionName: 'mint',
    args: [recipientAddress, amount]
  });
}
```

## 🚀 How to Use

To integrate fireGlobe testing into your own agent:

**Step 1:** Install the fireGlobe SDK:
```bash
npm install fireglobe-sdk-client
```

**Step 2:** Import the required components:
```typescript
import { AgentTester, CDPAgentKitAdapter } from "fireglobe-sdk-client";
```

**Step 3:** Wrap your existing agent with the adapter:
```typescript
const adapter = new CDPAgentKitAdapter({
  agent: yourAgentKitAgent,
  config: yourAgentConfig,
  metadata: {
    name: "Your Agent Name",
    description: "Description of your agent's capabilities",
    version: "1.0.0"
  }
});
```

**Step 4:** Configure and run the tester:
```typescript
const tester = new AgentTester({
  agentDescription: "Your agent description",
  agentCapabilities: "List of what your agent can do",
  accessToken: process.env.ACCESS_TOKEN!, // Required
  numPersonalities: 5, // Number of test personalities
  maxMessagesPerConversation: 10,
  saveConversations: true,
  realTimeLogging: true
});

// Add event listeners for real-time updates
tester.on((event) => {
  console.log(event);
});

// Run tests
const results = await tester.runTests(adapter);
console.log(`Overall Score: ${results.overallScore}/100`);
```

**Step 5:** View results at [fireglobe.vercel.app](https://fireglobe.vercel.app) using your access token.

## 🗺️ What's Next / Roadmap

### Upcoming Features

- **Expanded Agent Framework Support**: We're actively developing adapters for popular agent frameworks including:
  - **OpenAI Agents SDK** - Direct integration with OpenAI's agent framework
  - **LangChain Agents** - Enhanced support for various LangChain agent types
  - **AutoGen** - Multi-agent conversation testing
  - **CrewAI** - Collaborative agent testing
  - **Custom Framework Adapters** - Easy integration for any agent framework

- **Enhanced Testing Capabilities**:
  - Multi-agent conversation testing
  - Cross-chain transaction analysis
  - Advanced DeFi protocol testing
  - Performance benchmarking across different networks

- **Developer Experience Improvements**:
  - Visual test result dashboard
  - CI/CD integration tools
  - Automated regression testing
  - Performance monitoring and alerting

### Vision

Our goal is to become the **standard for on-chain agent testing**, providing comprehensive evaluation tools that work across all major agent frameworks. We believe that robust testing is essential for the future of autonomous on-chain agents.

### Adapter Contributions Welcome

We encourage the community to contribute adapters for their favorite agent frameworks! See our [CONTRIBUTING.md](https://github.com/Marshal-AM/fireglobe/blob/main/SDK/fireglobe-sdk-client/CONTRIBUTING.md) for guidelines on how to contribute.

## 🤝 Contributing

We welcome contributions to fireGlobe! Here's how you can help:

### Types of Contributions

1. **Agent Framework Adapters**: Create adapters for new agent frameworks
2. **Testing Improvements**: Enhance testing capabilities and metrics
3. **Documentation**: Improve guides, examples, and API documentation
4. **Bug Fixes**: Report and fix issues
5. **Feature Requests**: Suggest new features and improvements

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Marshal-AM/fireglobe.git
   cd fireglobe
   ```

2. **Install dependencies**:
   ```bash
   # SDK
   cd SDK/firegllobe-sdk-client
   npm install
   
   # Backend
   cd ../backend
   pip install -r requirements.txt
   
   # Database Server
   cd ../db-server
   npm install
   ```

3. **Set up environment variables** (see individual component READMEs)

4. **Run tests**:
   ```bash
   # SDK tests
   cd SDK/fireglobe-sdk-client
   npm test
   
   # Backend tests
   cd ../backend
   python test.py
   ```

### Creating an Agent Framework Adapter

To create an adapter for a new agent framework:

1. **Study existing adapters** in `/SDK/fireglobe-sdk-client/src/adapters/`
2. **Implement the `IUniversalAgent` interface**:
   ```typescript
   export class YourFrameworkAdapter implements IUniversalAgent {
     async sendMessage(message: string): Promise<string> {
       // Your framework's message handling
     }
     
     async reset(): Promise<void> {
       // Reset conversation state
     }
     
     getMetadata?() {
       return {
         name: "Your Agent",
         description: "Agent description",
         framework: "YourFramework",
         version: "1.0.0"
       };
     }
   }
   ```
3. **Add tests** for your adapter
4. **Update documentation** with usage examples
5. **Submit a Pull Request**

### Code Style

- **TypeScript**: Use strict typing and follow ESLint rules
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use Prettier for formatting
- **Documentation**: Update README files and add JSDoc comments

### Questions?

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and community discussions
- **Discord**: Join our community server (link coming soon)

## 📞 Support

- **Documentation**: [fireglobe.vercel.app](https://fireglobe.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/Marshal-AM/fireglobe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Marshal-AM/fireglobe/discussions)