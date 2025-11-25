import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

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
        // NOTA: Em escala real, precisaria de paginação. Para agora, serve.
        const snapshot = await firestore.collection('users').get();
        
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            // Sanitiza dados sensíveis antes de enviar pro front
            return {
                uid: doc.id,
                name: data.name,
                email: data.email,
                role: data.role || 'user',
                subscription: {
                    status: data.subscription?.status || 'trial',
                    expiresAt: data.subscription?.expiresAt?.toDate ? data.subscription.expiresAt.toDate().toISOString() : data.subscription?.expiresAt,
                    plan: data.subscription?.plan || 'free'
                },
                lastLogin: data.lastLogin // Se tiver tracking
            };
        });

        return NextResponse.json(users);

    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Adicionar Dias / Alterar Status
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
        const { targetUserId, action, days } = body;

        const targetRef = firestore.collection('users').doc(targetUserId);
        const targetSnap = await targetRef.get();
        const targetData = targetSnap.data();

        if (!targetSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (action === 'add_days') {
            let currentExpiresAt = new Date();
            
            // Se já tem data futura, soma a partir dela. Se não, soma a partir de hoje.
            if (targetData?.subscription?.expiresAt) {
                const expDate = targetData.subscription.expiresAt.toDate();
                if (expDate > new Date()) {
                    currentExpiresAt = expDate;
                }
            }

            const newExpiresAt = new Date(currentExpiresAt);
            newExpiresAt.setDate(newExpiresAt.getDate() + parseInt(days));

            await targetRef.update({
                'subscription.status': 'active',
                'subscription.plan': 'pro',
                'subscription.expiresAt': Timestamp.fromDate(newExpiresAt)
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}