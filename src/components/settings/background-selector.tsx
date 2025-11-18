"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { BACKGROUND_OPTIONS } from '@/lib/backgrounds';

interface BackgroundSelectorProps {
  selectedBackground: string | null | undefined;
  onSelectBackground: (backgroundId: string) => void;
}

export function BackgroundSelector({ selectedBackground, onSelectBackground }: BackgroundSelectorProps) {
  const current = selectedBackground || 'default';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {BACKGROUND_OPTIONS.map((bg) => (
        <div
          key={bg.id}
          className={cn(
            "cursor-pointer rounded-lg border-2 p-1 transition-all hover:scale-105",
            current === bg.id ? "border-primary" : "border-transparent"
          )}
          onClick={() => onSelectBackground(bg.id)}
        >
          <div className={cn("h-16 w-full rounded-md flex items-center justify-center shadow-sm", bg.preview)}>
            {current === bg.id && (
              <div className="bg-background/80 rounded-full p-1">
                 <Check className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 font-medium text-muted-foreground">{bg.name}</p>
        </div>
      ))}
    </div>
  );
}