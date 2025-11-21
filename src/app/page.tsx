"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, Bot, CheckCircle2, LayoutDashboard, PieChart, Smartphone, 
  TrendingUp, ShieldCheck, Users, CreditCard, TrendingDown, Download, 
  Palette, PiggyBank, Check, Laptop, Bell, X, AlertTriangle, RefreshCw, 
  Server, Zap, Coffee, ShoppingCart, Car, Home, Plane, Music
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/icons";
import { useUser } from "@/firebase/auth/use-user";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- LOGOS ---
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
);
const FirebaseLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true"><path fill="#FFCA28" d="M13.9 2.2l-1.9 10.4 7.5-3.2-5.6-7.2z"/><path fill="#FFA000" d="M2.5 18.7l9.5-5.2-1.9-10.4-7.6 15.6z"/><path fill="#F57F17" d="M12 13.5l-9.5 5.2 9.5 5.4 9.5-5.4-9.5-5.2z"/><path fill="#FFCA28" d="M19.5 9.4l-7.5 3.2 7.5 4.2 2-11.5-2 4.1z"/></svg>
);

// --- MOCKUPS ---

const DashboardMockupHero = () => (
  <div className="relative w-full h-full bg-[#09090B] rounded-xl border border-white/10 overflow-hidden flex shadow-2xl text-zinc-100 font-sans">
    {/* Sidebar */}
    <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-zinc-900/50 backdrop-blur-sm">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20"><Logo className="w-5 h-5"/></div>
        <div className="flex flex-col gap-4 mt-4">
            <div className="p-2 rounded-lg bg-white/5 text-white"><LayoutDashboard size={18}/></div>
            <div className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"><PieChart size={18}/></div>
            <div className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"><CreditCard size={18}/></div>
        </div>
        <div className="mt-auto p-2 rounded-lg text-zinc-500"><Users size={18}/></div>
    </div>
    {/* Content */}
    <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-900/20">
            <div className="flex flex-col"><span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Visão Geral</span><span className="text-sm font-bold">Família Silva</span></div>
            <div className="flex items-center gap-3"><div className="px-3 py-1 rounded-full bg-zinc-800 border border-white/5 text-[10px] text-zinc-400 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Sincronizado</div><div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center"><Bell size={14} className="text-zinc-400"/></div></div>
        </div>
        <div className="p-6 space-y-6 overflow-hidden relative">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div><p className="text-zinc-500 text-xs font-medium">Saldo Atual</p><h3 className="text-3xl font-bold mt-1 text-white">R$ 12.450,00</h3></div>
                        <span className="flex items-center text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <div className="relative h-24 w-full -mx-2">
                         {/* Gráfico SVG Fake */}
                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs><linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" /></linearGradient></defs>
                            <path d="M0,35 Q10,32 20,25 T40,20 T60,15 T80,28 T100,10 V40 H0 Z" fill="url(#gradient)" />
                            <path d="M0,35 Q10,32 20,25 T40,20 T60,15 T80,28 T100,10" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
                <div className="col-span-1 space-y-3">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-white/5"><div className="flex items-center gap-2 mb-1 text-zinc-500 text-[10px]"><TrendingDown size={12} className="text-red-500"/> Despesas</div><p className="text-lg font-bold text-white">R$ 4.210</p></div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-white/5"><div className="flex items-center gap-2 mb-1 text-zinc-500 text-[10px]"><PiggyBank size={12} className="text-blue-500"/> Meta</div><div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1"><div className="h-full w-[75%] bg-blue-500 rounded-full"/></div></div>
                </div>
            </div>
            
            {/* Lista de Transações Rica */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Extrato Recente</p>
                    <p className="text-[10px] text-primary cursor-pointer hover:underline">Ver completo</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                    {[
                        { icon: ShoppingCart, name: "Mercado Extra", val: "- R$ 450,20", user: "EU", userColor: "bg-blue-600", time: "Hoje, 14:30" },
                        { icon: Car, name: "Posto Shell", val: "- R$ 120,00", user: "AM", userColor: "bg-pink-600", time: "Ontem, 18:15" },
                        { icon: Laptop, name: "Freelance UI", val: "+ R$ 1.500,00", user: "EU", userColor: "bg-blue-600", time: "Ontem, 09:00", income: true },
                        { icon: Coffee, name: "Cafeteria", val: "- R$ 18,90", user: "AM", userColor: "bg-pink-600", time: "20/10, 08:30" },
                        { icon: Music, name: "Spotify", val: "- R$ 21,90", user: "EU", userColor: "bg-blue-600", time: "19/10, 10:00" },
                    ].map((t, i) => (
                        <div key={i} className="p-2.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                    <t.icon size={14}/>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-medium text-zinc-200">{t.name}</p>
                                        <div className={`h-3 w-3 rounded-full flex items-center justify-center text-[6px] font-bold text-white ${t.userColor} border border-zinc-900`}>{t.user}</div>
                                    </div>
                                    <p className="text-[9px] text-zinc-500">{t.time}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${t.income ? 'text-green-500' : 'text-zinc-300'}`}>{t.val}</span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Fade no final para indicar scroll */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none"/>
        </div>
    </div>
  </div>
);

// --- SEÇÕES PRINCIPAIS ---

export default function LandingPage() {
  const { user, loading } = useUser();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      
      {/* HEADER */}
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
                <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/auth">Entrar</Link></Button>
                <Button asChild className="rounded-full font-bold shadow-lg shadow-primary/20"><Link href="/signup">Testar Grátis</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-24 md:pt-32 lg:pt-40 overflow-hidden">
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
                        <DashboardMockupHero />
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 bg-muted/20">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Design que funciona</h2>
                    <p className="text-muted-foreground text-lg">Ferramentas poderosas desenhadas para quem quer resultado rápido.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <Card className="p-6 flex flex-col gap-4 hover:shadow-lg transition-all">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Smartphone size={20}/></div>
                        <h3 className="text-xl font-bold">Mobile First</h3>
                        <p className="text-sm text-muted-foreground">Adicione gastos em segundos. Interface pensada para o celular.</p>
                    </Card>
                    <Card className="p-6 flex flex-col gap-4 hover:shadow-lg transition-all">
                        <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><ShieldCheck size={20}/></div>
                        <h3 className="text-xl font-bold">Gestão de Dívidas</h3>
                        <p className="text-sm text-muted-foreground">Plano automático para sair do vermelho e parar de pagar juros.</p>
                    </Card>
                    <Card className="p-6 flex flex-col gap-4 hover:shadow-lg transition-all">
                        <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Bot size={20}/></div>
                        <h3 className="text-xl font-bold">IA Consultora</h3>
                        <p className="text-sm text-muted-foreground">Tire dúvidas e peça conselhos financeiros a qualquer hora.</p>
                    </Card>
                </div>
            </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-background to-muted/30">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Quanto custa a sua liberdade?</h2>
                    <p className="text-muted-foreground text-lg">Menos que um cafezinho por dia.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
                        <CardHeader><CardTitle className="text-red-600">O Preço do Caos</CardTitle><CardDescription>Continuar sem controle</CardDescription></CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div className="text-4xl font-black text-zinc-400 line-through opacity-50">Incalculável</div>
                            <ul className="text-sm text-left space-y-2 text-muted-foreground">
                                <li className="flex gap-2"><X className="text-red-500" size={16}/> Juros abusivos</li>
                                <li className="flex gap-2"><X className="text-red-500" size={16}/> Ansiedade constante</li>
                                <li className="flex gap-2"><X className="text-red-500" size={16}/> Sem futuro garantido</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card className="border-primary shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"/>
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">RECOMENDADO</div>
                        <CardHeader><CardTitle>Assinatura Poupp</CardTitle><CardDescription>Liberdade total</CardDescription></CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div className="text-5xl font-black text-primary">R$ 0,98 <span className="text-sm font-medium text-muted-foreground">/dia</span></div>
                            <p className="text-xs text-muted-foreground">Cobrado mensalmente (R$ 29,90). Sem fidelidade.</p>
                            <ul className="text-sm text-left space-y-2 pt-4">
                                <li className="flex gap-2"><Check className="text-primary" size={16}/> Acesso Ilimitado</li>
                                <li className="flex gap-2"><Check className="text-primary" size={16}/> Inteligência Artificial</li>
                                <li className="flex gap-2"><Check className="text-primary" size={16}/> App Mobile + Desktop</li>
                            </ul>
                        </CardContent>
                        <CardFooter><Button className="w-full" size="lg" asChild><Link href="/signup">Testar Grátis Agora</Link></Button></CardFooter>
                    </Card>
                </div>
            </div>
        </section>

        {/* SECURITY */}
        <section className="py-20 bg-zinc-950 text-white">
            <div className="container px-4 mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold flex items-center gap-3"><Shield size={32} className="text-green-500"/> Segurança de Nível Bancário</h2>
                    <p className="text-zinc-400">Seus dados são protegidos pela mesma infraestrutura que grandes bancos usam.</p>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <GoogleLogo />
                            <div><h4 className="font-bold">Google Cloud</h4><p className="text-xs text-zinc-500">Servidores de alta performance.</p></div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <FirebaseLogo />
                            <div><h4 className="font-bold">Firebase Secured</h4><p className="text-xs text-zinc-500">Criptografia de ponta a ponta.</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10">
                     <h3 className="text-2xl font-bold mb-4 flex gap-2"><Zap className="text-yellow-500"/> Atualizações Constantes</h3>
                     <p className="text-sm text-zinc-400 mb-4">O sistema evolui todo mês sem custo extra para você.</p>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-green-500"/> Novo Modo Escuro</div>
                        <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-green-500"/> Exportação PDF 2.0</div>
                        <div className="flex items-center gap-2 text-sm opacity-50"><CheckCircle2 size={16}/> Integração Bancária (Em breve)</div>
                     </div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
            <h2 className="text-4xl font-bold mb-6">Pare de adiar sua tranquilidade.</h2>
            <Button size="lg" className="h-14 px-10 text-xl rounded-full" asChild><Link href="/signup">Criar Conta Grátis</Link></Button>
            <p className="text-sm text-muted-foreground mt-4">Teste por 7 dias. Cancele quando quiser.</p>
        </section>

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