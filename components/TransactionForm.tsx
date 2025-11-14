import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { Account, Currency, Transaction, TransactionType } from '../types';
import { CURRENCY_DETAILS, TRANSACTION_TYPE_DETAILS } from '../constants';
import { CloseIcon } from './Icons';
import { calculateBalance } from './AccountCard';
import { numberToWordsAr } from '../utils/numberToWords';

export interface TransactionFormData {
    id?: string;
    amount: number;
    currency: Currency;
    type: TransactionType;
    description: string;
    date: string;
    fromAccountId?: string;
    toAccountId?: string;
    incomeSource?: 'profit' | 'debt';
    sourceAccountId?: string; // For expenses
}

interface TransactionFormProps {
    accounts: Account[];
    selectedAccountId: string;
    editingTransaction: Transaction | null;
    initialData?: Partial<TransactionFormData> | null;
    onClose: () => void;
    onSubmit: (data: TransactionFormData) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, selectedAccountId, editingTransaction, initialData, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.YER);
  const [amountAsText, setAmountAsText] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [incomeSource, setIncomeSource] = useState<'profit' | 'debt'>('profit');
  const [fromAccountId, setFromAccountId] = useState(selectedAccountId);
  const [toAccountId, setToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!editingTransaction;
  
  const expenseSourceAccounts = useMemo(() => {
    return accounts.filter(acc =>
        (acc.id.startsWith('safe-') || acc.id.startsWith('acc-bank-')) &&
        acc.currency === currency
    );
  }, [accounts, currency]);

  useEffect(() => {
    if (isEditing) {
      setAmount(editingTransaction.amount.toString());
      setCurrency(editingTransaction.currency);
      if (editingTransaction.type === TransactionType.LIABILITY && editingTransaction.description.startsWith('مقابل دين:')) {
        setType(TransactionType.INCOME);
        setIncomeSource('debt');
        setDescription(editingTransaction.description.replace('مقابل دين: ', ''));
      } else {
        setType(editingTransaction.type);
        if(editingTransaction.type === TransactionType.INCOME) {
            setIncomeSource('profit');
        }
        setDescription(editingTransaction.description);
      }
      setDate(new Date(editingTransaction.date).toISOString().split('T')[0]);
      setFromAccountId(selectedAccountId);
      if(editingTransaction.type === TransactionType.EXPENSE) {
        const originalAccount = accounts.find(a => a.transactions.some(t => t.id === editingTransaction.id));
        setSourceAccountId(originalAccount?.id || '');
      }
    } else if (initialData) {
        setAmount(initialData.amount?.toString() || '');
        setCurrency(initialData.currency || Currency.YER);
        setType(initialData.type || TransactionType.INCOME);
        setDescription(initialData.description || '');
        setFromAccountId(initialData.fromAccountId || selectedAccountId);
        setToAccountId(initialData.toAccountId || '');
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, initialData, selectedAccountId, accounts, isEditing]);
  
  useEffect(() => {
    if (type === TransactionType.TRANSFER && !toAccountId) {
      const defaultTo = accounts.find(acc => acc.id !== fromAccountId);
      if (defaultTo) setToAccountId(defaultTo.id);
    }
  }, [type, fromAccountId, accounts]);

  useEffect(() => {
    // This handles defaults for NEW transactions only.
    if (!isEditing) {
        if (type === TransactionType.EXPENSE) {
            const currentSourceIsValid = expenseSourceAccounts.some(acc => acc.id === sourceAccountId);
            if (!sourceAccountId || !currentSourceIsValid) {
                const defaultSource = expenseSourceAccounts.find(acc => acc.id === `safe-${currency.toLowerCase()}`) || expenseSourceAccounts[0];
                if (defaultSource) {
                    setSourceAccountId(defaultSource.id);
                } else {
                    setSourceAccountId('');
                }
            }
        }
    }
}, [type, currency, expenseSourceAccounts, isEditing, sourceAccountId]);
  
  useEffect(() => {
    const num = parseInt(amount, 10);
    if (!isNaN(num) && num > 0) {
        const text = numberToWordsAr(num);
        setAmountAsText(`${text} ${CURRENCY_DETAILS[currency].name}`);
    } else {
        setAmountAsText('');
    }
  }, [amount, currency]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('الرجاء إدخال مبلغ صحيح.');
        return;
    }
    if(!description.trim()){
        setError('الرجاء إدخال وصف للعملية.');
        return;
    }

    if (type === TransactionType.EXPENSE) {
        if (!sourceAccountId) {
            setError('الرجاء تحديد حساب السحب للمصروف.');
            return;
        }
        const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
        if (sourceAccount) {
            let availableBalance = calculateBalance(sourceAccount.transactions);
            if (isEditing && editingTransaction.type === TransactionType.EXPENSE) {
                const originalAccount = accounts.find(a => a.transactions.some(t => t.id === editingTransaction.id));
                if(originalAccount && originalAccount.id === sourceAccount.id) {
                   availableBalance += editingTransaction.amount;
                }
            }
            if (parsedAmount > availableBalance) {
                setError(`الرصيد في حساب "${sourceAccount.name}" غير كافٍ.`);
                return;
            }
        }
    }
    
    if (type === TransactionType.TRANSFER) {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            setError('في التحويل، يجب اختيار حسابين مختلفين.');
            return;
        }
        const fromAccount = accounts.find(acc => acc.id === fromAccountId);
        if(fromAccount) {
            const fromBalance = calculateBalance(fromAccount.transactions);
            if(parsedAmount > fromBalance) {
                setError(`الرصيد في حساب "${fromAccount.name}" غير كافٍ.`);
                return;
            }
        }
    }

    setError('');

    onSubmit({
        id: isEditing ? editingTransaction.id : undefined,
        amount: parsedAmount,
        currency: currency,
        type: type,
        description,
        date,
        fromAccountId: type === TransactionType.TRANSFER ? fromAccountId : undefined,
        toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
        incomeSource: type === TransactionType.INCOME ? incomeSource : undefined,
        sourceAccountId: type === TransactionType.EXPENSE ? sourceAccountId : undefined,
    });
  };
  
  const getHelperText = (type: TransactionType): string => {
    switch (type) {
        case TransactionType.INCOME:
            return `سيتم تسجيل الدخل في الصندوق النقدي للعملة المختارة.`;
        case TransactionType.LIABILITY:
        case TransactionType.RECEIVABLE:
            return `سيتم تسجيل هذه العملية في الحساب الآجل.`;
        case TransactionType.EXPENSE:
        default:
            return "";
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
            <CloseIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isEditing ? 'تعديل العملية' : 'إضافة عملية جديدة'}
        </h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                        disabled={isEditing}
                    >
                        {Object.values(Currency).map(c => (
                            <option key={c} value={c}>{CURRENCY_DETAILS[c].symbol}</option>
                        ))}
                    </select>
                </div>
            </div>
             {amountAsText && (
                <p className="text-xs text-gray-500 -mt-2 text-center animate-fade-in-up bg-gray-50 p-1 rounded">
                    {amountAsText}
                </p>
            )}

             <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
                <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                >
                    {Object.values(TransactionType).map(t => (
                        <option key={t} value={t}>{TRANSACTION_TYPE_DETAILS[t as TransactionType].label}</option>
                    ))}
                </select>
            </div>
            
            {type === TransactionType.EXPENSE && (
                 <div className="animate-fade-in-up">
                    <label htmlFor="sourceAccount" className="block text-sm font-medium text-gray-700 mb-1">السحب من</label>
                    <select
                        id="sourceAccount"
                        value={sourceAccountId}
                        onChange={(e) => setSourceAccountId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="" disabled>اختر حساب المصدر...</option>
                        {expenseSourceAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {type === TransactionType.INCOME && (
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50 animate-fade-in-up">
                     <label htmlFor="incomeSource" className="block text-sm font-medium text-gray-700 mb-2">مصدر هذا الدخل؟</label>
                     <select
                        id="incomeSource"
                        value={incomeSource}
                        onChange={(e) => setIncomeSource(e.target.value as 'profit' | 'debt')}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="profit">أرباح (نقد مباشر إلى الصندوق)</option>
                        <option value="debt">مقابل دين جديد (قرض يتم تسجيله كالتزام)</option>
                    </select>
                </div>
            )}
             
            {type === TransactionType.TRANSFER ? (
                <>
                    <div>
                        <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-1">من حساب</label>
                        <select
                            id="fromAccount"
                            value={fromAccountId}
                            onChange={(e) => setFromAccountId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-1">إلى حساب</label>
                        <select
                            id="toAccount"
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                             <option value="" disabled>اختر حساب...</option>
                            {accounts.filter(acc => acc.id !== fromAccountId).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                </>
            ) : (
                getHelperText(type) && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-center text-gray-600 text-sm">
                        <p>{getHelperText(type)}</p>
                    </div>
                )
            )}

             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">التفاصيل/الوصف</label>
                <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: شراء قهوة أو تحويل راتب"
                />
            </div>
             <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="mt-6 flex gap-4">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                  {isEditing ? 'حفظ التعديلات' : 'حفظ العملية'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-300">
                  تراجع
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;