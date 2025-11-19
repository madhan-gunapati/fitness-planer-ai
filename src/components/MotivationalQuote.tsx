'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Quote , Sparkles } from 'lucide-react';


export default function MotivationalQuote() {
  const [quote, setQuote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/motivational-quote');
      const data = await response.json();
      
      if (data.success) {
        setQuote(data.quote);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote('Consistency Always beats the Odds!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <Card className="bg-linear-to-r from-primary/10 to-primary/5 border-primary/20 text-center w-1/2 m-auto">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
               <Sparkles className="h-4 w-4" />
              <h3 className="font-semibold text-primary">Today&apos;s Quote</h3>
            </div>
            
            <motion.div
              key={quote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-lg italic text-foreground/90 leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            </motion.div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQuote}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}