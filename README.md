# Political Simulator 2

An AI-powered political debate simulator featuring two agents with opposing political beliefs that engage in dynamic conversations. The agents have sophisticated belief systems, memory streams, and the ability to evolve their beliefs through reflections on their experiences.

## Features

### 🤖 Intelligent AI Agents
- **Alex (Liberal)**: Progressive agent supporting government programs, social justice, and environmental protection
- **Jordan (Conservative)**: Conservative agent favoring limited government, free markets, and traditional values
- Both agents powered by OpenAI's GPT-4o-mini for natural conversations

### 🧠 Sophisticated Belief Systems
- **Three-layer hierarchy**: Core Values → Domain Areas → Specific Issues
- **8 Core Values**: Individual Liberty, Collective Welfare, Equality, Tradition & Authority, Security & Order, Economic Efficiency, Social Justice, National Sovereignty
- **6 Domain Areas**: Fiscal Policy, Monetary Policy, Social Policy, Foreign Policy, Civil Liberties, Environmental Policy
- **26 Specific Issues**: Tax levels, healthcare, abortion rights, gun rights, climate action, and more

### 💭 Memory & Reflection System
- **Memory Stream**: Each agent maintains a comprehensive record of experiences
- **Two Memory Types**: Observations (direct experiences) and Reflections (philosophical insights)
- **Vector-based Retrieval**: Uses OpenAI embeddings and cosine similarity to retrieve relevant memories
- **Recency Scoring**: Memory relevance decays over time using exponential decay

### 🔄 Belief Evolution
- **Reflection Generation**: Agents create philosophical insights from recent experiences
- **Belief Updates**: Reflections trigger updates to the most relevant beliefs
- **Propagation**: Changes cascade through connected beliefs to maintain consistency
- **Gradual Evolution**: Beliefs change subtly over time, maintaining agent identity

### 🎮 Interactive UI
- **Real-time Conversations**: Watch agents debate in real-time
- **Topic Injection**: Add new topics to ongoing conversations
- **Memory Visualization**: View each agent's complete memory stream
- **Belief System Explorer**: Inspect the full three-layer belief hierarchy
- **Reflection Controls**: Manually trigger reflections and belief updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd political-simulator-2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Starting a Debate
1. Enter a political topic in the "Debate Topic" field
2. Set the number of conversation turns
3. Click "Start New Debate" to begin

### Managing Conversations
- **Continue Conversation**: Add more turns to the current debate
- **+1 Turn**: Add a single additional turn
- **New Topic**: Inject a new topic into the ongoing conversation

### Exploring Agent State
- **Memory Stream**: View each agent's experiences and reflections
- **Belief System**: Explore the hierarchical belief structure
- **Generate Reflection**: Trigger philosophical reflection and belief updates

### Belief Evolution
1. Let agents have several conversation turns
2. Click "Generate Reflection" for an agent
3. Watch the console for detailed belief update logs
4. Observe changes in the belief system display

## Architecture

### Core Components

- **`/src/types/agent.ts`**: TypeScript interfaces for agents, memories, and beliefs
- **`/src/lib/agents/`**: Agent implementation and OpenAI integration
- **`/src/lib/memory/`**: Memory storage, retrieval, and reflection systems
- **`/src/lib/beliefs/`**: Belief system definitions and update mechanisms
- **`/src/lib/conversation/`**: Conversation management and orchestration
- **`/src/lib/retrieval/`**: Vector embeddings and similarity calculations

### API Routes

- **`/api/claude`**: OpenAI API integration for text generation
- **`/api/embeddings`**: OpenAI embeddings for memory retrieval

### Memory System Flow

1. **Conversation** → **Memory Creation** (condensed via OpenAI)
2. **Memory Storage** → **Vector Embedding** (OpenAI embeddings)
3. **Memory Retrieval** → **Relevance Scoring** (cosine similarity + recency)
4. **Reflection Generation** → **Belief Updates** → **System Evolution**

## Technical Details

### Memory Retrieval
- Combines recency scores (exponential decay) with relevance scores (cosine similarity)
- Default weighting: 30% recency, 70% relevance
- Retrieves top 5 memories per conversation turn

### Belief Update Process
1. **Target Identification**: OpenAI analyzes reflection against all beliefs
2. **Primary Update**: Target belief description evolves based on reflection
3. **Connected Updates**: Related beliefs update subtly for consistency
4. **Propagation**: Changes flow through the hierarchical structure

### Conversation Management
- Maintains conversation history with timestamps
- Tracks which memories influenced each response
- Supports topic injection and continuation
- Preserves agent state across interactions

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
├── lib/
│   ├── agents/         # Agent logic and OpenAI integration
│   ├── beliefs/        # Belief system and updates
│   ├── conversation/   # Conversation management
│   ├── memory/         # Memory and reflection systems
│   └── retrieval/      # Embeddings and similarity
└── types/              # TypeScript definitions
```

### Key Technologies
- **Next.js 15**: React framework with app router
- **TypeScript**: Type-safe development
- **OpenAI API**: GPT-4o-mini for conversations, embeddings for retrieval
- **Tailwind CSS**: Styling and responsive design

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Inspiration

This project is inspired by the "Generative Agents" paper, implementing key concepts:
- Memory streams with observations and reflections
- Vector-based memory retrieval
- Belief system evolution through experience
- Agent behavior informed by past experiences

## Future Enhancements
