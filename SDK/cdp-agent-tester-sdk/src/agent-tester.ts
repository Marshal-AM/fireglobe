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

export class AgentTester {
  private backendClient: BackendClient;
  private config: Required<TestConfig>;
  private listeners: EventListener[] = [];
  private logger?: ConversationLogger;

  constructor(config: TestConfig) {
    this.config = {
      maxMessagesPerConversation: config.maxMessagesPerConversation || 10,
      numPersonalities: config.numPersonalities || 5,
      backendUrl: config.backendUrl || 
                  process.env.CDP_TESTER_BACKEND_URL || 
                  "https://fireglobe-backend.onrender.com",
      saveConversations: config.saveConversations ?? true,
      conversationOutputPath: config.conversationOutputPath || "./conversations",
      realTimeLogging: config.realTimeLogging ?? true,
      agentDescription: config.agentDescription,
      agentCapabilities: config.agentCapabilities,
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
}

