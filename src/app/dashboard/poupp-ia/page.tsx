'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export default function PouppIAPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a Poupp IA, rodando com a tecnologia Gemini 2.0 Flash. Já tenho acesso aos seus dados financeiros. Como posso te ajudar a economizar hoje?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const userText = inputValue;
    setInputValue('');
    setIsLoading(true);

    // 1. Mostra mensagem do usuário
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // 2. Pega token de autenticação
      const token = await user.getIdToken();

      // 3. Envia para nossa API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro na API');

      // 4. Mostra resposta da IA
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: 'Desculpe, não consegui processar sua mensagem agora. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] w-full gap-4">
      <Card className="flex items-center gap-4 p-4 shrink-0 bg-card border-border/50">
        <div className="bg-primary/10 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h1 className="font-bold text-lg leading-none">Poupp IA 2.0</h1>
            <p className="text-xs text-muted-foreground mt-1">Consultor Financeiro Inteligente</p>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden bg-muted/30 border-dashed relative flex flex-col">
        <ScrollArea className="flex-1 p-4 h-full">
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full gap-3",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8 border shrink-0">
                  {message.role === 'assistant' || message.role === 'error' ? (
                    <div className={cn("h-full w-full flex items-center justify-center", message.role === 'error' ? "bg-red-100 text-red-600" : "bg-primary text-primary-foreground")}>
                        {message.role === 'error' ? <AlertCircle className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                  ) : (
                    <>
                        {user?.photoURL ? (
                            <AvatarImage src={user.photoURL} />
                        ) : (
                             <AvatarFallback className="bg-muted"><User className="h-4 w-4" /></AvatarFallback>
                        )}
                    </>
                  )}
                </Avatar>

                <div className={cn("flex flex-col gap-1 max-w-[85%] md:max-w-[70%]", message.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn("rounded-2xl px-4 py-3 text-sm shadow-sm", message.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : message.role === 'error' ? "bg-red-50 border-red-200 text-red-800 border rounded-tl-none" : "bg-card border text-card-foreground rounded-tl-none")}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground opacity-70 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
               <div className="flex w-full gap-3">
                 <Avatar className="h-8 w-8 border shrink-0">
                    <div className="bg-primary h-full w-full flex items-center justify-center"><Bot className="h-5 w-5 text-primary-foreground" /></div>
                 </Avatar>
                 <div className="bg-card border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 h-10">
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                 </div>
               </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </Card>

      <div className="shrink-0 pt-2 pb-1">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-center">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Quanto gastei com alimentação?"
                className="pr-12 py-6 rounded-full shadow-sm bg-background border-muted-foreground/20 focus-visible:ring-primary text-base"
                disabled={isLoading}
                autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="absolute right-1.5 h-9 w-9 rounded-full transition-all">
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
            </Button>
        </form>
      </div>
    </div>
  );
}