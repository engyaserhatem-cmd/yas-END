
import React, { useState, useRef, useEffect } from 'react';
import { TransactionType } from '../types';
import { TRANSACTION_TYPE_DETAILS } from '../constants';
import { CloseIcon, PrintIcon, DocumentArrowDownIcon, ChevronDownIcon } from './Icons';

interface TransactionFilterProps {
  filterType: TransactionType | 'ALL';
  filterText: string;
  startDate: string;
  endDate: string;
  onTypeChange: (type: TransactionType | 'ALL') => void;
  onTextChange: (text: string) => void;
  onDateChange: (start: string, end: string) => void;
  onReset: () => void;
  resultsCount: number;
  totalCount: number;
  onPrint: () => void;
  onExportRequest: (format: 'csv' | 'pdf') => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  filterType,
  filterText,
  startDate,
  endDate,
  onTypeChange,
  onTextChange,
  onDateChange,
  onReset,
  resultsCount,
  totalCount,
  onPrint,
  onExportRequest,
}) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const isFiltered = filterType !== 'ALL' || filterText !== '' || startDate !== '' || endDate !== '';

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDateChange(e.target.value, endDate);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDateChange(startDate, e.target.value);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[200px]">
                    <label htmlFor="text-filter" className="sr-only">بحث في الوصف</label>
                    <input
                        id="text-filter"
                        type="text"
                        value={filterText}
                        onChange={(e) => onTextChange(e.target.value)}
                        placeholder="بحث في الوصف..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex-grow flex gap-4">
                    <div className="w-full">
                        <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 mb-1">من تاريخ</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="w-full">
                         <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 mb-1">إلى تاريخ</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 me-2">النوع:</span>
                <button
                    onClick={() => onTypeChange('ALL')}
                    className={`px-3 py-1 text-sm rounded-full transition ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}
                >
                    الكل
                </button>
                {Object.values(TransactionType).map(t => (
                    <button
                        key={t}
                        onClick={() => onTypeChange(t)}
                        className={`px-3 py-1 text-sm rounded-full transition ${filterType === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}
                    >
                        {TRANSACTION_TYPE_DETAILS[t].label}
                    </button>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
                <p className="text-sm text-gray-600">
                    عرض <span className="font-bold">{resultsCount}</span> من أصل <span className="font-bold">{totalCount}</span> عملية.
                </p>
                <div className="flex items-center gap-2">
                    {isFiltered && (
                         <button
                            onClick={onReset}
                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                            <CloseIcon className="w-4 h-4" />
                            مسح الفلترة
                        </button>
                    )}
                     <button onClick={onPrint} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-800 font-semibold p-2 rounded-md hover:bg-gray-200 transition">
                        <PrintIcon className="w-5 h-5" />
                        <span>طباعة</span>
                    </button>
                    <div className="relative" ref={exportMenuRef}>
                        <button
                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-800 font-semibold p-2 rounded-md hover:bg-gray-200 transition"
                        >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>تصدير</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExportMenuOpen && (
                        <div className="absolute left-0 mt-2 w-36 bg-white rounded-md shadow-lg border z-10 animate-fade-in-up">
                            <button
                            onClick={() => { onExportRequest('csv'); setIsExportMenuOpen(false); }}
                            className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                            Excel (CSV)
                            </button>
                            <button
                            onClick={() => { onExportRequest('pdf'); setIsExportMenuOpen(false); }}
                            className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                            PDF
                            </button>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionFilter;