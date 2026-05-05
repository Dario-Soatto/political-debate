// src/app/page.tsx
'use client';

import { useState } from 'react';
import { PoliticalAgent } from '@/lib/agents/agent';
import { ConversationManager, ConversationTurn } from '@/lib/conversation/conversationManager';
import { createLiberalBeliefSystem, createConservativeBeliefSystem } from '@/lib/beliefs/beliefSystem';
import { addReflectionToAgent } from '@/lib/memory/reflection';
import { saveAgent } from '@/lib/database/agents';
import { saveConversation, saveConversationTurn, loadConversation as loadConversationFromDB } from '@/lib/database/conversations';
import { supabase } from '@/lib/database/supabase';
import { loadAgentWithMemories } from '@/lib/database/agents';

export default function Home() {
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [topic, setTopic] = useState('Should the government increase taxes on the wealthy?');
  const [numTurns, setNumTurns] = useState(6);
  const [agents, setAgents] = useState<{ liberal: PoliticalAgent | null, conservative: PoliticalAgent | null }>({
    liberal: null,
    conservative: null
  });
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [conversationTopics, setConversationTopics] = useState<Array<{topic: string, startIndex: number}>>([]);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedConversations, setSavedConversations] = useState<Array<{
    id: string,
    initial_topic: string,
    created_at: string,
    agent_names: string[]
  }>>([]);
  const [showConversationBrowser, setShowConversationBrowser] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showInfoBar, setShowInfoBar] = useState(false);

  const startNewConversation = async () => {
    setIsRunning(true);
    setConversationHistory([]);
    setConversationTopics([{topic, startIndex: 0}]); // Track initial topic

    try {
      // Create two agents with different political beliefs and belief systems
      const liberalAgent = new PoliticalAgent(
        'Alex',
        'I am an intelligent American individual interested in politics and society. I have strong opinions weakly held, I am maximally truth-seeking, am open to changing my mind, think rationally, and value evidence based reasoning. I am honest and direct and do not value sugarcoating or being polite for its own sake.',
        createLiberalBeliefSystem() // Add this parameter
      );

      const conservativeAgent = new PoliticalAgent(
        'Jordan',
        'I am an intelligent American individual interested in politics and society. I have strong opinions weakly held, I am maximally truth-seeking, am open to changing my mind, think rationally, and value evidence based reasoning. I am honest and direct and do not value sugarcoating or being polite for its own sake.',
        createConservativeBeliefSystem() // Add this parameter
      );

      // Store agents for memory display
      setAgents({ liberal: liberalAgent, conservative: conservativeAgent });

      // Create conversation manager
      const manager = new ConversationManager(liberalAgent, conservativeAgent);
      setConversationManager(manager);

      // Save agents first
      const liberalId = await saveAgent(liberalAgent);
      const conservativeId = await saveAgent(conservativeAgent);
      console.log('Agents saved:', { liberalId, conservativeId });

      // Save conversation to database
      const conversationId = await saveConversation(topic, liberalId, conservativeId);
      setCurrentConversationId(conversationId); // Add this back
      console.log('Conversation created:', conversationId);

      // Start the conversation and display first turn immediately
      const firstTurn = await manager.startConversation(topic);
      setConversationHistory([firstTurn]);

      // Save first turn to database
      await saveConversationTurn(conversationId, liberalId, firstTurn.message, 0);

      // Continue with remaining turns, displaying each one as it's generated
      for (let i = 1; i < numTurns; i++) {
        const turn = await manager.continueConversation();
        setConversationHistory(prev => [...prev, turn]);

        // Save each turn to database
        const agentId = turn.agentName === 'Alex' ? liberalId : conservativeId;
        await saveConversationTurn(conversationId, agentId, turn.message, i);
      }
    } catch (error) {
      console.error('Error running conversation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const continueConversation = async () => {
    if (!conversationManager) {
      console.error('No conversation manager available');
      return;
    }

    setIsRunning(true);

    try {
      // Snapshot starting turn index before the loop so subsequent turns are saved with the correct order
      const startIndex = conversationHistory.length;

      // Continue for the specified number of turns, displaying each one as it's generated
      for (let i = 0; i < numTurns; i++) {
        const newTurn = await conversationManager.continueConversation();
        setConversationHistory(prev => [...prev, newTurn]);

        // Save turn to database if we have a conversation ID
        if (currentConversationId && agents.liberal && agents.conservative) {
          const agentId = newTurn.agentName === 'Alex' ? agents.liberal.id : agents.conservative.id;
          await saveConversationTurn(currentConversationId, agentId, newTurn.message, startIndex + i);
        }
      }
    } catch (error) {
      console.error('Error continuing conversation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const addSingleTurn = async () => {
    if (!conversationManager) {
      console.error('No conversation manager available');
      return;
    }

    setIsRunning(true);

    try {
      const newTurn = await conversationManager.continueConversation();
      setConversationHistory(prev => [...prev, newTurn]);

      // Save turn to database if we have a conversation ID
      if (currentConversationId && agents.liberal && agents.conservative) {
        const agentId = newTurn.agentName === 'Alex' ? agents.liberal.id : agents.conservative.id;
        await saveConversationTurn(currentConversationId, agentId, newTurn.message, conversationHistory.length);
      }
    } catch (error) {
      console.error('Error adding turn:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const injectNewTopic = async () => {
    if (!conversationManager || !newTopic.trim()) {
      console.error('No conversation manager available or empty topic');
      return;
    }

    setIsRunning(true);

    try {
      const newTurn = await conversationManager.injectNewTopic(newTopic.trim());
      setConversationHistory(prev => [...prev, newTurn]);

      // Track the new topic
      setConversationTopics(prev => [...prev, {
        topic: newTopic.trim(),
        startIndex: conversationHistory.length
      }]);

      setNewTopic('');
      setShowTopicInput(false);
    } catch (error) {
      console.error('Error injecting new topic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const continueWithNewTopic = async () => {
    if (!conversationManager || !newTopic.trim()) {
      console.error('No conversation manager available or empty topic');
      return;
    }

    setIsRunning(true);

    try {
      // Snapshot starting turn index before any state updates / awaits below
      const startIndex = conversationHistory.length;

      const newTurns = await conversationManager.continueWithNewTopic(newTopic.trim(), numTurns - 1);

      // Track the new topic at the current conversation length
      setConversationTopics(prev => [...prev, {
        topic: newTopic.trim(),
        startIndex
      }]);

      setConversationHistory(prev => [...prev, ...newTurns]);

      // Save all new turns to database
      if (currentConversationId && agents.liberal && agents.conservative) {
        for (let i = 0; i < newTurns.length; i++) {
          const turn = newTurns[i];
          const agentId = turn.agentName === 'Alex' ? agents.liberal.id : agents.conservative.id;
          await saveConversationTurn(currentConversationId, agentId, turn.message, startIndex + i);
        }
      }

      setNewTopic('');
      setShowTopicInput(false);
    } catch (error) {
      console.error('Error continuing with new topic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const generateReflectionForAgent = async (agent: PoliticalAgent, agentType: 'liberal' | 'conservative') => {
    setIsGeneratingReflection(true);

    try {
      await addReflectionToAgent(agent, 5); // Reflect on last 5 memories

      // Force a re-render by updating the agents state
      setAgents(prev => ({
        ...prev,
        [agentType]: agent
      }));

      console.log(`Generated reflection for ${agent.name}`);
    } catch (error) {
      console.error(`Error generating reflection for ${agent.name}:`, error);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const saveAgentsToDatabase = async () => {
    if (!agents.liberal || !agents.conservative) {
      console.error('No agents to save');
      return;
    }

    setIsSaving(true);
    try {
      const liberalId = await saveAgent(agents.liberal);
      const conservativeId = await saveAgent(agents.conservative);

      console.log('Agents saved successfully:', { liberalId, conservativeId });
      alert('Agents saved to database!');
    } catch (error) {
      console.error('Failed to save agents:', error);
      alert('Failed to save agents');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedConversations = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          initial_topic,
          created_at,
          agent1:agents!agent1_id(name),
          agent2:agents!agent2_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to load conversations: ${error.message}`);
      }

      const conversations = data.map(conv => ({
        id: conv.id,
        initial_topic: conv.initial_topic,
        created_at: conv.created_at,
        agent_names: [
          Array.isArray(conv.agent1) ? conv.agent1[0]?.name || 'Unknown' : (conv.agent1 as { name: string })?.name || 'Unknown',
          Array.isArray(conv.agent2) ? conv.agent2[0]?.name || 'Unknown' : (conv.agent2 as { name: string })?.name || 'Unknown'
        ]
      }));

      setSavedConversations(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsRunning(true);

      // Load conversation data
      const conversationData = await loadConversationFromDB(conversationId);
      if (!conversationData) {
        alert('Failed to load conversation');
        return;
      }

      // Load the agents
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: convMeta } = await supabase
        .from('conversations')
        .select('agent1_id, agent2_id, initial_topic')
        .eq('id', conversationId)
        .single();

      if (!convMeta) {
        alert('Failed to load conversation metadata');
        return;
      }

      const liberalAgent = await loadAgentWithMemories(convMeta.agent1_id);
      const conservativeAgent = await loadAgentWithMemories(convMeta.agent2_id);

      if (!liberalAgent || !conservativeAgent) {
        alert('Failed to load agents');
        return;
      }

      // Convert database turns to UI format
      const uiTurns = conversationData.turns.map(turn => ({
        agentName: turn.agent_name,
        message: turn.message,
        timestamp: new Date(turn.created_at),
        memoriesUsed: [] // We don't store which memories were used, so empty array
      }));

      // Set up the conversation manager and populate its history
      const manager = new ConversationManager(liberalAgent, conservativeAgent);
      manager.populateConversationHistory(uiTurns);

      // Set up the UI
      setAgents({ liberal: liberalAgent, conservative: conservativeAgent });
      setConversationManager(manager);
      setCurrentConversationId(conversationId); // Add this line
      setConversationHistory(uiTurns);
      setConversationTopics([{ topic: convMeta.initial_topic, startIndex: 0 }]);
      setShowConversationBrowser(false);

      console.log(`Loaded conversation with ${uiTurns.length} turns`);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('Failed to load conversation');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
              Political AI Debate
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Two agents with opposing beliefs debate, reflect, and evolve.
            </p>
          </div>
          <button
            onClick={() => setShowInfoBar(!showInfoBar)}
            className="text-sm text-stone-500 transition-colors hover:text-stone-900"
          >
            {showInfoBar ? 'Hide details' : 'About this app'}
          </button>
        </header>

        {/* Info Section */}
        {showInfoBar && (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600 shadow-sm">
            <p className="mb-3">
              Two agents start with competing political beliefs, then discuss with each other and update their beliefs accordingly. Inspired by <em>Generative Agents: Interactive Simulacra of Human Behavior</em>:
            </p>
            <ul className="ml-1 list-disc space-y-1.5 pl-5 marker:text-stone-300">
              <li>The main orchestrator is GPT-4o (Claude often refused to roleplay as the conservative character).</li>
              <li>After each exchange, agents summarize and save it to their memory streams.</li>
              <li>Each turn, the LLMs perform RAG over their memories to find the most relevant ones.</li>
              <li>Agents can &quot;reflect&quot; — looking over recent memories, deriving new insights, and updating their beliefs.</li>
              <li>Beliefs are stored as a three-tiered tree in natural language and passed into the prompt.</li>
            </ul>
          </div>
        )}

        {/* Controls Card */}
        <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">
                Debate topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5 disabled:bg-stone-50 disabled:text-stone-500"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">
                Turns
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={numTurns}
                onChange={(e) => setNumTurns(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5 disabled:bg-stone-50 disabled:text-stone-500"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={startNewConversation}
              disabled={isRunning}
              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? 'Running…' : conversationManager ? 'New debate' : 'Start debate'}
            </button>

            {conversationManager && (
              <>
                <button
                  onClick={continueConversation}
                  disabled={isRunning}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue {numTurns} turns
                </button>
                <button
                  onClick={addSingleTurn}
                  disabled={isRunning}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +1 turn
                </button>
                <button
                  onClick={() => setShowTopicInput(!showTopicInput)}
                  disabled={isRunning}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {showTopicInput ? 'Cancel topic' : 'New topic'}
                </button>
                <button
                  onClick={saveAgentsToDatabase}
                  disabled={isRunning || isSaving}
                  className="ml-auto inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
                >
                  {isSaving ? 'Saving…' : 'Backup agents'}
                </button>
              </>
            )}
          </div>

          {/* New Topic Input Section */}
          {showTopicInput && (
            <div className="mt-5 border-t border-stone-200 pt-5">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">
                Inject new topic
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="What should they discuss next?"
                  className="flex-1 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5"
                  disabled={isRunning}
                />
                <button
                  onClick={injectNewTopic}
                  disabled={isRunning || !newTopic.trim()}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add only
                </button>
                <button
                  onClick={continueWithNewTopic}
                  disabled={isRunning || !newTopic.trim()}
                  className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add + {numTurns} turns
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Conversation */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Conversation</h2>
              {conversationHistory.length > 0 && (
                <span className="text-xs text-stone-400">{conversationHistory.length} {conversationHistory.length === 1 ? 'turn' : 'turns'}</span>
              )}
            </div>

            {conversationHistory.length === 0 && !isRunning ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <p className="mb-6 text-sm text-stone-500">
                  Start a fresh debate or load a previous conversation.
                </p>
                <button
                  onClick={() => {
                    setShowConversationBrowser(true);
                    loadSavedConversations();
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
                >
                  Load conversation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationHistory.map((turn, index) => {
                  const topicForThisTurn = conversationTopics.find(t => t.startIndex === index);
                  const isAlex = turn.agentName === 'Alex';
                  return (
                    <div key={index}>
                      {topicForThisTurn && (
                        <div className="my-6 flex items-center gap-3">
                          <div className="h-px flex-1 bg-stone-200" />
                          <span className="whitespace-nowrap text-xs uppercase tracking-wider text-stone-500">
                            <span className="font-medium">{index === 0 ? 'Initial topic' : 'New topic'}:</span>{' '}
                            <span className="font-normal normal-case tracking-normal text-stone-700">{topicForThisTurn.topic}</span>
                          </span>
                          <div className="h-px flex-1 bg-stone-200" />
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${isAlex ? 'bg-sky-600' : 'bg-rose-600'}`}>
                          {isAlex ? 'A' : 'J'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`rounded-2xl border p-4 ${isAlex ? 'border-sky-100 bg-sky-50/60' : 'border-rose-100 bg-rose-50/60'}`}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-3">
                              <h3 className={`text-sm font-semibold ${isAlex ? 'text-sky-900' : 'text-rose-900'}`}>
                                {turn.agentName}
                                <span className="ml-1.5 font-normal text-stone-500">· {isAlex ? 'Liberal' : 'Conservative'}</span>
                              </h3>
                              <span className="text-xs text-stone-400">{turn.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-stone-800">{turn.message}</p>
                          </div>

                          {turn.memoriesUsed && turn.memoriesUsed.length > 0 && (
                            <details className="mt-2 ml-1 group">
                              <summary className="cursor-pointer list-none text-xs text-stone-500 transition-colors hover:text-stone-900">
                                <span className="inline-block transition-transform group-open:rotate-90">›</span>{' '}
                                {turn.memoriesUsed.length} {turn.memoriesUsed.length === 1 ? 'memory' : 'memories'} used
                              </summary>
                              <div className="mt-2 space-y-1.5 pl-3">
                                {turn.memoriesUsed.map((memory) => (
                                  <div key={memory.id} className="flex gap-2 rounded-lg border border-stone-200 bg-white p-2.5">
                                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                      memory.type === 'observation' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                                    }`}>
                                      {memory.type}
                                    </span>
                                    <span className="text-xs text-stone-600">{memory.description}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isRunning && (
                  <div className="flex items-center gap-2 pl-12 pt-1 text-xs text-stone-400">
                    <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-stone-400" />
                    Thinking…
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Agent Sidebar */}
          <aside className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Agents</h2>

            {!agents.liberal && !agents.conservative && (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">
                Memories and beliefs will appear here once a debate starts.
              </div>
            )}

            {agents.liberal && (
              <AgentCard
                agent={agents.liberal}
                variant="liberal"
                onReflect={() => generateReflectionForAgent(agents.liberal!, 'liberal')}
                isReflecting={isGeneratingReflection}
              />
            )}

            {agents.conservative && (
              <AgentCard
                agent={agents.conservative}
                variant="conservative"
                onReflect={() => generateReflectionForAgent(agents.conservative!, 'conservative')}
                isReflecting={isGeneratingReflection}
              />
            )}
          </aside>
        </div>
      </div>

      {/* Conversation Browser Modal */}
      {showConversationBrowser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
          onClick={() => setShowConversationBrowser(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-stone-200 p-5">
              <h3 className="text-lg font-semibold text-stone-900">Load previous conversation</h3>
              <p className="mt-1 text-sm text-stone-500">Pick up where you left off.</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {savedConversations.length === 0 ? (
                <p className="p-4 text-sm text-stone-500">No saved conversations found.</p>
              ) : (
                <div className="space-y-1">
                  {savedConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className="w-full rounded-lg border border-transparent p-3 text-left transition-colors hover:border-stone-200 hover:bg-stone-50"
                    >
                      <div className="line-clamp-1 text-sm font-medium text-stone-900">{conv.initial_topic}</div>
                      <div className="mt-0.5 text-xs text-stone-500">
                        {conv.agent_names.join(' vs ')} · {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-stone-200 p-4">
              <button
                onClick={() => setShowConversationBrowser(false)}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  variant,
  onReflect,
  isReflecting,
}: {
  agent: PoliticalAgent;
  variant: 'liberal' | 'conservative';
  onReflect: () => void;
  isReflecting: boolean;
}) {
  const isLiberal = variant === 'liberal';
  const observationCount = agent.memories.filter(m => m.type === 'observation').length;
  const colors = isLiberal
    ? { avatar: 'bg-sky-600', name: 'text-sky-900' }
    : { avatar: 'bg-rose-600', name: 'text-rose-900' };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 p-4">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${colors.avatar}`}>
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className={`text-sm font-semibold ${colors.name}`}>{agent.name}</div>
            <div className="text-xs text-stone-500">{isLiberal ? 'Liberal' : 'Conservative'}</div>
          </div>
        </div>
        <button
          onClick={onReflect}
          disabled={isReflecting || observationCount === 0}
          className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isReflecting ? 'Reflecting…' : 'Reflect'}
        </button>
      </div>

      <div className="divide-y divide-stone-100">
        <Disclosure title="Memories" count={agent.memories.length}>
          {agent.memories.length === 0 ? (
            <p className="text-xs text-stone-400">No memories yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {agent.memories.map(memory => (
                <div key={memory.id} className="rounded-lg border border-stone-100 bg-stone-50/60 p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      memory.type === 'observation' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                    }`}>
                      {memory.type}
                    </span>
                    <span className="text-[10px] text-stone-400">{memory.createdAt.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-700">{memory.description}</p>
                </div>
              ))}
            </div>
          )}
        </Disclosure>

        <Disclosure title="Core values" count={agent.beliefSystem.coreValues.length}>
          <BeliefList items={agent.beliefSystem.coreValues} />
        </Disclosure>
        <Disclosure title="Policy domains" count={agent.beliefSystem.domainAreas.length}>
          <BeliefList items={agent.beliefSystem.domainAreas} />
        </Disclosure>
        <Disclosure title="Specific issues" count={agent.beliefSystem.specificIssues.length}>
          <BeliefList items={agent.beliefSystem.specificIssues} />
        </Disclosure>
      </div>
    </div>
  );
}

function Disclosure({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs text-stone-500">
          {count}
          <span className="text-stone-300 transition-transform group-open:rotate-90">›</span>
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

function BeliefList({
  items,
}: {
  items: Array<{ id: string; label: string; description: string }>;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-stone-400">None.</p>;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {items.map(item => (
        <div key={item.id} className="border-l-2 border-stone-200 pl-3">
          <h5 className="text-xs font-medium text-stone-900">{item.label}</h5>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
