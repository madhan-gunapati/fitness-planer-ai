import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";

// Use Gemini Flash / Nano Image model
const genAI = new GoogleGenerativeAI(apiKey);
const imageModel: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image"
});

export async function POST(req: NextRequest) {
  try {
    const { prompt = "", type = "exercise" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key missing" },
        { status: 500 }
      );
    }

    // Build image instructions
    const fullPrompt =
      type === "exercise"
        ? `Professional fitness photograph: ${prompt}. Realistic lighting, gym or home environment, proper form.`
        : `Professional food photograph: ${prompt}. Appetizing, clean background, vivid colors.`;

    console.log("➡️ Generating image via Google Gemini SDK…");

    // GOOGLE GEMINI (SDK)
    try {
      const result = await imageModel.generateContent(fullPrompt);
      const response = await result.response;

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData
      );

      if (imagePart?.inlineData?.data) {
        const base64 = imagePart.inlineData.data;
        const dataUrl = `data:image/png;base64,${base64}`;

        return NextResponse.json({
          success: true,
          method: "gemini-sdk",
          imageUrl: dataUrl,
        });
      }
    } catch (err) {
      console.error("❌ Gemini SDK failed:", err);
    }

    // POLLINATIONS (FREE FALLBACK)
    console.log("➡️ Using Pollinations.ai fallback…");
    const pollPrompt =
      type === "exercise"
        ? `professional fitness photo, ${prompt}`
        : `professional food photo, ${prompt}`;

    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      pollPrompt
    )}?width=512&height=512&nologo=true`;

    return NextResponse.json({
      success: true,
      method: "pollinations",
      imageUrl: pollUrl,
    });

  } catch (error) {
    console.error("❌ Route crashed:", error);

    // LIMITED FINAL FALLBACK (STATIC)
    const fallbackImages = {
      exercise:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
      meal:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    };

    return NextResponse.json({
      success: true,
      method: "static-fallback",
      imageUrl: fallbackImages["exercise"],
    });
  }
}
