'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Sparkles, BicepsFlexed } from 'lucide-react';
import { toast } from 'sonner';

import UserForm from '@/components/UserForm';
import PlanDisplay from '@/components/PlanDisplay';
import MotivationalQuote from '@/components/MotivationalQuote';
import ThemeToggle from '@/components/ThemeToggle';
import { UserProfile, FitnessPlan } from '@/lib/gemini';

export default function Home() {
  const [currentPlan, setCurrentPlan] = useState<FitnessPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Load saved plan from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('fitness-plan');
    if (savedPlan) {
      try {
        setCurrentPlan(JSON.parse(savedPlan));
      } catch (error) {
        console.error('Error loading saved plan:', error);
      }
    }
  }, []);

  const generatePlan = async (userProfile: UserProfile) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentPlan(data.plan);
        // Save to localStorage
        localStorage.setItem('fitness-plan', JSON.stringify(data.plan));
        localStorage.setItem('user-profile', JSON.stringify(userProfile));
        
        toast.success('Your personalized fitness plan is ready!');
      } else {
        const errorMsg = data.details || data.error || 'Failed to generate plan';
        console.error('API Error:', data);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('API configuration')) {
        toast.error('API configuration issue. Please check your setup.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to generate your plan: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const regeneratePlan = async () => {
    const savedProfile = localStorage.getItem('user-profile');
    if (!savedProfile) {
      toast.error('No user profile found. Please fill out the form again.');
      setCurrentPlan(null);
      return;
    }

    setIsRegenerating(true);
    
    try {
      const userProfile = JSON.parse(savedProfile);
      await generatePlan(userProfile);
      toast.success('Your plan has been regenerated!');
    } catch (error) {
      console.error('Error regenerating plan:', error);
      toast.error('Failed to regenerate your plan. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const resetPlan = () => {
    setCurrentPlan(null);
    localStorage.removeItem('fitness-plan');
    localStorage.removeItem('user-profile');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b  w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BicepsFlexed className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Fitness Planner AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!currentPlan ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center space-y-4 py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Your Transformation , Our Responsibility
                  </h2>
                </motion.div>
                
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-xl text-muted-foreground max-w-2xl mx-auto"
                >
               
                personalized workout and diet plan for your goals and diet  preferences .
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  
                  
                </motion.div>
              </div>

              {/* Motivational Quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <MotivationalQuote />
              </motion.div>

              {/* User Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <UserForm onSubmit={generatePlan} isLoading={isGenerating} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Back to Form Button */}
              <div className="flex justify-start">
                <button
                  onClick={resetPlan}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Create New Plan
                </button>
              </div>

              {/* Plan Display */}
              <PlanDisplay 
                plan={currentPlan} 
                onRegenerate={regeneratePlan}
                isRegenerating={isRegenerating}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Your AI Fitness Coach. Made with Next.js .</p>
            <p className="mt-2">
               Stay consistent, stay strong!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}