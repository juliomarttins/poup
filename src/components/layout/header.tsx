import Link from 'next/link';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* LADO ESQUERDO: LOGO (Limpo, sem texto duplicado) */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8 text-primary" />
          </Link>
        </div>

        {/* LADO DIREITO: BOTÕES (Visíveis no Mobile) */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Botão Entrar: Variant Ghost para contraste suave */}
          <Button variant="ghost" asChild className="text-sm font-medium">
            <Link href="/login">
              Entrar
            </Link>
          </Button>

          {/* Botão Teste Grátis: Destaque */}
          <Button asChild className="text-sm font-medium">
            <Link href="/signup">
              Teste Grátis
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}