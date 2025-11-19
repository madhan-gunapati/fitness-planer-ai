'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserProfile } from '@/lib/gemini';
import { Dumbbell, User, Target, MapPin, Utensils, Activity, BicepsFlexed, MoveLeftIcon, MoveRightIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface UserFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
}

export default function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    age: 25,
    height: 170,
    weight: 70,
    sleepHours: 7,
    waterIntake: 2,
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(formData as UserProfile);
    }
  };

  const isFormValid = () => {
    return formData.name && formData.age && formData.gender && 
           formData.height && formData.weight && formData.fitnessGoal &&
           formData.fitnessLevel && formData.workoutLocation && formData.dietaryPreference;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.age && formData.gender;
      case 2:
        return formData.height && formData.weight;
      case 3:
        return formData.fitnessGoal && formData.fitnessLevel && formData.workoutLocation;
      case 4:
        return formData.dietaryPreference;
      default:
        return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <BicepsFlexed className="h-6 w-6" />
          Tell Us About Yourself
        </CardTitle>
        <CardDescription>
          Let Us create fitness and nutrition plan specially for You
        </CardDescription>
        <div className="mt-4">
          {/* <Progress value={progress} className="w-full" /> */}
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="13"
                    max="100"
                    value={formData.age || ''}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Physical Measurements</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    value={formData.height || ''}
                    onChange={(e) => updateField('height', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="30"
                    max="300"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', parseInt(e.target.value))}
                  />
                </div>
              </div>

            
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Fitness Goals & Preferences</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Fitness Goal *</Label>
                <Select value={formData.fitnessGoal} onValueChange={(value) => updateField('fitnessGoal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                    <SelectItem value="general-fitness">General Fitness</SelectItem>
                    <SelectItem value="endurance">Improve Endurance</SelectItem>
                    <SelectItem value="strength">Build Strength</SelectItem>
                    <SelectItem value="flexibility">Improve Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Current Fitness Level *</Label>
                <Select value={formData.fitnessLevel} onValueChange={(value) => updateField('fitnessLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Workout Location *</Label>
                <Select value={formData.workoutLocation} onValueChange={(value) => updateField('workoutLocation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where will you work out?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home-no-equipment">Home (No Equipment)</SelectItem>
                    <SelectItem value="home-basic-equipment">Home (Basic Equipment)</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stress">Stress Level</Label>
                <Select value={formData.stressLevel} onValueChange={(value) => updateField('stressLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stress level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Dietary Preferences</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diet">Dietary Preference *</Label>
                <Select value={formData.dietaryPreference} onValueChange={(value) => updateField('dietaryPreference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your dietary preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                  
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical">Medical History (Optional)</Label>
                <Input
                  id="medical"
                  placeholder="Any injuries, conditions, or medications..."
                  value={formData.medicalHistory || ''}
                  onChange={(e) => updateField('medicalHistory', e.target.value)}
                />
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <MoveLeftIcon />
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              <MoveRightIcon />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
              className="min-h-12"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Generating Plan...</span>
                </div>
              ) : (
                'Generate My Plan'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}