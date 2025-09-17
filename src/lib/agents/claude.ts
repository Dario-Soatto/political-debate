// src/lib/agents/claude.ts
import { Memory, Agent, ConversationContext } from '@/types/agent';

/**
 * Generate a response from Claude using agent identity and relevant memories
 */
export async function generateAgentResponse(
  agent: Agent,
  conversationContext: ConversationContext,
  relevantMemories: Memory[]
): Promise<string> {
  // Build the prompt with identity, memories, and current context
  const memoryContext = relevantMemories
    .map(memory => `- ${memory.description} (${memory.type})`)
    .join('\n');

  const prompt = `You are ${agent.name}, a political agent with the following identity:
${agent.identity}

Based on your relevant memories:
${memoryContext}

Recent conversation:
${conversationContext.recentHistory.join('\n')}

Current message you're responding to:
${conversationContext.currentMessage}

Respond as ${agent.name} would, staying true to your political beliefs and drawing from your memories. Keep your response conversational and under 50 words.`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate Claude response');
  }

  const { response: claudeResponse } = await response.json();
  return claudeResponse;
}

/**
 * Condense an interaction into a brief memory (20 words max)
 */
export async function condenseInteraction(
  currentMessage: string,
  response: string
): Promise<string> {
  const prompt = `Condense this conversation exchange into exactly 20 words or less for a memory:

Other person said: "${currentMessage}"
I responded: "${response}"

Create a brief memory summary in 20 words or less:`;

  const apiResponse = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!apiResponse.ok) {
    throw new Error('Failed to condense interaction');
  }

  const { response: condensedMemory } = await apiResponse.json();
  return condensedMemory.trim();
}
