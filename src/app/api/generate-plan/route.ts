import { NextRequest, NextResponse } from 'next/server';
import { generateFitnessPlan, UserProfile } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    console.log('Generate plan API called');
    
    const userProfile: UserProfile = await request.json();
    console.log('User profile received:', {
      name: userProfile.name,
      age: userProfile.age,
      fitnessGoal: userProfile.fitnessGoal,
      fitnessLevel: userProfile.fitnessLevel
    });
    
    // Validate required fields
    if (!userProfile.name || !userProfile.age || !userProfile.height || !userProfile.weight) {
      console.error('Missing required fields:', {
        name: !!userProfile.name,
        age: !!userProfile.age,
        height: !!userProfile.height,
        weight: !!userProfile.weight
      });
      return NextResponse.json(
        { error: 'Missing required user profile information' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    console.log('Calling generateFitnessPlan...');
    const plan = await generateFitnessPlan(userProfile);
    console.log('Plan generated successfully');
    
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error in generate-plan API:', error);
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to generate fitness plan',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}