// Create src/lib/database/conversations.ts
import { supabase } from './supabase'

export async function saveConversation(
  initialTopic: string,
  agent1Id: string,
  agent2Id: string
): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      initial_topic: initialTopic,
      agent1_id: agent1Id,
      agent2_id: agent2Id
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to save conversation: ${error.message}`)
  }

  return data.id
}

export async function saveConversationTurn(
  conversationId: string,
  agentId: string,
  message: string,
  turnOrder: number
): Promise<void> {
  const { error } = await supabase
    .from('conversation_turns')
    .insert({
      conversation_id: conversationId,
      agent_id: agentId,
      message: message,
      turn_order: turnOrder
    })

  if (error) {
    throw new Error(`Failed to save conversation turn: ${error.message}`)
  }
}

export async function loadConversation(conversationId: string) {
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convError) return null

  const { data: turns, error: turnsError } = await supabase
    .from('conversation_turns')
    .select(`
      message,
      turn_order,
      created_at,
      agents!inner(name)
    `)
    .eq('conversation_id', conversationId)
    .order('turn_order')

  if (turnsError) return null

  return {
    conversation,
    turns: turns.map(turn => ({
      message: turn.message,
      agent_name: (turn.agents as any).name,
      turn_order: turn.turn_order,
      created_at: turn.created_at
    }))
  }
}