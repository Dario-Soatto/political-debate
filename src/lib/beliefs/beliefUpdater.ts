import { BeliefSystem, CoreValue, DomainArea, SpecificIssue } from '@/types/agent';

/**
 * Identify the belief most relevant to a reflection
 */
export async function identifyTargetBelief(
  reflection: string, 
  beliefSystem: BeliefSystem
): Promise<{ type: 'core-value' | 'domain-area' | 'specific-issue', id: string, belief: CoreValue | DomainArea | SpecificIssue }> {
  
  // Build a comprehensive list of all beliefs for Claude to choose from
  const allBeliefs = [
    ...beliefSystem.coreValues.map(cv => `CORE-VALUE: ${cv.id} - ${cv.label}: ${cv.description}`),
    ...beliefSystem.domainAreas.map(da => `DOMAIN-AREA: ${da.id} - ${da.label}: ${da.description}`),
    ...beliefSystem.specificIssues.map(si => `SPECIFIC-ISSUE: ${si.id} - ${si.label}: ${si.description}`)
  ].join('\n');

  console.log(`  Analyzing reflection against ${beliefSystem.coreValues.length + beliefSystem.domainAreas.length + beliefSystem.specificIssues.length} beliefs...`);

  const prompt = `You are analyzing a political agent's reflection to identify which belief it most closely relates to.

REFLECTION:
"${reflection}"

AVAILABLE BELIEFS:
${allBeliefs}

Instructions:
1. Identify the ONE belief that is most directly relevant to this reflection
2. Consider which belief the reflection is most likely to influence or relate to
3. Respond with EXACTLY this format: "TARGET: [belief-id]"
4. Then explain your reasoning in 1-2 sentences

Example response format:
TARGET: cv-individual-liberty
This reflection discusses personal freedom and government interference, which directly relates to the core value of individual liberty.`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to identify target belief');
  }

  const { response: claudeResponse } = await response.json();
  console.log(`  Claude's target identification response: "${claudeResponse}"`);
  
  // Parse the response to extract the target ID
  const targetMatch = claudeResponse.match(/TARGET:\s*([a-zA-Z-]+)/);
  if (!targetMatch) {
    console.error(`  ERROR: Could not parse target from response: "${claudeResponse}"`);
    throw new Error('Could not parse target belief from Claude response');
  }

  const targetId = targetMatch[1];
  console.log(`  Parsed target ID: ${targetId}`);

  // Find the belief and determine its type
  const coreValue = beliefSystem.coreValues.find(cv => cv.id === targetId);
  if (coreValue) {
    return { type: 'core-value', id: targetId, belief: coreValue };
  }

  const domainArea = beliefSystem.domainAreas.find(da => da.id === targetId);
  if (domainArea) {
    return { type: 'domain-area', id: targetId, belief: domainArea };
  }

  const specificIssue = beliefSystem.specificIssues.find(si => si.id === targetId);
  if (specificIssue) {
    return { type: 'specific-issue', id: targetId, belief: specificIssue };
  }

  console.error(`  ERROR: Could not find belief with ID: ${targetId}`);
  throw new Error(`Could not find belief with ID: ${targetId}`);
}

/**
 * Find all beliefs connected to a target belief
 */
export function getConnectedBeliefs(
  targetType: 'core-value' | 'domain-area' | 'specific-issue',
  targetId: string,
  beliefSystem: BeliefSystem
): {
  coreValues: CoreValue[];
  domainAreas: DomainArea[];
  specificIssues: SpecificIssue[];
} {
  let connectedCoreValues: CoreValue[] = [];
  let connectedDomainAreas: DomainArea[] = [];
  let connectedSpecificIssues: SpecificIssue[] = [];

  if (targetType === 'core-value') {
    // Find all domain areas that reference this core value
    connectedDomainAreas = beliefSystem.domainAreas.filter(da => 
      da.coreValueIds.includes(targetId)
    );
  }
  
  else if (targetType === 'domain-area') {
    // Find connected core values
    const targetDomain = beliefSystem.domainAreas.find(da => da.id === targetId);
    if (targetDomain) {
      connectedCoreValues = beliefSystem.coreValues.filter(cv => 
        targetDomain.coreValueIds.includes(cv.id)
      );
      
      // Find connected specific issues
      connectedSpecificIssues = beliefSystem.specificIssues.filter(si => 
        targetDomain.specificIssueIds.includes(si.id)
      );
    }
  }
  
  else if (targetType === 'specific-issue') {
    // Find all domain areas that contain this specific issue
    connectedDomainAreas = beliefSystem.domainAreas.filter(da => 
      da.specificIssueIds.includes(targetId)
    );
  }

  return {
    coreValues: connectedCoreValues,
    domainAreas: connectedDomainAreas,
    specificIssues: connectedSpecificIssues
  };
}

