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
  // Add detailed logging
  console.log('=== COSINE SIMILARITY DEBUG ===');
  console.log('Vector A length:', vecA?.length);
  console.log('Vector A type:', typeof vecA);
  console.log('Vector A first 3 values:', vecA?.slice(0, 3));
  console.log('Vector B length:', vecB?.length);
  console.log('Vector B type:', typeof vecB);
  console.log('Vector B first 3 values:', vecB?.slice(0, 3));
  console.log('Are they arrays?', Array.isArray(vecA), Array.isArray(vecB));
  
  if (vecA.length !== vecB.length) {
    console.error('❌ LENGTH MISMATCH!');
    console.error(`Vector A: ${vecA.length} dimensions`);
    console.error(`Vector B: ${vecB.length} dimensions`);
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
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  console.log('✅ Cosine similarity calculated:', similarity);
  console.log('================================');
  
  return similarity;
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
