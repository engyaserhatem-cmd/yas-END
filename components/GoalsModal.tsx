import React, { useMemo } from 'react';
import { Goal, Currency } from '../types';
import { CloseIcon, PlusIcon, PencilIcon, TrashIcon, TargetIcon } from './Icons';
import { CURRENCY_DETAILS } from '../constants';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onAddRequest: () => void;
  onEditRequest: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const GoalItem: React.FC<{ goal: Goal; onEdit: () => void; onDelete: () => void; }> = ({ goal, onEdit, onDelete }) => {
    // Note: The `goal` object received here might be a decoy.
    // Calculations here will be based on the displayed (decoy) values.
    // The real calculation logic remains in App.tsx.
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = Math.max(0, (targetDate.getFullYear() - new Date().getFullYear()) * 12 + (targetDate.getMonth() - new Date().getMonth()));

    // This monthly savings is for display only and will be based on the decoy targetAmount.
    const calculateDisplayMonthlySavings = () => {
        const startDate = new Date(goal.createdAt);
        if (isNaN(startDate.getTime()) || isNaN(targetDate.getTime()) || targetDate <= startDate) {
          return goal.targetAmount;
        }
        const totalMonths = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + (targetDate.getMonth() - startDate.getMonth());
        return totalMonths > 0 ? Math.ceil(goal.targetAmount / totalMonths) : goal.targetAmount;
    };
    
    const monthlySavings = calculateDisplayMonthlySavings();

    return (
        <li className="bg-gray-50 p-4 rounded-lg border border-gray-200 group animate-fade-in-up">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{goal.description}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        تاريخ الإنجاز: {targetDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="mx-2">|</span>
                        {monthsRemaining > 0 ? `تبقى ${monthsRemaining} شهر` : 'حان وقت التحقيق!'}
                    </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="text-gray-400 hover:text-blue-600 p-1"><PencilIcon /></button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-600 p-1"><TrashIcon /></button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dashed">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">المبلغ المستهدف:</span>
                    <span className="font-bold text-green-600 text-base">{goal.targetAmount.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600">الادخار الشهري الموصى به:</span>
                    <span className="font-bold text-purple-600 text-base">{monthlySavings.toLocaleString()} {CURRENCY_DETAILS[Currency.YER].symbol}</span>
                </div>
            </div>
        </li>
    );
};


const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, goals, onAddRequest, onEditRequest, onDelete }) => {

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [goals]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center pb-4 border-b mb-4">
              <div className="flex items-center gap-3">
                  <TargetIcon className="w-8 h-8 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">أهدافك المستقبلية</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                  <CloseIcon className="w-7 h-7"/>
              </button>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-2">
            {sortedGoals.length > 0 ? (
                <ul className="space-y-4">
                    {sortedGoals.map(goal => (
                        <GoalItem 
                            key={goal.id} 
                            goal={goal} 
                            onEdit={() => onEditRequest(goal)}
                            onDelete={() => onDelete(goal.id)}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center py-16">
                    <TargetIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">لم تقم بإضافة أي أهداف بعد</h3>
                    <p className="text-gray-500 mt-2">ابدأ التخطيط لمستقبلك الآن!</p>
                </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
             <button
                onClick={onAddRequest}
                className="w-full bg-blue-600 text-white font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition duration-300 text-lg"
            >
                <PlusIcon className="w-6 h-6" />
                <span>أضف هدفاً جديداً</span>
            </button>
          </div>
        </div>
      </div>
  );
};

export default GoalsModal;