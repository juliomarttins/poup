
import { Bot, Cat, Dog, Rabbit, Bird, Bug, Ghost, Crown, Rocket, Heart, Carrot, Cherry, Gamepad2, Pizza, Plane, Skull, Fish, Apple, Bone, Brain, Cookie, Diamond, Cloud, Moon, Sun, Star, Mountain, Flame, Leaf, IceCream, Ship, Shield, type LucideIcon } from "lucide-react";

export const AVATAR_ICONS = [
  { name: "Bot", icon: Bot },
  { name: "Cat", icon: Cat },
  { name: "Dog", icon: Dog },
  { name: "Rabbit", icon: Rabbit },
  { name: "Bird", icon: Bird },
  { name: "Bug", icon: Bug },
  { name: "Ghost", icon: Ghost },
  { name: "Crown", icon: Crown },
  { name: "Rocket", icon: Rocket },
  { name: "Heart", icon: Heart },
  { name: "Carrot", icon: Carrot },
  { name: "Cherry", icon: Cherry },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Pizza", icon: Pizza },
  { name: "Plane", icon: Plane },
  { name: "Skull", icon: Skull },
  { name: "Fish", icon: Fish },
  { name: "Apple", icon: Apple },
  { name: "Bone", icon: Bone },
  { name: "Brain", icon: Brain },
  { name: "Cookie", icon: Cookie },
  { name: "Diamond", icon: Diamond },
  { name: "Cloud", icon: Cloud },
  { name: "Moon", icon: Moon },
  { name: "Sun", icon: Sun },
  { name: "Star", icon: Star },
  { name: "Mountain", icon: Mountain },
  { name: "Flame", icon: Flame },
  { name: "Leaf", icon: Leaf },
  { name: "IceCream", icon: IceCream },
  { name: "Ship", icon: Ship },
  { name: "Shield", icon: Shield },
];

export const AVATAR_ICON_MAP: Record<string, LucideIcon> = AVATAR_ICONS.reduce((acc, avatar) => {
    acc[avatar.name] = avatar.icon;
    return acc;
}, {} as Record<string, LucideIcon>);

export const AVATAR_COLORS = [
  { name: 'Padrão', value: 'hsl(var(--primary))' },
  { name: 'Vermelho', value: 'hsl(0 84.2% 60.2%)' },
  { name: 'Laranja', value: 'hsl(24.6 95% 53.1%)' },
  { name: 'Amarelo', value: 'hsl(48 96% 50%)' },
  { name: 'Verde', value: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Azul', value: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Roxo', value: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'Rosa', value: 'hsl(346.8 97.7% 49.8%)' },
];
