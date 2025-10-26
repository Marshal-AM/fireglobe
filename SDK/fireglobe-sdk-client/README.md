# FireGlobe Agent Testing SDK

Universal testing framework for blockchain agents using AI-generated personalities

## Overview

FireGlobe SDK is a comprehensive testing framework designed to rigorously evaluate AI agents using diverse AI-generated personas powered by ASI:One. The framework generates multiple distinct test personalities that simulate realistic user behaviors and edge cases, providing thorough testing beyond traditional evaluation methods.

## Features

- **Universal Agent Interface**: Test any agent regardless of framework (LangChain, OpenAI SDK, Custom, etc.)
- **AI-Powered Personalities**: Generate unique test personalities tailored to your agent
- **Automated Conversations**: Each personality engages in natural conversations with your agent
- **AI Evaluation**: Advanced AI evaluation using ASI:One for comprehensive performance assessment
- **Real-Time Logging**: Watch conversations unfold in real-time
- **Comprehensive Reports**: Get detailed HTML and JSON reports
- **Framework Agnostic**: Works with any agent that implements the simple interface
- **Blockchain Transaction Analysis**: Integrates with BlockScout MCP for transaction analysis

## Installation

```bash
npm install fireglobe-sdk-client
```

## Quick Start

### 1. Install the SDK

```bash
npm install fireglobe-sdk-client
```

### 2. Implement the Universal Agent Interface

Any agent must implement the `IUniversalAgent` interface:

```typescript
import { IUniversalAgent } from "fireglobe-sdk-client";

class MyAgent implements IUniversalAgent {
  async sendMessage(message: string): Promise<string> {
    // Your agent logic here
    return "Agent response";
  }

  async reset(): Promise<void> {
    // Reset conversation state
  }

  getMetadata?() {
    return {
      name: "My Agent",
      description: "Description of what your agent does",
      framework: "YourFramework",
      version: "1.0.0"
    };
  }
}
```

### 3. Get Your Access Token

