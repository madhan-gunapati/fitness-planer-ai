'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Play, Pause, Square, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FitnessPlan } from '@/lib/gemini';
import { createWorkoutTTSText, createDietTTSText } from '@/lib/tts';

interface TTSControlsProps {
  plan: FitnessPlan;
}

export default function TTSControls({ plan }: TTSControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'workout' | 'diet' | 'both'>('both');
  const [selectedVoice, setSelectedVoice] = useState('Sm1seazb4gs7RSlUVw7c');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  
  const buildTextToSpeak = () => {
    if (!plan) return '';

    switch (selectedSection) {
      case 'workout':
        return createWorkoutTTSText(plan.workoutPlan);

      case 'diet':
        return createDietTTSText(plan.dietPlan);

      default:
        return (
          createWorkoutTTSText(plan.workoutPlan) +
          ' ' +
          createDietTTSText(plan.dietPlan)
        );
    }
  };

  const handleResume = () => {
  try {
    if (!audioRef.current) {
      toast.error('No audio loaded');
      return;
    }

    // Cannot resume if already playing
    if (!audioRef.current.paused) {
      toast.error('Audio is already playing');
      return;
    }

    audioRef.current.play();
    setIsPlaying(true);

  } catch (err) {
    toast.error('Failed to resume audio');
  }
};

  
 const handlePlay = async () => {
  try {
    const text = buildTextToSpeak();

    if (!text.trim()) {
      toast.error('Plan text is empty. Cannot generate audio.');
      return;
    }

    setIsPlaying(true);

    const res = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: selectedVoice }),
    });

    // ---- Handle non-200 API responses ----
    if (!res.ok) {
      let message = 'Error generating audio';

      try {
        // Try to extract user-friendly error from API response
        const errJson = await res.json();
        if (errJson?.error) message = errJson.error;
        if (errJson?.message) message = errJson.message;
      } catch {
        /* ignore JSON parse errors */
      }

      toast.error(message);
      setIsPlaying(false);
      return;
    }

    const data = await res.json();

    if (!data?.audioUrl) {
      toast.error('Audio generation failed: No audio returned by API');
      setIsPlaying(false);
      return;
    }

    // ---- Setup audio element if first time ----
    if (!audioRef.current) {
      audioRef.current = new Audio();

      audioRef.current.onended = () => setIsPlaying(false);

      audioRef.current.onerror = () => {
        toast.error('Audio failed to play');
        setIsPlaying(false);
      };
    }

    audioRef.current.src = data.audioUrl;

    await audioRef.current.play().catch(() => {
      toast.error('Autoplay blocked. Tap play again.');
      setIsPlaying(false);
    });

  } catch (err: unknown) {
    // ---- Network error or unexpected failure ----
    const message =
      err instanceof Error
        ? err.message
        : String(err ?? 'Unexpected error while generating audio');

    toast.error(message);
    setIsPlaying(false);
  }
};

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Play Button */}
      <Button variant="outline" size="sm" onClick={handlePlay} disabled={isPlaying}>
        <Volume2 className="h-4 w-4 mr-2" />
        Read My Plan
      </Button>

      {/* Settings Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audio Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Section Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Read:</label>
              <Select value={selectedSection} onValueChange={(v) => setSelectedSection(v as 'workout' | 'diet' | 'both')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Workout + Diet</SelectItem>
                  <SelectItem value="workout">Workout Only</SelectItem>
                  <SelectItem value="diet">Diet Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice:</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3AMU7jXQuQa3oRvRqUmb">Viraj</SelectItem>
                  <SelectItem value="0s2MqkqwzPYZVFGZpMXE">Sravani</SelectItem>
                  <SelectItem value="Sm1seazb4gs7RSlUVw7c">Anika</SelectItem>
                 
                </SelectContent>
              </Select>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleResume} disabled={isPlaying}>
                <Play className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handlePause} disabled={!isPlaying}>
                <Pause className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleStop} disabled={!isPlaying}>
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
