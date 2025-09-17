// src/types/agent.ts

/**
 * Type of memory - either direct observation or higher-level reflection
 */
export type MemoryType = 'observation' | 'reflection';

/**
 * Represents a single memory in an agent's memory stream
 */
export interface Memory {
  id: string;
  description: string;
  type: MemoryType;
  createdAt: Date;
  lastAccessedAt: Date;
  // Vector embedding for similarity calculations
  embedding?: number[];
}

/**
 * Basic agent structure with identity and memory
 */
export interface Agent {
  id: string;
  name: string;
  // Single paragraph describing the agent's political identity
  identity: string;
  // The agent's memory stream
  memories: Memory[];
}

/**
 * Represents the current conversation context for retrieval
 */
export interface ConversationContext {
  // The current message or situation
  currentMessage: string;
  // Recent conversation history (last few messages)
  recentHistory: string[];
  // Vector embedding of the current context for similarity matching
  embedding?: number[];
}