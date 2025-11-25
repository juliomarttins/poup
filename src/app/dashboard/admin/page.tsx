'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Plus, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type AdminUser = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    subscription: {
        status: 'active' | 'expired' | 'trial';
        expiresAt: string;
        plan: string;
    }
}

export default function AdminPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 403) throw new Error("Acesso negado.");
            const data = await res.json();
            setUsers(data);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user]);

    const addDays = async (targetUserId: string, days: number) => {
        if (!user) return;
        setProcessingId(targetUserId);
        try {
            const token = await user.getIdToken();
            await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ targetUserId, action: 'add_days', days })
            });
            toast({ title: 'Sucesso', description: `${days} dias adicionados.` });
            fetchUsers(); // Recarrega lista
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao adicionar dias.' });
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(filter.toLowerCase()) || 
        u.email?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> Painel Administrativo
                    </h1>
                    <p className="text-muted-foreground">Gerencie assinaturas e usuários.</p>
                </div>
                <Badge variant="outline" className="h-8 px-3">Total: {users.length} usuários</Badge>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome ou email..." className="pl-8" value={filter} onChange={e => setFilter(e.target.value)} />
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead className="text-right">Ações Rápidas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((u) => {
                            const isExpired = new Date(u.subscription.expiresAt) < new Date();
                            const daysLeft = Math.ceil((new Date(u.subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <TableRow key={u.uid}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                            {u.role === 'admin' && <Badge className="w-fit mt-1 text-[10px]" variant="secondary">Admin</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={isExpired ? "destructive" : "default"}>
                                            {isExpired ? 'Vencido' : 'Ativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {new Date(u.subscription.expiresAt).toLocaleDateString('pt-BR')}
                                            <span className={`block text-xs ${daysLeft < 5 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                ({daysLeft} dias)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            disabled={processingId === u.uid}
                                            onClick={() => addDays(u.uid, 30)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> 30 Dias
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}