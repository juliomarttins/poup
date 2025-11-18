
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FILE
function initializeAdminApp() {
    if (getApps().length) {
        return getAdminSdks(getApp());
    }

    // This is the only place we need to manually set the config.
    // All other places should use the auto-magical env vars.
    const app = initializeApp({
        projectId: firebaseConfig.projectId,
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
