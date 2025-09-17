// src/lib/retrieval/memoryRetrieval.ts
import { Memory, ConversationContext } from '@/types/agent';
import { calculateRecencyScore, updateLastAccessed } from '@/lib/memory/memoryStore';
import { calculateRelevanceScore, getEmbedding } from './embeddings';

/**
 * Retrieve memories using combined recency + relevance scoring
 */
export async function retrieveRelevantMemories(
  memories: Memory[],
  context: ConversationContext,
  maxMemories: number = 5
): Promise<Memory[]> {
  // Get embedding for context if not already available
  if (!context.embedding) {
    const contextText = `${context.currentMessage} ${context.recentHistory.join(' ')}`;
    context.embedding = await getEmbedding(contextText);
  }
  
  // Calculate combined scores for each memory
  const scoredMemories = memories
    .filter(memory => memory.embedding) // Only memories with embeddings
    .map(memory => {
      const recencyScore = calculateRecencyScore(memory);
      const relevanceScore = calculateRelevanceScore(memory.embedding!, context.embedding!);
      
      // Combine scores (you can adjust these weights)
      const combinedScore = (recencyScore * 0.3) + (relevanceScore * 0.7);
      
      return { memory, score: combinedScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMemories);
  
  // Update last accessed timestamps for retrieved memories
  const retrievedMemories = scoredMemories.map(({ memory }) => {
    updateLastAccessed(memory);
    return memory;
  });
  
  return retrievedMemories;
}