import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/contexts/loading-context";
import { TitleRotator } from "@/components/ui/title-rotator";

// [CORREÇÃO] Removido o objeto 'icons'. 
// O Next.js agora usa automaticamente o src/app/icon.tsx e src/app/apple-icon.tsx
export const metadata: Metadata = {
  title: "Poupp",
  description: "Gestão financeira familiar com inteligência artificial.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Poupp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary overscroll-y-none">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            defaultColor="default"
            enableSystem
            disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <UserProvider>
              <ProfileProvider>
                <LoadingProvider>
                  <TitleRotator />
                  
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">{children}</main>
                  </div>
                  <Toaster />
                </LoadingProvider>
              </ProfileProvider>
            </UserProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}