import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="flex flex-col justify-center items-center p-6 relative z-10 h-full">
        
        <div className="w-full max-w-[380px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
              <Logo className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Acesse sua conta para gerenciar suas finanças com inteligência.
            </p>
          </div>

          {/* CONTAINER DO FORMULÁRIO - Glassmorphism sutil */}
          <div className="p-1">
             <LoginForm />
          </div>
          
          <p className="px-8 text-center text-xs text-muted-foreground">
            Ao clicar em continuar, você concorda com nossos{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Termos de Serviço</a> e{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Política de Privacidade</a>.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: IMAGEM DE FUNDO */}
      <div className="hidden lg:block relative h-full bg-muted">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            data-ai-hint={loginBg.imageHint}
            fill
            priority
            className="object-cover transition-transform duration-1000 hover:scale-105"
          />
        )}
        
        {/* Gradiente Overlay Profissional */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-12 left-12 max-w-lg z-20 space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium backdrop-blur-md shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> <span>IA Integrada</span>
            </div>
            <blockquote className="space-y-2">
              <p className="text-3xl font-bold text-white leading-tight">
                "O controle financeiro não é sobre cortar gastos, é sobre criar liberdade."
              </p>
              <footer className="text-sm text-white/80 font-medium">Poupp Team</footer>
            </blockquote>
        </div>
      </div>
    </div>
  );
}