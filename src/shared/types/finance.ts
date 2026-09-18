export type CurrencyCode =
  | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'BYN' | 'UAH'
  | 'BTC' | 'ETH' | 'USDT' | 'TON'
  | (string & {}); 

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'bank' | 'card' | 'cash' | 'crypto' | 'e-wallet' | 'savings';
export type CardPaymentSystem = 'visa' | 'mastercard' | 'mir' | 'unionpay' | 'other';

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringSettings {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
  nextDate: string;
  endDate?: string | null;
  remainingOccurrences?: number | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'transfer';
  budgetLimit?: number;
}
export interface AccountDesign {
  gradient?: string;
  color?: string;
  icon?: string;
  paymentSystem?: CardPaymentSystem;
  texture?: 'matte' | 'glossy' | 'glass';
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string; 
  icon?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  accountId: string;
  date: string;
  comment?: string;
  tags?: string[];
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  categoryId?: string;
  accountId?: string;
  limit: number;
  currentAmount: number;
  period: BudgetPeriod;
  currency: CurrencyCode;
  periodStart: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  icon?: string;
  color?: string;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PiggybankSettings {
  enabled: boolean;
  roundTo: number;
  targetGoalId: string;
  totalSaved: number;
}
