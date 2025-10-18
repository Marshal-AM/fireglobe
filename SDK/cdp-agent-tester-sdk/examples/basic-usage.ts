/**
 * Basic usage example for CDP Agent Tester SDK
 */

import { AgentTester, IUniversalAgent } from "@cdp-agentkit/agent-tester";

// Example: Simple mock agent for demonstration
class MockAgent implements IUniversalAgent {
  private conversationContext: string[] = [];

  async sendMessage(message: string): Promise<string> {
    this.conversationContext.push(message);
    
    // Simple mock responses
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
      return "Hello! I'm a DeFi agent that can help you with blockchain operations. How can I assist you today?";
    }
    
    if (message.toLowerCase().includes("transfer") || message.toLowerCase().includes("send")) {
      return "I can help you transfer tokens. I support ETH, USDC, and other ERC-20 tokens on Base Sepolia. What would you like to transfer?";
    }
    
    if (message.toLowerCase().includes("security") || message.toLowerCase().includes("safe")) {
      return "Security is our top priority. All transactions are signed with your wallet, and we recommend starting with small amounts on testnet to familiarize yourself with the process.";
    }
    
    return "I understand your question about DeFi operations. I can help with transfers, token swaps, NFT minting, and more. What would you like to know?";
  }

  async reset(): Promise<void> {
    this.conversationContext = [];
  }

  getMetadata() {
    return {
      name: "Mock DeFi Agent",
      description: "A simple mock agent for testing",
      framework: "Custom",
      version: "1.0.0"
    };
  }
}

async function main() {
  console.log("🧪 CDP Agent Tester SDK - Basic Usage Example\n");

  // Create agent instance
  const agent = new MockAgent();

  // Configure tester
  const tester = new AgentTester({
    agentDescription: "A DeFi agent that helps users with token transfers and blockchain operations on Base Sepolia testnet.",
    maxMessagesPerConversation: 6,
    backendUrl: "http://localhost:8000",
    saveConversations: true,
    conversationOutputPath: "./example-results",
    realTimeLogging: true,
  });

  // Add event listeners for progress updates
  tester.on((event) => {
    switch (event.type) {
      case "test_started":
        console.log(`\n📊 Test Started`);
        console.log(`Test ID: ${event.testId}`);
        break;

      case "personalities_generated":
        console.log(`\n✨ Generated ${event.count} Personalities:`);
        event.personalities.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name}`);
          console.log(`      ${p.personality}`);
        });
        break;

      case "conversation_started":
        console.log(`\n💬 Starting Conversation with: ${event.personalityName}`);
        break;

      case "message_sent":
        const emoji = event.role === "user" ? "👤" : "🤖";
        const preview = event.content.length > 80 
          ? event.content.substring(0, 80) + "..." 
          : event.content;
        console.log(`${emoji} ${event.role.toUpperCase()}: ${preview}`);
        break;

      case "conversation_completed":
        console.log(`✅ Conversation Completed`);
        break;

      case "evaluation_completed":
        console.log(`📈 Evaluation Score: ${event.score}/100`);
        break;

      case "test_completed":
        console.log(`\n🎉 Testing Complete!\n`);
        console.log(`📊 Overall Score: ${event.results.overallScore}/100`);
        console.log(`\n📈 Summary:`);
        console.log(`   Total Conversations: ${event.results.summary.totalConversations}`);
        console.log(`   Successful: ${event.results.summary.successfulConversations}`);
        console.log(`   Failed: ${event.results.summary.failedConversations}`);
        console.log(`   Average Score: ${event.results.summary.averageScore}`);
        
        if (event.results.summary.topStrengths.length > 0) {
          console.log(`\n💪 Top Strengths:`);
          event.results.summary.topStrengths.forEach(s => console.log(`   - ${s}`));
        }
        
        if (event.results.summary.topWeaknesses.length > 0) {
          console.log(`\n⚠️  Top Weaknesses:`);
          event.results.summary.topWeaknesses.forEach(w => console.log(`   - ${w}`));
        }
        break;

      case "error":
        console.error(`\n❌ Error: ${event.error}`);
        if (event.context) console.error(`   Context: ${event.context}`);
        break;
    }
  });

  try {
    // Run tests
    const results = await tester.runTests(agent);

    // Display final results
    console.log(`\n\n📄 Results saved to: ./example-results/`);
    console.log(`📊 Test ID: ${results.testId}`);
    console.log(`⏱️  Duration: ${Math.round((results.endTime.getTime() - results.startTime.getTime()) / 1000)}s`);
    
    console.log(`\n✅ Testing completed successfully!`);
    
  } catch (error) {
    console.error("\n❌ Testing failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main };

