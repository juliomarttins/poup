import { initializeApp, getApps, getApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initializeAdminApp() {
    // Se já estiver inicializado, retorna a instância existente
    if (getApps().length) {
        return getAdminSdks(getApp());
    }

    let credential;

    // 1. PRODUÇÃO (Vercel): Tenta usar variáveis de ambiente diretas
    // Isso resolve o problema de "IA Offline" no site oficial
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        const serviceAccount: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID || "studio-5059883647-300c7",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Corrige a formatação da chave privada (quebra de linha)
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
        credential = cert(serviceAccount);
    } 
    // 2. LOCAL (Seu PC): Tenta ler o arquivo service-account.json
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            // Resolve o caminho absoluto
            const fullPath = path.isAbsolute(serviceAccountPath) 
                ? serviceAccountPath 
                : path.resolve(process.cwd(), serviceAccountPath);
            
            if (fs.existsSync(fullPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                credential = cert(serviceAccount);
            } else {
                console.warn(`[Firebase Admin] Arquivo não encontrado: ${fullPath}`);
            }
        } catch (error) {
            console.error("[Firebase Admin] Erro ao ler arquivo:", error);
        }
    }

    // Inicializa o app
    const app = initializeApp({
        credential: credential,
        projectId: "studio-5059883647-300c7"
    });

    return getAdminSdks(app);
}

function getAdminSdks(app: App) {
    return {
        app,
        auth: getAuth(app),
        firestore: getFirestore(app),
    };
}

export { initializeAdminApp };