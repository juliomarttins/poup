import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

// Listar Usuários (Apenas Admin)
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const token = authHeader.split('Bearer ')[1];
        const { auth, firestore } = initializeAdminApp();
        
        // Verifica quem está pedindo
        const decodedToken = await auth.verifyIdToken(token);
        const callerRef = firestore.collection('users').doc(decodedToken.uid);
        const callerDoc = await callerRef.get();
        
        if (callerDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // Busca todos os usuários
        const snapshot = await firestore.collection('users').get();
        
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name,
                email: data.email,
                role: data.role || 'user',
                isBlocked: data.isBlocked || false,
                adminMessage: data.adminMessage || '',
                subscription: {
                    status: data.subscription?.status || 'trial',
                    expiresAt: data.subscription?.expiresAt?.toDate ? data.subscription.expiresAt.toDate().toISOString() : data.subscription?.expiresAt,
                    plan: data.subscription?.plan || 'trial'
                }
            };
        });

        return NextResponse.json(users);

    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Ações Administrativas
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const token = authHeader.split('Bearer ')[1];
        const { auth, firestore } = initializeAdminApp();
        
        const decodedToken = await auth.verifyIdToken(token);
        const callerDoc = await firestore.collection('users').doc(decodedToken.uid).get();
        
        if (callerDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { targetUserId, action, value } = body;

        const targetRef = firestore.collection('users').doc(targetUserId);
        
        // AÇÃO: DELETAR USUÁRIO
        if (action === 'delete') {
            try {
                await auth.deleteUser(targetUserId);
            } catch (e) {
                console.log("Auth delete failed (maybe already deleted):", e);
            }
            await targetRef.delete();
            // Nota: Em produção real, deletaria recursivamente subcoleções.
            return NextResponse.json({ success: true });
        }

        const targetSnap = await targetRef.get();
        if (!targetSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const targetData = targetSnap.data();

        // AÇÃO: DEFINIR PLANO (Basic, Brother, Premium, etc)
        if (action === 'set_plan') {
            const planKey = value; 
            const planDetails = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planKey);
            
            if (!planDetails) return NextResponse.json({ error: 'Plan invalid' }, { status: 400 });

            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + planDetails.days);

            await targetRef.update({
                'subscription.status': planKey === 'lifetime' ? 'lifetime' : 'active',
                'subscription.plan': planKey,
                'subscription.expiresAt': Timestamp.fromDate(newExpiresAt)
            });
        }

        // AÇÃO: REMOVER DIAS
        if (action === 'remove_days') {
            const days = parseInt(value);
            let currentExpiresAt = targetData?.subscription?.expiresAt?.toDate() || new Date();
            currentExpiresAt.setDate(currentExpiresAt.getDate() - days);
            
            await targetRef.update({
                'subscription.expiresAt': Timestamp.fromDate(currentExpiresAt)
            });
        }

        // AÇÃO: BLOQUEAR / DESBLOQUEAR
        if (action === 'toggle_block') {
            const currentStatus = targetData?.isBlocked || false;
            await targetRef.update({ isBlocked: !currentStatus });
            try {
                await auth.updateUser(targetUserId, { disabled: !currentStatus });
            } catch (e) {
                console.error("Auth block failed:", e);
            }
        }

        // AÇÃO: ENVIAR MENSAGEM
        if (action === 'send_message') {
            await targetRef.update({ adminMessage: value });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API Admin Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}