
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { CURRENCY_DETAILS, TRANSACTION_TYPE_DETAILS } from '../constants';
import { PencilIcon, TrashIcon, CashIcon, StarIcon } from './Icons';
import TransactionFilter from './TransactionFilter';
import { exportToCsv, exportToPdf } from '../utils/export';

interface TransactionListProps {
  transactions: Transaction[];
  accountName: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleDebt: (transaction: Transaction) => void;
}

const formatDateForDisplay = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

const TransactionList: React.FC<TransactionListProps> = ({ transactions, accountName, onEdit, onDelete, onSettleDebt }) => {
  const [historyVisibleFor, setHistoryVisibleFor] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterText, setFilterText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleResetFilters = () => {
    setFilterType('ALL');
    setFilterText('');
    setStartDate('');
    setEndDate('');
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Memoize filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (filterText && !t.description.toLowerCase().includes(filterText.toLowerCase())) return false;
      
      if (startDate) {
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0, 0, 0, 0);
        if (transactionDate < filterStartDate) return false;
      }
      if (endDate) {
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(0, 0, 0, 0);
        if (transactionDate > filterEndDate) return false;
      }
      
      return true;
    });
  }, [transactions, filterType, filterText, startDate, endDate]);

  const settlementInfo = useMemo(() => {
    const settlementMap = new Map<string, number>();
    
    transactions.forEach(t => {
      if (t.settlesTransactionId) {
        const currentSettled = settlementMap.get(t.settlesTransactionId) || 0;
        settlementMap.set(t.settlesTransactionId, currentSettled + t.amount);
      }
    });

    return { settlementMap };
  }, [transactions]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = (format: 'csv' | 'pdf') => {
    const dateRange = (startDate && endDate) 
        ? `من ${formatDateForDisplay(startDate)} إلى ${formatDateForDisplay(endDate)}`
        : 'كل التواريخ';
        
    if (format === 'csv') {
      exportToCsv(filteredTransactions, accountName);
    } else {
      exportToPdf(filteredTransactions, accountName, dateRange);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">لا توجد عمليات لعرضها في هذا الحساب.</p>
      </div>
    );
  }

  return (
    <div className="printable-area">
      <div className="hidden print-only text-center mb-4">
        <h1 className="text-2xl font-bold">محفظتي الذكية</h1>
        <h2 className="text-xl mt-2">كشف حساب: {accountName}</h2>
        {(startDate || endDate) && (
             <p className="text-sm text-gray-600">
                الفترة: {startDate ? `من ${formatDateForDisplay(startDate)}` : ''} {endDate ? `إلى ${formatDateForDisplay(endDate)}` : ''}
             </p>
        )}
      </div>
      <div className="no-print">
        <TransactionFilter 
          filterType={filterType}
          filterText={filterText}
          startDate={startDate}
          endDate={endDate}
          onTypeChange={setFilterType}
          onTextChange={setFilterText}
          onDateChange={handleDateChange}
          onReset={handleResetFilters}
          resultsCount={filteredTransactions.length}
          totalCount={transactions.length}
          onPrint={handlePrint}
          onExportRequest={handleExport}
        />
      </div>
      {filteredTransactions.length === 0 && (
          <div className="text-center py-10 no-print">
            <p className="text-gray-500">لا توجد عمليات تطابق معايير البحث.</p>
          </div>
      )}
      <ul className="divide-y divide-gray-200">
        {filteredTransactions.map(t => {
          const hasHistory = t.history && t.history.length > 0;
          const reversedHistory = hasHistory ? [...t.history].reverse() : [];
          
          const isSettlement = !!t.settlesTransactionId;
          const isPrimaryDebt = (t.type === TransactionType.LIABILITY || t.type === TransactionType.RECEIVABLE) && !isSettlement;

          let remainingAmount = 0;
          let isFullySettled = false;

          if (isPrimaryDebt) {
            const settledAmount = settlementInfo.settlementMap.get(t.id) || 0;
            remainingAmount = t.amount - settledAmount;
            isFullySettled = remainingAmount <= 0.001;
          }

          const liClasses = `p-4 flex items-center justify-between group animate-fade-in-up ${isSettlement ? 'bg-gray-50/50' : ''} ${isFullySettled ? 'opacity-60' : ''}`;

          return (
            <li key={t.id} className={liClasses}>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-md font-medium text-gray-900 ${isFullySettled ? 'line-through' : ''}`}>
                    {t.description}
                  </p>
                  
                  {isPrimaryDebt ? (
                    <div className="text-right">
                      <span className={`text-lg font-bold ${TRANSACTION_TYPE_DETAILS[t.type].color}`}>
                        {remainingAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 mx-1">/</span>
                      <span className="text-sm text-gray-500">
                        {t.amount.toLocaleString()} {CURRENCY_DETAILS[t.currency].symbol}
                      </span>
                    </div>
                  ) : (
                    <div className={`text-lg font-bold text-right relative ${TRANSACTION_TYPE_DETAILS[t.type].color}`}>
                      <button 
                        onClick={() => hasHistory && setHistoryVisibleFor(historyVisibleFor === t.id ? null : t.id)}
                        className={`inline-flex items-center gap-1 relative px-2 py-1 rounded transition ${hasHistory ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
                        aria-haspopup="true"
                        aria-expanded={historyVisibleFor === t.id}
                        disabled={!hasHistory}
                      >
                        {hasHistory && <StarIcon className="w-4 h-4 text-yellow-500" title="تم تعديل هذا المبلغ"/>}
                        {t.type === TransactionType.EXPENSE || t.type === TransactionType.LIABILITY ? '-' : ''}
                        {t.amount.toLocaleString()}
                        <span className="text-sm font-normal ms-1">{CURRENCY_DETAILS[t.currency].symbol}</span>
                      </button>
                      {historyVisibleFor === t.id && hasHistory && (
                        <div className="absolute z-10 bottom-full mb-2 right-0 bg-gray-800 text-white p-3 rounded-lg shadow-lg w-72 text-sm text-right animate-fade-in-up no-print">
                           <h4 className="font-bold border-b pb-1 mb-2 text-base">سجل التعديلات</h4>
                            <ul className="space-y-1 text-xs">
                                <li className="flex justify-between items-center p-1 bg-green-900/80 rounded">
                                    <span>المبلغ الحالي:</span>
                                    <span className="font-bold">{t.amount.toLocaleString()} {CURRENCY_DETAILS[t.currency].symbol}</span>
                                </li>
                                {reversedHistory.map((h, index) => {
                                    const afterAmount = index === 0 ? t.amount : reversedHistory[index - 1].previousAmount;
                                    return (
                                        <li key={index} className="border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-gray-400 mb-1">
                                                تعديل بتاريخ: {new Date(h.modifiedAt).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                            <div className="flex justify-between items-center p-1 bg-red-800/60 rounded">
                                                <span>قبل:</span>
                                                <span className="font-mono">{h.previousAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-1 bg-green-800/60 rounded mt-1">
                                                <span>بعد:</span>
                                                <span className="font-mono">{afterAmount.toLocaleString()}</span>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                           <div className="absolute w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800 -bottom-2 right-4"></div>
                        </div>
                    )}
                    </div>
                  )}

                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                  <div>
                    <span className={`font-semibold ${TRANSACTION_TYPE_DETAILS[t.type].color}`}>
                      {isFullySettled ? 'مسدد بالكامل' : TRANSACTION_TYPE_DETAILS[t.type].label}
                    </span>
                    <span className="mx-2">|</span>
                    <span>{new Date(t.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                    {isPrimaryDebt && !isFullySettled && (
                      <button onClick={() => onSettleDebt({ ...t, amount: remainingAmount })} className="flex items-center text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded">
                        <CashIcon className="w-4 h-4 me-1" /> تسوية
                      </button>
                    )}
                     {!isSettlement && (
                        <>
                          <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-blue-600 p-1"><PencilIcon className="w-4 h-4"/></button>
                          <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-600 p-1"><TrashIcon className="w-4 h-4" /></button>
                        </>
                     )}
                  </div>
                </div>
              </div>
            </li>
        )})}
      </ul>
    </div>
  );
};

export default TransactionList;