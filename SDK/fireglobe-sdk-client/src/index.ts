/**
 * FireGlobe Agent Testing SDK
 * Universal testing framework for blockchain agents
 */

export { AgentTester } from "./agent-tester";
export { BackendClient } from "./backend-client";
export { ConversationLogger } from "./conversation-logger";
export { LangChainAdapter } from "./adapters/cdp-agentkit-adapter";

export * from "./types";

// Re-export main interface for convenience
export type { IUniversalAgent } from "./types";

