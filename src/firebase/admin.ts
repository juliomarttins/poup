import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
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

    // Tenta carregar as credenciais do arquivo service-account.json se a variável estiver definida
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountPath) {
        try {
            // Resolve o caminho absoluto do arquivo na raiz do projeto
            const fullPath = path.resolve(process.cwd(), serviceAccountPath);
            
            // Verifica se o arquivo existe antes de tentar ler
            if (fs.existsSync(fullPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                credential = cert(serviceAccount);
            } else {
                console.warn(`[Firebase Admin] Arquivo de credenciais não encontrado em: ${fullPath}`);
            }
        } catch (error) {
            console.error("[Firebase Admin] Erro ao carregar credenciais:", error);
        }
    }

    // Inicializa o app (se credential for undefined, ele tenta usar o Application Default Credentials do ambiente)
    const app = initializeApp({
        credential: credential,
        projectId: "studio-5059883647-300c7" // Força o Project ID correto
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