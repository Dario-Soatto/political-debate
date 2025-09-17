// src/lib/retrieval/embeddings.ts
/**
 * Get embedding vector for a text using OpenAI via API route
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get embedding');
  }
  
  const { embedding } = await response.json();
  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate relevance score between a memory and conversation context
 */
export function calculateRelevanceScore(
  memoryEmbedding: number[], 
  contextEmbedding: number[]
): number {
  return cosineSimilarity(memoryEmbedding, contextEmbedding);
}
