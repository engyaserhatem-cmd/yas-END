import React, { useState, useEffect, FormEvent } from 'react';
import { Account, Currency, ExchangeRates } from '../types';
import { CURRENCY_DETAILS } from '../constants';
import { CloseIcon, CurrencyExchangeIcon } from './Icons';
import { calculateBalance } from './AccountCard';

export interface ExchangeFormData {
    amountToSell: number;
    fromCurrency: Currency;
    toCurrency: Currency;
    exchangeRate: number;
    amountToReceive: number;
}

interface ExchangeFormProps {
    accounts: Account[]; // Should be only safe accounts
    exchangeRates: ExchangeRates;
    onClose: () => void;
    onSubmit: (data: ExchangeFormData) => void;
}

const ExchangeForm: React.FC<ExchangeFormProps> = ({ accounts, exchangeRates, onClose, onSubmit }) => {
    const [amountToSell, setAmountToSell] = useState('');
    const [fromCurrency, setFromCurrency] = useState<Currency>(Currency.YER);
    const [toCurrency, setToCurrency] = useState<Currency>(Currency.USD);
    const [exchangeRate, setExchangeRate] = useState('');
    const [amountToReceive, setAmountToReceive] = useState(0);
    const [error, setError] = useState('');

    const availableCurrencies = accounts.map(a => a.currency);

    useEffect(() => {
        if (!availableCurrencies.includes(toCurrency) || toCurrency === fromCurrency) {
            const nextBest = availableCurrencies.find(c => c !== fromCurrency) || availableCurrencies[0];
            setToCurrency(nextBest);
        }
    }, [fromCurrency, toCurrency, availableCurrencies]);


    // Pre-fill exchange rate when currencies change
    useEffect(() => {
        if (fromCurrency === Currency.YER) {
            const rate = exchangeRates[toCurrency];
            setExchangeRate(rate ? rate.toString() : '');
        } else if (toCurrency === Currency.YER) {
            const rate = exchangeRates[fromCurrency];
            setExchangeRate(rate ? rate.toString() : '');
        } else {
            const fromRate = exchangeRates[fromCurrency] || 0;
            const toRate = exchangeRates[toCurrency] || 0;
            if (fromRate > 0 && toRate > 0) {
                setExchangeRate((fromRate / toRate).toFixed(4));
            } else {
                setExchangeRate('');
            }
        }
    }, [fromCurrency, toCurrency, exchangeRates]);
    
    // Auto-calculate received amount
    useEffect(() => {
        const sell = parseFloat(amountToSell);
        const rate = parseFloat(exchangeRate);
        if (!isNaN(sell) && !isNaN(rate) && sell > 0 && rate > 0) {
            let received = 0;
            if (fromCurrency === Currency.YER) {
                received = sell / rate;
            } else if (toCurrency === Currency.YER) {
                received = sell * rate;
            } else {
                const fromRateInYer = exchangeRates[fromCurrency] || 0;
                const toRateInYer = exchangeRates[toCurrency] || 0;
                if(fromRateInYer > 0 && toRateInYer > 0) {
                    received = (sell * fromRateInYer) / toRateInYer;
                }
            }
            setAmountToReceive(parseFloat(received.toFixed(2)));
        } else {
            setAmountToReceive(0);
        }
    }, [amountToSell, exchangeRate, fromCurrency, toCurrency, exchangeRates]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amountToSell);
        const parsedRate = parseFloat(exchangeRate);

        if (!amountToSell || isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('الرجاء إدخال مبلغ صحيح للمصارفة.');
            return;
        }
        if (!exchangeRate || isNaN(parsedRate) || parsedRate <= 0) {
            setError('الرجاء إدخال سعر صرف صحيح.');
            return;
        }
        if (fromCurrency === toCurrency) {
            setError('لا يمكن المصارفة بنفس العملة.');
            return;
        }

        const fromAccount = accounts.find(acc => acc.currency === fromCurrency);
        if (!fromAccount) {
             setError(`لا يوجد لديك صندوق منزلي لعملة ${CURRENCY_DETAILS[fromCurrency].name}`);
             return;
        }
        
        const availableBalance = calculateBalance(fromAccount.transactions);
        if (parsedAmount > availableBalance) {
            setError(`الرصيد في صندوق ${fromAccount.name} غير كافٍ.`);
            return;
        }

        setError('');
        onSubmit({
            amountToSell: parsedAmount,
            fromCurrency,
            toCurrency,
            exchangeRate: parsedRate,
            amountToReceive,
        });
    };
    
    const getRateLabel = () => {
        if (fromCurrency === Currency.YER) {
            return `سعر صرف ${CURRENCY_DETAILS[toCurrency].name} مقابل الريال`;
        }
        if (toCurrency === Currency.YER) {
            return `سعر صرف ${CURRENCY_DETAILS[fromCurrency].name} مقابل الريال`;
        }
        return `سعر الصرف (${CURRENCY_DETAILS[toCurrency].symbol} لكل 1 ${CURRENCY_DETAILS[fromCurrency].symbol})`;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    مصارفة بين الصناديق
                </h2>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="amountToSell" className="block text-sm font-medium text-gray-700 mb-1">المبلغ المُراد بيعه</label>
                        <input
                            type="number"
                            id="amountToSell"
                            value={amountToSell}
                            onChange={(e) => setAmountToSell(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <label htmlFor="fromCurrency" className="block text-sm font-medium text-gray-700 mb-1">من عملة</label>
                            <select
                                id="fromCurrency"
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                {availableCurrencies.map(c => (
                                    <option key={c} value={c}>{CURRENCY_DETAILS[c].name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-7">
                            <CurrencyExchangeIcon className="w-6 h-6 text-gray-500"/>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="toCurrency" className="block text-sm font-medium text-gray-700 mb-1">إلى عملة</label>
                            <select
                                id="toCurrency"
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value as Currency)}
                                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                {availableCurrencies.filter(c => c !== fromCurrency).map(c => (
                                    <option key={c} value={c}>{CURRENCY_DETAILS[c].name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">{getRateLabel()}</label>
                         <input
                            type="number"
                            id="exchangeRate"
                            value={exchangeRate}
                            step="any"
                            onChange={(e) => setExchangeRate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="سعر السوق اليوم"
                        />
                    </div>

                    {amountToReceive > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center animate-fade-in-up">
                            <p className="text-sm text-blue-700">ستحصل على:</p>
                            <p className="text-2xl font-bold text-blue-800">
                                {amountToReceive.toLocaleString()}
                                <span className="text-base font-normal ms-2">{CURRENCY_DETAILS[toCurrency].name}</span>
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex gap-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                          تأكيد المصارفة
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

export default ExchangeForm;
