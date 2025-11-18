

import { AVATAR_ICON_MAP } from "@/lib/avatars";
import { UserCircle, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarIconProps extends Omit<LucideProps, 'className'> {
  iconName: string | null | undefined;
  color?: string | null;
  className?: string;
}

export function AvatarIcon({ iconName, color, className, ...props }: AvatarIconProps) {
  const Icon = iconName ? AVATAR_ICON_MAP[iconName] : UserCircle;
  
  if (!Icon) {
     return <UserCircle {...props} absoluteStrokeWidth strokeWidth={1.5} style={{ color: color || undefined }} className={cn(className)} />;
  }

  return <Icon {...props} absoluteStrokeWidth strokeWidth={1.5} style={{ color: color || undefined }} className={cn(className)} />;
}
