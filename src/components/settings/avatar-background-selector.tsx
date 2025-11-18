
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { AVATAR_BACKGROUNDS } from '@/lib/avatars';

interface AvatarBackgroundSelectorProps {
  selectedBackground: string | null;
  onSelectBackground: (backgroundValue: string) => void;
}

export function AvatarBackgroundSelector({ selectedBackground, onSelectBackground }: AvatarBackgroundSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {AVATAR_BACKGROUNDS.map((bg) => (
        <button
          key={bg.name}
          type="button"
          className={cn(
            'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
            selectedBackground === bg.value ? 'border-ring scale-110' : 'border-transparent'
          )}
          style={{ background: bg.value }}
          onClick={() => onSelectBackground(bg.value)}
          aria-label={`Select ${bg.name}`}
        >
          {selectedBackground === bg.value && <Check className="w-6 h-6 text-white mix-blend-difference" />}
        </button>
      ))}
    </div>
  );
}
