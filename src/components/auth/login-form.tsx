

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
                familyId: user.uid, // O pai da família é ele mesmo
                familyCode: generateFamilyCode() // Gera o código
            };
            await setDoc(userDocRef, userProfileData);
        }
    } catch (error) {
        console.error("Error setting up user:", error);
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "Não foi possível configurar o perfil do usuário no banco de dados.",
        });
        throw error; // Propagate error to stop the login flow
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
        let description = "E-mail ou senha inválidos. Por favor, tente novamente.";
        
        // Don't show specific error messages for security reasons in production,
        // but it's useful for debugging now.
        switch (authError.code) {
            case 'auth/user-not-found':
                description = "Nenhum usuário encontrado com este e-mail. Por favor, cadastre-se.";
                break;
            case 'auth/wrong-password':
                description = "Senha incorreta. Por favor, tente novamente.";
                break;
            case 'auth/invalid-credential':
                 description = "As credenciais fornecidas são inválidas ou o usuário não existe.";
                break;
            case 'auth/invalid-email':
                description = "O formato do e-mail é inválido.";
                break;
        }

        toast({
            variant: 'destructive',
            title: "Falha no login",
            description: description,
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
        toast({
            variant: 'destructive',
            title: 'Erro de Autenticação com Google',
            description: error.message,
        });
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  };

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      auth.languageCode = 'pt-BR';
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail de redefinição enviado",
        description: "Se o e-mail estiver cadastrado, você receberá um link. Não se esqueça de verificar sua caixa de spam.",
      });
      setView('login');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: "Erro",
        description: "Não foi possível enviar o e-mail de redefinição. Tente novamente.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  if (view === 'forgot-password') {
    return (
      <form onSubmit={handleForgotSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <h3 className="font-semibold text-lg">Recuperar Senha</h3>
          <p className="text-sm text-muted-foreground">Digite seu e-mail para receber um link de redefinição.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email-forgot">E-mail</Label>
          <Input
            id="email-forgot"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar E-mail de Recuperação'}
        </Button>
        <Button variant="link" onClick={() => setView('login')} disabled={isLoading}>Voltar para o Login</Button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
        {isGoogleLoading ? 'Aguardando Google...' : 'Entrar com Google'}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      <form onSubmit={handleLoginSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading || isGoogleLoading}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            <Button variant="link" type="button" onClick={() => setView('forgot-password')} className="ml-auto inline-block text-sm underline" disabled={isLoading || isGoogleLoading}>
              Esqueceu sua senha?
            </Button>
          </div>
          <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
        <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className={cn((isLoading || isGoogleLoading) && "pointer-events-none opacity-50", "underline")}>
                Cadastre-se
              </Link>
            </div>
      </form>
    </div>
  );
}
