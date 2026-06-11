import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type TransactionType = 'earn' | 'spend';
export type CurrencyType = 'choco' | 'gchoco';

export const logTransaction = async (
  uid: string,
  amount: number,
  currency: CurrencyType,
  type: TransactionType,
  reason: string
) => {
  if (!uid || amount <= 0) return;
  try {
    await addDoc(collection(db, `users/${uid}/transactions`), {
      amount,
      currency,
      type,
      reason,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Lỗi khi ghi lịch sử giao dịch:', error);
  }
};
