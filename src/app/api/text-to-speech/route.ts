// /app/api/tts/elevenlabs/route.ts

import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();
    console.log(voice)

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ElevenLabs API key' }, { status: 500 });
    }

    // Initialize the ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey,
    });

    // Generate speech using the SDK
    const audio = await elevenlabs.textToSpeech.convert(voice, {
      text: text,
      model_id: 'eleven_turbo_v2',
    });

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      audioUrl: `data:audio/mp3;base64,${base64Audio}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'TTS generation failed', details: String(err) },
      { status: 500 }
    );
  }
}