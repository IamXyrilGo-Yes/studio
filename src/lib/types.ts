export type PaymentType = 'regular' | 'custom';
export type ClientStatus = 'ongoing' | 'settled';

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  type: PaymentType;
  date: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  loanAmount: number;
  initialBalance: number; // Loan Amount * 1.1
  outstandingBalance: number;
  totalPaid: number;
  notes?: string;
  history: PaymentHistoryItem[];
  createdAt: string;
}

export interface AppData {
  clients: Client[];
}
