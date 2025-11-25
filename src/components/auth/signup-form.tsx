"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { cn, generateUsername, generateFamilyCode } from '@/lib/utils';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const setupNewUser = async (user: User, name?: string | null) => {
    if (!firestore || !user?.uid) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    
    try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             const mainProfile = {
                id: user.uid,
                name: name || user.displayName || generateUsername(user.email),
                photoURL: 'Bot',
                avatarColor: 'hsl(0 0% 100%)',
                avatarBackground: 'hsl(var(--primary))'
            }

            // Lógica de Data de Expiração (Hoje + 8 dias)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + SUBSCRIPTION_PLANS.TRIAL.days);

            const userProfileData = {
                uid: user.uid,
                name: name || user.displayName,
                email: user.email,
                createdAt: serverTimestamp(),
                profiles: [mainProfile],
                familyId: user.uid,
                familyCode: generateFamilyCode(),
                // Configuração Padrão de Assinatura
                subscription: {
                    plan: SUBSCRIPTION_PLANS.TRIAL.id,
                    status: 'trial',
                    expiresAt: Timestamp.fromDate(expirationDate)
                },
                role: 'user',
                isBlocked: false
            };
            await setDoc(userDocRef, userProfileData);
        }
        
        if (name && auth?.currentUser && (auth.currentUser.displayName !== name)) {
            await updateProfile(auth.currentUser, { displayName: name });
        }
        
        router.refresh();
        router.push('/select-profile');

    } catch (error) {
        console.error("Error setting up user:", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível configurar o perfil do usuário.",
        });
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await setupNewUser(userCredential.user, data.name);
      toast({ title: "Conta criada!", description: "8 dias de teste ativados." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await setupNewUser(result.user, result.user.displayName);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Erro Google', description: error.message });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? 'Aguardando...' : 'Cadastrar-se com Google'}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou continue com e-mail</span></div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Repita a Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>{isLoading ? 'Criando...' : 'Criar conta'}</Button>
             <div className="mt-4 text-center text-sm">Já tem uma conta? <Link href="/login" className="underline">Entrar</Link></div>
        </form>
      </Form>
    </div>
  );
}