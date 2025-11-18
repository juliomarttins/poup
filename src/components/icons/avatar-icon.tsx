

import { AVATAR_ICON_MAP } from "@/lib/avatars";
import { UserCircle, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarFallback } from "../ui/avatar";


interface AvatarIconProps extends Omit<LucideProps, 'className' | 'color' | 'style'> {
  iconName: string | null | undefined;
  fallbackName?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function AvatarIcon({ iconName, fallbackName, className, style, ...props }: AvatarIconProps) {
  const Icon = iconName ? AVATAR_ICON_MAP[iconName] : null;
  
  if (Icon) {
     return <Icon {...props} absoluteStrokeWidth strokeWidth={1.5} style={style} className={cn(className)} />;
  }

  if (fallbackName) {
    return <AvatarFallback style={style} className={cn("text-3xl sm:text-4xl", className)}>{fallbackName[0]}</AvatarFallback>;
  }

  // Fallback to a default icon if no icon and no name is provided
  return <UserCircle {...props} absoluteStrokeWidth strokeWidth={1.5} style={style} className={cn(className)} />;
}
