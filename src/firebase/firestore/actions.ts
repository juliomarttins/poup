'use client';

import {
  doc,
  setDoc,
  deleteDoc,
  type Firestore,
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Transaction, ManagedDebt, Report } from '@/lib/types';

// Generic function to set a document in a user's subcollection
async function setUserSubcollectionDoc<T extends { id: string, userId: string }>(
  firestore: Firestore,
  userId: string,
  collectionName: string,
  data: T
) {
  const isUpdate = !!data.id && data.id !== '';
  
  // Use the provided userId for the path
  const docRef = isUpdate
    ? doc(firestore, 'users', userId, collectionName, data.id)
    : doc(collection(firestore, 'users', userId, collectionName));

  const finalData: any = {
    ...data,
    id: docRef.id,
    userId: userId, // Ensure userId is correctly set
    updatedAt: serverTimestamp(),
  };

  if (!isUpdate) {
    finalData.createdAt = serverTimestamp();
  }

  setDoc(docRef, finalData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: isUpdate ? 'update' : 'create',
      requestResourceData: finalData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

// Generic function to delete a document from a user's subcollection
async function deleteUserSubcollectionDoc(
  firestore: Firestore,
  userId: string,
  collectionName: string,
  docId: string
) {
  const docRef = doc(firestore, 'users', userId, collectionName, docId);
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

// Specific actions for Transactions
export const setTransaction = (
  firestore: Firestore,
  userId: string,
  transaction: Transaction
) => {
  return setUserSubcollectionDoc<Transaction>(
    firestore,
    userId,
    'transactions',
    transaction
  );
};

export const deleteTransaction = (
  firestore: Firestore,
  userId: string,
  transactionId: string
) => {
  return deleteUserSubcollectionDoc(
    firestore,
    userId,
    'transactions',
    transactionId
  );
};

// Specific actions for Debts
export const setDebt = (
  firestore: Firestore,
  userId: string,
  debt: ManagedDebt
) => {
  return setUserSubcollectionDoc<ManagedDebt>(firestore, userId, 'debts', debt);
};

export const deleteDebt = (
  firestore: Firestore,
  userId: string,
  debtId: string
) => {
  return deleteUserSubcollectionDoc(firestore, userId, 'debts', debtId);
};

// [NOVO] Salvar histórico de relatório
export const saveReportHistory = async (
    firestore: Firestore,
    userId: string,
    type: Report['type'],
    title: string,
    filterDescription?: string
) => {
    try {
        const reportsCol = collection(firestore, 'users', userId, 'reports');
        await addDoc(reportsCol, {
            userId,
            type,
            title,
            filterDescription: filterDescription || 'Sem filtros',
            generatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao salvar histórico de relatório:", error);
    }
}