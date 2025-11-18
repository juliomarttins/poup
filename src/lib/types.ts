
import type { Timestamp } from 'firebase/firestore';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  userId: string; // ID of the user who created the transaction
  profileId?: string; // ID of the profile that created the transaction
  createdAt?: Timestamp;
};

export type Debt = {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
};

export type ManagedDebt = {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: number;
    dueDate: string; // Data da primeiro vencimento
    category: string;
    userId: string; // ID of the user who created the debt
}

export type FinancialAnalysis = {
  id: string;
  title: string;
  status: 'positive' | 'negative' | 'neutral';
  summary: string;
  advice: string;
}


export type UserProfile = {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  avatarColor?: string | null;
  profiles?: Profile[];
};

export type Profile = {
  id: string;
  name: string;
  photoURL: string | null;
  avatarColor: string | null;
  backgroundId?: string | null; // <--- ADICIONE SÓ ESSA LINHA AQUI
}
}
