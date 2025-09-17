// src/app/api/claude/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Claude error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
