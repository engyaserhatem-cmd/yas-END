
import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { Account, Currency } from '../types';
import { CURRENCY_DETAILS } from '../constants';
import { CloseIcon } from './Icons';
import { calculateBalance } from './AccountCard';

export interface SavingsTransferFormData {
    amount: number;
    fromCurrency: Currency;
}

interface SavingsTransferFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SavingsTransferFormData) => void;
    suggestedAmount: number;
    accounts: Account[];
}

const SavingsTransferForm: React.FC<SavingsTransferFormProps> = ({ isOpen, onClose, onSubmit, suggestedAmount, accounts }) => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState<Currency>(Currency.YER);
    const [error, setError] = useState('');

    const availableSources = useMemo(() => {
        return accounts
            .filter(acc => acc.id.startsWith('safe-'))
            .map(acc => ({
                account: acc,
                balance: calculateBalance(acc.transactions)
            }))
            .filter(item => item.balance > 0);
    }, [accounts]);

    const selectedSource = useMemo(() => {
        return availableSources.find(s => s.account.currency === fromCurrency);
    }, [availableSources, fromCurrency]);

    useEffect(() => {
        // Set initial amount based on the YER suggestion
        const yerSource = availableSources.find(s => s.account.currency === Currency.YER);
        const initialAmount = (yerSource && yerSource.balance >= suggestedAmount) ? suggestedAmount : (yerSource?.balance || 0);
        setAmount(Math.floor(initialAmount).toString());
        setFromCurrency(Currency.YER);
    }, [suggestedAmount, availableSources]);
    
    useEffect(() => {
      // If the selected currency doesn't have a source, switch to one that does
      if (!availableSources.some(s => s.account.currency === fromCurrency) && availableSources.length > 0) {
        setFromCurrency(availableSources[0].account.currency);
      }
    }, [fromCurrency, availableSources]);


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);

        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('الرجاء إدخال مبلغ صحيح.');
            return;
        }

        if (!selectedSource || parsedAmount > selectedSource.balance) {
            setError('المبلغ المطلوب أكبر من الرصيد المتوفر في الصندوق.');
            return;
        }

        const destinationAccount = accounts.find(acc => acc.id === `acc-bank-${fromCurrency.toLowerCase()}`);
        if (!destinationAccount) {
            setError(`لا يوجد حساب بنكي للإدخار لهذه العملة (${CURRENCY_DETAILS[fromCurrency].name}).`);
            return;
        }

        setError('');
        onSubmit({
            amount: parsedAmount,
            fromCurrency: fromCurrency,
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">تحويل إلى الادخار</h2>
                
                <div className="bg-blue-50 p-3 rounded-md mb-4 text-center">
                    <p className="text-sm text-blue-700">المبلغ الموصى به للادخار:</p>
                    <p className="font-bold text-xl text-blue-800">
                        {suggestedAmount.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}
                    </p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="fromCurrency" className="block text-sm font-medium text-gray-700 mb-1">التحويل من صندوق</label>
                        <select
                            id="fromCurrency"
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value as Currency)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            {availableSources.map(source => (
                                <option key={source.account.id} value={source.account.currency}>
                                    {source.account.name} (الرصيد: {source.balance.toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ المراد تحويله</label>
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
                                {CURRENCY_DETAILS[fromCurrency].symbol}
                            </span>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-center text-gray-600 text-sm">
                        <p>سيتم تحويل المبلغ إلى: <span className="font-semibold">{`الحساب البنكي (${CURRENCY_DETAILS[fromCurrency].symbol})`}</span></p>
                    </div>

                    <div className="mt-6 flex gap-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                          تأكيد التحويل
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

export default SavingsTransferForm;
