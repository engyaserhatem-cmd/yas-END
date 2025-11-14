import React, { useState, FormEvent, useEffect } from 'react';
import { Goal, Currency } from '../types';
import { CloseIcon } from './Icons';
import { CURRENCY_DETAILS } from '../constants';

interface GoalFormProps {
  onClose: () => void;
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt'> | Goal) => void;
  initialData?: Goal | null;
}

const GoalForm: React.FC<GoalFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!initialData;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isEditing && initialData) {
      setDescription(initialData.description);
      setTargetAmount(initialData.targetAmount.toString());
      setTargetDate(new Date(initialData.targetDate).toISOString().split('T')[0]);
    }
  }, [initialData, isEditing]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(targetAmount);

    if (!description.trim()) {
      setError('الرجاء إدخال وصف للهدف.');
      return;
    }
    if (!targetAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح للهدف.');
      return;
    }
    if (!targetDate) {
      setError('الرجاء تحديد تاريخ لإنجاز الهدف.');
      return;
    }
    if (new Date(targetDate) <= new Date()) {
        setError('يجب أن يكون تاريخ الإنجاز في المستقبل.');
        return;
    }

    setError('');
    const goalData = {
        description,
        targetAmount: parsedAmount,
        targetDate,
    };
    
    if (isEditing && initialData) {
        onSubmit({ ...initialData, ...goalData });
    } else {
        onSubmit(goalData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isEditing ? 'تعديل الهدف' : 'إضافة هدف جديد'}
        </h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">وصف الهدف</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: شراء سيارة جديدة"
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ المستهدف</label>
            <div className="relative">
              <input
                type="number"
                id="targetAmount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 left-0 ps-3 flex items-center pointer-events-none text-gray-500">
                {CURRENCY_DETAILS[Currency.YER].symbol}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">تاريخ إنجاز الهدف</label>
            <input
              type="date"
              id="targetDate"
              value={targetDate}
              min={today}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mt-6 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
              {isEditing ? 'حفظ التعديلات' : 'حفظ الهدف'}
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

export default GoalForm;
