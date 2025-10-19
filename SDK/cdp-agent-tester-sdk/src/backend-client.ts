/**
 * Client for interacting with the PersonalityGenerator backend
 */

import axios, { AxiosInstance } from "axios";
import { Personality, EvaluationResult } from "./types";

export interface BackendClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class BackendClient {
  private client: AxiosInstance;

  constructor(config: BackendClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Generate personalities for a given agent description and capabilities
   */
  async generatePersonalities(
    agentDescription: string,
    agentCapabilities: string,
    numPersonalities: number
  ): Promise<Personality[]> {
    try {
      const response = await this.client.post<{
        success: boolean;
        personalities: Personality[];
      }>("/rest/generate-personalities", {
        agent_description: agentDescription,
        agent_capabilities: agentCapabilities,
        num_personalities: numPersonalities,
      });

      if (!response.data.success) {
        throw new Error("Failed to generate personalities");
      }

      return response.data.personalities;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Backend error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Evaluate a conversation using Python AI backend
   */
  async evaluateConversation(
    personalityName: string,
    personality: string,
    description: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<EvaluationResult> {
    try {
      const response = await this.client.post<EvaluationResult>(
        "/rest/evaluate-conversation",
        {
          personality_name: personalityName,
          personality,
          description,
          messages,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Evaluation error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Store a conversation in the backend
   */
  async storeConversation(
    conversationId: string,
    personalityName: string,
    messages: Array<{ role: string; content: string; timestamp: Date }>
  ): Promise<void> {
    try {
      await this.client.post("/rest/store-conversation", {
        conversation_id: conversationId,
        personality_name: personalityName,
        messages: messages.map((m) => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Storage error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Generate a natural message from a personality
   */
  async generatePersonalityMessage(
    personality: Personality,
    previousMessages: any[],
    isInitial: boolean,
    agentDescription: string
  ): Promise<string> {
    try {
      const response = await this.client.post<{ message: string }>(
        "/rest/generate-personality-message",
        {
          personality,
          previous_messages: previousMessages,
          is_initial: isInitial,
          agent_description: agentDescription,
        }
      );
      return response.data.message;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Message generation error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Send transaction analysis request to backend
   */
  async analyzeAgentTransaction(
    conversationId: string,
    personalityName: string,
    conversationMessages: Array<{ role: string; content: string; timestamp: Date }>,
    transactionHash: string,
    chainId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post<{
        success: boolean;
        message: string;
        timestamp: string;
      }>("/rest/analyze-agent-transaction", {
        conversation_id: conversationId,
        personality_name: personalityName,
        conversation_messages: conversationMessages.map((m) => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
        transaction_hash: transactionHash,
        chain_id: chainId,
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Transaction analysis error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Retrieve transaction analysis from backend
   */
  async getTransactionAnalysis(
    transactionHash: string
  ): Promise<{ success: boolean; analysis?: string; timestamp?: string; message: string }> {
    try {
      const response = await this.client.post<{
        success: boolean;
        analysis?: string;
        timestamp?: string;
        message: string;
      }>("/rest/get-transaction-analysis", {
        transaction_hash: transactionHash,
      });

      return {
        success: response.data.success,
        analysis: response.data.analysis,
        timestamp: response.data.timestamp,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Transaction analysis retrieval error: ${error.response?.data?.detail || error.message}`
        );
      }
      throw error;
    }
  }
}

