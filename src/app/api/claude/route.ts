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
      model: 'gpt-5',
      max_completion_tokens: 500,
      reasoning_effort: 'minimal',
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
