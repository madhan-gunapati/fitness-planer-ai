import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  fitnessGoal: string;
  fitnessLevel: string;
  workoutLocation: string;
  dietaryPreference: string;
  medicalHistory?: string;
  stressLevel?: string;
  sleepHours?: number;
  waterIntake?: number;
}

export interface FitnessPlan {
  workoutPlan: {
    overview: string;
    weeklySchedule: Array<{
      day: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        restTime: string;
        instructions: string;
      }>;
      duration: string;
      notes: string;
    }>;
  };
  dietPlan: {
    overview: string;
    dailyCalories: number;
    macros: {
      protein: string;
      carbs: string;
      fats: string;
    };
    dailyMeals: Array<{
      day: string;
      breakfast: {
        name: string;
        ingredients: string[];
        calories: number;
      };
      lunch: {
        name: string;
        ingredients: string[];
        calories: number;
      };
      dinner: {
        name: string;
        ingredients: string[];
        calories: number;
      };
      snacks: {
        name: string;
        ingredients: string[];
        calories: number;
      };
    }>;
  };
  tips: string[];
  motivation: string;
}

export async function generateFitnessPlan(userProfile: UserProfile): Promise<FitnessPlan> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const prompt = `You are an expert fitness coach and nutritionist. Create a comprehensive, personalized 7-day fitness and diet plan.

User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Fitness Goal: ${userProfile.fitnessGoal}
- Current Fitness Level: ${userProfile.fitnessLevel}
- Workout Location: ${userProfile.workoutLocation}
- Dietary Preference: ${userProfile.dietaryPreference}
${userProfile.medicalHistory ? `- Medical History: ${userProfile.medicalHistory}` : ''}
${userProfile.stressLevel ? `- Stress Level: ${userProfile.stressLevel}` : ''}
${userProfile.sleepHours ? `- Sleep Hours: ${userProfile.sleepHours}` : ''}
${userProfile.waterIntake ? `- Water Intake: ${userProfile.waterIntake}L/day` : ''}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 7 days of workout plans (Monday through Sunday)
2. Generate EXACTLY 7 days of meal plans (Monday through Sunday)
3. Each day must have different exercises and meals
4. Include rest days and active recovery days
5. Ensure variety across the week

IMPORTANT: Respond ONLY with valid JSON in this exact format:

{
  "workoutPlan": {
    "overview": "Brief workout philosophy and approach",
    "weeklySchedule": [
      {
        "day": "Monday",
        "exercises": [
          {
            "name": "Push-ups",
            "sets": 3,
            "reps": "10-15",
            "restTime": "60 seconds",
            "instructions": "Keep body straight, lower chest to floor, push up"
          }
        ],
        "duration": "30 minutes",
        "notes": "Focus on form over speed"
      }
    ]
  },
  "dietPlan": {
    "overview": "Nutrition strategy overview",
    "dailyCalories": 2000,
    "macros": {
      "protein": "25%",
      "carbs": "45%",
      "fats": "30%"
    },
    "dailyMeals": [
      {
        "day": "Monday",
        "breakfast": {
          "name": "Oatmeal with Berries",
          "ingredients": ["Rolled oats", "Mixed berries", "Almonds", "Honey"],
          "calories": 350
        },
        "lunch": {
          "name": "Grilled Chicken Salad",
          "ingredients": ["Grilled chicken breast", "Mixed greens", "Cherry tomatoes", "Olive oil"],
          "calories": 450
        },
        "dinner": {
          "name": "Salmon with Quinoa",
          "ingredients": ["Salmon fillet", "Quinoa", "Steamed broccoli", "Lemon"],
          "calories": 500
        },
        "snacks": {
          "name": "Greek Yogurt with Nuts",
          "ingredients": ["Greek yogurt", "Mixed nuts", "Honey"],
          "calories": 200
        }
      }
    ]
  },
  "tips": [
    "Stay hydrated throughout the day",
    "Get adequate sleep for recovery",
    "Listen to your body and rest when needed"
  ],
  "motivation": "Your fitness journey starts with a single step. Stay consistent and believe in yourself!"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response from Gemini API');
    }

    const text = response.text();
    console.log('Gemini API Response:', text.substring(0, 500) + '...');
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    // Try to extract JSON from the response
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON object
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON found in response:', text);
      throw new Error('Invalid JSON format in API response');
    }
    
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    
    let planData: FitnessPlan;
    try {
      planData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonStr.substring(0, 200) + '...');
      
      // Fallback: Create a basic plan
      planData = createFallbackPlan(userProfile);
    }
    
    // Validate the structure
    if (!planData.workoutPlan || !planData.dietPlan) {
      console.warn('Invalid plan structure, using fallback');
      planData = createFallbackPlan(userProfile);
    }
    
    return planData;
    
  } catch (error) {
    console.error('Error generating fitness plan:', error);
    
    // Return a fallback plan instead of throwing an error
    console.log('Using fallback plan due to API error');
    return createFallbackPlan(userProfile);
  }
}

function createFallbackPlan(userProfile: UserProfile): FitnessPlan {
  return {
    workoutPlan: {
      overview: `A personalized ${userProfile.fitnessLevel} level workout plan designed for ${userProfile.fitnessGoal.toLowerCase()} at ${userProfile.workoutLocation.toLowerCase()}.`,
      weeklySchedule: [
        {
          day: "Monday",
          exercises: [
            {
              name: "Warm-up Walk",
              sets: 1,
              reps: "5-10 minutes",
              restTime: "N/A",
              instructions: "Start with a gentle walk to warm up your muscles"
            },
            {
              name: userProfile.workoutLocation.includes('gym') ? "Treadmill" : "Bodyweight Squats",
              sets: 3,
              reps: userProfile.fitnessLevel === 'beginner' ? "8-12" : "12-15",
              restTime: "60 seconds",
              instructions: userProfile.workoutLocation.includes('gym') 
                ? "Maintain steady pace, adjust incline as needed"
                : "Keep feet shoulder-width apart, lower until thighs parallel to ground"
            }
          ],
          duration: "30 minutes",
          notes: "Focus on proper form and listen to your body"
        },
        {
          day: "Tuesday",
          exercises: [
            {
              name: "Upper Body Workout",
              sets: 3,
              reps: userProfile.fitnessLevel === 'beginner' ? "8-10" : "10-12",
              restTime: "60 seconds",
              instructions: userProfile.workoutLocation.includes('gym') 
                ? "Use dumbbells or machines for chest and arms"
                : "Push-ups, tricep dips using chair"
            }
          ],
          duration: "35 minutes",
          notes: "Focus on upper body strength"
        },
        {
          day: "Wednesday",
          exercises: [
            {
              name: "Cardio Day",
              sets: 1,
              reps: "20-30 minutes",
              restTime: "N/A",
              instructions: userProfile.workoutLocation.includes('gym')
                ? "Treadmill, elliptical, or bike"
                : "Brisk walk, jogging, or jumping jacks"
            }
          ],
          duration: "30 minutes",
          notes: "Maintain steady heart rate"
        },
        {
          day: "Thursday",
          exercises: [
            {
              name: "Lower Body Workout",
              sets: 3,
              reps: userProfile.fitnessLevel === 'beginner' ? "8-10" : "12-15",
              restTime: "60 seconds",
              instructions: "Squats, lunges, and calf raises"
            }
          ],
          duration: "35 minutes",
          notes: "Focus on leg strength and stability"
        },
        {
          day: "Friday",
          exercises: [
            {
              name: "Full Body Circuit",
              sets: 2,
              reps: "10-12 each exercise",
              restTime: "45 seconds",
              instructions: "Combine upper and lower body movements"
            }
          ],
          duration: "40 minutes",
          notes: "High energy, full body engagement"
        },
        {
          day: "Saturday",
          exercises: [
            {
              name: "Active Recovery",
              sets: 1,
              reps: "20-30 minutes",
              restTime: "N/A",
              instructions: "Yoga, stretching, or light walk"
            }
          ],
          duration: "20 minutes",
          notes: "Gentle movement for recovery"
        },
        {
          day: "Sunday",
          exercises: [
            {
              name: "Rest Day",
              sets: 0,
              reps: "Complete rest",
              restTime: "N/A",
              instructions: "Focus on hydration and meal prep"
            }
          ],
          duration: "0 minutes",
          notes: "Complete rest and preparation for next week"
        }
      ]
    },
    dietPlan: {
      overview: `A balanced ${userProfile.dietaryPreference} diet plan supporting your ${userProfile.fitnessGoal.toLowerCase()} goals.`,
      dailyCalories: userProfile.fitnessGoal.includes('loss') ? 1800 : 2200,
      macros: {
        protein: "25%",
        carbs: "45%",
        fats: "30%"
      },
      dailyMeals: [
        {
          day: "Monday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Oatmeal with Berries" : "Scrambled Eggs with Toast",
            ingredients: userProfile.dietaryPreference === 'vegetarian' 
              ? ["Oatmeal", "Mixed berries", "Almonds", "Greek yogurt"]
              : ["Eggs", "Whole grain toast", "Avocado", "Spinach"],
            calories: 400
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Quinoa Salad Bowl" : "Grilled Chicken Salad",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Quinoa", "Mixed vegetables", "Chickpeas", "Olive oil"]
              : ["Grilled chicken", "Mixed greens", "Cherry tomatoes", "Cucumber"],
            calories: 500
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Lentil Curry" : "Salmon with Vegetables",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Red lentils", "Brown rice", "Mixed vegetables", "Coconut milk"]
              : ["Salmon fillet", "Sweet potato", "Broccoli", "Lemon"],
            calories: 450
          },
          snacks: {
            name: "Healthy Snack",
            ingredients: ["Greek yogurt", "Mixed nuts"],
            calories: 200
          }
        },
        {
          day: "Tuesday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Smoothie Bowl" : "Protein Pancakes",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Banana", "Berries", "Spinach", "Almond milk", "Chia seeds"]
              : ["Protein powder", "Banana", "Eggs", "Oats"],
            calories: 380
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Veggie Wrap" : "Turkey Sandwich",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole wheat wrap", "Hummus", "Vegetables", "Avocado"]
              : ["Whole grain bread", "Turkey", "Lettuce", "Tomato"],
            calories: 450
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Vegetable Stir-fry" : "Chicken Stir-fry",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Tofu", "Mixed vegetables", "Brown rice", "Soy sauce"]
              : ["Chicken breast", "Mixed vegetables", "Quinoa", "Ginger"],
            calories: 520
          },
          snacks: {
            name: "Fruit and Nuts",
            ingredients: ["Apple", "Almonds"],
            calories: 180
          }
        },
        {
          day: "Wednesday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Chia Pudding" : "Greek Yogurt Bowl",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Chia seeds", "Almond milk", "Berries", "Honey"]
              : ["Greek yogurt", "Granola", "Berries", "Honey"],
            calories: 350
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Buddha Bowl" : "Tuna Salad",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Quinoa", "Roasted vegetables", "Chickpeas", "Tahini"]
              : ["Tuna", "Mixed greens", "Cherry tomatoes", "Olive oil"],
            calories: 480
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Pasta Primavera" : "Beef and Vegetables",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole wheat pasta", "Seasonal vegetables", "Olive oil", "Herbs"]
              : ["Lean beef", "Sweet potato", "Green beans", "Herbs"],
            calories: 550
          },
          snacks: {
            name: "Veggie Sticks",
            ingredients: ["Carrots", "Hummus"],
            calories: 150
          }
        },
        {
          day: "Thursday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Avocado Toast" : "Egg Benedict",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole grain bread", "Avocado", "Tomato", "Hemp seeds"]
              : ["English muffin", "Poached egg", "Canadian bacon", "Hollandaise"],
            calories: 420
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Lentil Soup" : "Chicken Caesar Salad",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Red lentils", "Vegetables", "Vegetable broth", "Herbs"]
              : ["Grilled chicken", "Romaine lettuce", "Parmesan", "Caesar dressing"],
            calories: 460
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Stuffed Bell Peppers" : "Grilled Fish",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Bell peppers", "Quinoa", "Black beans", "Cheese"]
              : ["White fish", "Asparagus", "Wild rice", "Lemon"],
            calories: 500
          },
          snacks: {
            name: "Trail Mix",
            ingredients: ["Mixed nuts", "Dried fruit"],
            calories: 190
          }
        },
        {
          day: "Friday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Breakfast Burrito" : "Protein Smoothie",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole wheat tortilla", "Scrambled tofu", "Black beans", "Salsa"]
              : ["Protein powder", "Banana", "Peanut butter", "Milk"],
            calories: 390
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Caprese Salad" : "Salmon Bowl",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Fresh mozzarella", "Tomatoes", "Basil", "Balsamic"]
              : ["Grilled salmon", "Brown rice", "Edamame", "Sesame dressing"],
            calories: 470
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Eggplant Parmesan" : "Pork Tenderloin",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Eggplant", "Marinara sauce", "Mozzarella", "Basil"]
              : ["Pork tenderloin", "Roasted vegetables", "Quinoa", "Herbs"],
            calories: 530
          },
          snacks: {
            name: "Protein Bar",
            ingredients: ["Protein bar", "Water"],
            calories: 200
          }
        },
        {
          day: "Saturday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "French Toast" : "Steak and Eggs",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole grain bread", "Almond milk", "Cinnamon", "Berries"]
              : ["Lean steak", "Eggs", "Hash browns", "Vegetables"],
            calories: 450
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Falafel Plate" : "Chicken Wrap",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Falafel", "Hummus", "Pita", "Cucumber", "Tomato"]
              : ["Grilled chicken", "Whole wheat wrap", "Vegetables", "Sauce"],
            calories: 490
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Mushroom Risotto" : "Lamb Chops",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Arborio rice", "Mushrooms", "Vegetable broth", "Parmesan"]
              : ["Lamb chops", "Minted peas", "Roasted potatoes", "Rosemary"],
            calories: 580
          },
          snacks: {
            name: "Cheese and Crackers",
            ingredients: ["Whole grain crackers", "Cheese"],
            calories: 210
          }
        },
        {
          day: "Sunday",
          breakfast: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Pancakes" : "Full Breakfast",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole wheat flour", "Almond milk", "Berries", "Maple syrup"]
              : ["Eggs", "Turkey bacon", "Whole grain toast", "Orange juice"],
            calories: 480
          },
          lunch: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Veggie Pizza" : "Grilled Chicken Pizza",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Whole wheat crust", "Vegetables", "Cheese", "Herbs"]
              : ["Whole wheat crust", "Grilled chicken", "Vegetables", "Cheese"],
            calories: 520
          },
          dinner: {
            name: userProfile.dietaryPreference === 'vegetarian' ? "Vegetable Curry" : "Roast Chicken",
            ingredients: userProfile.dietaryPreference === 'vegetarian'
              ? ["Mixed vegetables", "Coconut milk", "Curry spices", "Basmati rice"]
              : ["Roast chicken", "Roasted vegetables", "Mashed potatoes", "Gravy"],
            calories: 560
          },
          snacks: {
            name: "Smoothie",
            ingredients: ["Fruits", "Yogurt", "Honey"],
            calories: 220
          }
        }
      ]
    },
    tips: [
      "Stay hydrated by drinking at least 8 glasses of water daily",
      "Get 7-9 hours of quality sleep for optimal recovery",
      "Listen to your body and rest when you feel overly fatigued",
      "Progress gradually - consistency is more important than intensity"
    ],
    motivation: `Hi ${userProfile.name}! Your ${userProfile.fitnessGoal.toLowerCase()} journey starts now. Remember, every expert was once a beginner. Stay consistent, be patient with yourself, and celebrate small victories along the way. You've got this! 💪`
  };
}

export async function generateMotivationalQuote(): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `Generate a short, inspiring fitness and wellness motivational quote (maximum 20 words). Make it unique and energizing.`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().replace(/"/g, '');
  } catch (error) {
    console.error('Error generating motivational quote:', error);
    return "Every workout brings you closer to your goals. Stay consistent, stay strong!";
  }
}