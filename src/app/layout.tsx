import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/contexts/loading-context";
import { TitleRotator } from "@/components/ui/title-rotator"; // [NOVO]

// [CORREÇÃO] Metadados Base (O TitleRotator vai sobrescrever o título no cliente)
export const metadata: Metadata = {
  title: "Poupp", // Fallback para SEO
  description: "Gestão financeira familiar com inteligência artificial.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Poupp",
  },
  icons: {
    // [IMPORTANTE] O Next.js procura esses arquivos na pasta /public
    // Certifique-se de ter favicon.ico e apple-icon.png lá.
    icon: "/favicon.ico", 
    apple: "/apple-icon.png", 
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
                  {/* [NOVO] Componente que gira o título da aba */}
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