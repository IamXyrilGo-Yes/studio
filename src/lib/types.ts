export type PaymentStatus = 'paid' | 'due' | 'overdue';

export interface PaymentEntry {
  id: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  dueDate?: string;
}

export interface Client {
  id: string;
  name: string;
  loanAmount: number;
  outstandingBalance: number;
  totalPaid: number;
  notes?: string;
  payments: PaymentEntry[];
  createdAt: string;
}

export interface AppData {
  clients: Client[];
}