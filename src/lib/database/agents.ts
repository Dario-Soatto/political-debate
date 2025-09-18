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

export async function saveAgent(agent: PoliticalAgent): Promise<string> {
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

  if (error) {
    throw new Error(`Failed to save agent: ${error.message}`)
  }

  return data.id
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
