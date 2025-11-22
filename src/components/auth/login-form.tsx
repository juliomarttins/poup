"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, type User, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { generateUsername, generateFamilyCode } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type View = 'login' | 'forgot-password';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const setupNewUser = async (user: User) => {
    if (!firestore || !user?.uid) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    
    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            const mainProfile = {
                id: user.uid,
                name: user.displayName || generateUsername(user.email),
                photoURL: 'Bot',
                avatarColor: 'hsl(0 0% 100%)',
                avatarBackground: 'hsl(var(--primary))'
            }

            const userProfileData = {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                createdAt: serverTimestamp(),
                profiles: [mainProfile],
                familyId: user.uid, 
                familyCode: generateFamilyCode() 
            };
            await setDoc(userDocRef, userProfileData);
        }
    } catch (error) {
        console.error("Error setting up user:", error);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await setupNewUser(userCredential.user);
        router.push('/select-profile'); 
    } catch (error: unknown) {
        const authError = error as AuthError;
        toast({
            variant: 'destructive',
            title: "Falha no login",
            description: "E-mail ou senha incorretos.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        await setupNewUser(result.user);
        router.push('/select-profile');
      })
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Erro Google', description: error.message });
      })
      .finally(() => setIsGoogleLoading(false));
  };

  if (view === 'forgot-password') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="space-y-2 text-center">
          <h3 className="font-semibold text-lg">Recuperar Senha</h3>
          <p className="text-xs text-muted-foreground">Digite seu e-mail para receber o link.</p>
        </div>
        <form onSubmit={async (e) => {
            e.preventDefault();
            if(!auth) return;
            setIsLoading(true);
            try {
                await sendPasswordResetEmail(auth, email);
                toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
                setView('login');
            } catch(e) {
                toast({ variant: 'destructive', title: "Erro", description: "Falha ao enviar." });
            } finally { setIsLoading(false); }
        }} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email-forgot" className="text-xs uppercase text-muted-foreground font-bold">E-mail</Label>
                <Input id="email-forgot" type="email" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="bg-zinc-950/50 border-white/10 h-11 focus-visible:ring-primary/50" />
            </div>
            <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Link'}</Button>
            <Button variant="link" type="button" onClick={() => setView('login')} disabled={isLoading} className="w-full text-xs text-muted-foreground">Voltar para o Login</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-5 animate-in fade-in duration-300">
      <Button variant="outline" className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
        {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>}
        Continuar com Google
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-transparent px-2 text-muted-foreground bg-zinc-900">Ou via e-mail</span></div>
      </div>

      <form onSubmit={handleLoginSubmit} className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase text-muted-foreground font-bold ml-1">E-mail</Label>
          <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading || isGoogleLoading} className="bg-zinc-950/50 border-white/10 h-11 focus-visible:ring-primary/50" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <Label htmlFor="password" className="text-xs uppercase text-muted-foreground font-bold">Senha</Label>
            <Button variant="link" type="button" onClick={() => setView('forgot-password')} className="p-0 h-auto text-xs text-primary font-normal hover:text-primary/80" disabled={isLoading}>Esqueceu?</Button>
          </div>
          <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading || isGoogleLoading} className="bg-zinc-950/50 border-white/10 h-11 focus-visible:ring-primary/50" />
        </div>
        
        <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={isLoading || isGoogleLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acessar Conta'}
        </Button>

        {/* DUPLICIDADE REMOVIDA (agora é o único local) */}
        <div className="text-center text-sm mt-2 text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className={cn((isLoading || isGoogleLoading) && "pointer-events-none opacity-50", "underline hover:text-primary transition-colors font-medium")}>
            Cadastre-se
            </Link>
        </div>
      </form>
    </div>
  );
}