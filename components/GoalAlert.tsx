import React from 'react';
import { Goal, Currency } from '../types';
import { CURRENCY_DETAILS } from '../constants';
import { TargetIcon } from './Icons';

interface GoalAlertProps {
  goal: Goal;
  onDismiss: () => void;
}

const GoalAlert: React.FC<GoalAlertProps> = ({ goal, onDismiss }) => {
  const calculateMonthlySavings = () => {
    const now = new Date();
    const startDate = new Date(goal.createdAt);
    const endDate = new Date(goal.targetDate);
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      return goal.targetAmount; // Fallback for invalid date range
    }
    
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    
    if (totalMonths <= 0) {
      return goal.targetAmount; // If target is within the same month, show full amount
    }

    return Math.ceil(goal.targetAmount / totalMonths);
  };
  
  const monthlySavings = calculateMonthlySavings();

  return (
    <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-800 p-4 rounded-md shadow-lg animate-fade-in-up">
      <div className="flex items-start gap-3">
        <TargetIcon className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
        <div>
          <p className="font-bold">تذكير بهدفك الشهري!</p>
          <p className="text-sm mb-3">
            لا تنسَ هدفك: "{goal.description}". حاول توفير 
            <span className="font-bold mx-1">{monthlySavings.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}</span> 
            هذا الشهر.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <button onClick={onDismiss} className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
          تجاهل هذا الشهر
        </button>
      </div>
    </div>
  );
};

export default GoalAlert;
