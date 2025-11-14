import React from 'react';
import { Account } from '../types';
import { CURRENCY_DETAILS } from '../constants';
import { calculateBalance } from './AccountCard';

interface BankAccountDisplayProps {
  bankAccounts: Account[];
  selectedAccountId: string;
  onSelect: (id: string) => void;
}

const BankAccountDisplay: React.FC<BankAccountDisplayProps> = ({ bankAccounts, selectedAccountId, onSelect }) => {
  const sortedAccounts = [...bankAccounts].sort((a, b) => {
    const order: Record<string, number> = { 'YER': 1, 'USD': 2, 'SAR': 3 };
    return (order[a.currency] || 99) - (order[b.currency] || 99);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-3 flex flex-col h-full">
      <h3 className="font-bold text-base mb-2 text-gray-900 text-center">الحساب البنكي (للإدخار)</h3>
      <div className="flex-grow grid grid-cols-1 gap-1">
        {sortedAccounts.map(account => {
          const balance = calculateBalance(account.transactions);
          const isSelected = selectedAccountId === account.id;

          const sectionClasses = `
            py-2 px-2 cursor-pointer transition-all duration-200 rounded-md
            ${isSelected ? 'bg-blue-600 text-white shadow' : 'bg-gray-50 hover:bg-blue-100'}
          `;

          return (
            <div key={account.id} className={sectionClasses} onClick={() => onSelect(account.id)}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-200' : 'text-gray-600'}`}>
                  {CURRENCY_DETAILS[account.currency].name}
                </span>
                <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {balance.toLocaleString()}
                  <span className="text-xs font-normal ms-1">{CURRENCY_DETAILS[account.currency].symbol}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BankAccountDisplay;