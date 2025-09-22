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
    let embedding = undefined;
    
    if (row.embedding) {
      // Handle different embedding formats from database
      if (typeof row.embedding === 'string') {
        console.log('Parsing string embedding...');
        try {
          embedding = JSON.parse(row.embedding);
        } catch (e) {
          console.error('Failed to parse embedding string:', e);
          embedding = undefined;
        }
      } else if (Array.isArray(row.embedding)) {
        embedding = row.embedding;
      } else {
        console.warn('Unknown embedding format:', typeof row.embedding);
        embedding = undefined;
      }
    }
    
    console.log('Processed embedding length:', embedding?.length);
    
    return {
      id: row.id,
      description: row.description,
      type: row.type as MemoryType,
      createdAt: new Date(row.created_at),
      lastAccessedAt: new Date(row.last_accessed_at),
      embedding
    };
  })
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