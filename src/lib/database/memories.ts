// Create src/lib/database/memories.ts
import { supabase } from './supabase'
import { Memory, MemoryType } from '@/types/agent'

export async function saveMemory(
  agentId: string, 
  description: string, 
  type: MemoryType,
  embedding?: number[]
): Promise<string> {
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
  console.log('Loading memories for agent:', agentId)

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load memories: ${error.message}`)
  }

  return data.map(row => ({
    id: row.id,
    description: row.description,
    type: row.type as MemoryType,
    createdAt: new Date(row.created_at),
    lastAccessedAt: new Date(row.last_accessed_at),
    embedding: row.embedding || undefined
  }))
}

export async function updateMemoryAccess(memoryId: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', memoryId)

  if (error) {
    console.error('Failed to update memory access:', error)
  }
}