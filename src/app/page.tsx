"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, Bot, CheckCircle2, LayoutDashboard, PieChart, Smartphone, 
  TrendingUp, ShieldCheck, Users, CreditCard, TrendingDown, Download, 
  Palette, PiggyBank, Check, Laptop, Bell, X, AlertTriangle, RefreshCw, 
  Server, Zap, Coffee, ShoppingCart, Car, Home, Plane, Music, 
  Shield, Gift, BrainCircuit, Sparkles, ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/icons";
import { useUser } from "@/firebase/auth/use-user";
import { Progress } from "@/components/ui/progress";

// ... (MANTENHA OS COMPONENTES MOCKUP IGUAIS - GoogleLogo, DashboardMockupHero, etc...)
// Estou omitindo os mockups para economizar espaço, mas eles devem permanecer no arquivo.
// Vou focar nas mudanças do componente principal abaixo.
// ---

// ATENÇÃO: COPIE OS MOCKUPS DO ARQUIVO ANTERIOR OU MANTENHA OS QUE JÁ EXISTEM.
// O código abaixo substitui o "export default function LandingPage..."

export default function LandingPage() {
  const { user, loading } = useUser();

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      
      {/* HEADER (Mantido igual) */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight font-headline">Poupp</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="transition-colors hover:text-primary">Recursos</Link>
            <Link href="#pricing" className="transition-colors hover:text-primary">Planos</Link>
            <Link href="#security" className="transition-colors hover:text-primary">Segurança</Link>
          </nav>
          <div className="flex items-center gap-4">
            {loading ? (
               <Button variant="ghost" size="sm" disabled>...</Button>
            ) : user ? (
              <Button asChild className="rounded-full font-bold">
                <Link href="/select-profile">Painel <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link href="/login">Entrar</Link></Button>
                <Button asChild className="rounded-full font-bold shadow-lg shadow-primary/20"><Link href="/signup">Testar Grátis</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-24 md:pt-32 lg:pt-40 overflow-hidden min-h-[90vh] flex flex-col justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                {/* Copy */}
                <div className="flex-1 text-center lg:text-left space-y-8">
                    <Badge variant="outline" className="px-4 py-1 text-sm border-primary/30 text-primary bg-primary/5 rounded-full backdrop-blur-sm">🚀 Controle Financeiro Definitivo</Badge>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                      Troque o desespero pela <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">tranquilidade.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0 leading-relaxed">
                      Chega de viver no limite. O Poupp usa Inteligência Artificial para organizar seu dinheiro e te tirar do vermelho.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                      <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:scale-105 transition-transform" asChild><Link href="/signup">Começar Teste Grátis</Link></Button>
                      <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 bg-transparent hover:bg-secondary/50" asChild><Link href="#pricing">Ver Preços</Link></Button>
                    </div>
                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500 h-4 w-4" /> Teste 7 dias sem custo</div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500 h-4 w-4" /> Sem fidelidade</div>
                    </div>
                </div>
                {/* Mockup Hero */}
                <div className="flex-1 w-full max-w-[650px] lg:max-w-none perspective-1000 relative hidden md:block">
                    <div className="relative transform lg:rotate-y-[-8deg] lg:rotate-x-[4deg] transition-all duration-1000 hover:rotate-0 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl border border-white/10 bg-[#09090B]">
                        {/* RECOLOCAR O COMPONENTE DashboardMockupHero AQUI */}
                        <div className="h-[400px] bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">Visualização do Dashboard</div>
                    </div>
                </div>
            </div>
          </div>
          
          {/* SCROLL INDICATOR (NOVO) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-70">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Descubra Mais</span>
            <ChevronDown className="h-6 w-6 text-primary" />
          </div>
        </section>

        {/* ... (RESTO DAS SEÇÕES - FEATURES, PRICING, SECURITY - MANTENHA IGUAL AO ANTERIOR) ... */}
        
      </main>

      <footer className="py-8 border-t bg-muted/30">
        <div className="container px-4 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2"><Logo className="h-5 w-5"/><span className="font-bold">Poupp</span></div>
            <p className="text-xs text-muted-foreground">© 2025 Poupp Inc.</p>
            <div className="flex gap-4 text-xs text-muted-foreground"><Link href="#">Termos</Link><Link href="#">Privacidade</Link><Link href="#">Suporte</Link></div>
        </div>
      </footer>
    </div>
  );
}