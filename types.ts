// FIX: Removed self-import of types from this file to resolve conflicts.
export enum Currency {
  YER = 'YER',
  USD = 'USD',
  SAR = 'SAR',
}

export type ExchangeRates = {
  [key in Currency]?: number;
};

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  LIABILITY = 'LIABILITY',
  RECEIVABLE = 'RECEIVABLE',
  TRANSFER = 'TRANSFER',
}

export interface TransactionHistory {
  previousAmount: number;
  modifiedAt: string; // ISO string
}

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  description: string;
  date: string; // ISO string
  fromAccountId?: string;
  toAccountId?: string;
  history?: TransactionHistory[];
  settlesTransactionId?: string;
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  transactions: Transaction[];
}

export interface Goal {
  id:string;
  description: string;
  targetAmount: number;
  targetDate: string; // ISO string
  createdAt: string; // ISO string
}