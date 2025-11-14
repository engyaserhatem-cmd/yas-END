import React from 'react';
import { CURRENCY_DETAILS } from '../constants';
import { Currency } from '../types';

interface SavingsAlertProps {
  balance: number;
  savingsPercentage: number;
  isDecoyMode: boolean;
  onDismiss: () => void;
  onTransfer: (amount: number) => void;
}

const SavingsAlert: React.FC<SavingsAlertProps> = ({ balance, savingsPercentage, isDecoyMode, onDismiss, onTransfer }) => {
  const savingsAmount = Math.floor(balance * (savingsPercentage / 100));
  const displayAmount = isDecoyMode ? savingsAmount * 0.2 : savingsAmount;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-lg animate-fade-in-up">
      <div>
        <p className="font-bold">تنبيه الادخار!</p>
        <p className="text-sm mb-3">
          رصيدك النقدي مرتفع! يوصى بتحويل {savingsPercentage}% 
          ({displayAmount.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}) 
          إلى حساب الادخار.
        </p>
      </div>
      <div className="flex items-center justify-end space-s-4">
        <button 
          onClick={() => onTransfer(savingsAmount)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 text-sm"
        >
          إتمام التحويل
        </button>
        <button onClick={onDismiss} className="text-yellow-600 hover:text-yellow-800 font-semibold text-sm">
          تجاهل
        </button>
      </div>
    </div>
  );
};

export default SavingsAlert;