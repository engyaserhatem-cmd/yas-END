import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { Account, Transaction, TransactionType } from '../types';
import { CURRENCY_DETAILS } from '../constants';
import { CloseIcon } from './Icons';

export interface SettleDebtFormData {
    debtTransaction: Transaction;
    amountPaid: number;
    accountId: string; // The account receiving the income or making the expense
}

interface SettleDebtFormProps {
  transaction: Transaction;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (data: SettleDebtFormData) => void;
}

const SettleDebtForm: React.FC<SettleDebtFormProps> = ({ transaction, accounts, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [targetAccountId, setTargetAccountId] = useState('');
  const [error, setError] = useState('');

  const isReceivable = transaction.type === TransactionType.RECEIVABLE;
  const formTitle = isReceivable ? 'تسجيل دفعة مستلمة' : 'تسجيل سداد دين';
  const amountLabel = isReceivable ? 'المبلغ المستلم' : 'المبلغ المدفوع';
  const accountLabel = isReceivable ? 'إيداع في حساب' : 'سداد من حساب';

  const compatibleAccounts = useMemo(() => {
    return accounts.filter(acc => acc.currency === transaction.currency);
  }, [accounts, transaction.currency]);
  
  useEffect(() => {
    // Default the target account to a compatible home safe, then any compatible account
    const defaultSafe = compatibleAccounts.find(a => a.id === `safe-${transaction.currency.toLowerCase()}`);
    if (defaultSafe) {
        setTargetAccountId(defaultSafe.id);
    } else if (compatibleAccounts.length > 0) {
        setTargetAccountId(compatibleAccounts[0].id);
    } else {
        setTargetAccountId('');
    }
  }, [compatibleAccounts, transaction.currency]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('الرجاء إدخال مبلغ صحيح.');
        return;
    }
    if (parsedAmount > transaction.amount) {
        setError('المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ المتبقي من الدين.');
        return;
    }
    if (!targetAccountId) {
        setError('الرجاء اختيار حساب لإتمام العملية.');
        return;
    }
    setError('');

    onSubmit({
        debtTransaction: transaction,
        amountPaid: parsedAmount,
        accountId: targetAccountId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
            <CloseIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{formTitle}</h2>
        <div className="bg-gray-50 p-3 rounded-md mb-4 text-center">
            <p className="text-sm text-gray-600">الدين الأصلي: <span className="font-bold">{transaction.description}</span></p>
            <p className="font-bold text-lg text-gray-800">المبلغ المتبقي: {transaction.amount.toLocaleString()} {CURRENCY_DETAILS[transaction.currency].symbol}</p>
            <p className="text-xs text-gray-500 mt-1">
                سيتم التسوية باستخدام عملة الدين الأصلية: <span className="font-semibold">{CURRENCY_DETAILS[transaction.currency].name}</span>
            </p>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        
        {compatibleAccounts.length === 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                لا يوجد لديك حساب بنفس عملة هذا الدين ({CURRENCY_DETAILS[transaction.currency].name}) لتسوية المبلغ منه.
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">{amountLabel}</label>
                <div className="flex">
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-grow p-2 border border-gray-300 rounded-s-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                    />
                     <span className="inline-flex items-center px-3 border border-s-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-e-md">
                        {CURRENCY_DETAILS[transaction.currency].symbol}
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">{accountLabel}</label>
                <select
                    id="account"
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                    disabled={compatibleAccounts.length === 0}
                >
                    <option value="" disabled>اختر حساب...</option>
                    {compatibleAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
            </div>
            <div className="mt-6 flex gap-4">
              <button 
                type="submit"
                disabled={compatibleAccounts.length === 0}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  حفظ الدفعة
              </button>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-300">
                  إلغاء
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettleDebtForm;