// src/lib/conversation/conversationManager.ts
import { PoliticalAgent } from '@/lib/agents/agent';
import { ConversationContext, Memory } from '@/types/agent';

export interface ConversationTurn {
  agentName: string;
  message: string;
  timestamp: Date;
  memoriesUsed: Memory[]; // Add this field
}

export class ConversationManager {
  private agent1: PoliticalAgent;
  private agent2: PoliticalAgent;
  private conversationHistory: ConversationTurn[] = [];
  private maxHistoryLength: number = 10; // Keep last 10 messages for context

  constructor(agent1: PoliticalAgent, agent2: PoliticalAgent) {
    this.agent1 = agent1;
    this.agent2 = agent2;
  }

  /**
   * Start a conversation with an initial topic
   */
  async startConversation(initialTopic: string): Promise<ConversationTurn> {
    // Agent 1 starts the conversation
    const context: ConversationContext = {
      currentMessage: initialTopic,
      recentHistory: [],
    };

    const { response, memoriesUsed } = await this.agent1.generateResponseWithMemories(context);
    
    const turn: ConversationTurn = {
      agentName: this.agent1.name,
      message: response,
      timestamp: new Date(),
      memoriesUsed,
    };

    this.conversationHistory.push(turn);
    return turn;
  }

  /**
   * Continue the conversation - the other agent responds
   */
  async continueConversation(): Promise<ConversationTurn> {
    if (this.conversationHistory.length === 0) {
      throw new Error('Conversation not started. Call startConversation first.');
    }

    // Determine which agent should respond next
    const lastTurn = this.conversationHistory[this.conversationHistory.length - 1];
    const respondingAgent = lastTurn.agentName === this.agent1.name ? this.agent2 : this.agent1;

    // Build context from recent history
    const recentHistory = this.conversationHistory
      .slice(-this.maxHistoryLength)
      .map(turn => `${turn.agentName}: ${turn.message}`);

    const context: ConversationContext = {
      currentMessage: lastTurn.message,
      recentHistory: recentHistory.slice(0, -1), // Exclude the current message
    };

    const { response, memoriesUsed } = await respondingAgent.generateResponseWithMemories(context);
    
    const turn: ConversationTurn = {
      agentName: respondingAgent.name,
      message: response,
      timestamp: new Date(),
      memoriesUsed,
    };

    this.conversationHistory.push(turn);
    return turn;
  }

  /**
   * Get the full conversation history
   */
  getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }

  /**
   * Run multiple turns of conversation
   */
  async runConversation(initialTopic: string, numTurns: number): Promise<ConversationTurn[]> {
    // Start the conversation
    await this.startConversation(initialTopic);

    // Continue for the specified number of turns
    for (let i = 0; i < numTurns - 1; i++) {
      await this.continueConversation();
    }

    return this.getConversationHistory();
  }

  /**
   * Inject a new topic into the ongoing conversation
   */
  async injectNewTopic(newTopic: string): Promise<ConversationTurn> {
    // The next agent in line responds to the new topic
    const lastTurn = this.conversationHistory.length > 0 
      ? this.conversationHistory[this.conversationHistory.length - 1]
      : null;
    
    const respondingAgent = !lastTurn || lastTurn.agentName === this.agent1.name 
      ? this.agent2 
      : this.agent1;

    // Build context with the new topic and recent history
    const recentHistory = this.conversationHistory
      .slice(-this.maxHistoryLength)
      .map(turn => `${turn.agentName}: ${turn.message}`);

    const context: ConversationContext = {
      currentMessage: newTopic,
      recentHistory,
    };

    const { response, memoriesUsed } = await respondingAgent.generateResponseWithMemories(context);
    
    const turn: ConversationTurn = {
      agentName: respondingAgent.name,
      message: response,
      timestamp: new Date(),
      memoriesUsed,
    };

    this.conversationHistory.push(turn);
    return turn;
  }

  /**
   * Continue conversation with a new topic and then run additional turns
   */
  async continueWithNewTopic(newTopic: string, additionalTurns: number): Promise<ConversationTurn[]> {
    // Inject the new topic
    const topicTurn = await this.injectNewTopic(newTopic);
    const newTurns = [topicTurn];

    // Continue for additional turns
    for (let i = 0; i < additionalTurns; i++) {
      const turn = await this.continueConversation();
      newTurns.push(turn);
    }

    return newTurns;
  }

  /**
   * Populate conversation history from loaded data
   */
  populateConversationHistory(turns: ConversationTurn[]): void {
    this.conversationHistory = [...turns];
    console.log(`Populated conversation history with ${turns.length} turns`);
  }
}
