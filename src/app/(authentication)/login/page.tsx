import Image from 'next/image';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center p-6 py-12 sm:p-12">
        <div className="mx-auto grid w-full max-w-sm gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Logo className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold font-headline">
                Poupp
              </h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Digite seu e-mail e senha para acessar sua conta.
            </p>
          </div>
          <LoginForm />
          {/* Link para ir para o Cadastro caso o usuário tenha caído aqui por engano */}
          <div className="mt-4 text-center text-sm">
                Não tem uma conta?{' '}
                <Link href="/signup" className="underline hover:text-primary transition-colors">
                  Cadastre-se
                </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-background/0" />
      </div>
    </div>
  );
}