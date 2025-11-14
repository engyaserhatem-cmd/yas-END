import React from 'react';
import { Account, Transaction, TransactionType, Currency } from '../types';
import { CURRENCY_DETAILS } from '../constants';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const calculateBalance = (transactions: Account['transactions']): number => {
  return transactions.reduce((acc, trans) => {
    if (trans.type === TransactionType.INCOME) {
      return acc + trans.amount;
    } else if (trans.type === TransactionType.EXPENSE) {
      return acc - trans.amount;
    }
    return acc;
  }, 0);
};

export const calculateTotalByType = (transactions: Transaction[], type: TransactionType): number => {
  return transactions
    .filter(trans => trans.type === type)
    .reduce((acc, trans) => acc + trans.amount, 0);
};

const AccountCard: React.FC<AccountCardProps> = ({ account, isSelected, onSelect }) => {
  const totalReceivables = calculateTotalByType(account.transactions, TransactionType.RECEIVABLE);
  const totalLiabilities = calculateTotalByType(account.transactions, TransactionType.LIABILITY);
  const cashBalance = calculateBalance(account.transactions);
  const netDeferredBalance = totalReceivables - totalLiabilities;

  const isDebtAccount = account.id === 'acc-deferred';
  const mainBalance = isDebtAccount ? netDeferredBalance : cashBalance;

  const cardClasses = `
    p-3 rounded-lg shadow-md cursor-pointer transition-all duration-300 transform flex flex-col justify-between
    ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-gray-800 hover:bg-gray-50'}
  `;

  return (
    <div className={cardClasses} onClick={() => onSelect(account.id)}>
      <div>
        <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>{account.name}</h3>
        <div className="text-xl font-bold">
          {mainBalance.toLocaleString()}
          <span className="text-xs font-normal ms-1">{CURRENCY_DETAILS[account.currency].symbol}</span>
        </div>
      </div>
      {/* For debt accounts, show cash balance as secondary info if it exists */}
      {isDebtAccount && cashBalance !== 0 && (
        <div className={`border-t mt-2 pt-2 text-xs ${isSelected ? 'border-blue-400' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
                <span className={`${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>الرصيد النقدي:</span>
                <span className={`font-semibold ${cashBalance > 0 ? (isSelected ? 'text-green-300' : 'text-green-600') : (isSelected ? 'text-red-300' : 'text-red-600')}`}>
                    {cashBalance.toLocaleString()} {CURRENCY_DETAILS[account.currency].symbol}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};

export default AccountCard;