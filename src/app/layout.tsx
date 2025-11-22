import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
// [CORREÇÃO 1] Importação correta do Provider do Firebase
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";
import { ThemeProvider } from "@/components/theme-provider";
// [CORREÇÃO 2] Adicionar o LoadingProvider para evitar o erro de contexto
import { LoadingProvider } from "@/contexts/loading-context";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased min-h-screen bg-background font-sans`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            defaultColor="default"
            enableSystem={false}
        >
          <FirebaseClientProvider>
            <UserProvider>
              <ProfileProvider>
                {/* [CORREÇÃO 2] Envolvendo a app com LoadingProvider */}
                <LoadingProvider>
                  <div className="relative flex min-h-screen flex-col">
                    {/* O Header verifica a rota internamente para se esconder se necessário */}
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