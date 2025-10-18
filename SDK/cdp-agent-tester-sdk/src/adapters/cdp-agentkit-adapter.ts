/**
 * Adapter for CDP AgentKit with LangChain
 * Wraps the LangChain agent to implement IUniversalAgent interface
 */

import { IUniversalAgent } from "../types";
import { HumanMessage } from "@langchain/core/messages";

/**
 * Configuration for CDP AgentKit Adapter
 */
export interface CDPAgentKitAdapterConfig {
  /**
   * The LangChain agent instance
   */
  agent: any;

  /**
   * Agent configuration (thread_id, etc.)
   */
  config: any;

  /**
   * Optional metadata
   */
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
  };
}

/**
 * CDP AgentKit Adapter
 * Adapts LangChain-based CDP AgentKit agents to the universal interface
 */
export class CDPAgentKitAdapter implements IUniversalAgent {
  private agent: any;
  private config: any;
  private metadata: CDPAgentKitAdapterConfig["metadata"];
  private messageHistory: any[] = [];

  constructor(config: CDPAgentKitAdapterConfig) {
    this.agent = config.agent;
    this.config = config.config;
    this.metadata = config.metadata || {
      name: "CDP AgentKit Agent",
      description: "Agent built with CDP AgentKit",
      version: "1.0.0",
    };
  }

  /**
   * Send a message to the agent and get a response
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const stream = await this.agent.stream(
        { messages: [new HumanMessage(message)] },
        this.config
      );

      let responseContent = "";
      let lastAgentMessage = "";

      // Collect response from stream
      for await (const chunk of stream) {
        if ("agent" in chunk) {
          const content = chunk.agent.messages[0].content;
          if (content) {
            lastAgentMessage = content;
            responseContent += content;
          }
        }
      }

      // Return the last agent message or accumulated content
      return lastAgentMessage || responseContent || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw new Error(`Failed to get agent response: ${error}`);
    }
  }

  /**
   * Reset the agent's conversation state
   * Note: LangChain agents with MemorySaver maintain state
   * This creates a new thread ID for a fresh conversation
   */
  async reset(): Promise<void> {
    // Generate a new thread ID for fresh conversation
    const timestamp = Date.now();
    this.config = {
      ...this.config,
      configurable: {
        ...this.config.configurable,
        thread_id: `test_conversation_${timestamp}`,
      },
    };
    this.messageHistory = [];
  }

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      name: this.metadata?.name || "CDP AgentKit Agent",
      description: this.metadata?.description || "Agent built with CDP AgentKit",
      framework: "CDP AgentKit (LangChain)",
      version: this.metadata?.version || "1.0.0",
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // No specific cleanup needed for LangChain agents
    this.messageHistory = [];
  }
}

