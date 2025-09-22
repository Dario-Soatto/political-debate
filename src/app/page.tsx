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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [savedConversations, setSavedConversations] = useState<Array<{
    id: string,
    initial_topic: string,
    created_at: string,
    agent_names: string[]
  }>>([]);
  const [showConversationBrowser, setShowConversationBrowser] = useState(false);

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
      setCurrentConversationId(conversationId);
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
      // Continue for the specified number of turns
      for (let i = 0; i < numTurns; i++) {
        const newTurn = await conversationManager.continueConversation();
        setConversationHistory(prev => [...prev, newTurn]);
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
      const newTurns = await conversationManager.continueWithNewTopic(newTopic.trim(), numTurns - 1);
      
      // Track the new topic at the current conversation length
      setConversationTopics(prev => [...prev, {
        topic: newTopic.trim(), 
        startIndex: conversationHistory.length
      }]);
      
      setConversationHistory(prev => [...prev, ...newTurns]);
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
        agent_names: [(conv.agent1 as any)?.name || 'Unknown', (conv.agent2 as any)?.name || 'Unknown']
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
      setCurrentConversationId(conversationId);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold font-mono text-black text-center mb-8">Political AI Debate</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debate Topic:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Turns:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={numTurns}
                onChange={(e) => setNumTurns(parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                disabled={isRunning}
              />
            </div>
          </div>
          
          <div className="flex gap-3 mb-4">
            <button
              onClick={startNewConversation}
              disabled={isRunning}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Start New Debate'}
            </button>
            
            {conversationManager && (
              <>
                <button
                  onClick={continueConversation}
                  disabled={isRunning}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isRunning ? 'Running...' : `Continue ${numTurns} Turns`}
                </button>
                
                <button
                  onClick={addSingleTurn}
                  disabled={isRunning}
                  className="bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  +1 Turn
                </button>

                <button
                  onClick={() => setShowTopicInput(!showTopicInput)}
                  disabled={isRunning}
                  className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  New Topic
                </button>

                <button
                  onClick={saveAgentsToDatabase}
                  disabled={isRunning || isSaving}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Agents'}
                </button>
              </>
            )}
          </div>

          {/* New Topic Input Section */}
          {showTopicInput && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inject New Topic:
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Enter a new topic to discuss..."
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500"
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Turns:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numTurns}
                    onChange={(e) => setNumTurns(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                    disabled={isRunning}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={injectNewTopic}
                  disabled={isRunning || !newTopic.trim()}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  Add Topic Only
                </button>
                <button
                  onClick={continueWithNewTopic}
                  disabled={isRunning || !newTopic.trim()}
                  className="flex-1 bg-purple-700 text-white py-2 px-4 rounded-md hover:bg-purple-800 disabled:opacity-50"
                >
                  Add Topic + {numTurns} Turns
                </button>
                <button
                  onClick={() => {setShowTopicInput(false); setNewTopic('');}}
                  disabled={isRunning}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {conversationHistory.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Total turns: {conversationHistory.length}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation History */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold font-mono text-black mb-4">Conversation</h2>
            <div className="space-y-4">
              {conversationHistory.map((turn, index) => {
                // Check if we should show a topic header before this turn
                const topicForThisTurn = conversationTopics.find(t => t.startIndex === index);
                
                return (
                  <div key={index}>
                    {/* Show topic header if this turn starts a new topic */}
                    {topicForThisTurn && (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                        <h3 className="font-semibold text-yellow-800 mb-2">
                          {index === 0 ? '📋 Initial Topic:' : '🔄 New Topic:'}
                        </h3>
                        <p className="text-yellow-700">{topicForThisTurn.topic}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div
                        className={`p-4 rounded-lg ${
                          turn.agentName === 'Alex'
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'bg-red-100 border-l-4 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-lg text-black">
                            {turn.agentName} {turn.agentName === 'Alex' ? '(Liberal)' : '(Conservative)'}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {turn.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800">{turn.message}</p>
                      </div>
                      
                      {/* Show memories used for this response */}
                      {turn.memoriesUsed && turn.memoriesUsed.length > 0 && (
                        <div className={`ml-4 p-3 rounded border-l-2 ${
                          turn.agentName === 'Alex' ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'
                        }`}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Memories used ({turn.memoriesUsed.length}):
                          </h4>
                          <div className="space-y-1">
                            {turn.memoriesUsed.map((memory) => (
                              <div key={memory.id} className="text-xs text-gray-600 bg-white p-2 rounded">
                                <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                                  memory.type === 'observation' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {memory.type}
                                </span>
                                {memory.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {conversationHistory.length === 0 && !isRunning && (
              <div className="text-center text-gray-500 mt-8">
                Click &quot;Start Debate&quot; to watch two AI agents with different political beliefs discuss a topic.
              </div>
            )}
          </div>

          {/* Agent Memories and Beliefs */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-mono text-black">Agent Memories & Beliefs</h2>
            
            {/* Alex's Memories and Beliefs */}
            {agents.liberal && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-800">Alex (Liberal)</h3>
                  <button
                    onClick={() => generateReflectionForAgent(agents.liberal!, 'liberal')}
                    disabled={isGeneratingReflection || agents.liberal.memories.filter(m => m.type === 'observation').length === 0}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGeneratingReflection ? 'Reflecting...' : 'Generate Reflection'}
                  </button>
                </div>
                
                {/* Memories Section */}
                <div className="mb-4">
                  <h4 className="font-medium text-blue-700 mb-2">Memories ({agents.liberal.memories.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.liberal.memories.map((memory) => (
                      <div key={memory.id} className="bg-white p-3 rounded border-l-2 border-blue-300">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            memory.type === 'observation' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {memory.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {memory.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{memory.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beliefs Section */}
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">Belief System</h4>
                  <div className="space-y-3">
                    
                    {/* Core Values */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-blue-800 hover:bg-blue-50">
                        Core Values ({agents.liberal.beliefSystem.coreValues.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2">
                        {agents.liberal.beliefSystem.coreValues.map((value) => (
                          <div key={value.id} className="border-l-2 border-blue-200 pl-3">
                            <h5 className="font-medium text-sm text-blue-900">{value.label}</h5>
                            <p className="text-xs text-gray-600">{value.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Domain Areas */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-blue-800 hover:bg-blue-50">
                        Policy Domains ({agents.liberal.beliefSystem.domainAreas.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2">
                        {agents.liberal.beliefSystem.domainAreas.map((domain) => (
                          <div key={domain.id} className="border-l-2 border-blue-300 pl-3">
                            <h5 className="font-medium text-sm text-blue-900">{domain.label}</h5>
                            <p className="text-xs text-gray-600">{domain.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Specific Issues */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-blue-800 hover:bg-blue-50">
                        Specific Issues ({agents.liberal.beliefSystem.specificIssues.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
                        {agents.liberal.beliefSystem.specificIssues.map((issue) => (
                          <div key={issue.id} className="border-l-2 border-blue-400 pl-3">
                            <h5 className="font-medium text-sm text-blue-900">{issue.label}</h5>
                            <p className="text-xs text-gray-600">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}

            {/* Jordan's Memories and Beliefs */}
            {agents.conservative && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-red-800">Jordan (Conservative)</h3>
                  <button
                    onClick={() => generateReflectionForAgent(agents.conservative!, 'conservative')}
                    disabled={isGeneratingReflection || agents.conservative.memories.filter(m => m.type === 'observation').length === 0}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {isGeneratingReflection ? 'Reflecting...' : 'Generate Reflection'}
                  </button>
                </div>
                
                {/* Memories Section */}
                <div className="mb-4">
                  <h4 className="font-medium text-red-700 mb-2">Memories ({agents.conservative.memories.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.conservative.memories.map((memory) => (
                      <div key={memory.id} className="bg-white p-3 rounded border-l-2 border-red-300">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            memory.type === 'observation' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {memory.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {memory.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{memory.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beliefs Section */}
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Belief System</h4>
                  <div className="space-y-3">
                    
                    {/* Core Values */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-red-800 hover:bg-red-50">
                        Core Values ({agents.conservative.beliefSystem.coreValues.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2">
                        {agents.conservative.beliefSystem.coreValues.map((value) => (
                          <div key={value.id} className="border-l-2 border-red-200 pl-3">
                            <h5 className="font-medium text-sm text-red-900">{value.label}</h5>
                            <p className="text-xs text-gray-600">{value.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Domain Areas */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-red-800 hover:bg-red-50">
                        Policy Domains ({agents.conservative.beliefSystem.domainAreas.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2">
                        {agents.conservative.beliefSystem.domainAreas.map((domain) => (
                          <div key={domain.id} className="border-l-2 border-red-300 pl-3">
                            <h5 className="font-medium text-sm text-red-900">{domain.label}</h5>
                            <p className="text-xs text-gray-600">{domain.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Specific Issues */}
                    <details className="bg-white rounded border">
                      <summary className="p-3 cursor-pointer font-medium text-red-800 hover:bg-red-50">
                        Specific Issues ({agents.conservative.beliefSystem.specificIssues.length})
                      </summary>
                      <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
                        {agents.conservative.beliefSystem.specificIssues.map((issue) => (
                          <div key={issue.id} className="border-l-2 border-red-400 pl-3">
                            <h5 className="font-medium text-sm text-red-900">{issue.label}</h5>
                            <p className="text-xs text-gray-600">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowConversationBrowser(true);
              loadSavedConversations();
            }}
            disabled={isRunning}
            className="bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Load Conversation
          </button>
        </div>

        {/* Conversation Browser Modal */}
        {showConversationBrowser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Load Previous Conversation</h3>
              
              {savedConversations.length === 0 ? (
                <p className="text-gray-500">No saved conversations found.</p>
              ) : (
                <div className="space-y-2">
                  {savedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadConversation(conv.id)}
                    >
                      <div className="font-medium">{conv.initial_topic}</div>
                      <div className="text-sm text-gray-600">
                        {conv.agent_names.join(' vs ')} • {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowConversationBrowser(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
