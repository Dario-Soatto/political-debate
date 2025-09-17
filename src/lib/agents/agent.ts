// src/lib/agents/agent.ts
import { Agent, Memory, ConversationContext, MemoryType } from '@/types/agent';
import { createMemoryWithEmbedding } from '@/lib/memory/memoryStore';
import { retrieveRelevantMemories } from '@/lib/retrieval/memoryRetrieval';
import { generateAgentResponse, condenseInteraction } from './claude';

/**
 * Basic Agent class implementation
 */

export class PoliticalAgent implements Agent {
  id: string;
  name: string;
  identity: string;
  memories: Memory[];

  constructor(name: string, identity: string) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.identity = identity;
    this.memories = [];
  }

  async addMemory(description: string, type: MemoryType): Promise<void> {
    const memory = await createMemoryWithEmbedding(description, type);
    this.memories.push(memory);
  }

  async getRelevantMemories(context: ConversationContext): Promise<Memory[]> {
    return await retrieveRelevantMemories(this.memories, context);
  }

  /**
   * Generate a response and return both the response and memories used
   */
  async generateResponseWithMemories(context: ConversationContext): Promise<{response: string, memoriesUsed: Memory[]}> {
    // Get relevant memories
    const relevantMemories = await this.getRelevantMemories(context);
    
    // Generate response using Claude
    const response = await generateAgentResponse(this, context, relevantMemories);
    
    // Condense the interaction into a brief memory
    const condensedMemory = await condenseInteraction(context.currentMessage, response);
    
    // Add the condensed interaction as a new observation memory
    await this.addMemory(condensedMemory, 'observation');
    
    return {
      response,
      memoriesUsed: relevantMemories
    };
  }

  /**
   * Generate a response to the current conversation context (keep for backward compatibility)
   */
  async generateResponse(context: ConversationContext): Promise<string> {
    const { response } = await this.generateResponseWithMemories(context);
    return response;
  }
}