"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface SettingsNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

const additionalItems = [
    { title: "Minha Conta", href: "/dashboard/settings/account" }
];

export function SettingsNav({ className, items, ...props }: SettingsNavProps) {
  const pathname = usePathname()
  
  // Merge default items with new items
  const allItems = [...items, ...additionalItems];

  // Remove duplicates based on href just in case
  const uniqueItems = allItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.href === item.href)
  );

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 bg-background lg:bg-transparent rounded-md lg:rounded-none p-1 lg:p-0 overflow-x-auto",
        className
      )}
      {...props}
    >
      {uniqueItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            "h-9 px-3 py-2", 
            pathname === item.href
              ? "bg-muted text-foreground hover:bg-muted hover:text-foreground" 
              : "hover:bg-transparent hover:text-foreground", 
            "justify-start lg:flex-none"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}