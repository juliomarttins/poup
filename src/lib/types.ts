import type { Timestamp } from 'firebase/firestore';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  userId: string; 
  profileId?: string; 
  createdAt?: Timestamp;
};

export type ManagedDebt = {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: number;
    dueDate: string;
    category: string;
    userId: string;
}

export type FinancialAnalysis = {
  id: string;
  title: string;
  status: 'positive' | 'negative' | 'neutral';
  summary: string;
  advice: string;
}

// [ATUALIZADO] Adicionado role e subscription
export type UserProfile = {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  avatarColor?: string | null;
  profiles?: Profile[];
  familyId?: string;
  familyCode?: string;
  
  // Controle de Acesso e Pagamento
  role?: 'admin' | 'user'; 
  subscription?: {
      plan: 'free' | 'pro';
      status: 'active' | 'expired' | 'trial';
      expiresAt: string | Timestamp; // ISO String ou Timestamp
  };

  aiSettings?: {
      persona?: string;
      updatedAt?: any;
  }
};

export type Profile = {
  id: string;
  name: string;
  photoURL: string | null;
  avatarColor: string | null;
  avatarBackground?: string | null;
}

export type Report = {
    id: string;
    userId: string;
    type: 'geral' | 'painel' | 'dividas' | 'transacoes';
    title: string;
    generatedAt: Timestamp | any;
    filterDescription?: string;
}