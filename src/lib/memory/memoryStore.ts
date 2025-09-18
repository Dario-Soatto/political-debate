// src/lib/memory/memoryStore.ts
import { Memory, MemoryType } from '@/types/agent';
import { getEmbedding } from '@/lib/retrieval/embeddings';
import { saveMemory } from '@/lib/database/memories';

/**
 * Basic memory storage functions
 * For now, we'll work with in-memory storage
 */

export function createMemory(
  description: string, 
  type: MemoryType
): Memory {
  return {
    id: crypto.randomUUID(),
    description,
    type,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
  };
}

export function updateLastAccessed(memory: Memory): void {
  memory.lastAccessedAt = new Date();
}

/**
 * Calculate recency score for a memory (higher = more recent)
 * Score decays exponentially over time
 */
export function calculateRecencyScore(memory: Memory): number {
  const now = new Date().getTime();
  const lastAccessed = memory.lastAccessedAt.getTime();
  const hoursSinceAccess = (now - lastAccessed) / (1000 * 60 * 60);
  
  // Exponential decay: score = e^(-decay_rate * hours)
  // decay_rate of 0.1 means score halves roughly every 7 hours
  const decayRate = 0.1;
  return Math.exp(-decayRate * hoursSinceAccess);
}

/**
 * Get all memories with their recency scores
 */
export function getMemoriesWithRecencyScores(memories: Memory[]): Array<{memory: Memory, recencyScore: number}> {
  return memories.map(memory => ({
    memory,
    recencyScore: calculateRecencyScore(memory)
  }));
}

/**
 * Create a memory with embedding and save to database
 */
export async function createMemoryWithEmbeddingAndSave(
  description: string, 
  type: MemoryType,
  agentId: string
): Promise<Memory> {
  const embedding = await getEmbedding(description);
  
  // Save to database
  const memoryId = await saveMemory(agentId, description, type, embedding);
  
  return {
    id: memoryId,
    description,
    type,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
    embedding,
  };
}

/**
 * Add embedding to an existing memory
 */
export async function addEmbeddingToMemory(memory: Memory): Promise<void> {
  if (!memory.embedding) {
    memory.embedding = await getEmbedding(memory.description);
  }
}

/**
 * Ensure all memories in a list have embeddings
 */
export async function ensureMemoriesHaveEmbeddings(memories: Memory[]): Promise<void> {
  const promises = memories
    .filter(memory => !memory.embedding)
    .map(memory => addEmbeddingToMemory(memory));
    
  await Promise.all(promises);
}