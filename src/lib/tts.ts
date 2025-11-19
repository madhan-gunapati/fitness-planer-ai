export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | string;
  language?: string;
  useGeminiTTS?: boolean;
}

export class TTSManager {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private isPaused = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = this.synthesis.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
      } else {
        this.synthesis.onvoiceschanged = () => {
          voices = this.synthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    // Try Gemini TTS first if enabled
    if (options.useGeminiTTS) {
      try {
        await this.speakWithGemini(text, options);
        return;
      } catch (error) {
        console.warn('Gemini TTS failed, falling back to Web Speech API:', error);
      }
    }

    // Fallback to Web Speech API
    return new Promise((resolve, reject) => {
      if (this.isPlaying) {
        this.stop();
      }

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      this.currentUtterance.rate = options.rate || 1;
      this.currentUtterance.pitch = options.pitch || 1;
      this.currentUtterance.volume = options.volume || 1;
      
      if (options.voice && typeof options.voice !== 'string') {
        this.currentUtterance.voice = options.voice;
      }

      this.currentUtterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
      };

      this.currentUtterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        
        // Handle different error types
        if (event.error === 'interrupted') {
          console.warn('TTS was interrupted, this is normal behavior');
          resolve(); // Don't treat interruption as an error
        } else if (event.error === 'canceled') {
          console.warn('TTS was canceled');
          resolve();
        } else {
          console.error('TTS Error:', event.error);
          reject(new Error(`TTS Error: ${event.error}`));
        }
      };

      // Add additional error handling for browser compatibility
      try {
        this.synthesis.speak(this.currentUtterance);
      } catch (error) {
        console.error('Failed to start TTS:', error);
        reject(error);
      }
    });
  }

  private async speakWithGemini(text: string, options: TTSOptions): Promise<void> {
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: typeof options.voice === 'string' ? options.voice : 'Zephyr',
        language: options.language || 'en-US',
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini TTS API request failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Gemini TTS failed');
    }

    // If Gemini returns audio data, play it
    if (data.audioUrl) {
      return this.playAudioUrl(data.audioUrl);
    } else {
      // Fallback to Web Speech API with the processed text
      throw new Error('No audio data returned from Gemini TTS');
    }
  }

  private async playAudioUrl(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onloadstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        resolve();
      };

      audio.onerror = () => {
        this.isPlaying = false;
        this.isPaused = false;
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(reject);
    });
  }

  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
    }
  }

  stop(): void {
    this.synthesis.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: 'speechSynthesis' in window
    };
  }
}

export function formatTextForTTS(text: string): string {
  return text
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/[•·]/g, '')
    .trim();
}

export function createWorkoutTTSText(workoutPlan: any): string {
  if (!workoutPlan) {
    return 'No workout plan available.';
  }
  
  let text = `Here is your personalized workout plan. ${workoutPlan.overview || 'A customized workout plan for you.'}. `;
  
  if (workoutPlan.weeklySchedule && Array.isArray(workoutPlan.weeklySchedule)) {
    workoutPlan.weeklySchedule.forEach((day: any, index: number) => {
      text += `Day ${index + 1}, ${day.day}. `;
      text += `Workout duration: ${day.duration}. `;
      
      if (day.exercises && Array.isArray(day.exercises)) {
        day.exercises.forEach((exercise: any, exerciseIndex: number) => {
          text += `Exercise ${exerciseIndex + 1}: ${exercise.name}. `;
          text += `${exercise.sets} sets of ${exercise.reps} repetitions. `;
          text += `Rest for ${exercise.restTime} between sets. `;
        });
      }
      
      if (day.notes) {
        text += `Important note for today: ${day.notes}. `;
      }
    });
  }
  
  return formatTextForTTS(text);
}

export function createDietTTSText(dietPlan: any): string {
  if (!dietPlan) {
    return 'No diet plan available.';
  }
  
  let text = `Here is your personalized diet plan. ${dietPlan.overview || 'A customized nutrition plan for you.'}. `;
  
  if (dietPlan.dailyCalories) {
    text += `Your daily calorie target is ${dietPlan.dailyCalories} calories. `;
  }
  
  if (dietPlan.macros) {
    text += `Macro breakdown: ${dietPlan.macros.protein || '25%'} protein, ${dietPlan.macros.carbs || '45%'} carbohydrates, and ${dietPlan.macros.fats || '30%'} fats. `;
  }
  
  if (dietPlan.dailyMeals && Array.isArray(dietPlan.dailyMeals)) {
    dietPlan.dailyMeals.forEach((dayMeal: any) => {
      text += `${dayMeal.day} meals: `;
      
      // Read breakfast, lunch, dinner, snacks
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach((mealType) => {
        const meal = dayMeal[mealType];
        if (meal && meal.name) {
          text += `${mealType}: ${meal.name}. `;
          if (meal.calories) {
            text += `${meal.calories} calories. `;
          }
        }
      });
    });
  }
  
  return formatTextForTTS(text);
}