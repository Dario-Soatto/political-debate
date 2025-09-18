// Create src/lib/database/agents.ts
import { supabase } from './supabase'
import { PoliticalAgent } from '@/lib/agents/agent'
import { BeliefSystem } from '@/types/agent'

export interface DatabaseAgent {
  id: string
  name: string
  identity: string
  belief_system: BeliefSystem
  created_at: string
  updated_at: string
}

// Update src/lib/database/agents.ts
export async function saveAgent(agent: PoliticalAgent): Promise<string> {
  console.log('Attempting to save agent:', agent.name, agent.id)
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .upsert({
        id: agent.id,
        name: agent.name,
        identity: agent.identity,
        belief_system: agent.beliefSystem,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    console.log('Supabase response:', { data, error })

    if (error) {
      throw new Error(`Failed to save agent: ${error.message}`)
    }

    return data.id
  } catch (err) {
    console.error('Save agent error:', err)
    throw err
  }
}

export async function loadAgent(agentId: string): Promise<PoliticalAgent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (error) {
    console.error('Failed to load agent:', error)
    return null
  }

  const agent = new PoliticalAgent(data.name, data.identity, data.belief_system)
  agent.id = data.id
  return agent
}

export async function loadAgentWithMemories(agentId: string): Promise<PoliticalAgent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (error) {
    console.error('Failed to load agent:', error)
    return null
  }

  const agent = new PoliticalAgent(data.name, data.identity, data.belief_system)
  agent.id = data.id
  
  // Load memories from database
  await agent.loadMemoriesFromDatabase()
  
  return agent
}

export async function getAllAgents(): Promise<DatabaseAgent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load agents: ${error.message}`)
  }

  return data || []
}

// Update src/lib/database/agents.ts - add belief system update function
export async function updateAgentBeliefSystem(agentId: string, beliefSystem: BeliefSystem): Promise<void> {
  console.log('Updating belief system for agent:', agentId)
  
  const { error } = await supabase
    .from('agents')
    .update({
      belief_system: beliefSystem,
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)

  if (error) {
    throw new Error(`Failed to update belief system: ${error.message}`)
  }
}
