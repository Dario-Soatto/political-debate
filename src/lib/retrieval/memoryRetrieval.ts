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

  const contextDim = context.embedding.length;

  // Calculate combined scores for each memory.
  // Skip memories whose embedding is missing or has a mismatched dimension —
  // a single bad embedding would otherwise crash cosineSimilarity.
  const scoredMemories = memories
    .filter(memory => {
      if (!memory.embedding) return false;
      if (memory.embedding.length !== contextDim) {
        console.warn(
          `Skipping memory ${memory.id}: embedding dim ${memory.embedding.length} != context dim ${contextDim}`
        );
        return false;
      }
      return true;
    })
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