Sign up at [fireglobe.vercel.app](https://fireglobe.vercel.app) to get your access token and add it to your .env

### 4. Run Tests

```typescript
import { AgentTester } from "fireglobe-sdk-client";

const tester = new AgentTester({
  accessToken: process.env.ACCESS_TOKEN!, // Get from fireglobe.vercel.app
  agentDescription: "A DeFi agent that helps users with lending and borrowing"
});

// Add event listeners for real-time updates
tester.on((event) => {
  console.log(event);
});

// Run tests
const results = await tester.runTests(myAgent);

console.log(`Overall Score: ${results.overallScore}/100`);
```

## LangChain Integration

We provide a ready-made adapter for LangChain-based agents:

```typescript
import { AgentTester, LangChainAdapter } from "fireglobe-sdk-client";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

// Your existing LangChain setup
const agent = createReactAgent({ llm, tools, checkpointSaver: memory });
const config = { configurable: { thread_id: "test" } };

// Wrap with adapter
const adapter = new LangChainAdapter({
  agent,
  config,
  metadata: {
    name: "My FireGlobe Agent",
    description: "DeFi operations on Base",
    version: "1.0.0"
  }
});

// Run tests
const tester = new AgentTester({
  agentDescription: "A DeFi agent built with FireGlobe"
});

const results = await tester.runTests(adapter);
```

## API Reference

### AgentTester

Main class for orchestrating tests.

#### Constructor Options

```typescript
interface TestConfig {
  accessToken: string;                 
  agentDescription: string;           // Description of your agent
  maxMessagesPerConversation?: number; // Default: 10
  saveConversations?: boolean;         // Default: true
  conversationOutputPath?: string;     // Default: "./conversations"
  realTimeLogging?: boolean;           // Default: true
}
```

#### Methods

- `runTests(agent: IUniversalAgent): Promise<TestResults>` - Run complete test suite
- `on(listener: EventListener): void` - Add event listener for real-time updates

### IUniversalAgent Interface

```typescript
interface IUniversalAgent {
  sendMessage(message: string): Promise<string>;
  reset(): Promise<void>;
  getMetadata?(): {
    name: string;
    description: string;
    framework: string;
    version: string;
  };
  cleanup?(): Promise<void>;
}
```

### LangChainAdapter

Adapter for LangChain-based agents.

```typescript
const adapter = new LangChainAdapter({
  agent: langchainAgent,
  config: agentConfig,
  metadata: { /* ... */ }
});
```

### Test Results

```typescript
interface TestResults {
  testId: string;
  agentDescription: string;
  personalities: Personality[];
  conversations: Conversation[];
  evaluations: EvaluationResult[];
  startTime: Date;
  endTime: Date;
  overallScore: number;  // 0-100
  summary: {
    totalConversations: number;
    successfulConversations: number;
    failedConversations: number;
    averageScore: number;
    topStrengths: string[];
    topWeaknesses: string[];
  };
}
```

## Events

The SDK emits real-time events during testing:

```typescript
type TestEvent =
  | { type: "test_started"; testId: string; timestamp: Date }
  | { type: "personalities_generated"; count: number; personalities: Personality[] }
  | { type: "conversation_started"; conversationId: string; personalityName: string }
  | { type: "message_sent"; conversationId: string; role: "user" | "agent"; content: string }
  | { type: "conversation_completed"; conversationId: string }
  | { type: "evaluation_completed"; conversationId: string; score: number }
  | { type: "test_completed"; results: TestResults }
  | { type: "error"; error: string; context?: string };
```

## Output Formats

### JSON Results

Saved to: `./test-results/test_results_TIMESTAMP.json`

Contains complete test data including all conversations and evaluations.

### HTML Report

Interactive HTML report with:
- Overall score and summary
- All conversations with each personality
- Individual evaluation scores
- Strengths and weaknesses analysis
- Color-coded messages

### Real-Time Logs

Each conversation is logged in real-time to:
`./test-results/conversation_ID.jsonl`

## How ASI:One is Used

ASI:One (Artificial Superintelligence Alliance) serves as the core AI reasoning engine that powers FireGlobe's intelligent testing capabilities:

### Personality Generation
ASI:One generates diverse, contextually appropriate test personas that challenge agents with realistic DeFi scenarios. Each personality is tailored to test specific aspects of your agent's capabilities:

- **Trading Knowledge Seekers**: Test market analysis and trading strategy capabilities
- **Risk-Averse Users**: Evaluate safety measures and conservative approaches
- **DeFi Enthusiasts**: Test advanced protocol interactions and complex operations
- **Novice Users**: Assess educational capabilities and user guidance

### Conversation Evaluation
ASI:One provides sophisticated evaluation of agent performance across multiple dimensions:

- **Tool Usage Assessment**: Evaluates how effectively agents use their available tools
- **DeFi Capability Analysis**: Assesses knowledge of blockchain and DeFi protocols
- **Response Quality**: Measures relevance, accuracy, and helpfulness of responses
- **Context Awareness**: Evaluates how well agents understand conversation context

### AI-Powered Insights
The system generates comprehensive insights including:

- **Strengths Identification**: Highlights areas where your agent excels
- **Weakness Analysis**: Identifies specific areas for improvement
- **Performance Scoring**: Provides detailed scoring across multiple criteria
- **Recommendations**: Offers actionable suggestions for enhancement

### Integration Architecture
ASI:One integrates seamlessly through the FireGlobe backend:

```typescript
// The SDK automatically handles ASI:One integration
const tester = new AgentTester({
  accessToken: process.env.ACCESS_TOKEN!,
  agentDescription: "Your agent description"
});

// ASI:One powers personality generation and evaluation behind the scenes
const results = await tester.runTests(myAgent);
```

## How BlockScout is Used

BlockScout MCP (Model Context Protocol) provides comprehensive blockchain transaction analysis capabilities:

### Transaction Data Retrieval
BlockScout MCP enables real-time access to detailed blockchain transaction data:

- **Multi-Chain Support**: Access data across Ethereum, Base, Optimism, Arbitrum, Polygon, and other networks
- **Comprehensive Transaction Details**: Gas usage, contract interactions, token transfers, and execution traces
- **Real-Time Processing**: Immediate analysis of transactions as they occur on-chain
- **Historical Data Access**: Retrieval of past transaction data for analysis and comparison

### Transaction Analysis Features
When your agent performs blockchain operations, BlockScout provides:

- **Gas Analysis**: Detailed gas usage patterns and efficiency recommendations
- **Contract Interaction Analysis**: Explains smart contract calls and their purposes
- **Token Transfer Detection**: Identifies and explains token movements
- **Risk Assessment**: Evaluates potential security concerns or anomalies
- **Transaction Classification**: Identifies transaction types (transfers, swaps, approvals, etc.)

### AI-Enhanced Analysis
BlockScout data is processed through ASI:One to provide intelligent insights:

- **Context-Aware Analysis**: Links transaction analysis to conversation context
- **Personality-Based Insights**: Tailors analysis to user personality and goals
- **Educational Content**: Provides learning opportunities about blockchain concepts
- **Actionable Recommendations**: Offers specific suggestions for optimization

### Integration Flow
The BlockScout integration works automatically when your agent performs blockchain operations:

```typescript
// When your agent executes a blockchain transaction
const response = await myAgent.sendMessage("Transfer 0.1 ETH to 0x...");

// BlockScout automatically analyzes the transaction
// Analysis is included in the test results
const results = await tester.runTests(myAgent);
console.log(results.transactionAnalyses); // BlockScout analysis results
```

### Supported Networks
BlockScout MCP provides comprehensive coverage across major blockchain networks:

- **Ethereum Mainnet (Chain ID: 1)**: Primary Ethereum network
- **Base Mainnet (Chain ID: 8453)**: Coinbase's Layer 2 solution
- **Base Sepolia (Chain ID: 84532)**: Base testnet for development
- **Optimism (Chain ID: 10)**: Optimistic rollup solution
- **Arbitrum (Chain ID: 42161)**: Arbitrum Layer 2 solution
- **Polygon (Chain ID: 137)**: Polygon network

## Technical Documentation

For detailed technical implementation documentation:

- **ASI:One Integration**: [ASI Integration Documentation](https://github.com/Marshal-AM/fireglobe/blob/main/SDK/backend/ASI_INTEGRATION_README.md)
- **BlockScout MCP Integration**: [BlockScout Documentation](https://github.com/Marshal-AM/fireglobe/blob/main/SDK/BlockscoutAgent/BlockScout.md)

## License

MIT

## Vision

Our goal is to become the standard for on-chain agent testing, providing comprehensive evaluation tools that work across all major agent frameworks. We believe that robust testing is essential for the future of autonomous on-chain agents.

## Adapter Contributions Welcome

We encourage the community to contribute adapters for their favorite agent frameworks! See our [CONTRIBUTING.md](https://github.com/Marshal-AM/fireglobe/blob/main/SDK/fireglobe-sdk-client/CONTRIBUTING.md) for guidelines on how to contribute.

## Contributing

We welcome contributions to FireGlobe! Here's how you can help:

### Types of Contributions

1. **Agent Framework Adapters**: Create adapters for new agent frameworks
2. **Testing Improvements**: Enhance testing capabilities and metrics
3. **Documentation**: Improve guides, examples, and API documentation
4. **Bug Fixes**: Report and fix issues
5. **Feature Requests**: Suggest new features and improvements

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Marshal-AM/fireglobe.git
   cd fireglobe
   ```

2. **Install dependencies**:
   ```bash
   # SDK
   cd SDK/cdp-agent-tester-sdk
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
   cd SDK/cdp-agent-tester-sdk
   npm test
   
   # Backend tests
   cd ../backend
   python test.py
   ```

### Creating an Agent Framework Adapter

To create an adapter for a new agent framework:

1. **Study existing adapters** in `/SDK/cdp-agent-tester-sdk/src/adapters/`
2. **Implement the IUniversalAgent interface**:
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

## Support

- **Documentation**: [fireglobe.vercel.app](https://fireglobe.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/Marshal-AM/fireglobe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Marshal-AM/fireglobe/discussions)

