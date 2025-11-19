'use client';

import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-primary`}
      >
        <Dumbbell className="w-full h-full" />
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground text-center"
        >
          {text}
        </motion.p>
      )}
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="h-1 bg-primary/20 rounded-full overflow-hidden max-w-32"
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full bg-primary rounded-full w-1/2"
        />
      </motion.div>
    </div>
  );
}