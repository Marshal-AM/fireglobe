# fireGlobe

A comprehensive testing framework for On-Chain agents that evaluates DeFi capabilities using AI-generated personalities, real-time transaction analysis, and comprehensive performance metrics.

## How to use?

### 1. Use our pre-existing CDP AgentKit example

**Step 1:** Sign up at [fireglobe.vercel.app](https://fireglobe.vercel.app) and copy your access token.

**Step 2:** Navigate to the AgentKit example and install dependencies:
```bash
cd agentkit/typescript/examples/langchain-cdp-chatbot && pnpm install
```

**Step 3:** Fill up the environment variables with your credentials. Use the `.env` file in the `langchain-cdp-chatbot` folder as reference:

```bash
# Required API Keys
OPENAI_API_KEY=your_openai_api_key
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret

# FireGlobe Access Token (from step 1)
ACCESS_TOKEN=your_access_token_from_fireglobe
```

**Step 4:** Run the agent script and select test mode:
```bash
npx ts-node chatbot-with-testing.ts
```
When prompted, choose option `3` or `test` for automated testing mode.

**Step 5:** After the test run completes, view your detailed results at [fireglobe.vercel.app](https://fireglobe.vercel.app)

### 2. Integrate fireGlobe in your own code

To integrate fireGlobe testing into your own CDP AgentKit agent:

**Step 1:** Install the fireGlobe SDK:
```bash
npm install fireglobe-sdk-client
```

**Step 2:** Import the required components:
```typescript
import { AgentTester, CDPAgentKitAdapter } from "fireglobe-sdk-client";
```

**Step 3:** Wrap your existing AgentKit agent with the adapter:
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
```

**Step 5:** View run results at [fireglobe.vercel.app](https://fireglobe.vercel.app).

## What fireGlobe Tests

fireGlobe evaluates your CDP AgentKit agent across multiple dimensions:

- **DeFi Capabilities**: Token transfers, swaps, approvals, contract deployments
- **Tool Usage**: Balance checks, transaction execution, error handling
- **Conversation Quality**: Response relevance, transparency, personality adherence
- **Technical Accuracy**: Gas efficiency, transaction sequencing, protocol selection
- **Error Recovery**: Handling failures, providing alternatives

## Features

- 🤖 **AI-Generated Personalities**: 5-10 unique test personalities tailored to your agent
- 🔍 **Real-Time Transaction Analysis**: Automatic detection and analysis of blockchain transactions
- 📊 **Comprehensive Metrics**: Detailed performance evaluation across multiple criteria
- 💾 **Persistent Storage**: Results stored in IPFS and Supabase for long-term access
- 🎁 **Rewards**: Earn FGC tokens for completed test runs
- 📈 **Real-Time Monitoring**: Live progress updates and conversation logging

## Architecture

fireGlobe consists of several interconnected components:

- **SDK Client**: TypeScript library for agent integration
- **Backend Agent**: Python uAgents service for AI-powered testing
- **Database Server**: Node.js service for data storage and IPFS uploads
- **Metrics Generator**: Python service for comprehensive performance analysis
- **BlockscoutAgent**: Transaction analysis agent using BlockScout MCP

