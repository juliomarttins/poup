
"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { AVATAR_ICONS } from '@/lib/avatars';
import { AvatarIcon } from '../icons/avatar-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatarName: string) => void;
  selectedColor: string | null | undefined;
}

const MOBILE_AVATAR_LIMIT = 12;

export function AvatarSelector({ selectedAvatar, onSelectAvatar, selectedColor }: AvatarSelectorProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);

  const avatarsToShow = isMobile && !isExpanded 
    ? AVATAR_ICONS.slice(0, MOBILE_AVATAR_LIMIT) 
    : AVATAR_ICONS;

  return (
    <div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-4">
        {avatarsToShow.map((avatar) => (
            <div
            key={avatar.name}
            className="relative cursor-pointer aspect-square"
            onClick={() => onSelectAvatar(avatar.name)}
            role="radio"
            aria-checked={selectedAvatar === avatar.name}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                onSelectAvatar(avatar.name);
                }
            }}
            >
            <div
                className={cn(
                "w-full h-full rounded-full border-2 flex items-center justify-center bg-muted transition-all",
                selectedAvatar === avatar.name ? 'border-primary scale-110' : 'border-transparent'
                )}
            >
                <AvatarIcon iconName={avatar.name} className="w-2/3 h-2/3 text-primary" style={{ color: selectedColor || undefined }} />
            </div>

            {selectedAvatar === avatar.name && (
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 bg-background rounded-full">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
            )}
            </div>
        ))}
        </div>
        {isMobile && AVATAR_ICONS.length > MOBILE_AVATAR_LIMIT && (
            <Button 
                type="button"
                variant="ghost" 
                className="w-full mt-4" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? "Mostrar menos" : "Mostrar mais"}
                {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
        )}
    </div>
  );
}
