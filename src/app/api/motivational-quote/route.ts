import { NextResponse } from 'next/server';
import { generateMotivationalQuote } from '@/lib/gemini';

export async function GET() {
  try {
    const quote = await generateMotivationalQuote();
    
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error('Error in motivational-quote API:', error);
    return NextResponse.json(
      { error: 'Failed to generate motivational quote' },
      { status: 500 }
    );
  }
}