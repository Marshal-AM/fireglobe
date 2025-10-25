/**
 * CDP Agent Tester SDK
 * Universal testing framework for CDP AgentKit agents
 */

export { AgentTester } from "./agent-tester";
export { BackendClient } from "./backend-client";
export { ConversationLogger } from "./conversation-logger";
export { CDPAgentKitAdapter } from "./adapters/cdp-agentkit-adapter";

export * from "./types";

// Re-export main interface for convenience
export type { IUniversalAgent } from "./types";

