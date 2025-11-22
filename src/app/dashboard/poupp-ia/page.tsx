'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/contexts/profile-context';
import { AvatarIcon } from '@/components/icons/avatar-icon';
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
  const { activeProfile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const hasFetchedInit = useRef(false);

  useEffect(() => {
    const fetchInitialGreeting = async () => {
        if (!user || !activeProfile || hasFetchedInit.current) return;
        hasFetchedInit.current = true;
        setIsInitializing(true);
        setInitError(false);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: '', init: true, profileName: activeProfile.name }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.text) {
                setMessages([{ id: 'init', role: 'assistant', content: data.text, timestamp: new Date() }]);
                setSuggestions(data.suggestions || []);
            }
        } catch (e) {
            console.error(e);
            setInitError(true);
        } finally {
            setIsInitializing(false);
        }
    };

    fetchInitialGreeting();
  }, [user, activeProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchMoreSuggestions = async () => {
    if (!user || isLoadingSuggestions) return;
    setIsLoadingSuggestions(true);
    try {
        const token = await user.getIdToken();
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'suggestions', profileName: activeProfile?.name }),
        });
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
             setSuggestions(data.suggestions);
             if (suggestionsRef.current) suggestionsRef.current.scrollLeft = 0;
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoadingSuggestions(false);
    }
  };

  const handleScroll = () => {
      if (suggestionsRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = suggestionsRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
              fetchMoreSuggestions();
          }
      }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    setInputValue('');
    setSuggestions([]); 
    setIsLoading(true);
    setInitError(false);

    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, newMessage]);

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ message: text, profileName: activeProfile?.name }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, timestamp: new Date() };
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (data.suggestions) setSuggestions(data.suggestions);

    } catch (error) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'error', content: 'Erro de conexão.', timestamp: new Date() }]);
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
            <h1 className="font-bold text-sm leading-none">Poupp IA</h1>
            <p className="text-[10px] text-muted-foreground">Assistente Pessoal</p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden bg-background/50 border-none relative flex flex-col shadow-none">
        {/* FIX: max-w-[100vw] garante que o scroll container não exceda a largura da tela */}
        <ScrollArea className="flex-1 px-2 sm:px-4 py-2 w-full max-w-[100vw]">
            {isInitializing && (
                <div className="flex gap-3 items-center mt-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2"><Skeleton className="h-16 w-[250px] rounded-xl" /></div>
                </div>
            )}
            {initError && !isLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full mt-10 gap-4 text-center opacity-80">
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                    <p className="text-sm font-medium">IA Offline</p>
                </div>
            )}
            <div className="flex flex-col gap-6 pb-4 pt-2 w-full">
                {messages.map((message) => (
                <div key={message.id} className={cn("flex w-full gap-3", message.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <Avatar className={cn("h-8 w-8 border shrink-0 shadow-sm mt-1 flex items-center justify-center", 
                        message.role === 'assistant' ? "bg-yellow-500/10 border-yellow-500/20" : "",
                        message.role === 'error' ? "bg-red-100" : "")}
                        style={message.role === 'user' ? { background: activeProfile?.avatarBackground || 'hsl(var(--muted))' } : undefined}
                    >
                        {message.role === 'assistant' ? <Bot className="h-5 w-5 text-yellow-600" /> : 
                         message.role === 'error' ? <span className="text-red-600 font-bold">!</span> :
                         <AvatarIcon iconName={activeProfile?.photoURL} fallbackName={activeProfile?.name} className="h-5 w-5" style={{color: activeProfile?.avatarColor}} />}
                    </Avatar>

                    {/* FIX: min-w-0 permite que o flex item encolha corretamente em telas pequenas */}
                    <div className={cn("flex flex-col gap-1 max-w-[85%] md:max-w-[75%] text-sm min-w-0", message.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn("rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm overflow-hidden w-full", message.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border text-card-foreground rounded-tl-sm")}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className={cn(
                                "prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap leading-relaxed",
                                "prose-p:m-0 prose-pre:bg-transparent prose-ul:my-1 prose-li:my-0.5",
                                // FIX: Estilo específico para blocos de código (pre) para evitar overflow
                                "[&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:bg-muted/50 [&_pre]:p-2 [&_pre]:rounded-md", 
                                message.role === 'user' ? "prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground" : ""
                            )}
                            components={{
                                a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium" {...props} />,
                                // FIX: Wrapper com overflow-x-auto para tabelas
                                table: ({node, ...props}) => <div className="my-3 w-full overflow-x-auto rounded-lg border border-border/60 bg-muted/20 shadow-sm block"><table className="w-full min-w-[300px] text-xs" {...props} /></div>,
                                thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="divide-y divide-border/50" {...props} />,
                                tr: ({node, ...props}) => <tr className="transition-colors hover:bg-muted/30" {...props} />,
                                th: ({node, ...props}) => <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap" {...props} />,
                                td: ({node, ...props}) => <td className="px-3 py-2 align-middle whitespace-nowrap" {...props} />,
                                // FIX: Componente pre explícito para garantir scroll em códigos
                                pre: ({node, ...props}) => <div className="w-full overflow-x-auto my-2 rounded-md bg-muted/50"><pre className="p-2 text-xs" {...props} /></div>
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1 opacity-70">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                ))}
                {isLoading && (
                    <div className="flex w-full gap-3 animate-in fade-in duration-300">
                         <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 border border-yellow-500/20"><Bot className="h-5 w-5 animate-pulse" /></div>
                         <div className="flex gap-1 items-center h-8 px-2"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></span></div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>
        </ScrollArea>
      </Card>

      <div className="shrink-0 p-3 sm:p-4 pt-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        {suggestions.length > 0 && !isLoading && (
            <div className="relative flex items-center mb-2 group/suggestions">
                <div 
                    ref={suggestionsRef} 
                    onScroll={handleScroll}
                    className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x px-1 scroll-smooth w-full"
                >
                    {suggestions.map((sug, idx) => (
                        <button key={idx} onClick={() => sendMessage(sug)} className="snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border hover:bg-primary/5 hover:border-primary/40 transition-all text-xs text-left group max-w-[240px] active:scale-95 whitespace-nowrap">
                            <span className="line-clamp-1">{sug}</span>
                        </button>
                    ))}
                    {isLoadingSuggestions && (
                        <div className="shrink-0 px-3 py-2 flex items-center justify-center">
                           <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
                           <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce ml-1 [animation-delay:0.2s]"></span>
                        </div>
                    )}
                </div>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full absolute right-0 z-10 bg-background/80 shadow-sm md:opacity-0 group-hover/suggestions:opacity-100 transition-opacity hidden md:flex hover:bg-primary hover:text-white" 
                    onClick={() => fetchMoreSuggestions()}
                    disabled={isLoadingSuggestions}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="relative flex items-center">
            <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)} placeholder="Digite sua dúvida..." className="pr-12 py-6 rounded-full shadow-md bg-background border-muted-foreground/20 focus-visible:ring-primary text-base pl-5" disabled={isLoading} autoComplete="off" />
            <Button onClick={() => sendMessage(inputValue)} size="icon" disabled={isLoading || !inputValue.trim()} className="absolute right-1.5 h-9 w-9 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"><ArrowRight className="h-5 w-5" /><span className="sr-only">Enviar</span></Button>
        </div>
      </div>
    </div>
  );
}