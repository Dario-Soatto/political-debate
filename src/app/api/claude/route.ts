// src/app/api/claude/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective, or use 'gpt-4o' for more capability
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const text = response.choices[0]?.message?.content || '';
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
