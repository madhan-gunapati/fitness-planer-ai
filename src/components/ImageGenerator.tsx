'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageGeneratorProps {
  prompt: string;
  type: 'exercise' | 'meal';
  trigger: React.ReactNode;
}

export default function ImageGenerator({ prompt, type, trigger }: ImageGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageData, setImageData] = useState<{
    url: string;
    description: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating image for:', prompt, type);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type,
        }),
      });

      console.log('Image API response status:', response.status);

      if (!response.ok) {
        console.error('Image API response not ok:', response.statusText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Image API response data:', data);
      
      if (data.success) {
        console.log(' Image data received:', {
          hasImageUrl: !!data.imageUrl,
          isBase64: data.imageUrl?.startsWith('data:image'),
          generated: data.generated,
          fallback: data.fallback
        });
        
        setImageData({
          url: data.imageUrl,
          description: data.description,
        });
        
        if (data.generated) {
          console.log('🎨 AI-generated image received!');
        } else if (data.fallback) {
          console.warn('Using fallback image');
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Set a fallback image even on error
      setImageData({
        url: type === 'exercise' 
          ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&crop=center&auto=format&q=80'
          : 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
        description: `Visual representation of: ${prompt}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !imageData && !isLoading) {
      generateImage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {type === 'exercise' ? 'Exercise Visualization' : 'Meal Visualization'}
          </DialogTitle>
          <DialogDescription>
            {prompt}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Generating image...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button variant="outline" onClick={generateImage}>
                Try Again
              </Button>
            </div>
          )}

          {imageData && !isLoading && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                {imageData.url.startsWith('data:image') ? (
                  <img
                    src={imageData.url}
                    alt={prompt}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                    onLoad={() => {
                      console.log('✅ AI-generated image loaded successfully');
                    }}
                    onError={(e) => {
                      console.error(' Base64 image failed to display');
                      const target = e.target as HTMLImageElement;
                      const fallbackUrl = type === 'exercise' 
                        ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center'
                        : 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=300&fit=crop&crop=center';
                      target.src = fallbackUrl;
                      target.onerror = null;
                    }}
                  />
                ) : (
                  <img
                    src={imageData.url}
                    alt={prompt}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error(' Image failed to load:', imageData.url);
                      const target = e.target as HTMLImageElement;
                      const fallbackUrl = type === 'exercise' 
                        ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center'
                        : 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=300&fit=crop&crop=center';
                      target.src = fallbackUrl;
                      target.onerror = null;
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully');
                    }}
                  />
                )}
              </div>
              
              {imageData.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description:</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">{imageData.description}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={generateImage}
                className="w-full"
              >
                Generate New Image
              </Button>
            </div>
          )}

          {!imageData && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to generate visualization</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}