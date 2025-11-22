import type { Metadata } from "next";
// [ALTERAÇÃO] Removemos a importação da fonte do Google para evitar erro de conexão
// import { Inter } from "next/font/google"; 
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/contexts/loading-context";

// [ALTERAÇÃO] Removemos a inicialização da fonte
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poupp",
  description: "Gestão financeira inteligente para famílias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* [ALTERAÇÃO] Removemos ${inter.className} e mantemos apenas as classes do Tailwind */}
      <body className={`antialiased min-h-screen bg-background font-sans`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            defaultColor="default"
            enableSystem={false}
        >
          <FirebaseClientProvider>
            <UserProvider>
              <ProfileProvider>
                <LoadingProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
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