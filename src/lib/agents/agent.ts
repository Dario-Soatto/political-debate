// src/lib/agents/agent.ts
import { Agent, Memory, ConversationContext, MemoryType, BeliefSystem } from '@/types/agent';
import { createMemoryWithEmbeddingAndSave } from '@/lib/memory/memoryStore';
import { retrieveRelevantMemories } from '@/lib/retrieval/memoryRetrieval';
import { generateAgentResponse, condenseInteraction } from './claude';
import { loadMemoriesForAgent, updateMemoryAccess } from '@/lib/database/memories';

/**
 * Basic Agent class implementation
 */

export class PoliticalAgent implements Agent {
  id: string;
  name: string;
  identity: string;
  memories: Memory[];
  beliefSystem: BeliefSystem;

  constructor(name: string, identity: string, beliefSystem: BeliefSystem) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.identity = identity;
    this.memories = [];
    this.beliefSystem = beliefSystem;
  }

  async addMemory(description: string, type: MemoryType): Promise<void> {
    const memory = await createMemoryWithEmbeddingAndSave(description, type, this.id);
    this.memories.push(memory);
  }

  async loadMemoriesFromDatabase(): Promise<void> {
    try {
      this.memories = await loadMemoriesForAgent(this.id);
      console.log(`Loaded ${this.memories.length} memories for ${this.name}`);
    } catch (error) {
      console.error(`Failed to load memories for ${this.name}:`, error);
    }
  }

  async getRelevantMemories(context: ConversationContext): Promise<Memory[]> {
    const relevantMemories = await retrieveRelevantMemories(this.memories, context);
    
    // Update last accessed timestamps in database
    for (const memory of relevantMemories) {
      await updateMemoryAccess(memory.id);
    }
    
    return relevantMemories;
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