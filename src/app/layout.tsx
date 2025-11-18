
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LoadingProvider } from '@/contexts/loading-context';
import { ThemeProvider } from '@/components/theme-provider';
import { UserProvider } from '@/firebase/auth/use-user';


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });


export const metadata: Metadata = {
  title: 'Poupp',
  description: 'Gerencie suas finanças familiares e saia das dívidas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable}`}>
        <FirebaseClientProvider>
          <UserProvider>
            <LoadingProvider>
                {children}
            </LoadingProvider>
          </UserProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
