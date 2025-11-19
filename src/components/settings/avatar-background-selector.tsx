
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { AVATAR_BACKGROUNDS } from '@/lib/avatars';

interface AvatarBackgroundSelectorProps {
  selectedBackground: string | null | undefined;
  onSelectBackground: (backgroundValue: string) => void;
}

export function AvatarBackgroundSelector({ selectedBackground, onSelectBackground }: AvatarBackgroundSelectorProps) {
  const current = selectedBackground || 'hsl(var(--muted))';
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {AVATAR_BACKGROUNDS.map((bg) => (
        <button
          key={bg.name}
          type="button"
          onClick={() => onSelectBackground(bg.value)}
          className={cn("cursor-pointer rounded-lg border-2 p-1 transition-all hover:scale-105",
             current === bg.value ? "border-primary" : "border-transparent"
          )}
        >
          <div 
            className="h-16 w-full rounded-md flex items-center justify-center shadow-sm"
            style={{background: bg.value}}
          >
             {current === bg.value && (
              <div className="bg-background/80 rounded-full p-1">
                 <Check className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 font-medium text-muted-foreground">{bg.name}</p>
        </button>
      ))}
    </div>
  );
}
