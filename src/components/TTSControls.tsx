'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { FitnessPlan } from '@/lib/gemini';
import { TTSManager, createWorkoutTTSText, createDietTTSText } from '@/lib/tts';
import { Volume2, Play, Pause, Square, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface TTSControlsProps {
  plan: FitnessPlan;
}

export default function TTSControls({ plan }: TTSControlsProps) {
  const [ttsManager] = useState(() => new TTSManager());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'workout' | 'diet' | 'both'>('both');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedGeminiVoice, setSelectedGeminiVoice] = useState<string>('Zephyr');
  const [useGeminiTTS, setUseGeminiTTS] = useState(true);
  const [rate, setRate] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      const availableVoices = await ttsManager.getVoices();
      setVoices(availableVoices);
      
      // Set default voice (prefer English voices)
      const englishVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.localService
      ) || availableVoices[0];
      
      setSelectedVoice(englishVoice);
    };

    loadVoices();
  }, [ttsManager]);

  const handlePlay = async () => {
    if (isPaused) {
      ttsManager.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    try {
      setIsPlaying(true);
      setIsPaused(false);

      let textToSpeak = '';
      
      switch (selectedSection) {
        case 'workout':
          textToSpeak = createWorkoutTTSText(plan.workoutPlan);
          break;
        case 'diet':
          textToSpeak = createDietTTSText(plan.dietPlan);
          break;
        case 'both':
          textToSpeak = createWorkoutTTSText(plan.workoutPlan) + ' ' + createDietTTSText(plan.dietPlan);
          break;
      }

      await ttsManager.speak(textToSpeak, {
        voice: useGeminiTTS ? selectedGeminiVoice : selectedVoice || undefined,
        rate: rate,
        pitch: 1,
        volume: 1,
        useGeminiTTS: useGeminiTTS,
        language: 'en-US'
      });

      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    ttsManager.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    ttsManager.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const status = ttsManager.getStatus();

  if (!status.isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quick Play Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlay}
        disabled={isPlaying}
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Read My Plan
      </Button>

      {/* Advanced Controls Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audio Settings</DialogTitle>
            <DialogDescription>
              Customize your text-to-speech experience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Section Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What to read:</label>
              <Select value={selectedSection} onValueChange={(value: 'workout' | 'diet' | 'both') => setSelectedSection(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Workout + Diet Plan</SelectItem>
                  <SelectItem value="workout">Workout Plan Only</SelectItem>
                  <SelectItem value="diet">Diet Plan Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TTS Provider Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Use Gemini TTS:</label>
                <Switch 
                  checked={useGeminiTTS} 
                  onCheckedChange={setUseGeminiTTS}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {useGeminiTTS ? 'High-quality AI voice synthesis' : 'Browser native voices'}
              </p>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice:</label>
              {useGeminiTTS ? (
                <Select value={selectedGeminiVoice} onValueChange={setSelectedGeminiVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zephyr">Zephyr (Natural)</SelectItem>
                    <SelectItem value="Alloy">Alloy (Warm)</SelectItem>
                    <SelectItem value="Echo">Echo (Clear)</SelectItem>
                    <SelectItem value="Fable">Fable (Expressive)</SelectItem>
                    <SelectItem value="Onyx">Onyx (Deep)</SelectItem>
                    <SelectItem value="Nova">Nova (Bright)</SelectItem>
                    <SelectItem value="Shimmer">Shimmer (Gentle)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select 
                  value={selectedVoice?.name || ''} 
                  onValueChange={(value) => {
                    const voice = voices.find(v => v.name === value);
                    setSelectedVoice(voice || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Speed: {rate}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlay}
                disabled={isPlaying}
              >
                <Play className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={!isPlaying}
              >
                <Pause className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={!isPlaying && !isPaused}
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>

            {/* Status */}
            {(isPlaying || isPaused) && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {isPlaying ? 'Playing...' : 'Paused'}
                </p>
                <Progress value={isPlaying ? 50 : 0} className="w-full" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}