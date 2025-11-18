
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { AVATAR_COLORS } from '@/lib/avatars';

interface AvatarColorSelectorProps {
  selectedColor: string | null;
  onSelectColor: (colorValue: string) => void;
}

export function AvatarColorSelector({ selectedColor, onSelectColor }: AvatarColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color.name}
          type="button"
          className={cn(
            'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
            selectedColor === color.value ? 'border-ring' : 'border-transparent'
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onSelectColor(color.value)}
          aria-label={`Select ${color.name}`}
        >
          {selectedColor === color.value && <Check className="w-6 h-6 text-white" />}
        </button>
      ))}
    </div>
  );
}
