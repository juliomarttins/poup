'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, ArrowRight, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removido AvatarImage
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/contexts/profile-context'; // [NOVO] Contexto do Perfil
import { AvatarIcon } from '@/components/icons/avatar-icon'; // [NOVO] Ícone do Avatar
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export default function PouppIAPage() {
  const { user } = useUser();
  const { activeProfile } = useProfile(); // [NOVO] Pegamos o perfil ativo
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFetchedInit = useRef(false);

  useEffect(() => {
    const fetchInitialGreeting = async () => {
        if (!user || hasFetchedInit.current) return;
        hasFetchedInit.current = true;
        setIsInitializing(true);
        setInitError(false);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: '', init: true }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro desconhecido na API");

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
            console.error("Erro na inicialização do chat:", e);
            setInitError(true);
        } finally {
            setIsInitializing(false);
        }
    };

    fetchInitialGreeting();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isInitializing]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    setInputValue('');
    setSuggestions([]); 
    setIsLoading(true);
    setInitError(false);

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
        if (!response.ok) throw new Error(data.error || data.details || "Erro na resposta da IA");

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.text,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestions(data.suggestions || []);

    } catch (error) {
        console.error(error);
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'error',
            content: 'Não consegui conectar. Verifique se o arquivo "service-account.json" está na pasta correta e se o servidor foi reiniciado.',
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] w-full gap-2">
      <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1.5 rounded-lg shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
            <h1 className="font-bold text-sm leading-none">Poupp IA 2.0</h1>
            <p className="text-[10px] text-muted-foreground">Consultor Financeiro</p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden bg-background/50 border-none relative flex flex-col shadow-none">
        <ScrollArea className="flex-1 px-2 sm:px-4 py-2">
            
            {isInitializing && (
                <div className="flex gap-3 items-center mt-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-16 w-[250px] rounded-xl" />
                    </div>
                </div>
            )}

            {initError && !isLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full mt-10 gap-4 text-center opacity-80">
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                    <div>
                        <p className="text-sm font-medium">A IA está offline.</p>
                        <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                           Reinicie o servidor (npm run dev) para carregar as novas credenciais.
                        </p>
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
                    {/* [CORREÇÃO] Avatar agora usa o Profile Context e AvatarIcon */}
                    <Avatar className={cn(
                        "h-8 w-8 border shrink-0 shadow-sm mt-1 flex items-center justify-center", 
                        message.role === 'assistant' ? "bg-yellow-500/10 border-yellow-500/20" : "",
                        message.role === 'error' ? "bg-red-100 border-red-200" : ""
                    )}
                    style={message.role === 'user' ? { background: activeProfile?.avatarBackground || 'hsl(var(--muted))' } : undefined}
                    >
                        {message.role === 'assistant' ? (
                           <Bot className="h-5 w-5 text-yellow-600" />
                        ) : message.role === 'error' ? (
                           <span className="font-bold text-red-600">!</span>
                        ) : (
                           <AvatarIcon 
                             iconName={activeProfile?.photoURL} 
                             fallbackName={activeProfile?.name}
                             className="h-5 w-5"
                             style={{ color: activeProfile?.avatarColor || 'hsl(var(--foreground))' }}
                           />
                        )}
                    </Avatar>

                    <div
                    className={cn(
                        "flex flex-col gap-1 max-w-[90%] md:max-w-[80%] text-sm",
                        message.role === 'user' ? "items-end" : "items-start"
                    )}
                    >
                    <div
                        className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm overflow-hidden w-full",
                        message.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border text-card-foreground rounded-tl-sm"
                        )}
                    >
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className={cn(
                                "prose prose-sm dark:prose-invert max-w-none break-words",
                                "prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent",
                                "prose-ul:my-1 prose-li:my-0.5",
                                message.role === 'user' ? "prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground" : ""
                            )}
                            components={{
                                a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium" {...props} />,
                                table: ({node, ...props}) => (
                                    <div className="my-3 w-full overflow-y-hidden overflow-x-auto rounded-lg border border-border/60 bg-muted/20 shadow-sm">
                                        <table className="w-full min-w-[350px] text-xs" {...props} />
                                    </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="divide-y divide-border/50" {...props} />,
                                tr: ({node, ...props}) => <tr className="transition-colors hover:bg-muted/30" {...props} />,
                                th: ({node, ...props}) => <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap" {...props} />,
                                td: ({node, ...props}) => <td className="px-3 py-2 align-middle whitespace-nowrap" {...props} />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1 opacity-70">
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
                         <div className="flex gap-1 items-center h-8 px-2">
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

      <div className="shrink-0 p-3 sm:p-4 pt-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        {suggestions.length > 0 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar snap-x">
                {suggestions.map((sug, idx) => (
                    <button
                        key={idx}
                        onClick={() => sendMessage(sug)}
                        className="snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border hover:bg-primary/5 hover:border-primary/40 transition-all text-xs text-left group max-w-[240px] active:scale-95"
                    >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border text-[10px] font-bold text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors shrink-0 shadow-sm">
                            {idx + 1}
                        </span>
                        <span className="line-clamp-2 leading-tight">{sug}</span>
                    </button>
                ))}
            </div>
        )}

        <div className="relative flex items-center">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
                placeholder="Digite sua dúvida..."
                className="pr-12 py-6 rounded-full shadow-md bg-background border-muted-foreground/20 focus-visible:ring-primary text-base pl-5"
                disabled={isLoading}
                autoComplete="off"
            />
            <Button 
                onClick={() => sendMessage(inputValue)}
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1.5 h-9 w-9 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <ArrowRight className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
            </Button>
        </div>
      </div>
    </div>
  );
}