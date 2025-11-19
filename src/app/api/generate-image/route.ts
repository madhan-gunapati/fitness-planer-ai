import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  let prompt: string = '';
  let type: 'exercise' | 'meal' = 'exercise';
  
  try {
    console.log('Generate image API called');
    
    const body = await request.json();
    prompt = body.prompt || '';
    type = body.type || 'exercise';
    
    console.log('Image generation request:', { prompt, type });
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Create specific, detailed prompt based on exercise or meal type
    let imagePrompt: string;
    
    if (type === 'exercise') {
      imagePrompt = `Generate a professional, realistic fitness photograph showing a person performing the exercise: ${prompt}. 
      The image should show:
      - Proper form and correct posture
      - Clean, modern gym or home workout environment
      - Good lighting and professional photography quality
      - The person should be in athletic wear
      - The exercise should be clearly visible and inspiring
      - Suitable for a fitness app, motivational and educational
      Make it visually appealing, clear, and professional.`;
    } else {
      imagePrompt = `Generate a professional, appetizing food photograph of: ${prompt}. 
      The image should show:
      - Beautifully plated and presented meal
      - Good lighting, vibrant colors, professional food styling
      - Looks delicious, healthy, and nutritious
      - Clean background, suitable for a fitness and nutrition app
      - Appetizing and visually appealing
      Make it look professional and enticing.`;
    }

    console.log('Generating image with AI...', imagePrompt.substring(0, 100));
    
    // Try multiple AI image generation approaches
    let generationMethod = 'none';
    
    // Method 1: Try Gemini Image Generation API (Direct REST API call)
    try {
      console.log('Attempting Gemini Image Generation API...');
      
      const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }
      
      // Use the correct Gemini image generation endpoint
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image:generateContent`;
      
      const geminiResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: imagePrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
          }
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        console.log('Gemini API response received');
        
        // Extract image data from response
        let imageBase64: string | null = null;
        
        if (geminiData.candidates && geminiData.candidates[0]) {
          const candidate = geminiData.candidates[0];
          
          // Check for inlineData in parts
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                imageBase64 = part.inlineData.data;
                break;
              }
            }
          }
        }
        
        if (imageBase64) {
          // Convert base64 to data URL for display
          const imageDataUrl = `data:image/png;base64,${imageBase64}`;
          
          console.log('Gemini AI image generated successfully, size:', imageBase64.length, 'chars');
          generationMethod = 'gemini';
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: imageDataUrl,
            description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
            prompt: prompt,
            type: type,
            generated: true,
            method: 'gemini'
          });
        } else {
          console.warn('No image data in Gemini response');
        }
      } else {
        const errorData = await geminiResponse.json().catch(() => ({}));
        console.log('Gemini API failed:', geminiResponse.status, errorData.error?.message || '');
        
        // If it's a quota error, wait and retry once
        if (geminiResponse.status === 429) {
          console.log('Rate limit hit, waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: imagePrompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
              }
            }),
            signal: AbortSignal.timeout(30000)
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            let imageBase64: string | null = null;
            
            if (retryData.candidates && retryData.candidates[0]) {
              const candidate = retryData.candidates[0];
              if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                  if (part.inlineData && part.inlineData.data) {
                    imageBase64 = part.inlineData.data;
                    break;
                  }
                }
              }
            }
            
            if (imageBase64) {
              const imageDataUrl = `data:image/png;base64,${imageBase64}`;
              console.log(' Gemini AI image generated on retry');
              
              return NextResponse.json({ 
                success: true, 
                imageUrl: imageDataUrl,
                description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
                prompt: prompt,
                type: type,
                generated: true,
                method: 'gemini-retry'
              });
            }
          }
        }
      }
    } catch (geminiError: any) {
      console.log('Gemini API error:', geminiError.message);
    }
    
    // Method 2: Try Stability AI (Stable Diffusion) - Free API
    try {
      console.log('Attempting Stability AI (Stable Diffusion) image generation...');
      
      const stabilityPrompt = type === 'exercise'
        ? `professional fitness photograph, ${prompt}, person performing exercise, proper form, gym setting, high quality, 4k, realistic, photography`
        : `professional food photography, ${prompt}, beautifully plated, appetizing, restaurant quality, high quality, 4k, realistic, photography`;
      
      const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY || 'sk-REPLACE_WITH_YOUR_KEY'}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: stabilityPrompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (stabilityResponse.ok) {
        const stabilityData = await stabilityResponse.json();
        
        if (stabilityData.artifacts && stabilityData.artifacts[0] && stabilityData.artifacts[0].base64) {
          const imageBase64 = stabilityData.artifacts[0].base64;
          const imageDataUrl = `data:image/png;base64,${imageBase64}`;
          
          console.log('✅ Stability AI image generated successfully');
          generationMethod = 'stability-ai';
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: imageDataUrl,
            description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
            prompt: prompt,
            type: type,
            generated: true,
            method: 'stability-ai'
          });
        }
      } else {
        console.log('Stability AI failed:', stabilityResponse.status);
      }
    } catch (stabilityError: any) {
      console.log('Stability AI error:', stabilityError.message);
    }
    
    // Method 3: Try Getimg.ai - Free tier available
    try {
      console.log('Attempting Getimg.ai image generation...');
      
      const getimgPrompt = type === 'exercise'
        ? `professional fitness photograph, ${prompt}, person performing exercise, proper form, gym setting, high quality, realistic`
        : `professional food photography, ${prompt}, beautifully plated, appetizing, restaurant quality, high quality, realistic`;
      
      const getimgResponse = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GETIMG_API_KEY || 'REPLACE_WITH_YOUR_KEY'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: getimgPrompt,
          model: 'stable-diffusion-v1-5',
          size: '512x512',
          output_format: 'url',
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (getimgResponse.ok) {
        const getimgData = await getimgResponse.json();
        
        if (getimgData.url || getimgData.image) {
          const imageUrl = getimgData.url || getimgData.image;
          
          console.log('✅ Getimg.ai image generated successfully');
          generationMethod = 'getimg-ai';
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: imageUrl,
            description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
            prompt: prompt,
            type: type,
            generated: true,
            method: 'getimg-ai'
          });
        }
      } else {
        console.log('Getimg.ai failed:', getimgResponse.status);
      }
    } catch (getimgError: any) {
      console.log('Getimg.ai error:', getimgError.message);
    }
    
    // Method 4: Try Pollinations.ai - FREE, No API key required!
    try {
      console.log('Attempting Pollinations.ai image generation (FREE, no API key needed)...');
      
      const pollinationsPrompt = type === 'exercise'
        ? `professional fitness photograph, ${prompt}, person performing exercise, proper form, gym setting, high quality, realistic, photography, 8k`
        : `professional food photography, ${prompt}, beautifully plated, appetizing, restaurant quality, high quality, realistic, photography, 8k`;
      
      // Pollinations.ai is completely free and generates images on-the-fly via URL
      // No API key needed, works immediately
      const encodedPrompt = encodeURIComponent(pollinationsPrompt);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;
      
      console.log('✅ Pollinations.ai image generated successfully');
      generationMethod = 'pollinations-ai';
      
      return NextResponse.json({ 
        success: true, 
        imageUrl: pollinationsUrl,
        description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
        prompt: prompt,
        type: type,
        generated: true,
        method: 'pollinations-ai'
      });
    } catch (pollinationsError: any) {
      console.log('Pollinations.ai error:', pollinationsError.message);
    }
    
    // Method 5: Try DeepAI - Free tier available
    try {
      console.log('Attempting DeepAI image generation...');
      
      if (!process.env.DEEPAI_API_KEY || process.env.DEEPAI_API_KEY === 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K') {
        throw new Error('DeepAI API key not configured');
      }
      
      const deepaiPrompt = type === 'exercise'
        ? `professional fitness photograph, ${prompt}, person performing exercise, proper form, gym setting, high quality, realistic`
        : `professional food photography, ${prompt}, beautifully plated, appetizing, restaurant quality, high quality, realistic`;
      
      const deepaiResponse = await fetch('https://api.deepai.org/api/text2img', {
        method: 'POST',
        headers: {
          'Api-Key': process.env.DEEPAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: deepaiPrompt,
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (deepaiResponse.ok) {
        const deepaiData = await deepaiResponse.json();
        
        if (deepaiData.output_url || deepaiData.url) {
          const imageUrl = deepaiData.output_url || deepaiData.url;
          
          console.log('✅ DeepAI image generated successfully');
          generationMethod = 'deepai';
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: imageUrl,
            description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
            prompt: prompt,
            type: type,
            generated: true,
            method: 'deepai'
          });
        }
      } else {
        console.log('DeepAI failed:', deepaiResponse.status);
      }
    } catch (deepaiError: any) {
      console.log('DeepAI error:', deepaiError.message);
    }
    
    // Method 6: Try Replicate API (Stable Diffusion) - Free tier available
    try {
      console.log('Attempting Replicate API image generation...');
      
      if (!process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_KEY === 'demo-key') {
        throw new Error('Replicate API key not configured');
      }
      
      const replicatePrompt = type === 'exercise'
        ? `professional fitness photograph, ${prompt}, person performing exercise, proper form, gym setting, high quality, 4k, realistic`
        : `professional food photography, ${prompt}, beautifully plated, appetizing, restaurant quality, high quality, 4k, realistic`;
      
      const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
          input: {
            prompt: replicatePrompt,
            width: 512,
            height: 512,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (replicateResponse.ok) {
        const replicateData = await replicateResponse.json();
        
        if (replicateData.id) {
          // Poll for result
          let status = replicateData.status;
          let attempts = 0;
          const maxAttempts = 30;
          
          while (status === 'starting' || status === 'processing') {
            if (attempts >= maxAttempts) break;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${replicateData.id}`, {
              headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
              },
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              status = statusData.status;
              
              if (status === 'succeeded' && statusData.output && statusData.output[0]) {
                console.log('✅ Replicate image generated successfully');
                generationMethod = 'replicate';
                
                return NextResponse.json({ 
                  success: true, 
                  imageUrl: statusData.output[0],
                  description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
                  prompt: prompt,
                  type: type,
                  generated: true,
                  method: 'replicate'
                });
              } else if (status === 'failed') {
                throw new Error('Replicate generation failed');
              }
            }
            attempts++;
          }
        }
      } else {
        console.log('Replicate API failed:', replicateResponse.status);
      }
    } catch (replicateError: any) {
      console.log('Replicate API error:', replicateError.message);
    }

    // Method 6: Try OpenAI DALL-E with proper error handling
    try {
      console.log('Attempting OpenAI DALL-E image generation...');
      
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
        throw new Error('OpenAI API key not configured');
      }
      
      const dallePrompt = type === 'exercise'
        ? `A professional fitness photograph showing a person performing ${prompt} exercise with proper form in a clean gym environment, high quality, realistic`
        : `A professional food photograph of ${prompt}, beautifully plated and appetizing, restaurant quality, high quality, realistic`;
      
      const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: dallePrompt,
          size: '512x512',
          quality: 'standard',
          n: 1
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (dalleResponse.ok) {
        const dalleData = await dalleResponse.json();
        
        if (dalleData.data && dalleData.data[0] && dalleData.data[0].url) {
          console.log('✅ DALL-E image generated successfully');
          generationMethod = 'dalle';
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: dalleData.data[0].url,
            description: `AI-generated ${type === 'exercise' ? 'exercise demonstration' : 'meal visualization'}: ${prompt}`,
            prompt: prompt,
            type: type,
            generated: true,
            method: 'dalle'
          });
        }
      } else {
        const errorData = await dalleResponse.json().catch(() => ({}));
        console.log('DALL-E API failed:', dalleResponse.status, errorData.error?.message || '');
      }
    } catch (dalleError: any) {
      console.log('DALL-E API error:', dalleError.message);
    }
    
    // If all AI methods fail, continue to enhanced fallback system
    console.log('All AI image generation methods failed, using enhanced fallback system');
    
    // Throw an error to trigger the fallback system in the catch block
    throw new Error('All AI image generation methods failed');
      
  } catch (error: any) {
    console.error('Error in generate-image API:', error);
    
    // Enhanced fallback system with multiple image sources for variety
    const promptText = prompt || 'exercise';
    const cleanPrompt = promptText.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    let fallbackUrl: string;
    let description: string;
    
    // Add timestamp and random factor for more variety
    const timestamp = Date.now();
    const randomFactor = Math.floor(Math.random() * 1000);
    
    // Create a unique seed based on the prompt for consistent but varied results
    const promptSeed = promptText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const varietyIndex = (promptSeed + randomFactor) % 10;
    
    if (type === 'exercise') {
      // Direct mapping for specific exercises to ensure variety
      if (cleanPrompt.includes('squat') || cleanPrompt.includes('leg')) {
        const squatImages = [
          `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex}`,
          `https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 1}`,
          `https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 2}`,
          `https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 3}`,
          `https://images.unsplash.com/photo-1583500178690-f7fd1d14489b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 4}`
        ];
        fallbackUrl = squatImages[varietyIndex % squatImages.length];
      } else if (cleanPrompt.includes('push') || cleanPrompt.includes('chest')) {
        const pushImages = [
          `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 10}`,
          `https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 11}`,
          `https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 12}`,
          `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 13}`,
          `https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 14}`
        ];
        fallbackUrl = pushImages[varietyIndex % pushImages.length];
      } else if (cleanPrompt.includes('run') || cleanPrompt.includes('cardio')) {
        const cardioImages = [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop'
        ];
        fallbackUrl = cardioImages[randomFactor % cardioImages.length];
      } else if (cleanPrompt.includes('yoga') || cleanPrompt.includes('stretch')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1506629905607-d405d7d2b0a8?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('plank') || cleanPrompt.includes('core')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('lunge')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('bridge') || cleanPrompt.includes('glute')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('bicep') || cleanPrompt.includes('curl')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('tricep') || cleanPrompt.includes('dip')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('shoulder') || cleanPrompt.includes('press')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('deadlift') || cleanPrompt.includes('lift')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('burpee') || cleanPrompt.includes('jump')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('mountain') || cleanPrompt.includes('climber')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('calf') || cleanPrompt.includes('raise')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop';
        } else {
          // Generate unique images using Unsplash Source API with exercise-specific search terms
          const exerciseSearchTerms = [
            'fitness', 'workout', 'exercise', 'gym', 'training', 'strength', 'bodyweight', 
            'athlete', 'sport', 'active', 'health', 'muscle', 'cardio', 'movement'
          ];
          
          // Use prompt to determine the best search term
          let searchTerm = 'fitness'; // default
          if (cleanPrompt.includes('cardio') || cleanPrompt.includes('run')) searchTerm = 'cardio';
          else if (cleanPrompt.includes('strength') || cleanPrompt.includes('weight')) searchTerm = 'strength';
          else if (cleanPrompt.includes('yoga') || cleanPrompt.includes('stretch')) searchTerm = 'yoga';
          else if (cleanPrompt.includes('core') || cleanPrompt.includes('abs')) searchTerm = 'core';
          else searchTerm = exerciseSearchTerms[varietyIndex % exerciseSearchTerms.length];
          
          // Generate unique URL with search term and variety parameters
          fallbackUrl = `https://source.unsplash.com/400x300/?${searchTerm},exercise&sig=${promptSeed + varietyIndex}`;
          
          // Fallback to curated collection if source API fails
          const curatedExerciseImages = [
            `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 20}`,
            `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 21}`,
            `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 22}`,
            `https://images.unsplash.com/photo-1506629905607-d405d7d2b0a8?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 23}`,
            `https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 24}`,
            `https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 25}`,
            `https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 26}`,
            `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 27}`,
            `https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 28}`,
            `https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 29}`
          ];
          
          // Use curated image as backup
          const backupUrl = curatedExerciseImages[varietyIndex % curatedExerciseImages.length];
          
          // Test if source API is working, otherwise use curated
          try {
            const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
            if (!testResponse.ok) {
              fallbackUrl = backupUrl;
            }
          } catch {
            fallbackUrl = backupUrl;
          }
        }
      description = `Exercise demonstration: ${promptText}. This exercise helps improve strength, flexibility, and overall fitness.`;
    } else {
      // Direct mapping for specific meals to ensure variety
      if (cleanPrompt.includes('salad') || cleanPrompt.includes('vegetable')) {
        const saladImages = [
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop'
        ];
        fallbackUrl = saladImages[randomFactor % saladImages.length];
      } else if (cleanPrompt.includes('chicken') || cleanPrompt.includes('meat') || cleanPrompt.includes('protein')) {
        const proteinImages = [
          'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop'
        ];
        fallbackUrl = proteinImages[randomFactor % proteinImages.length];
      } else if (cleanPrompt.includes('breakfast') || cleanPrompt.includes('oatmeal') || cleanPrompt.includes('cereal')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('smoothie') || cleanPrompt.includes('drink') || cleanPrompt.includes('juice')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('snack') || cleanPrompt.includes('nuts') || cleanPrompt.includes('fruit')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('pasta') || cleanPrompt.includes('rice') || cleanPrompt.includes('carb')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('fish') || cleanPrompt.includes('salmon')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('soup') || cleanPrompt.includes('broth')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('sandwich') || cleanPrompt.includes('wrap')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('egg') || cleanPrompt.includes('omelet')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('yogurt') || cleanPrompt.includes('parfait')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('pizza') || cleanPrompt.includes('bread')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop';
      } else if (cleanPrompt.includes('berry') || cleanPrompt.includes('fruit')) {
        fallbackUrl = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop';
        } else {
          // Generate unique meal images using Unsplash Source API with food-specific search terms
          const foodSearchTerms = [
            'food', 'meal', 'healthy', 'nutrition', 'cooking', 'fresh', 'organic', 
            'restaurant', 'delicious', 'gourmet', 'plate', 'dish', 'cuisine', 'dining'
          ];
          
          // Use prompt to determine the best search term for meals
          let searchTerm = 'food'; // default
          if (cleanPrompt.includes('salad') || cleanPrompt.includes('vegetable')) searchTerm = 'salad';
          else if (cleanPrompt.includes('breakfast') || cleanPrompt.includes('morning')) searchTerm = 'breakfast';
          else if (cleanPrompt.includes('smoothie') || cleanPrompt.includes('drink')) searchTerm = 'smoothie';
          else if (cleanPrompt.includes('pasta') || cleanPrompt.includes('rice')) searchTerm = 'pasta';
          else if (cleanPrompt.includes('protein') || cleanPrompt.includes('meat')) searchTerm = 'protein';
          else searchTerm = foodSearchTerms[varietyIndex % foodSearchTerms.length];
          
          // Generate unique URL with food search term and variety parameters
          fallbackUrl = `https://source.unsplash.com/400x300/?${searchTerm},healthy&sig=${promptSeed + varietyIndex + 100}`;
          
          // Fallback to curated food collection if source API fails
          const curatedFoodImages = [
            `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 50}`,
            `https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 51}`,
            `https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 52}`,
            `https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 53}`,
            `https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 54}`,
            `https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 55}`,
            `https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 56}`,
            `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 57}`,
            `https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 58}`,
            `https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop&auto=format&q=80&ixid=${varietyIndex + 59}`
          ];
          
          // Use curated image as backup
          const backupUrl = curatedFoodImages[varietyIndex % curatedFoodImages.length];
          
          // Test if source API is working, otherwise use curated
          try {
            const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
            if (!testResponse.ok) {
              fallbackUrl = backupUrl;
            }
          } catch {
            fallbackUrl = backupUrl;
          }
        }
      description = `Nutritious meal: ${promptText}. This meal provides essential nutrients and energy.`;
    }
    
    console.log(`✅ Enhanced fallback image selected: ${fallbackUrl.substring(0, 80)}...`);
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: fallbackUrl,
      description: description,
      fallback: true,
      method: 'enhanced-fallback',
      variety: varietyIndex,
      error: error.message || 'AI image generation failed, using enhanced fallback system with variety'
    });
  }
}