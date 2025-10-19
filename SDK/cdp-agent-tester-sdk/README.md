# CDP AgentKit Agent Tester SDK

> Universal testing framework for CDP AgentKit agents using AI-generated personalities

## 🌟 Features

- **Universal Agent Interface**: Test ANY agent regardless of framework (LangChain, OpenAI SDK, Custom, etc.)
- **AI-Powered Personalities**: Generate 10 unique test personalities tailored to your agent
- **Automated Conversations**: Each personality engages in natural conversations with your agent
- **AI Evaluation**: Python backend evaluates agent performance using advanced AI
- **Real-Time Logging**: Watch conversations unfold in real-time
- **Comprehensive Reports**: Get detailed HTML and JSON reports
- **Framework Agnostic**: Works with any agent that implements the simple interface

## 📦 Installation

```bash
npm install @cdp-agentkit/agent-tester
```

## 🚀 Quick Start

### 1. Backend (No Setup Required!)

**The SDK uses a hosted backend by default!**

✅ **Backend URL:** `https://backend-739298578243.us-central1.run.app`  
✅ **No Python installation needed**  
✅ **No API keys required**  
✅ **Just install and use!**

For advanced users who want to self-host, see [Self-Hosting Guide](#self-hosting-optional)

### 2. Install the SDK

```bash
npm install @cdp-agentkit/agent-tester
```

### 3. Implement the Universal Agent Interface

Any agent must implement the `IUniversalAgent` interface:

```typescript
import { IUniversalAgent } from "@cdp-agentkit/agent-tester";

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

### 4. Run Tests

```typescript
import { AgentTester } from "@cdp-agentkit/agent-tester";

const tester = new AgentTester({
  accessToken: process.env.ACCESS_TOKEN!, // REQUIRED: Get from db-server
  agentDescription: "A DeFi agent that helps users with lending and borrowing",
  // backendUrl is optional - uses hosted backend by default
  // backendUrl: "https://backend-739298578243.us-central1.run.app"
});

// Add event listeners for real-time updates
tester.on((event) => {
  console.log(event);
});

// Run tests
const results = await tester.runTests(myAgent);

console.log(`Overall Score: ${results.overallScore}/100`);
```

## 🎯 For CDP AgentKit Users

We provide a ready-made adapter for CDP AgentKit agents:

```typescript
import { AgentTester, CDPAgentKitAdapter } from "@cdp-agentkit/agent-tester";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

// Your existing CDP AgentKit setup
const agent = createReactAgent({ llm, tools, checkpointSaver: memory });
const config = { configurable: { thread_id: "test" } };

// Wrap with adapter
const adapter = new CDPAgentKitAdapter({
  agent,
  config,
  metadata: {
    name: "My CDP Agent",
    description: "DeFi operations on Base",
    version: "1.0.0"
  }
});

// Run tests
const tester = new AgentTester({
  agentDescription: "A DeFi agent built with CDP AgentKit",
  // ... other config
});

const results = await tester.runTests(adapter);
```

## 📚 Complete Example

See `agentkit/typescript/examples/langchain-cdp-chatbot/chatbot-with-testing.ts` for a complete implementation.

## 🔧 API Reference

### `AgentTester`

Main class for orchestrating tests.

#### Constructor Options

```typescript
interface TestConfig {
  agentDescription: string;           // Description of your agent
  maxMessagesPerConversation?: number; // Default: 10
  backendUrl?: string;                 // Default: "http://localhost:8000"
  saveConversations?: boolean;         // Default: true
  conversationOutputPath?: string;     // Default: "./conversations"
  realTimeLogging?: boolean;           // Default: true
}
```

#### Methods

- `runTests(agent: IUniversalAgent): Promise<TestResults>` - Run complete test suite
- `on(listener: EventListener): void` - Add event listener for real-time updates

### `IUniversalAgent` Interface

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

### `CDPAgentKitAdapter`

Adapter for LangChain-based CDP AgentKit agents.

```typescript
const adapter = new CDPAgentKitAdapter({
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

## 📊 Events

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

## 🎨 Output Formats

### JSON Results

Saved to: `./test-results/test_results_TIMESTAMP.json`

Contains complete test data including all conversations and evaluations.

### HTML Report

Beautiful, interactive HTML report with:
- Overall score and summary
- All conversations with each personality
- Individual evaluation scores
- Strengths and weaknesses analysis
- Color-coded messages

### Real-Time Logs

Each conversation is logged in real-time to:
`./test-results/conversation_ID.jsonl`

## 🛠️ Backend API

The Python backend exposes these endpoints:

- `POST /generate-personalities` - Generate 10 personalities
- `POST /evaluate-conversation` - Evaluate a conversation
- `POST /store-conversation` - Store conversation data
- `GET /health` - Health check

## 🔐 Environment Variables

### SDK (TypeScript)
```bash
# Optional - override default backend URL
TEST_BACKEND_URL=http://localhost:8000
```

### Backend (Python)
```bash
# Required
ASI_ONE_API_KEY=your_asi_one_api_key
```

## 🏠 Self-Hosting (Optional)

The SDK uses a hosted backend by default, but you can self-host if needed:

### Backend URL Configuration

```typescript
// Option 1: Pass custom URL
const tester = new AgentTester({
  agentDescription: "My agent",
  backendUrl: "http://localhost:8000" // Your self-hosted backend
});

// Option 2: Environment variable
// Set: CDP_TESTER_BACKEND_URL=http://localhost:8000
const tester = new AgentTester({
  agentDescription: "My agent"
  // Will use environment variable if set
});
```

### Self-Host the Backend

1. Clone repository
2. Navigate to `PersonalityGenerator/backend/`
3. Install: `pip install -r requirements.txt`
4. Set: `export ASI_ONE_API_KEY=your_key`
5. Run: `python server.py`

See full backend documentation in the repository.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Hosted Backend**: https://backend-739298578243.us-central1.run.app
- **Documentation**: See README and guides in repository

