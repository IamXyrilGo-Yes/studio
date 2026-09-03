export type PaymentType = 'regular' | 'custom';
export type ClientStatus = 'ongoing' | 'settled' | 'overdue';

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  type: PaymentType;
  date: string;
  notes?: string;
  principalApplied?: number;
  interestApplied?: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loanAmount: number;
  interestRate: number; // Percentage, e.g., 10
  initialBalance: number; // Loan Amount * (1 + interestRate/100)
  outstandingBalance: number;
  totalPaid: number;
  dueDate?: string; // ISO date string
  notes?: string;
  history: PaymentHistoryItem[];
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  defaultInterestRate: number;
  defaultRegularPayment: number;
}

export interface AppData {
  clients: Client[];
  settings?: AppSettings;
  version: number;
}
