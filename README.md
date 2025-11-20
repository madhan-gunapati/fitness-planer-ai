# 💪 Fitness Planner AI

An advanced AI-powered fitness assistant built with **Next.js 14** that generates **personalized 7-day workout and diet plans** . 
Access at 'https://fitness-planer-ai.vercel.app'

## 🚀 Features

### Core Functionality
- **Personalized AI Plans**
- **Advanced Multi-Step Form**
- **AI Image Generation**
- **Voice Synthesis**
- **PDF Export**
- **Local Storage**
- **Dark/Light Mode**
- **Daily Motivation**

### User Input Collection
- **Basic Info**: Name, Age, Gender
- **Physical Measurements**: Height, Weight
- **Fitness Goals**: Weight Loss, Muscle Gain, General Fitness, Endurance, Strength, Flexibility
- **Fitness Level**: Beginner, Intermediate, Advanced
- **Workout Location**: Home (No Equipment), Home (Basic Equipment), Gym, Outdoor
- **Dietary Preferences**: Non-Vegetarian, Vegetarian, Vegan, Keto
- **Optional**: Medical history, stress level

### AI-Generated Content
- **7-Day Workout Plans**: Detailed exercises with sets, reps, rest times, and instructions
- **7-Day Diet Plans**: Meal breakdowns with calories, ingredients, and macros
- **Personalized Tips**: Lifestyle and fitness recommendations
- **Daily Motivation**: AI-generated motivational quotes
- **Exercise Images**: Unique AI-generated images for each exercise
- **Meal Images**: Unique AI-generated images for each meal

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + Shadcn UI |
| **AI Integration** | Google Gemini API (gemini-2.0-flash) |
| **Image Generation** | Gemini, Pollinations.ai|
| **Voice Synthesis** |Eleven Labs Text-to-speech |
| **PDF Generation** | jsPDF  |
| **Theme** | next-themes |

## 📦 Installation



### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/madhan-gunapati/fitness-planer-ai.git
   cd fitness-panner-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp  .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   # Required: Google Gemini API Key & Eleven Labs API key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ELEVEN_LABS_API_KEY=your_gemini_api_key_here
   
  
   ```



4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