/**
 * Update the target belief based on a reflection
 */
export async function updateTargetBelief(
  reflection: string,
  targetBelief: CoreValue | DomainArea | SpecificIssue,
  agentName: string,
  agentIdentity: string
): Promise<string> {
  const prompt = `You are ${agentName}, a political agent with this identity: ${agentIdentity}

You recently had this reflection:
"${reflection}"

Your current belief about "${targetBelief.label}" is:
"${targetBelief.description}"

Based on your reflection, write an updated belief description for "${targetBelief.label}". 

Guidelines:
1. Keep the update subtle and realistic - beliefs don't change dramatically overnight
2. Stay true to your overall political orientation (${agentName === 'Alex' ? 'liberal' : 'conservative'})
3. The update should logically connect to your reflection
4. Maintain the core essence of the belief while allowing for nuanced evolution
5. Write ONLY the updated belief description in 1-2 sentences, similar in length to the original
6. Do not include any preamble, explanation, or commentary - just the new description

Updated description:`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to update target belief');
  }

  const { response: updatedDescription } = await response.json();
  return updatedDescription.trim();
}

/**
 * Update a connected belief based on the target belief change
 */
export async function updateConnectedBelief(
  targetBelief: CoreValue | DomainArea | SpecificIssue,
  targetUpdate: string,
  connectedBelief: CoreValue | DomainArea | SpecificIssue,
  agentName: string,
  agentIdentity: string
): Promise<string> {
  const prompt = `You are ${agentName}, a political agent with this identity: ${agentIdentity}

Your belief about "${targetBelief.label}" has evolved from:
"${targetBelief.description}"
to:
"${targetUpdate}"

Your current belief about the related topic "${connectedBelief.label}" is:
"${connectedBelief.description}"

Write an updated belief description for "${connectedBelief.label}" that reflects how your evolved understanding of "${targetBelief.label}" might subtly influence it.

Guidelines:
1. Make only VERY subtle adjustments - connected beliefs should change less than the primary belief
2. Stay true to your overall political orientation (${agentName === 'Alex' ? 'liberal' : 'conservative'})
3. Ensure the beliefs remain consistent with each other
4. The change should be logical but minimal
5. If no change is warranted, you may keep the belief exactly the same
6. Write ONLY the updated belief description in 1-2 sentences, similar in length to the original
7. Do not include any preamble, explanation, or commentary - just the new description

Updated description:`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to update connected belief');
  }

  const { response: updatedDescription } = await response.json();
  return updatedDescription.trim();
}

/**
 * Complete belief system update process
 */
