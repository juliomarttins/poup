'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export default function PouppIAPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]); // Estado para as sugestões
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Loading inicial
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFetchedInit = useRef(false);

  // 1. Carregamento Inicial Inteligente
  useEffect(() => {
    const fetchInitialGreeting = async () => {
        if (!user || hasFetchedInit.current) return;
        hasFetchedInit.current = true;
        setIsInitializing(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: '', init: true }), // Flag init
            });
            
            const data = await res.json();
            if (data.text) {
                setMessages([{
                    id: 'init',
                    role: 'assistant',
                    content: data.text,
                    timestamp: new Date()
                }]);
                setSuggestions(data.suggestions || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsInitializing(false);
        }
    };

    fetchInitialGreeting();
  }, [user]);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isInitializing]);

  // Função centralizada de envio
  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    setInputValue('');
    setSuggestions([]); // Limpa sugestões antigas ao enviar
    setIsLoading(true);

    // Adiciona mensagem do usuário
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: text }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        // Adiciona resposta da IA
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.text,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Atualiza as sugestões com as novas fornecidas pela IA
        setSuggestions(data.suggestions || []);

    } catch (error) {
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'error',
            content: 'Ops! Tive um problema de conexão. Tente novamente.',
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Componente para renderizar texto com negrito simples (**texto**)
  const FormattedText = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span className="whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] w-full gap-2">
      {/* Cabeçalho Compacto */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-b border-border/40">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1.5 rounded-lg shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
            <h1 className="font-bold text-sm leading-none">Poupp IA 2.0</h1>
            <p className="text-[10px] text-muted-foreground">Consultor Financeiro</p>
        </div>
      </div>

      {/* Área de Chat */}
      <Card className="flex-1 overflow-hidden bg-background/50 border-none relative flex flex-col shadow-none">
        <ScrollArea className="flex-1 px-4 py-2">
            {isInitializing && (
                <div className="flex gap-3 items-center mt-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
            )}
            
            <div className="flex flex-col gap-6 pb-4 pt-2">
                {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn(
                    "flex w-full gap-3",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    <Avatar className={cn("h-8 w-8 border shrink-0 shadow-sm", message.role === 'assistant' ? "bg-yellow-500/10 border-yellow-500/20" : "")}>
                        {message.role === 'assistant' ? (
                            <div className="h-full w-full flex items-center justify-center text-yellow-600">
                                <Bot className="h-5 w-5" />
                            </div>
                        ) : message.role === 'error' ? (
                            <div className="h-full w-full flex items-center justify-center bg-red-100 text-red-600">!</div>
                        ) : (
                             <AvatarImage src={user?.photoURL || ''} />
                        )}
                        <AvatarFallback>EU</AvatarFallback>
                    </Avatar>

                    <div
                    className={cn(
                        "flex flex-col gap-1 max-w-[85%] md:max-w-[70%] text-sm",
                        message.role === 'user' ? "items-end" : "items-start"
                    )}
                    >
                    <div
                        className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm",
                        message.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border text-card-foreground rounded-tl-sm"
                        )}
                    >
                        <FormattedText text={message.content} />
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                </div>
                ))}
                
                {isLoading && (
                    <div className="flex w-full gap-3 animate-in fade-in duration-300">
                         <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 border border-yellow-500/20">
                            <Bot className="h-5 w-5 animate-pulse" />
                         </div>
                         <div className="flex gap-1 items-center h-8">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></span>
                         </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>
        </ScrollArea>
      </Card>

      {/* Área de Input e Sugestões */}
      <div className="shrink-0 p-4 pt-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        
        {/* Sugestões Inteligentes (Chips) */}
        {suggestions.length > 0 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar snap-x">
                {suggestions.map((sug, idx) => (
                    <button
                        key={idx}
                        onClick={() => sendMessage(sug)}
                        className="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-xs font-medium whitespace-nowrap group"
                    >
                        <Lightbulb className="w-3 h-3 text-yellow-500 group-hover:text-primary" />
                        {sug}
                    </button>
                ))}
            </div>
        )}

        <div className="relative flex items-center">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida..."
                className="pr-12 py-6 rounded-full shadow-md bg-background border-muted-foreground/20 focus-visible:ring-primary text-base pl-5"
                disabled={isLoading}
                autoComplete="off"
            />
            <Button 
                onClick={() => sendMessage(inputValue)}
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1.5 h-9 w-9 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95"
            >
                <ArrowRight className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
            </Button>
        </div>
      </div>
    </div>
  );
}