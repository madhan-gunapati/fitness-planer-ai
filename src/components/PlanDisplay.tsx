'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';
import { FitnessPlan } from '@/lib/gemini';
import { 
  
  Download, 
  RefreshCw, 
  Clock,
 
  Image as ImageIcon
} from 'lucide-react';
import TTSControls from './TTSControls';
import ImageGenerator from './ImageGenerator';

interface PlanDisplayProps {
  plan: FitnessPlan;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export default function PlanDisplay({ plan, onRegenerate, isRegenerating }: PlanDisplayProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMealDay, setSelectedMealDay] = useState(0);

  // Safety check for plan structure
  if (!plan) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No fitness plan available. Please generate a new plan.</p>
        </div>
      </div>
    );
  }

  // Ensure we don't exceed array bounds
  const safeSelectedDay = Math.min(selectedDay, (plan?.workoutPlan?.weeklySchedule?.length || 1) - 1);
  const safeSelectedMealDay = Math.min(selectedMealDay, (plan?.dietPlan?.dailyMeals?.length || 1) - 1);

  const exportToPDF = async () => {
    try {
      toast.loading('Generating PDF...');
      
      // Use comprehensive text-based PDF approach to avoid oklch issues
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      let yPosition = 30;
      const lineHeight = 7;
      const pageHeight = 280;
      
      // Helper function to add text with page breaks
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        if (!text) return;
        
        if (yPosition > pageHeight) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        // Split long text into multiple lines
        const lines = pdf.splitTextToSize(text, 170);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight) {
            pdf.addPage();
            yPosition = 30;
          }
          pdf.text(line, 20, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 3; // Extra spacing
      };
      
      // Title
      addText('Fitness Planner AI', 24, true);
      addText('Personalized Fitness Plan', 16, true);
      yPosition += 10;
      
      // Workout Plan
      addText('WORKOUT PLAN', 18, true);
      if (plan?.workoutPlan?.overview) {
        addText(plan.workoutPlan.overview, 12);
      }
      yPosition += 5;
      
      // Check if weeklySchedule exists and is an array
      if (plan?.workoutPlan?.weeklySchedule && Array.isArray(plan.workoutPlan.weeklySchedule)) {
        plan.workoutPlan.weeklySchedule.forEach((day) => {
          if (day?.day) {
            addText(`${day.day.toUpperCase()} - ${day.duration || 'N/A'}`, 14, true);
            
            if (day.exercises && Array.isArray(day.exercises)) {
              day.exercises.forEach((exercise) => {
                if (exercise?.name) {
                  addText(`• ${exercise.name}`, 12, true);
                  addText(`  ${exercise.sets || 'N/A'} sets × ${exercise.reps || 'N/A'} reps`, 11);
                  addText(`  Rest: ${exercise.restTime || 'N/A'}`, 11);
                  if (exercise.instructions) {
                    addText(`  ${exercise.instructions}`, 11);
                  }
                  yPosition += 2;
                }
              });
            }
            yPosition += 5;
          }
        });
      }
      
      // Diet Plan
      yPosition += 10;
      addText('DIET PLAN', 18, true);
      if (plan?.dietPlan?.overview) {
        addText(plan.dietPlan.overview, 12);
      }
      yPosition += 5;
      
      // Check if dailyMeals exists and is an array
      if (plan?.dietPlan?.dailyMeals && Array.isArray(plan.dietPlan.dailyMeals)) {
        plan.dietPlan.dailyMeals.forEach((day) => {
          if (day?.day) {
            addText(`${day.day.toUpperCase()}`, 14, true);
            
            ['breakfast', 'lunch', 'dinner', 'snacks'].forEach((mealType) => {
              const meal = day[mealType as keyof typeof day];
              if (meal && typeof meal === 'object' && 'name' in meal) {
                addText(`${mealType.toUpperCase()}: ${meal.name}`, 12, true);
                if ('ingredients' in meal && Array.isArray(meal.ingredients)) {
                  meal.ingredients.forEach((ingredient: string) => {
                    addText(`  - ${ingredient}`, 11);
                  });
                }
                if ('calories' in meal) {
                  addText(`  Calories: ${meal.calories}`, 11);
                }
                yPosition += 2;
              }
            });
            yPosition += 5;
          }
        });
      }
      
      // Tips
      if (plan?.tips && Array.isArray(plan.tips) && plan.tips.length > 0) {
        yPosition += 10;
        addText('TIPS & RECOMMENDATIONS', 18, true);
        plan.tips.forEach((tip, index) => {
          if (tip) {
            addText(`${index + 1}. ${tip}`, 12);
          }
        });
      }
      
      pdf.save('fitness-plan-detailed.pdf');
      toast.dismiss();
      toast.success('PDF exported successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 h-fit ">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl"> Personalized Fitness Plan</CardTitle>
              <CardDescription>
                workout and diet plan for your goals and diet  preferences 
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <TTSControls plan={plan} />
              <Button 
                onClick={exportToPDF} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button 
                onClick={onRegenerate} 
                disabled={isRegenerating}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                {isRegenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 " id="plan-content">
        {/* Workout Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 "
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                {/* <Dumbbell className="h-5 w-5" /> */}
                Workout Plan
              </CardTitle>
            </CardHeader>
          </Card>

          

          {/* Day Selector */}
          <div className="flex flex-wrap gap-2">
            {plan?.workoutPlan?.weeklySchedule?.map((day, index) => (
              <Button
                key={index}
                variant={safeSelectedDay === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(index)}
              >
                {day?.day || `Day ${index + 1}`}
              </Button>
            )) || (
              <div className="text-muted-foreground">No workout schedule available</div>
            )}
          </div>

          {/* Selected Day Workout */}
          {plan?.workoutPlan?.weeklySchedule?.[safeSelectedDay] && (
            <Card className='h-1/2 overflow-scroll'>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.workoutPlan.weeklySchedule[safeSelectedDay]?.day || 'Workout'} Workout</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {plan.workoutPlan.weeklySchedule[safeSelectedDay]?.duration || 'N/A'}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.workoutPlan.weeklySchedule[safeSelectedDay]?.exercises?.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{exercise?.name || 'Exercise'}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          <span>{exercise?.sets || 'N/A'} sets</span>
                          <span>{exercise?.reps || 'N/A'} reps</span>
                          <span>Rest: {exercise?.restTime || 'N/A'}</span>
                        </div>
                      </div>
                      {exercise?.name && (
                        <ImageGenerator 
                          prompt={exercise.name}
                          type="exercise"
                          trigger={
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{exercise?.instructions || 'No instructions available'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Diet Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 "
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                {/* <Utensils className="h-5 w-5" /> */}
                Diet Plan
              </CardTitle>
            </CardHeader>
          </Card>


          {/* Meal Day Selector */}
          <div className="flex flex-wrap gap-2">
            {plan?.dietPlan?.dailyMeals?.map((day, index) => (
              <Button
                key={index}
                variant={safeSelectedMealDay === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMealDay(index)}
              >
                {day?.day || `Day ${index + 1}`}
              </Button>
            )) || (
              <div className="text-muted-foreground">No meal schedule available</div>
            )}
          </div>

          {/* Selected Day Meals */}
          {plan?.dietPlan?.dailyMeals?.[safeSelectedMealDay] && (
            <Card  className='h-1/2 overflow-scroll'>
              <CardHeader >
                <CardTitle>{plan.dietPlan.dailyMeals[safeSelectedMealDay]?.day || 'Meals'} Meals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                  const meal = plan.dietPlan.dailyMeals[safeSelectedMealDay]?.[mealType as keyof typeof plan.dietPlan.dailyMeals[0]];
                  if (!meal || typeof meal !== 'object' || !('name' in meal)) return null;
                  
                  return (
                    <div key={mealType} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg capitalize">{mealType}</h4>
                          <h5 className="font-medium">{meal.name}</h5>
                          {'calories' in meal && (
                            <p className="text-sm text-muted-foreground">Calories: {meal.calories}</p>
                          )}
                        </div>
                        <ImageGenerator 
                          prompt={meal.name}
                          type="meal"
                          trigger={
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                      {'ingredients' in meal && Array.isArray(meal.ingredients) && (
                        <div>
                          <h6 className="font-medium text-sm mb-2">Ingredients:</h6>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {meal.ingredients.map((ingredient: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-current rounded-full"></span>
                                {ingredient}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      
      
    </div>
  );
}