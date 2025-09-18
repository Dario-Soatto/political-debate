// Create src/lib/beliefs/reflection.ts
import { PoliticalAgent } from '@/lib/agents/agent';
import { Memory } from '@/types/agent';
import { updateBeliefSystemFromReflection } from '@/lib/beliefs/beliefUpdater';
import { updateAgentBeliefSystem } from '@/lib/database/agents';
import { BeliefSystem } from '@/types/agent'

/**
 * Generate a reflection based on recent memories
 */
export async function generateReflection(agent: PoliticalAgent, numMemories: number = 5): Promise<string> {
  // Get the most recent observation memories (up to numMemories)
  const recentMemories = getRecentObservationMemories(agent.memories, numMemories);
  
  if (recentMemories.length === 0) {
    throw new Error('No memories to reflect upon');
  }

  // Build prompt for Claude to generate reflection
  const memoryDescriptions = recentMemories
    .map(memory => `- ${memory.description}`)
    .join('\n');

  const prompt = `You are ${agent.name}, reflecting on your recent experiences and conversations. 

Your identity: ${agent.identity}

Recent experiences:
${memoryDescriptions}

Based on these experiences, generate a thoughtful reflection that:
1. Identifies patterns or themes in your recent interactions
2. Considers how these experiences relate to and may influenceyour political beliefs
3. Notes any insights or shifts in your thinking
4. Is philosophical and abstract (not just a summary)
5. Is 2-3 sentences maximum

Write your reflection in first person as ${agent.name}:`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate reflection');
  }

  const { response: reflection } = await response.json();
  return reflection.trim();
}

/**
 * Get the most recent observation memories (up to maxCount)
 */
function getRecentObservationMemories(memories: Memory[], maxCount: number): Memory[] {
  return memories
    .filter(memory => memory.type === 'observation')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
    .slice(0, maxCount);
}

/**
 * Generate and add a reflection to an agent's memory, then update belief system
 */
export async function addReflectionToAgent(agent: PoliticalAgent, numMemories: number = 5): Promise<Memory> {
  const reflectionText = await generateReflection(agent, numMemories);
  
  // Add the reflection as a new memory
  await agent.addMemory(reflectionText, 'reflection');
  
  // Update the agent's belief system based on the reflection
  console.log(`\nUpdating belief system for ${agent.name} based on reflection...`);
  agent.beliefSystem = await updateBeliefSystemFromReflection(
    reflectionText,
    agent.beliefSystem,
    agent.name,
    agent.identity
  );
  
  // Save updated belief system to database
  await updateAgentBeliefSystem(agent.id, agent.beliefSystem);
  console.log('✓ Belief system saved to database');
  
  // Return the newly created reflection memory
  return agent.memories[agent.memories.length - 1];
}
