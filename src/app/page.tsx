"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Bot, 
  CheckCircle2, 
  LayoutDashboard, 
  PieChart, 
  Smartphone, 
  TrendingUp, 
  ShieldCheck,
  Users,
  CreditCard,
  TrendingDown,
  Download,
  Palette,
  PiggyBank,
  Check,
  Laptop,
  Bell,
  X,
  AlertTriangle,
  RefreshCw,
  Shield, // Adicionado para corrigir o erro
  Zap,
  Plane,
  Car,
  Home
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/icons";
import { useUser } from "@/firebase/auth/use-user";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- LOGOS SVG ---
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true">
    <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

const FirebaseLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true">
    <path fill="#FFCA28" d="M13.9 2.2l-1.9 10.4 7.5-3.2-5.6-7.2z"/>
    <path fill="#FFA000" d="M2.5 18.7l9.5-5.2-1.9-10.4-7.6 15.6z"/>
    <path fill="#F57F17" d="M12 13.5l-9.5 5.2 9.5 5.4 9.5-5.4-9.5-5.2z"/>
    <path fill="#FFCA28" d="M19.5 9.4l-7.5 3.2 7.5 4.2 2-11.5-2 4.1z"/>
  </svg>
);

// --- MOCKUPS (Visual Components) ---

// 1. INTEGRATED DEBT & AI SHOWCASE
const IntegratedDebtAI = () => {
    const [step, setStep] = useState(0);
    useEffect(() => { const i = setInterval(() => setStep(s => (s + 1) % 3), 4000); return () => clearInterval(i); }, []);

    const data = [
        { title: "Análise", debtTotal: "R$ 15.400", color: "bg-red-500", progress: 10, chat: "Juros altos no Cartão Master. Priorize este pagamento." },
        { title: "Estratégia", debtTotal: "R$ 14.900", color: "bg-blue-500", progress: 35, chat: "Pague R$ 500 extras aqui para economizar 4 meses de juros." },
        { title: "Liberdade", debtTotal: "R$ 8.200", color: "bg-green-500", progress: 75, chat: "Parabéns! Nesse ritmo, em outubro você estará livre." }
    ];
    const current = data[step];

    return (
        <div className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${current.color} animate-pulse`} />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{current.title}</span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-zinc-400">Saldo Devedor</span>
                        <span className="text-xl font-bold text-white transition-all duration-500">{current.debtTotal}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className={`h-full ${current.color} transition-all duration-1000 ease-in-out`} style={{ width: `${current.progress}%` }}/>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 bg-zinc-900/50 flex flex-col justify-center gap-3">
                <div className="flex gap-2 items-start animate-in slide-in-from-bottom-2 fade-in duration-500 key={step}">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 mt-1"><Bot size={12} /></div>
                    <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-2xl rounded-tl-none text-[11px] text-zinc-200 leading-relaxed shadow-sm">{current.chat}</div>
                </div>
            </div>
        </div>
    );
};

// 2. CROSS PLATFORM (Ajustado)
const CrossPlatformMockup = () => (
    <div className="relative w-full h-full flex items-end justify-center pb-4 overflow-hidden">
        {/* Laptop - Oculto em telas muito pequenas para não quebrar layout */}
        <div className="hidden sm:block w-[80%] sm:w-[70%] aspect-[16/10] bg-zinc-900 rounded-t-lg sm:rounded-lg border border-zinc-800 shadow-2xl relative z-10 transform sm:-translate-x-8 sm:translate-y-4">
            <div className="h-4 sm:h-5 bg-zinc-950 border-b border-zinc-800 flex items-center px-2 gap-1">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500/50"/><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-500/50"/><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500/50"/>
            </div>
            <div className="p-2 sm:p-3 bg-black/50 h-full grid grid-cols-4 gap-2 opacity-50">
                <div className="bg-zinc-800/50 rounded h-full col-span-1 hidden sm:block"/>
                <div className="bg-zinc-800/50 rounded h-full col-span-4 sm:col-span-3 flex flex-col gap-2">
                    <div className="h-1/3 bg-zinc-800/50 rounded w-full"/>
                    <div className="h-2/3 bg-zinc-800/50 rounded w-full"/>
                </div>
            </div>
        </div>
        {/* Phone - Centralizado */}
        <div className="relative sm:absolute sm:bottom-0 sm:right-1/2 sm:translate-x-0 sm:right-8 w-[100px] sm:w-[120px] h-[200px] sm:h-[240px] bg-black rounded-[1.5rem] border-[4px] border-zinc-800 shadow-2xl z-20 overflow-hidden ring-1 ring-white/10">
            <div className="w-full h-full bg-zinc-950 flex flex-col pt-6 px-2">
                <div className="mb-2"><div className="text-[8px] text-zinc-500">Saldo</div><div className="text-sm font-bold text-white">R$ 1.250</div></div>
                <div className="space-y-1.5 flex-1">
                    {[{i:"🍔",n:"iFood",v:"-32,90",c:"text-red-500"},{i:"💰",n:"Pix",v:"+150",c:"text-green-500"},{i:"🚗",n:"Uber",v:"-14,20",c:"text-red-500"}].map((t,k)=>(
                        <div key={k} className="flex items-center justify-between p-1 rounded bg-zinc-900/80 border border-white/5">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white/5 flex items-center justify-center text-[6px]">{t.i}</div><span className="text-[8px] text-white">{t.n}</span></div>
                            <span className={`text-[8px] font-bold ${t.c}`}>{t.v}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-auto mb-2 h-0.5 w-8 bg-zinc-700 rounded-full mx-auto"/>
            </div>
        </div>
    </div>
);

// 3. PDF MOCKUP (Ajustado)
const PDFReportMockup = () => (
    <div className="relative w-32 aspect-[210/297] bg-white rounded shadow-xl border border-zinc-200 p-3 flex flex-col gap-2 mx-auto group hover:scale-105 transition-transform duration-500">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-1">
            <div><div className="text-[5px] font-black uppercase tracking-widest text-zinc-400">Relatório</div><div className="text-[8px] font-bold text-black">EXTRATO 2025</div></div>
            <div className="h-4 w-4 bg-black rounded-sm flex items-center justify-center"><Logo className="w-2 h-2 text-white"/></div>
        </div>
        <div className="space-y-2 flex-1">
            <div className="flex gap-1">
                <div className="h-6 flex-1 bg-green-50 rounded-sm border border-green-100 flex flex-col justify-center px-1"><div className="h-1 w-full bg-green-500 rounded-full mb-0.5"/><div className="h-0.5 w-1/2 bg-green-300 rounded-full"/></div>
                <div className="h-6 flex-1 bg-red-50 rounded-sm border border-red-100 flex flex-col justify-center px-1"><div className="h-1 w-full bg-red-500 rounded-full mb-0.5"/></div>
            </div>
            <div className="space-y-0.5">
                {[1,2,3,4,5].map(i => <div key={i} className={`h-1.5 w-full flex justify-between items-center px-1 ${i%2===0?'bg-zinc-50':'bg-white'} border-b border-zinc-50`}><div className="h-0.5 w-8 bg-zinc-200 rounded-sm"/><div className="h-0.5 w-4 bg-zinc-300 rounded-sm"/></div>)}
            </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors rounded"><div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black text-white rounded-full p-1.5 shadow-xl"><Download size={12} /></div></div>
    </div>
);

// 4. PERSONALIZAÇÃO (Enriquecida e Estilosa)
const PersonalizationMockup = () => (
    <div className="h-full flex flex-col justify-between p-1">
        {/* Selector Header */}
        <div className="flex justify-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-[10px] font-bold text-blue-700">EU</div>
             <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-transparent opacity-50 flex items-center justify-center text-[10px] font-bold text-pink-700">ELA</div>
             <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-transparent opacity-50 flex items-center justify-center"><Palette size={12} className="text-zinc-400"/></div>
        </div>

        {/* Theme Dots */}
        <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-offset-1 ring-blue-200"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2">
            <div className="bg-card rounded-lg p-2 border border-blue-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">EU</div>
                    <div><p className="text-xs font-bold">Netflix</p></div>
                </div>
                <span className="text-xs font-bold text-red-500">- R$ 55</span>
            </div>
            <div className="bg-card rounded-lg p-2 border border-pink-100 shadow-sm flex items-center justify-between opacity-70">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-[8px] font-bold text-pink-600">ELA</div>
                    <div><p className="text-xs font-bold">Uber</p></div>
                </div>
                <span className="text-xs font-bold text-red-500">- R$ 22</span>
            </div>
             <div className="bg-card rounded-lg p-2 border border-blue-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">EU</div>
                    <div><p className="text-xs font-bold">Salário</p></div>
                </div>
                <span className="text-xs font-bold text-green-500">+ R$ 3K</span>
            </div>
        </div>
    </div>
);

// 5. METAS REAIS (Enriquecida)
const GoalsMockup = () => (
    <div className="flex flex-col gap-3 h-full justify-center p-2">
        <div className="space-y-1 group">
            <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><Plane size={12} className="text-purple-500"/> <span className="font-medium">Viagem Disney</span></div> <span className="text-muted-foreground">80%</span></div>
            <Progress value={80} className="h-1.5 bg-purple-100" indicatorClassName="bg-purple-500"/>
        </div>
        <div className="space-y-1 group">
            <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-green-500"/> <span className="font-medium">Reserva</span></div> <span className="text-muted-foreground">45%</span></div>
            <Progress value={45} className="h-1.5 bg-green-100" indicatorClassName="bg-green-500"/>
        </div>
        <div className="space-y-1 group">
            <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><Car size={12} className="text-blue-500"/> <span className="font-medium">Carro Novo</span></div> <span className="text-muted-foreground">20%</span></div>
            <Progress value={20} className="h-1.5 bg-blue-100" indicatorClassName="bg-blue-500"/>
        </div>
        <div className="space-y-1 group opacity-50">
            <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><Home size={12} className="text-orange-500"/> <span className="font-medium">Reforma</span></div> <span className="text-muted-foreground">5%</span></div>
            <Progress value={5} className="h-1.5 bg-orange-100" indicatorClassName="bg-orange-500"/>
        </div>
    </div>
)

// 6. DASHBOARD HERO (Mantido)
const DashboardMockupHero = () => (
  <div className="relative w-full h-full bg-[#09090B] rounded-xl border border-white/10 overflow-hidden flex shadow-2xl text-zinc-100 font-sans">
    <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-zinc-900/50 backdrop-blur-sm">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20"><Logo className="w-5 h-5"/></div>
        <div className="flex flex-col gap-4 mt-4">
            <div className="p-2 rounded-lg bg-white/5 text-white"><LayoutDashboard size={18}/></div>
            <div className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"><PieChart size={18}/></div>
            <div className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"><CreditCard size={18}/></div>
        </div>
        <div className="mt-auto p-2 rounded-lg text-zinc-500"><Users size={18}/></div>
    </div>
    <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-900/20">
            <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Visão Geral</span>
                <span className="text-sm font-bold">Família Silva</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-zinc-800 border border-white/5 text-[10px] text-zinc-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                    Sincronizado
                </div>
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center"><Bell size={14} className="text-zinc-400"/></div>
            </div>
        </div>
        <div className="p-6 space-y-6 overflow-hidden">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-zinc-500 text-xs font-medium">Saldo Atual</p>
                            <h3 className="text-3xl font-bold mt-1 text-white">R$ 12.450,00</h3>
                        </div>
                        <span className="flex items-center text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">+12% este mês</span>
                    </div>
                    <div className="relative h-24 w-full -mx-2 group">
                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,35 Q10,32 20,25 T40,20 T60,15 T80,28 T100,10 V40 H0 Z" fill="url(#gradient)" />
                            <path d="M0,35 Q10,32 20,25 T40,20 T60,15 T80,28 T100,10" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div className="absolute top-2 right-10 bg-zinc-800 border border-white/10 px-2 py-1 rounded text-[10px] text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            R$ 2.100
                        </div>
                        <div className="absolute top-[18px] right-[43px] w-2 h-2 bg-primary rounded-full border-2 border-zinc-900 group-hover:scale-150 transition-transform"></div>
                    </div>
                </div>
                <div className="col-span-1 space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs">
                            <TrendingDown size={14} className="text-red-500"/> Despesas
                        </div>
                        <p className="text-xl font-bold text-white">R$ 4.210</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs">
                            <PiggyBank size={14} className="text-blue-500"/> Meta
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-white">75%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full w-[75%] bg-blue-500 rounded-full"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Últimas Movimentações</p>
                    <p className="text-xs text-primary cursor-pointer">Ver tudo</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl border border-white/5 divide-y divide-white/5">
                    {[
                        { name: "Mercado Extra", val: "- R$ 450,20", user: "EU", bg: "bg-blue-600", time: "Hoje, 14:30" },
                        { name: "Combustível", val: "- R$ 120,00", user: "AM", bg: "bg-pink-600", time: "Ontem, 18:15" },
                        { name: "Freelance Design", val: "+ R$ 1.500,00", user: "EU", bg: "bg-blue-600", time: "Ontem, 09:00", income: true }
                    ].map((t, i) => (
                        <div key={i} className="p-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${t.bg} border-2 border-zinc-900 ring-1 ring-white/10 shadow-sm`}>
                                    {t.user}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                                    <p className="text-[10px] text-zinc-500">{t.time}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${t.income ? 'text-green-500' : 'text-zinc-200'}`}>{t.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  </div>
);

export default function LandingPage() {
  const { user, loading } = useUser();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      
      {/* --- HEADER --- */}
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
                <Link href="/select-profile">
                  Painel <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth">Entrar</Link>
                </Button>
                <Button asChild className="rounded-full font-bold shadow-lg shadow-primary/20">
                  <Link href="/signup">Testar Grátis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative pt-20 pb-24 md:pt-32 lg:pt-40 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 text-center lg:text-left space-y-8">
                    <Badge variant="outline" className="px-4 py-1 text-sm border-primary/30 text-primary bg-primary/5 rounded-full backdrop-blur-sm">
                      🚀 Controle Financeiro Definitivo
                    </Badge>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                      Troque o desespero pela <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                        tranquilidade.
                      </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0 leading-relaxed">
                      Chega de viver no limite. O Poupp usa Inteligência Artificial para organizar seu dinheiro, planejar seus sonhos e te tirar do vermelho.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                      <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 transition-transform hover:scale-105" asChild>
                        <Link href="/signup">Começar Teste Grátis</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 bg-transparent hover:bg-secondary/50" asChild>
                        <Link href="#pricing">Ver Preços</Link>
                      </Button>
                    </div>
                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-green-500 h-4 w-4" /> Teste 7 dias sem custo
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-green-500 h-4 w-4" /> Sem fidelidade
                        </div>
                    </div>
                </div>

                {/* Dashboard Hero Visual */}
                <div className="flex-1 w-full max-w-[650px] lg:max-w-none perspective-1000 relative">
                    <div className="relative transform lg:rotate-y-[-8deg] lg:rotate-x-[4deg] transition-all duration-1000 hover:rotate-0 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl">
                        {/* Só mostra o dashboard complexo em telas maiores para performance */}
                        <div className="hidden md:block h-full">
                            <DashboardMockupHero />
                        </div>
                        <div className="md:hidden h-64 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center">
                            <p className="text-zinc-500 text-sm">Visualização otimizada para Desktop</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* --- BENTO GRID SHOWCASE --- */}
        <section id="features" className="py-24 bg-muted/20">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Design que funciona</h2>
                    <p className="text-muted-foreground text-lg">
                        Uma experiência fluida, seja no computador do escritório ou no celular na fila do mercado.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    
                    {/* Feature 1: Mobile & Desktop */}
                    <div className="md:col-span-1 relative group overflow-hidden rounded-3xl border bg-background p-6 flex flex-col hover:shadow-xl transition-all duration-500">
                        <div className="space-y-2 relative z-10 mb-6">
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Smartphone size={16} /></div>
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Laptop size={16} /></div>
                            </div>
                            <h3 className="text-lg font-bold">Multiplataforma Real</h3>
                            <p className="text-xs text-muted-foreground">Design responsivo que se adapta perfeitamente a qualquer tamanho de tela.</p>
                        </div>
                        <div className="mt-auto relative h-48 w-full overflow-hidden flex items-end justify-center">
                            <CrossPlatformMockup />
                        </div>
                    </div>

                    {/* Feature 2: Caixinhas & Metas (RICH MOCKUP) */}
                    <div className="md:col-span-1 relative group overflow-hidden rounded-3xl border bg-background p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-500">
                        <div className="space-y-2 relative z-10">
                            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500"><PiggyBank size={16} /></div>
                            <h3 className="text-lg font-bold">Metas Reais</h3>
                            <p className="text-xs text-muted-foreground">Veja quanto falta para realizar seus sonhos.</p>
                        </div>
                        <div className="mt-4 flex-1">
                            <GoalsMockup />
                        </div>
                    </div>

                    {/* Feature 3: Personalização (RICH MOCKUP) */}
                    <div className="md:col-span-1 relative group overflow-hidden rounded-3xl border bg-background p-6 flex flex-col hover:shadow-xl transition-all duration-500">
                        <div className="space-y-2 relative z-10 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Palette size={16} /></div>
                            <h3 className="text-lg font-bold">Seu Estilo</h3>
                            <p className="text-xs text-muted-foreground">Avatares e temas para deixar do seu jeito.</p>
                        </div>
                        <div className="mt-auto flex flex-col gap-2">
                            <PersonalizationMockup />
                        </div>
                    </div>

                    {/* Feature 4: Exportação */}
                    <div className="md:col-span-1 relative group overflow-hidden rounded-3xl border bg-background p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-500">
                        <div className="space-y-2 relative z-10">
                            <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600"><Download size={16} /></div>
                            <h3 className="text-lg font-bold">Exportação PDF</h3>
                            <p className="text-xs text-muted-foreground">Relatórios profissionais com um clique. Ideal para controle arquivado ou contabilidade.</p>
                        </div>
                        <div className="mt-4 relative flex items-center justify-center h-40">
                             <PDFReportMockup />
                        </div>
                    </div>

                    {/* Feature 5: Debt Management & AI (UNIFICADO) */}
                    <div className="md:col-span-2 relative group overflow-hidden rounded-3xl border bg-background p-6 flex flex-col hover:shadow-xl transition-all duration-500">
                        <div className="space-y-4 relative z-10 mb-6">
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><ShieldCheck size={16} /></div>
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><Bot size={16} /></div>
                            </div>
                            <h3 className="text-lg font-bold">IA Contra as Dívidas</h3>
                            <p className="text-xs text-muted-foreground">
                                O Poupp analisa juros, cria estratégias de amortização e conversa com você sobre como economizar no dia a dia.
                            </p>
                        </div>
                        <div className="flex-1 w-full flex items-center justify-center">
                            <IntegratedDebtAI />
                        </div>
                    </div>

                </div>
            </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-background to-muted/30">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Quanto custa a sua liberdade?</h2>
                    <p className="text-muted-foreground text-lg">
                        Invista centavos para ganhar paz de espírito.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                    
                    {/* Card 1: O Preço do Caos */}
                    <Card className="border-2 border-red-500/30 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/10 dark:to-transparent flex flex-col relative overflow-hidden hover:border-red-500/50 transition-all group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                        <CardHeader className="text-center pb-2 pt-8">
                            <div className="mx-auto mb-4 h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <AlertTriangle size={24} />
                            </div>
                            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">O Preço do Descontrole</CardTitle>
                            <CardDescription>O custo oculto de não fazer nada.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-6 flex-1 flex flex-col justify-center">
                            <div className="text-4xl font-black text-zinc-400 line-through decoration-red-500 decoration-4 opacity-80">
                                Incalculável
                            </div>
                            <p className="text-sm text-muted-foreground px-4">
                                O preço de continuar pagando juros abusivos e perdendo noites de sono por falta de organização.
                            </p>
                            <div className="space-y-4 text-left max-w-xs mx-auto pt-4 border-t border-red-100 dark:border-red-900/30">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <X size={18} className="text-red-500 shrink-0" /> Juros de cartão rotativo
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <X size={18} className="text-red-500 shrink-0" /> Ansiedade constante
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <X size={18} className="text-red-500 shrink-0" /> Sem previsão de futuro
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 pb-8">
                            <Button size="lg" variant="outline" className="w-full h-12 text-lg text-muted-foreground cursor-not-allowed hover:bg-transparent border-dashed" disabled>
                                Continuar Sofrendo
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Card 2: A Oferta Poupp */}
                    <div className="relative flex flex-col">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-orange-500 rounded-xl blur opacity-30 animate-pulse"></div>
                        <Card className="relative border-2 border-primary/50 shadow-2xl bg-background flex-1 flex flex-col overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-xs font-bold tracking-wide">
                                RECOMENDADO
                            </div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                            <CardHeader className="text-center pb-2 pt-8">
                                <div className="mx-auto mb-4 h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <CardTitle className="text-2xl font-bold">Assinatura Poupp</CardTitle>
                                <CardDescription>Paz mental garantida.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-6 flex-1 flex flex-col justify-center">
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-sm text-muted-foreground line-through">R$ 49,90</span>
                                    <span className="text-5xl font-black text-primary">R$ 0,98</span>
                                    <span className="text-muted-foreground font-medium">/ dia</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Apenas R$ 29,90/mês. <br/>
                                    <span className="font-bold text-foreground">Sem fidelidade. Cancele quando quiser.</span>
                                </p>

                                <div className="space-y-4 text-left max-w-xs mx-auto pt-4 border-t border-primary/10">
                                    {[
                                        "Painel Completo + IA",
                                        "Gestão Inteligente de Dívidas",
                                        "Exportação de PDF Ilimitada",
                                        "Contas e Perfis Ilimitados",
                                        "Suporte Premium"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 pb-8 flex flex-col gap-6">
                                <Button size="lg" className="w-full h-14 text-lg shadow-lg shadow-primary/20 font-bold" asChild>
                                    <Link href="/signup">Começar Teste de 7 Dias Grátis</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                
                <p className="text-center text-xs text-muted-foreground mt-12 max-w-md mx-auto">
                    Ao iniciar seu teste, você terá acesso total. Não cobramos nada hoje. O sistema avisa antes do período de teste acabar.
                </p>
            </div>
        </section>

        {/* --- SECURITY & UPDATES SECTION (DEDICADA) --- */}
        <section id="security" className="py-20 bg-zinc-950 text-white border-t border-white/10">
            <div className="container px-4 mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Shield size={32} className="text-green-500" />
                            Segurança de Nível Bancário
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            Seus dados são sagrados. Utilizamos a mesma infraestrutura que protege os maiores bancos digitais e empresas de tecnologia do mundo.
                        </p>
                        <div className="flex flex-col gap-4 pt-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <GoogleLogo />
                                <div>
                                    <h4 className="font-bold">Infraestrutura Google Cloud</h4>
                                    <p className="text-xs text-zinc-500">Servidores de alta performance e criptografia de ponta a ponta.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <FirebaseLogo />
                                <div>
                                    <h4 className="font-bold">Protegido pelo Firebase</h4>
                                    <p className="text-xs text-zinc-500">Autenticação segura e banco de dados em tempo real com backup automático.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <RefreshCw size={100} className="text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="text-primary" />
                            Evolução Constante
                        </h3>
                        <p className="text-zinc-400 mb-6">
                            O Poupp não para. Assinando hoje, você garante acesso a todas as futuras atualizações sem custo extra.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span>Novo Modo Escuro (Dark Mode)</span>
                                <Badge variant="outline" className="ml-auto border-green-500/50 text-green-500 text-[10px]">NOVO</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span>Exportação Avançada de PDF</span>
                                <Badge variant="outline" className="ml-auto border-green-500/50 text-green-500 text-[10px]">NOVO</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm opacity-60">
                                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span>Integração Bancária Automática</span>
                                <span className="ml-auto text-[10px] uppercase tracking-widest">Em breve</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- CTA FINAL --- */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="container px-4 flex flex-col items-center text-center space-y-8 relative z-10 mx-auto">
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl max-w-2xl">
                    Pare de adiar sua tranquilidade.
                </h2>
                <p className="max-w-[600px] text-primary-foreground/80 text-xl">
                    Você não tem nada a perder com o teste grátis, mas tem uma vida inteira de liberdade financeira a ganhar.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Button size="lg" variant="secondary" className="h-14 px-10 text-xl rounded-full shadow-2xl text-primary font-bold" asChild>
                        <Link href="/signup">Quero Testar Agora</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      <footer className="py-12 bg-background border-t">
        <div className="container px-4 mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Poupp</span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    © 2025 Poupp Inc. Construído para organizar a vida.
                </p>
                <div className="flex items-center gap-6">
                    <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos</Link>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</Link>
                    <Link href="https://wa.me/5562998413382" target="_blank" className="text-sm text-muted-foreground hover:text-primary transition-colors">Suporte</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}