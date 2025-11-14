import { Account, Currency, TransactionType } from './types';

export const CURRENCY_DETAILS: Record<Currency, { symbol: string; name: string }> = {
  [Currency.YER]: { symbol: 'ر.ي.', name: 'ريال يمني' },
  [Currency.USD]: { symbol: '$', name: 'دولار أمريكي' },
  [Currency.SAR]: { symbol: 'ر.س.', name: 'ريال سعودي' },
};

export const INITIAL_ACCOUNTS: Account[] = [
  // Deferred Accounts
  { id: 'acc-deferred-yer', name: 'الحساب الآجل (ر.ي)', currency: Currency.YER, transactions: [
    { id: 'trans-1', amount: 50000, currency: Currency.YER, type: TransactionType.RECEIVABLE, description: 'دين للسيد أحمد', date: '2024-05-20T10:00:00.000Z' },
    { id: 'trans-2', amount: 25000, currency: Currency.YER, type: TransactionType.LIABILITY, description: 'دين لمحلات البدر', date: '2024-05-15T14:30:00.000Z' },
  ] },
  { id: 'acc-deferred-usd', name: 'الحساب الآجل ($)', currency: Currency.USD, transactions: [
    { id: 'trans-3', amount: 100, currency: Currency.USD, type: TransactionType.LIABILITY, description: 'قسط شهري للسيارة', date: '2024-05-01T09:00:00.000Z' },
  ] },
  { id: 'acc-deferred-sar', name: 'الحساب الآجل (ر.س)', currency: Currency.SAR, transactions: [] },
  
  // Home Safes
  { id: 'safe-yer', name: 'الصندوق المنزلي (ر.ي)', currency: Currency.YER, transactions: [
    { id: 'trans-4', amount: 300000, currency: Currency.YER, type: TransactionType.INCOME, description: 'راتب شهر مايو', date: '2024-05-25T08:00:00.000Z' },
    { id: 'trans-5', amount: 15000, currency: Currency.YER, type: TransactionType.EXPENSE, description: 'مصاريف بقالة', date: '2024-05-26T18:00:00.000Z' },
    { id: 'trans-6', amount: 2000, currency: Currency.YER, type: TransactionType.EXPENSE, description: 'شراء قهوة', date: '2024-05-27T11:00:00.000Z' },
  ] },
  { id: 'safe-usd', name: 'الصندوق المنزلي ($)', currency: Currency.USD, transactions: [
    { id: 'trans-7', amount: 500, currency: Currency.USD, type: TransactionType.INCOME, description: 'تحويل من صديق', date: '2024-05-22T16:00:00.000Z' },
    { id: 'trans-8', amount: 50, currency: Currency.USD, type: TransactionType.EXPENSE, description: 'فاتورة انترنت', date: '2024-05-28T10:00:00.000Z' },
  ] },
  { id: 'safe-sar', name: 'الصندوق المنزلي (ر.س)', currency: Currency.SAR, transactions: [
    { id: 'trans-9', amount: 1000, currency: Currency.SAR, type: TransactionType.INCOME, description: 'هدية', date: '2024-05-10T20:00:00.000Z' },
  ] },

  // Bank Accounts
  { id: 'acc-bank-yer', name: 'الحساب البنكي (ر.ي)', currency: Currency.YER, transactions: [
    { id: 'trans-10', amount: 500000, currency: Currency.YER, type: TransactionType.INCOME, description: 'رصيد افتتاحي للادخار', date: '2024-05-01T00:00:00.000Z' },
  ] },
  { id: 'acc-bank-usd', name: 'الحساب البنكي ($)', currency: Currency.USD, transactions: [] },
  { id: 'acc-bank-sar', name: 'الحساب البنكي (ر.س)', currency: Currency.SAR, transactions: [] },
];

export const TRANSACTION_TYPE_DETAILS: Record<TransactionType, { label: string; color: string }> = {
    [TransactionType.INCOME]: { label: 'دخل', color: 'text-green-600' },
    [TransactionType.EXPENSE]: { label: 'مصروف', color: 'text-red-600' },
    [TransactionType.LIABILITY]: { label: 'دين عليّ', color: 'text-orange-600' },
    [TransactionType.RECEIVABLE]: { label: 'دين لي', color: 'text-blue-600' },
    [TransactionType.TRANSFER]: { label: 'تحويل بين الحسابات', color: 'text-purple-600' },
}