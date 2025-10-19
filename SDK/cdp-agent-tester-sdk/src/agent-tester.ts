/**
 * Main Agent Tester class that orchestrates testing
 */

import { BackendClient } from "./backend-client";
import {
  IUniversalAgent,
  TestConfig,
  TestResults,
  Conversation,
  ConversationMessage,
  Personality,
  EvaluationResult,
  EventListener,
  TestEvent,
} from "./types";
import { ConversationLogger } from "./conversation-logger";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export class AgentTester {
  private backendClient: BackendClient;
  private config: Required<TestConfig>;
  private listeners: EventListener[] = [];
  private logger?: ConversationLogger;

  constructor(config: TestConfig) {
    // Validate required access token
    if (!config.accessToken || config.accessToken.trim() === '') {
      throw new Error(
        '❌ ACCESS TOKEN REQUIRED: CDP Agent Tester requires an access token to function.\n' 

      );
    }

    this.config = {
      maxMessagesPerConversation: config.maxMessagesPerConversation || 10,
      numPersonalities: config.numPersonalities || 5,
      backendUrl: config.backendUrl || 
                  process.env.CDP_TESTER_BACKEND_URL || 
                  "https://backend-739298578243.us-central1.run.app",
      saveConversations: config.saveConversations ?? true,
      conversationOutputPath: config.conversationOutputPath || "./conversations",
      realTimeLogging: config.realTimeLogging ?? true,
      agentDescription: config.agentDescription,
      agentCapabilities: config.agentCapabilities,
      accessToken: config.accessToken,
      dbServerUrl: config.dbServerUrl || 
                   process.env.DB_SERVER_URL || 
                   "http://localhost:3001",
    };

    this.backendClient = new BackendClient({
      baseUrl: this.config.backendUrl,
    });

    if (this.config.saveConversations) {
      this.logger = new ConversationLogger(this.config.conversationOutputPath);
    }
  }

  /**
   * Add an event listener for real-time updates
   */
  on(listener: EventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: TestEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }

  /**
   * Run comprehensive tests on the agent
   */
  async runTests(agent: IUniversalAgent): Promise<TestResults> {
    const testId = uuidv4();
    const startTime = new Date();

    this.emit({ type: "test_started", testId, timestamp: startTime });

    try {
      // Step 1: Generate personalities
      const personalities = await this.backendClient.generatePersonalities(
        this.config.agentDescription,
        this.config.agentCapabilities,
        this.config.numPersonalities
      );
      this.emit({
        type: "personalities_generated",
        count: personalities.length,
        personalities,
      });

      // Step 2: Run conversations with each personality
      const conversations: Conversation[] = [];
      for (const personality of personalities) {
        try {
          const conversation = await this.runConversation(agent, personality);
          conversations.push(conversation);
        } catch (error) {
          this.emit({
            type: "error",
            error: `Failed conversation with ${personality.name}: ${error}`,
            context: personality.name,
          });
          // Continue with next personality
        }
      }

      // Step 3: Evaluate all conversations
      const evaluations: EvaluationResult[] = [];
      for (const conversation of conversations) {
        if (conversation.status === "completed") {
          try {
            const personality = personalities.find(
              (p) => p.name === conversation.personalityName
            )!;
            const evaluation = await this.evaluateConversation(
              conversation,
              personality
            );
            evaluations.push(evaluation);
            this.emit({
              type: "evaluation_completed",
              conversationId: conversation.id,
              score: evaluation.score,
            });
          } catch (error) {
            this.emit({
              type: "error",
              error: `Failed evaluation for ${conversation.personalityName}: ${error}`,
              context: conversation.id,
            });
          }
        }
      }

      // Step 4: Compile results
      const endTime = new Date();
      const results: TestResults = {
        testId,
        agentDescription: this.config.agentDescription,
        personalities,
        conversations,
        evaluations,
        startTime,
        endTime,
        overallScore: this.calculateOverallScore(evaluations),
        summary: this.generateSummary(conversations, evaluations),
      };

      // Save results
      if (this.logger) {
        await this.logger.saveTestResults(results);
      }

      // Upload to db-server (required - access token validated in constructor)
      await this.uploadToDbServer();

      this.emit({ type: "test_completed", results });

      return results;
    } catch (error) {
      this.emit({
        type: "error",
        error: `Test failed: ${error}`,
        context: "runTests",
      });
      throw error;
    }
  }

  /**
   * Run a conversation between the agent and a personality
   */
  private async runConversation(
    agent: IUniversalAgent,
    personality: Personality
  ): Promise<Conversation> {
    const conversationId = uuidv4();
    const conversation: Conversation = {
      id: conversationId,
      personalityName: personality.name,
      messages: [],
      startTime: new Date(),
      status: "in_progress",
    };

    this.emit({
      type: "conversation_started",
      conversationId,
      personalityName: personality.name,
    });

    try {
      // Reset agent state
      await agent.reset();

      // Run conversation loop
      for (let i = 0; i < this.config.maxMessagesPerConversation; i++) {
        // Generate user message - initial on first iteration, context-aware afterwards
        const isFirstMessage = i === 0;
        const messageContent = await this.generatePersonalityMessage(
          personality,
          conversation.messages,
          isFirstMessage
        );
        
        // User (personality) message
        const userMessage: ConversationMessage = {
          role: "user",
          content: messageContent,
          timestamp: new Date(),
          personality: personality.name,
        };
        conversation.messages.push(userMessage);

        this.emit({
          type: "message_sent",
          conversationId,
          role: "user",
          content: userMessage.content,
        });

        // Log in real-time
        if (this.logger && this.config.realTimeLogging) {
          await this.logger.logMessage(conversationId, userMessage);
        }

        // Agent response
        const agentResponse = await agent.sendMessage(userMessage.content);
        const agentMessage: ConversationMessage = {
          role: "agent",
          content: agentResponse,
          timestamp: new Date(),
        };
        conversation.messages.push(agentMessage);

        this.emit({
          type: "message_sent",
          conversationId,
          role: "agent",
          content: agentMessage.content,
        });

        // Check for transaction hash in agent response
        const txInfo = this.extractTransactionFromMessage(agentMessage.content);
        if (txInfo) {
          console.log(`🔍 Transaction detected in agent response: ${txInfo.txHash}`);
          console.log(`⛓️  Chain ID: ${txInfo.chainId}`);
          
          // Send transaction analysis request to backend
          try {
            await this.backendClient.analyzeAgentTransaction(
              conversationId,
              personality.name,
              conversation.messages,
              txInfo.txHash,
              txInfo.chainId
            );
            console.log(`✅ Transaction analysis request sent to backend`);
            
            // Wait for analysis to be available (poll every 2 seconds, no timeout)
            console.log(`⏳ Waiting for transaction analysis...`);
            let analysisReceived = false;
            
            while (!analysisReceived) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              
              try {
                const analysisResult = await this.backendClient.getTransactionAnalysis(txInfo.txHash);
                if (analysisResult.success && analysisResult.analysis) {
                  console.log(`\n📊 TRANSACTION ANALYSIS:`);
                  console.log(`🔗 Transaction: ${txInfo.txHash}`);
                  console.log(`⛓️  Chain: ${txInfo.chainId}`);
                  console.log(`📝 Analysis: ${analysisResult.analysis}`);
                  console.log(`⏰ Timestamp: ${analysisResult.timestamp}\n`);
                  
                  // Add transaction analysis to the conversation messages
                  conversation.messages.push({
                    role: "agent",
                    content: `[Transaction Analysis for ${txInfo.txHash}]`,
                    timestamp: new Date(analysisResult.timestamp || Date.now()),
                    transaction_analysis: {
                      transaction_hash: txInfo.txHash,
                      chain: txInfo.chainId,
                      analysis: analysisResult.analysis,
                      timestamp: analysisResult.timestamp || new Date().toISOString(),
                    },
                  } as any);
                  
                  analysisReceived = true;
                }
              } catch (error) {
                // Continue polling
              }
            }
            
            // Add 10-second delay after displaying analysis
            console.log(`⏳ Waiting 10 seconds before next message...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            
          } catch (error) {
            console.error(`❌ Failed to send transaction analysis request: ${error}`);
          }
        }

        // Log in real-time
        if (this.logger && this.config.realTimeLogging) {
          await this.logger.logMessage(conversationId, agentMessage);
        }

        // Check if conversation should end
        if (this.shouldEndConversation(conversation.messages)) {
          break;
        }

        // Add 10-second delay before next message to avoid rate limits
        // Only delay if not the last message
        if (i < this.config.maxMessagesPerConversation - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      conversation.endTime = new Date();
      conversation.status = "completed";

      // Store conversation in backend
      await this.backendClient.storeConversation(
        conversationId,
        personality.name,
        conversation.messages
      );

      // Generate metrics for this conversation
      console.log(`\n📊 Generating performance metrics for conversation ${conversationId}...`);
      try {
        const metricsResult = await this.backendClient.generateMetrics(conversationId);
        if (metricsResult.success) {
          console.log(`✅ Metrics generated successfully!`);
          console.log(`📊 Final Performance Index: ${metricsResult.metrics?.metrics?.aggregate_scores?.final_performance_index || 'N/A'}/100`);
          console.log(`   Check the Metrics Generator logs for detailed breakdown\n`);
        } else {
          console.log(`⚠️  Metrics generation returned: ${metricsResult.message}`);
          console.log(`   The Metrics Generator might be unavailable or still processing\n`);
        }
      } catch (error) {
        console.log(`⚠️  Could not generate metrics: ${error}`);
        console.log(`   The Metrics Generator might be unavailable\n`);
      }

      this.emit({
        type: "conversation_completed",
        conversationId,
      });

      return conversation;
    } catch (error) {
      conversation.status = "failed";
      conversation.endTime = new Date();
      throw error;
    }
  }

  /**
   * Extract transaction hash and chain ID from a message
   */
  private extractTransactionFromMessage(message: string): { txHash: string; chainId: string } | null {
    // Look for transaction hash pattern (0x followed by 64 hex characters)
    const txPattern = /0x[a-fA-F0-9]{64}/;
    const txMatch = message.match(txPattern);
    
    if (!txMatch) {
      return null;
    }
    
    const txHash = txMatch[0];
    
    // Try to detect chain from context
    const messageLower = message.toLowerCase();
    let chainId = "84532"; // Default to Base Sepolia for testing
    
    // Check for explicit chain mentions (order matters - check specific before general)
    if (messageLower.includes("base-sepolia") || messageLower.includes("base sepolia")) {
      chainId = "84532";
    } else if (messageLower.includes("base mainnet") || (messageLower.includes("base") && messageLower.includes("mainnet"))) {
      chainId = "8453";
    } else if (messageLower.includes("base")) {
      chainId = "84532"; // Default base to sepolia testnet
    } else if (messageLower.includes("ethereum mainnet") || (messageLower.includes("ethereum") && messageLower.includes("mainnet"))) {
      chainId = "1";
    } else if (messageLower.includes("polygon")) {
      chainId = "137";
    } else if (messageLower.includes("arbitrum")) {
      chainId = "42161";
    } else if (messageLower.includes("optimism")) {
      chainId = "10";
    }
    
    return {
      txHash,
      chainId
    };
  }

  /**
   * Generate a message from the personality's perspective using AI
   */
  private async generatePersonalityMessage(
    personality: Personality,
    previousMessages: ConversationMessage[],
    isInitial: boolean = false
  ): Promise<string> {
    try {
      // Use backend AI to generate natural personality-driven messages
      const response = await this.backendClient.generatePersonalityMessage(
        personality,
        previousMessages,
        isInitial,
        this.config.agentDescription
      );
      return response;
    } catch (error) {
      // Log the error for debugging
      console.error(`⚠️ Failed to generate AI message: ${error}`);
      console.error(`   Using fallback message instead`);
      
      // Fallback to simple context-aware messages if backend fails
      if (isInitial) {
        return `Hi! I'm interested in your DeFi agent. What can you help me with?`;
      }
      
      // Simple follow-ups that reference the last agent response
      const lastAgentMsg = previousMessages
        .filter(m => m.role === 'agent')
        .slice(-1)[0]?.content || '';
      
      const followUps = [
        `That's interesting. Can you tell me more?`,
        `How does that work exactly?`,
        `What are the benefits of this?`,
        `Can you give me an example?`,
        `I see. What else should I know?`,
      ];
      
      return followUps[previousMessages.length % followUps.length];
    }
  }

  /**
   * Check if conversation should end
   */
  private shouldEndConversation(messages: ConversationMessage[]): boolean {
    if (messages.length < 4) return false;

    const lastMessage = messages[messages.length - 1];
    // End if agent says goodbye or conversation seems concluded
    const endPhrases = [
      "goodbye",
      "have a great day",
      "feel free to reach out",
      "is there anything else",
    ];

    return endPhrases.some((phrase) =>
      lastMessage.content.toLowerCase().includes(phrase)
    );
  }

  /**
   * Evaluate a conversation
   */
  private async evaluateConversation(
    conversation: Conversation,
    personality: Personality
  ): Promise<EvaluationResult> {
    const evaluation = await this.backendClient.evaluateConversation(
      personality.name,
      personality.personality,
      personality.description,
      conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );

    return evaluation;
  }

  /**
   * Calculate overall score from evaluations
   */
  private calculateOverallScore(evaluations: EvaluationResult[]): number {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, e) => acc + e.score, 0);
    return Math.round(sum / evaluations.length);
  }

  /**
   * Generate summary from results
   */
  private generateSummary(
    conversations: Conversation[],
    evaluations: EvaluationResult[]
  ): TestResults["summary"] {
    const successfulConversations = conversations.filter(
      (c) => c.status === "completed"
    ).length;
    const failedConversations = conversations.length - successfulConversations;

    const allStrengths = evaluations.flatMap((e) => e.strengths);
    const allWeaknesses = evaluations.flatMap((e) => e.weaknesses);

    // Count occurrences and get top items
    const strengthCounts = this.countOccurrences(allStrengths);
    const weaknessCounts = this.countOccurrences(allWeaknesses);

    return {
      totalConversations: conversations.length,
      successfulConversations,
      failedConversations,
      averageScore: this.calculateOverallScore(evaluations),
      topStrengths: Object.keys(strengthCounts)
        .sort((a, b) => strengthCounts[b] - strengthCounts[a])
        .slice(0, 5),
      topWeaknesses: Object.keys(weaknessCounts)
        .sort((a, b) => weaknessCounts[b] - weaknessCounts[a])
        .slice(0, 5),
    };
  }

  /**
   * Count occurrences of items in array
   */
  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Upload test results to db-server (Lighthouse + Supabase)
   */
  private async uploadToDbServer(): Promise<void> {
    try {
      console.log('\n📦 Uploading test results to db-server...');
      console.log(`   DB Server: ${this.config.dbServerUrl}`);
      console.log(`   Access Token: ${this.config.accessToken?.substring(0, 8)}...`);
      
      const response = await axios.post(
        `${this.config.dbServerUrl}/upload-complete`,
        {
          access_token: this.config.accessToken,
        },
        {
          timeout: 120000, // 2 minute timeout for complete upload
        }
      );

      if (response.data.success) {
        console.log('\n✅ Test results uploaded successfully!');
        console.log(`   Run ID: ${response.data.run_id}`);
        console.log(`   KG IPFS: ${response.data.kg.url}`);
        console.log(`   Metrics IPFS: ${response.data.metrics.url}`);
        console.log(`   User ID: ${response.data.user_id}`);
      } else {
        console.warn('⚠️  Upload completed but with warnings');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`\n❌ Failed to upload to db-server: ${error.message}`);
        if (error.response?.data) {
          console.error(`   Error details: ${JSON.stringify(error.response.data)}`);
        }
        console.error(`   Note: Test results are still saved locally`);
      } else {
        console.error(`\n❌ Upload error: ${error}`);
      }
      // Don't throw - we don't want to fail the test run if upload fails
    }
  }
}

