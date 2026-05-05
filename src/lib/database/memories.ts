// Create src/lib/database/memories.ts
import { supabase } from './supabase'
import { Memory, MemoryType } from '@/types/agent'

export async function saveMemory(
  agentId: string, 
  description: string, 
  type: MemoryType,
  embedding?: number[]
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  console.log('Saving memory for agent:', agentId, type)

  const { data, error } = await supabase
    .from('memories')
    .insert({
      agent_id: agentId,
      description: description,
      type: type,
      embedding: embedding || null,
      last_accessed_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to save memory: ${error.message}`)
  }

  return data.id
}

export async function loadMemoriesForAgent(agentId: string): Promise<Memory[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  console.log('Loading memories for agent:', agentId)

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load memories: ${error.message}`)
  }

  return data.map(row => {
    return {
      id: row.id,
      description: row.description,
      type: row.type as MemoryType,
      createdAt: new Date(row.created_at),
      lastAccessedAt: new Date(row.last_accessed_at),
      embedding: parseEmbedding(row.embedding, row.id)
    };
  })
}

/**
 * Normalize embedding into a number[] or undefined.
 * Supabase may return embeddings as a JSON array, a JSON-encoded string,
 * or null. Validates the result is a non-empty array of finite numbers.
 */
function parseEmbedding(raw: unknown, rowId: string): number[] | undefined {
  if (raw === null || raw === undefined) return undefined;

  let candidate: unknown = raw;
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate);
    } catch (e) {
      console.warn(`Memory ${rowId}: failed to JSON.parse embedding string:`, e);
      return undefined;
    }
  }

  if (!Array.isArray(candidate) || candidate.length === 0) {
    console.warn(`Memory ${rowId}: embedding is not a non-empty array (got ${typeof candidate})`);
    return undefined;
  }

  // Validate all entries are finite numbers
  for (let i = 0; i < candidate.length; i++) {
    const v = candidate[i];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      console.warn(`Memory ${rowId}: embedding contains non-numeric value at index ${i}`);
      return undefined;
    }
  }

  return candidate as number[];
}

export async function updateMemoryAccess(memoryId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  const { error } = await supabase
    .from('memories')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', memoryId)

  if (error) {
    console.error('Failed to update memory access:', error)
  }
}