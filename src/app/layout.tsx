import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/firebase/provider";
import { UserProvider } from "@/firebase/auth/use-user";
import { Header } from "@/components/layout/header";
import { ProfileProvider } from "@/contexts/profile-context";

// Usando fonte do Google para evitar erro de arquivo local faltando
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
        <AuthProvider>
          <UserProvider>
            {/* O ProfileProvider AQUI garante que o Header consiga ler o perfil */}
            <ProfileProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </ProfileProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}