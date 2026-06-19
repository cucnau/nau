/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Use env vars if they exist (Vercel), otherwise fallback to the hardcoded config (AI Studio)
const config = {
  apiKey: firebaseConfig.apiKey || (import.meta.env.VITE_FIREBASE_API_KEY as string),
  authDomain: firebaseConfig.authDomain || (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string),
  projectId: firebaseConfig.projectId || (import.meta.env.VITE_FIREBASE_PROJECT_ID as string),
  storageBucket: firebaseConfig.storageBucket || (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string),
  messagingSenderId: firebaseConfig.messagingSenderId || (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string),
  appId: firebaseConfig.appId || (import.meta.env.VITE_FIREBASE_APP_ID as string),
  measurementId: firebaseConfig.measurementId || (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string),
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || '(default)'
};

export const app = initializeApp(config);
console.log('Firebase App initialized with Project ID:', config.projectId);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function checkIfQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    errMsg.toLowerCase().includes('quota') ||
    errMsg.toLowerCase().includes('exhausted') ||
    errMsg.toLowerCase().includes('limit exceeded') ||
    code === 'resource-exhausted'
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (checkIfQuotaError(error)) {
    if (typeof window !== 'undefined' && (window as any).__setQuotaExceeded) {
      (window as any).__setQuotaExceeded(true);
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
