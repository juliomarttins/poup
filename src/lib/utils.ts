import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUsername(email: string | null): string {
    if (!email) {
        return "Usuário";
    }
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
}
