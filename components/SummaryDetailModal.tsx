import React from 'react';
import { Currency, Transaction, TransactionType } from '../types';
import { CloseIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { CURRENCY_DETAILS, TRANSACTION_TYPE_DETAILS } from '../constants';

// We need an augmented transaction type that includes the account name
export interface AugmentedTransaction extends Transaction {
  accountName: string;
}

interface SummaryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: AugmentedTransaction[];
}

const SummaryDetailModal: React.FC<SummaryDetailModalProps> = ({ isOpen, onClose, title, transactions }) => {
  if (!isOpen) return null;

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const getTransactionIcon = (type: TransactionType) => {
    const color = TRANSACTION_TYPE_DETAILS[type].color;
    if(type === TransactionType.INCOME || type === TransactionType.RECEIVABLE) {
        return <ArrowUpIcon className={`w-6 h-6 ${color}`} />;
    }
    return <ArrowDownIcon className={`w-6 h-6 ${color}`} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-4 border-b">
          {title}
        </h2>
        
        {transactions.length > 0 ? (
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="divide-y divide-gray-200">
                {transactions.map(t => (
                    <li key={t.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-s-4">
                            <div className="flex-shrink-0">
                                {getTransactionIcon(t.type)}
                            </div>
                            <div>
                                <p className="text-md font-medium text-gray-900">{t.description}</p>
                                <p className="text-sm text-gray-500">
                                {new Date(t.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                <span className="mx-2">|</span>
                                <span className="font-semibold text-gray-600">{t.accountName}</span>
                                </p>
                            </div>
                        </div>
                        <div className={`text-lg font-bold text-right ${TRANSACTION_TYPE_DETAILS[t.type].color}`}>
                            {t.amount.toLocaleString()}
                            <span className="text-sm font-normal ms-1">{CURRENCY_DETAILS[t.currency].symbol}</span>
                        </div>
                    </li>
                ))}
                </ul>
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center text-center text-gray-500 py-10">
                <p>لا توجد عمليات من هذا النوع لعرضها.</p>
            </div>
        )}

        <div className="mt-4 pt-4 border-t-2 border-dashed">
            <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-800">الإجمالي:</span>
                <span className="text-blue-600">
                    {totalAmount.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDetailModal;
