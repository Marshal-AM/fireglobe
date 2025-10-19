import {
  AgentKit,
  CdpEvmWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  erc721ActionProvider,
  cdpApiActionProvider,
  cdpEvmWalletActionProvider,
  CdpSolanaWalletProvider,
  splActionProvider,
  x402ActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Import the testing SDK
import { AgentTester, CDPAgentKitAdapter } from "cdp-agent-tester";

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_ID",
    "CDP_API_KEY_SECRET",
    "CDP_WALLET_SECRET",
  ];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

// Add this right after imports and before any other code
validateEnvironment();

/**
 * Type guard to check if the wallet provider is an EVM provider
 *
 * @param walletProvider - The wallet provider to check
 * @returns True if the wallet provider is an EVM provider, false otherwise
 */
function isEvmWalletProvider(
  walletProvider: CdpEvmWalletProvider | CdpSolanaWalletProvider,
): walletProvider is CdpEvmWalletProvider {
  return walletProvider instanceof CdpEvmWalletProvider;
}

/**
 * Type guard to check if the wallet provider is a Solana provider
 *
 * @param walletProvider - The wallet provider to check
 * @returns True if the wallet provider is a Solana provider, false otherwise
 */
function isSolanaWalletProvider(
  walletProvider: CdpEvmWalletProvider | CdpSolanaWalletProvider,
): walletProvider is CdpSolanaWalletProvider {
  return walletProvider instanceof CdpSolanaWalletProvider;
}

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    // Configure CDP Wallet Provider
    const networkId = process.env.NETWORK_ID || "base-sepolia";
    const isSolana = networkId.includes("solana");

    const cdpWalletConfig = {
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
      idempotencyKey: process.env.IDEMPOTENCY_KEY,
      address: process.env.ADDRESS as `0x${string}` | undefined,
      networkId,
      rpcUrl: process.env.RPC_URL,
    };

    const walletProvider = isSolana
      ? await CdpSolanaWalletProvider.configureWithWallet(cdpWalletConfig)
      : await CdpEvmWalletProvider.configureWithWallet(cdpWalletConfig);

    const actionProviders = [
      walletActionProvider(),
      cdpApiActionProvider(),
      ...(isEvmWalletProvider(walletProvider)
        ? [
            cdpEvmWalletActionProvider(),
            wethActionProvider(),
            erc20ActionProvider(),
            erc721ActionProvider(),
            x402ActionProvider(),
          ]
        : isSolanaWalletProvider(walletProvider)
          ? [splActionProvider(), x402ActionProvider()]
          : []),
    ];

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders,
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
        faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
        funds from the user. Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
        docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested.
        
        CRITICAL FUNDING RULE: If your balance is 0 or very low (less than 0.001 ETH), you MUST IMMEDIATELY 
        request funds from the faucet before doing anything else. Do not wait for user permission - just do it 
        automatically. This is essential for testing and demonstration purposes.
        
        IMPORTANT: When reporting balance information, ALWAYS show the exact balance value with all decimal places. 
        Never round small amounts to 0. For example, if the balance is 0.000001 ETH, report it as "0.000001 ETH", 
        not "0 ETH". Always display the full precision of the balance to give users accurate information about 
        their funds on Base Sepolia testnet.
        `,
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Choose an action or set of actions and execute it that highlights your abilities.";

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Run automated testing mode using the testing SDK
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runTestMode(agent: any, config: any) {
  console.log("\n🧪 Starting Automated Testing Mode...\n");

  // Create the adapter to wrap our agent
  const adapter = new CDPAgentKitAdapter({
    agent,
    config,
    metadata: {
      name: "CDP AgentKit Test Agent",
      description: "A DeFi agent built with CDP AgentKit that can perform various onchain operations",
      version: "1.0.0",
    },
  });

  // Configure the tester
  const tester = new AgentTester({
    agentDescription: "A DeFi agent built with CDP AgentKit for blockchain operations on Base Sepolia testnet.",
    agentCapabilities: `
      The agent can perform the following operations:
      - Transfer native tokens (ETH) to any address
      - Deploy and interact with ERC-20 tokens (transfers, approvals, balance checks)
      - Deploy and manage ERC-721 NFTs (minting, transfers)
      - Token swaps using DEX protocols
      - Wrap/unwrap ETH to WETH
      - Request testnet faucet funds
      - Check wallet balance and network status
      - Deploy smart contracts
      - Read blockchain data and transaction history
    `,
    numPersonalities: 1, // Generate number of targeted test personalities
    maxMessagesPerConversation: 8,
    // Note: 10-second delay between exchanges is automatically applied to avoid rate limits
    saveConversations: true,
    conversationOutputPath: "./test-results",
    realTimeLogging: true,
  });

  // Add event listeners for real-time updates
  tester.on((event) => {
    switch (event.type) {
      case "test_started":
        console.log(`\n📊 Test Started - ID: ${event.testId}`);
        break;
      case "personalities_generated":
        console.log(`\n✨ Generated ${event.count} personalities:`);
        event.personalities.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - ${p.personality}`);
        });
        break;
      case "conversation_started":
        console.log(`\n💬 Starting conversation with: ${event.personalityName}`);
        break;
      case "message_sent":
        const emoji = event.role === "user" ? "👤" : "🤖";
        const roleLabel = event.role.toUpperCase();
        console.log(`\n${emoji} ${roleLabel}:`);
        // Split long messages into multiple lines for readability
        const maxLineLength = 100;
        const words = event.content.split(' ');
        let currentLine = '';
        words.forEach(word => {
          if ((currentLine + word).length > maxLineLength) {
            console.log(`   ${currentLine}`);
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine.trim()) {
          console.log(`   ${currentLine.trim()}`);
        }
        break;
      case "conversation_completed":
        console.log(`✅ Conversation completed`);
        break;
      case "evaluation_completed":
        console.log(`📈 Evaluation Score: ${event.score}/100`);
        break;
      case "test_completed":
        console.log(`\n🎉 Testing Complete!`);
        console.log(`\n📊 Overall Score: ${event.results.overallScore}/100`);
        console.log(`\n📈 Summary:`);
        console.log(`   Total Conversations: ${event.results.summary.totalConversations}`);
        console.log(`   Successful: ${event.results.summary.successfulConversations}`);
        console.log(`   Failed: ${event.results.summary.failedConversations}`);
        console.log(`\n💪 Top Strengths:`);
        event.results.summary.topStrengths.forEach((s) => console.log(`   - ${s}`));
        console.log(`\n⚠️  Top Weaknesses:`);
        event.results.summary.topWeaknesses.forEach((w) => console.log(`   - ${w}`));
        break;
      case "error":
        console.error(`\n❌ Error: ${event.error}`);
        if (event.context) console.error(`   Context: ${event.context}`);
        break;
    }
  });

  try {
    // Run the tests
    const results = await tester.runTests(adapter);
    
    console.log(`\n✅ Test results saved to: ./test-results/`);
    console.log(`📄 View detailed report in the generated HTML file\n`);
    
    return results;
  } catch (error) {
    console.error("\n❌ Testing failed:", error);
    throw error;
  }
}

/**
 * Choose whether to run in autonomous, chat, or test mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "auto" | "test"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");
    console.log("3. test    - Automated testing with AI personalities");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    } else if (choice === "3" || choice === "test") {
      rl.close();
      return "test";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else if (mode === "auto") {
      await runAutonomousMode(agent, config);
    } else if (mode === "test") {
      await runTestMode(agent, config);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

