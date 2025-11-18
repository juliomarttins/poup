
'use client';

import { useState, useEffect } from 'react';
import { Logo } from './icons';
import { Progress } from './ui/progress';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        // Simulate faster loading at the beginning
        const increment = prev < 60 ? Math.random() * 10 + 5 : Math.random() * 2 + 1;
        return Math.min(prev + increment, 95);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <Logo className="h-24 w-24 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Preparando seu painel financeiro...
        </h2>
        <p className="max-w-md text-muted-foreground">
          Estamos buscando suas informações mais recentes. Isso pode levar alguns segundos.
        </p>
        <div className="w-full max-w-sm">
           <Progress value={progress} className="h-2" />
           <p className="text-sm font-medium mt-2 text-primary">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
