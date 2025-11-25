'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Search, Trash2, Lock, Unlock, MessageSquare, MinusCircle, RefreshCw, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type AdminUser = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    isBlocked: boolean;
    adminMessage: string;
    subscription: {
        status: string;
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
    const [messageText, setMessageText] = useState("");

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

    useEffect(() => { fetchUsers(); }, [user]);

    const performAction = async (targetUserId: string, action: string, value: any = null) => {
        if (!user) return;
        setProcessingId(targetUserId);
        try {
            const token = await user.getIdToken();
            await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetUserId, action, value })
            });
            toast({ title: 'Sucesso', description: 'Ação realizada.' });
            fetchUsers();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha na ação.' });
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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-primary" /> Painel Mestre
                </h1>
                <Button size="sm" variant="outline" onClick={fetchUsers}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar usuário..." className="pl-8" value={filter} onChange={e => setFilter(e.target.value)} />
                </div>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plano / Vencimento</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((u) => {
                            const expires = new Date(u.subscription.expiresAt);
                            const daysLeft = Math.ceil((expires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isExpired = daysLeft < 0;
                            const planLabel = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === u.subscription.plan)?.label || u.subscription.plan;

                            return (
                                <TableRow key={u.uid} className={u.isBlocked ? "opacity-50 bg-destructive/5" : ""}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2">
                                                {u.name} {u.role === 'admin' && <Badge variant="secondary" className="text-[10px]">ADMIN</Badge>}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                            {u.adminMessage && <span className="text-[10px] text-yellow-600 font-bold mt-1">msg: {u.adminMessage}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {u.isBlocked && <Badge variant="destructive">BLOQUEADO</Badge>}
                                            <Badge variant={isExpired ? "outline" : "default"} className={isExpired ? "text-red-500 border-red-200" : "bg-green-600"}>
                                                {isExpired ? 'Vencido' : 'Ativo'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{planLabel}</div>
                                        <div className={`text-xs ${daysLeft < 5 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                            Vence em: {expires.toLocaleDateString('pt-BR')} ({daysLeft} dias)
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* PLANO */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="outline" disabled={!!processingId}>Plano / Renovar</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                                                        <DropdownMenuItem key={plan.id} onClick={() => performAction(u.uid, 'set_plan', plan.id)}>
                                                            <Plus className="mr-2 h-4 w-4" /> {plan.label} (+{plan.days}d)
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* ACTIONS MENU */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost"><ShieldCheck className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => performAction(u.uid, 'remove_days', 5)}>
                                                        <MinusCircle className="mr-2 h-4 w-4 text-orange-500" /> Remover 5 Dias
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => performAction(u.uid, 'toggle_block')}>
                                                        {u.isBlocked ? <Unlock className="mr-2 h-4 w-4 text-green-500" /> : <Lock className="mr-2 h-4 w-4 text-orange-500" />}
                                                        {u.isBlocked ? 'Desbloquear' : 'Bloquear Acesso'}
                                                    </DropdownMenuItem>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                <MessageSquare className="mr-2 h-4 w-4 text-blue-500" /> Enviar Aviso
                                                            </DropdownMenuItem>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader><DialogTitle>Enviar Mensagem para {u.name}</DialogTitle></DialogHeader>
                                                            <Input placeholder="Ex: Renove agora para não perder acesso..." value={messageText} onChange={e => setMessageText(e.target.value)} />
                                                            <Button onClick={() => { performAction(u.uid, 'send_message', messageText); setMessageText(""); }}>Enviar</Button>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <DropdownMenuItem onClick={() => performAction(u.uid, 'delete')} className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
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