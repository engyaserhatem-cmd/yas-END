import React, { useMemo } from 'react';
import { Account, Currency, TransactionType, ExchangeRates } from '../types';
import { calculateBalance } from './AccountCard';
import { CURRENCY_DETAILS } from '../constants';

interface SummaryProps {
    accounts: Account[];
    exchangeRates: ExchangeRates;
    onItemClick: (type: TransactionType) => void;
}

const Summary: React.FC<SummaryProps> = ({ accounts, exchangeRates, onItemClick }) => {

    const convert = (amount: number, currency: Currency) => {
        return amount * (exchangeRates[currency] || 1);
    };

    const summaryData = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalLiabilities = 0;
        let totalReceivables = 0;

        accounts.forEach(account => {
            account.transactions.forEach(t => {
                const amount = convert(t.amount, t.currency);
                
                const isInternalTransfer = (t.type === TransactionType.INCOME || t.type === TransactionType.EXPENSE) &&
                                           (t.description.startsWith('تحويل إلى') || t.description.startsWith('تحويل من'));

                if (isInternalTransfer) {
                    return;
                }

                switch (t.type) {
                    case TransactionType.INCOME:
                        totalIncome += amount;
                        break;
                    case TransactionType.EXPENSE:
                        totalExpenses += amount;
                        break;
                    case TransactionType.LIABILITY:
                        totalLiabilities += amount;
                        break;
                    case TransactionType.RECEIVABLE:
                        totalReceivables += amount;
                        break;
                }
            });
        });

        const netBalance = accounts.reduce((total, account) => {
            if (account.id.startsWith('safe-') || account.id.startsWith('acc-bank')) {
                 const balance = calculateBalance(account.transactions);
                 return total + convert(balance, account.currency);
            }
            return total;
        }, 0);
        
        const netDeferredBalance = totalReceivables - totalLiabilities;
        const projectedNetBalance = netBalance - totalLiabilities;
        const totalSum = netBalance + netDeferredBalance;

        return { totalIncome, totalExpenses, totalLiabilities, totalReceivables, netBalance, netDeferredBalance, projectedNetBalance, totalSum };

    }, [accounts, exchangeRates]);

    const SummaryItem = ({ label, value, color, type, isClickable }: { label: string, value: number, color: string, type?: TransactionType, isClickable?: boolean }) => {
        const commonClasses = "p-4 rounded-lg flex justify-between items-center";
        
        if (isClickable && type) {
            return (
                <button 
                    onClick={() => onItemClick(type)}
                    className={`${commonClasses} bg-gray-50 w-full text-start hover:bg-blue-50 hover:shadow-sm transition-all duration-200 cursor-pointer`}
                    aria-label={`عرض تفاصيل ${label}`}
                >
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className={`font-bold text-lg ${color}`}>
                        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCY_DETAILS[Currency.YER].symbol}
                    </span>
                </button>
            );
        }
        
        return (
            <div className={`${commonClasses} bg-gray-50`}>
                <span className="font-medium text-gray-700">{label}</span>
                <span className={`font-bold text-lg ${color}`}>
                    {value.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCY_DETAILS[Currency.YER].symbol}
                </span>
            </div>
        );
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">الملخص المالي الشامل (مقوّم بالريال اليمني)</h2>
            <div className="space-y-3">
                <SummaryItem label="مجموع الدخل" value={summaryData.totalIncome} color="text-green-600" type={TransactionType.INCOME} isClickable={true} />
                <SummaryItem label="مجموع المصروفات" value={summaryData.totalExpenses} color="text-red-600" type={TransactionType.EXPENSE} isClickable={true} />
                <SummaryItem label="مجموع المستحقات (ديون لك)" value={summaryData.totalReceivables} color="text-blue-600" type={TransactionType.RECEIVABLE} isClickable={true} />
                <SummaryItem label="مجموع الالتزامات (ديون عليك)" value={summaryData.totalLiabilities} color="text-orange-600" type={TransactionType.LIABILITY} isClickable={true} />
                <SummaryItem label="الرصيد الصافي للحساب الآجل" value={summaryData.netDeferredBalance} color="text-purple-600" />
                
                <div className="pt-4 border-t-2 border-dashed space-y-3">
                     <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-lg text-blue-800">الرصيد النقدي الصافي</span>
                        <span className={`font-extrabold text-2xl ${summaryData.netBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                           {summaryData.netBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCY_DETAILS[Currency.YER].symbol}
                        </span>
                    </div>
                     <div className="bg-purple-50 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-lg text-purple-800">الرصيد الصافي المتوقع</span>
                        <span className={`font-extrabold text-2xl ${summaryData.projectedNetBalance >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                           {summaryData.projectedNetBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCY_DETAILS[Currency.YER].symbol}
                        </span>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg flex justify-between items-center border-t-2 border-green-200">
                        <span className="font-bold text-lg text-green-800">المجموع الكلي</span>
                        <span className={`font-extrabold text-2xl ${summaryData.totalSum >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                           {summaryData.totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCY_DETAILS[Currency.YER].symbol}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Summary;