export async function updateBeliefSystemFromReflection(
  reflection: string,
  beliefSystem: BeliefSystem,
  agentName: string,
  agentIdentity: string
): Promise<BeliefSystem> {
  console.log(`\n=== BELIEF UPDATE PROCESS FOR ${agentName.toUpperCase()} ===`);
  console.log(`Reflection: "${reflection}"`);
  
  // Step 1: Identify target belief
  console.log('\n1. IDENTIFYING TARGET BELIEF...');
  const { type: targetType, id: targetId, belief: targetBelief } = await identifyTargetBelief(reflection, beliefSystem);
  
  console.log(`✓ Target identified: ${targetType} - ${targetBelief.label} (${targetId})`);
  console.log(`  Current description: "${targetBelief.description}"`);

  // Step 2: Update the target belief
  console.log('\n2. UPDATING TARGET BELIEF...');
  const updatedTargetDescription = await updateTargetBelief(reflection, targetBelief, agentName, agentIdentity);
  console.log(`✓ Target belief updated:`);
  console.log(`  OLD: "${targetBelief.description}"`);
  console.log(`  NEW: "${updatedTargetDescription}"`);

  // Step 3: Find connected beliefs
  console.log('\n3. FINDING CONNECTED BELIEFS...');
  const connectedBeliefs = getConnectedBeliefs(targetType, targetId, beliefSystem);
  
  const totalConnected = connectedBeliefs.coreValues.length + connectedBeliefs.domainAreas.length + connectedBeliefs.specificIssues.length;
  console.log(`✓ Found ${totalConnected} connected beliefs:`);
  
  if (connectedBeliefs.coreValues.length > 0) {
    console.log(`  - ${connectedBeliefs.coreValues.length} Core Values: ${connectedBeliefs.coreValues.map(cv => cv.label).join(', ')}`);
  }
  if (connectedBeliefs.domainAreas.length > 0) {
    console.log(`  - ${connectedBeliefs.domainAreas.length} Domain Areas: ${connectedBeliefs.domainAreas.map(da => da.label).join(', ')}`);
  }
  if (connectedBeliefs.specificIssues.length > 0) {
    console.log(`  - ${connectedBeliefs.specificIssues.length} Specific Issues: ${connectedBeliefs.specificIssues.map(si => si.label).join(', ')}`);
  }

  // Step 4: Update connected beliefs
  console.log('\n4. UPDATING CONNECTED BELIEFS...');
  const updatedConnectedBeliefs = {
    coreValues: [] as CoreValue[],
    domainAreas: [] as DomainArea[],
    specificIssues: [] as SpecificIssue[]
  };

  // Update connected core values
  for (const cv of connectedBeliefs.coreValues) {
    console.log(`\n  Updating Core Value: ${cv.label}`);
    console.log(`    OLD: "${cv.description}"`);
    const updatedDescription = await updateConnectedBelief(targetBelief, updatedTargetDescription, cv, agentName, agentIdentity);
    console.log(`    NEW: "${updatedDescription}"`);
    updatedConnectedBeliefs.coreValues.push({ ...cv, description: updatedDescription });
  }

  // Update connected domain areas
  for (const da of connectedBeliefs.domainAreas) {
    console.log(`\n  Updating Domain Area: ${da.label}`);
    console.log(`    OLD: "${da.description}"`);
    const updatedDescription = await updateConnectedBelief(targetBelief, updatedTargetDescription, da, agentName, agentIdentity);
    console.log(`    NEW: "${updatedDescription}"`);
    updatedConnectedBeliefs.domainAreas.push({ ...da, description: updatedDescription });
  }

  // Update connected specific issues
  for (const si of connectedBeliefs.specificIssues) {
    console.log(`\n  Updating Specific Issue: ${si.label}`);
    console.log(`    OLD: "${si.description}"`);
    const updatedDescription = await updateConnectedBelief(targetBelief, updatedTargetDescription, si, agentName, agentIdentity);
    console.log(`    NEW: "${updatedDescription}"`);
    updatedConnectedBeliefs.specificIssues.push({ ...si, description: updatedDescription });
  }

  // Step 5: Apply updates to belief system
  console.log('\n5. APPLYING UPDATES TO BELIEF SYSTEM...');
  const updatedBeliefSystem: BeliefSystem = {
    coreValues: beliefSystem.coreValues.map(cv => {
      if (cv.id === targetId && targetType === 'core-value') {
        return { ...cv, description: updatedTargetDescription };
      }
      const updatedCV = updatedConnectedBeliefs.coreValues.find(ucv => ucv.id === cv.id);
      return updatedCV || cv;
    }),
    domainAreas: beliefSystem.domainAreas.map(da => {
      if (da.id === targetId && targetType === 'domain-area') {
        return { ...da, description: updatedTargetDescription };
      }
      const updatedDA = updatedConnectedBeliefs.domainAreas.find(uda => uda.id === da.id);
      return updatedDA || da;
    }),
    specificIssues: beliefSystem.specificIssues.map(si => {
      if (si.id === targetId && targetType === 'specific-issue') {
        return { ...si, description: updatedTargetDescription };
      }
      const updatedSI = updatedConnectedBeliefs.specificIssues.find(usi => usi.id === si.id);
      return updatedSI || si;
    })
  };

  console.log(`✓ Belief system update complete for ${agentName}`);
  console.log(`  - 1 target belief updated: ${targetBelief.label}`);
  console.log(`  - ${totalConnected} connected beliefs updated`);
  console.log(`=== END BELIEF UPDATE ===\n`);

  return updatedBeliefSystem;
}
