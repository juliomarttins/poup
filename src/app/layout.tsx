import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/contexts/loading-context";

export const metadata: Metadata = {
  title: {
    template: "%s | Poupp",
    default: "Poupp - Finanças Inteligentes",
  },
  description: "Gestão financeira familiar com inteligência artificial.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
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
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1 flex flex-col">{children}</main>
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