import { initializeApp, getApps, getApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initializeAdminApp() {
    if (getApps().length) {
        return getAdminSdks(getApp());
    }

    let credential;

    // 1. MODO VERCEL / PRODUÇÃO (Lê das variáveis de ambiente)
    if (process.env.FIREBASE_PRIVATE_KEY) {
        const serviceAccount: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Corrige as quebras de linha da chave privada que a Vercel às vezes bagunça
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
        credential = cert(serviceAccount);
    } 
    // 2. MODO LOCAL (Lê do arquivo service-account.json)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            // Garante que o caminho seja absoluto
            const fullPath = path.isAbsolute(serviceAccountPath) 
                ? serviceAccountPath 
                : path.resolve(process.cwd(), serviceAccountPath);
            
            if (fs.existsSync(fullPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                credential = cert(serviceAccount);
            }
        } catch (error) {
            console.error("Erro ao carregar credenciais locais:", error);
        }
    }

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