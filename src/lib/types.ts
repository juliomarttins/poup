

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  userId: string; // ID of the user who created the transaction
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
  avatarBackground: string | null;
}
