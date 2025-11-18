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

export function SettingsNav({ className, items, ...props }: SettingsNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 bg-background lg:bg-transparent rounded-md lg:rounded-none p-1 lg:p-0",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
             // Base styles from buttonVariants('ghost') without hover effects
            "inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            "h-9 px-3 py-2", // Size from buttonVariants
            pathname === item.href
              ? "bg-muted text-foreground hover:bg-muted hover:text-foreground" // Active link: solid, no change on hover
              : "hover:bg-transparent hover:text-foreground", // Inactive link: transparent, text darkens on hover
            "justify-start flex-1 lg:flex-none"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
