import Image from 'next/image';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="flex items-center justify-center p-6 py-12 sm:p-12 relative overflow-hidden">
        {/* Efeito de fundo sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

        <div className="mx-auto grid w-full max-w-[380px] gap-8 relative z-10">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
              <Logo className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              Acesse sua conta para gerenciar suas finanças com inteligência.
            </p>
          </div>

          {/* FORMULÁRIO - O link de cadastro já está dentro do componente LoginForm */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-2xl">
             <LoginForm />
          </div>
          
        </div>
      </div>

      {/* LADO DIREITO: IMAGEM DE FUNDO */}
      <div className="hidden bg-zinc-900 lg:block relative overflow-hidden">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            priority
            className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out scale-105"
          />
        )}
        {/* Gradiente de sobreposição para integração perfeita */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
        
        <div className="absolute bottom-10 left-10 max-w-md space-y-2 z-20">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium backdrop-blur-md">
                <Sparkles className="w-3 h-3" /> <span>Powered by Gemini AI</span>
            </div>
            <h2 className="text-2xl font-bold text-white">O controle total do seu dinheiro.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Junte-se a milhares de famílias que estão saindo do vermelho e construindo um futuro sólido com o Poupp.
            </p>
        </div>
      </div>
    </div>
  );
}