

import { AVATAR_ICON_MAP } from "@/lib/avatars";
import { UserCircle, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarIconProps extends Omit<LucideProps, 'className' | 'color' | 'style'> {
  iconName: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

export function AvatarIcon({ iconName, className, style, ...props }: AvatarIconProps) {
  const Icon = iconName ? AVATAR_ICON_MAP[iconName] : UserCircle;
  
  if (!Icon) {
     return <UserCircle {...props} absoluteStrokeWidth strokeWidth={1.5} style={style} className={cn(className)} />;
  }

  return <Icon {...props} absoluteStrokeWidth strokeWidth={1.5} style={style} className={cn(className)} />;
}
