import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { CloseIcon, TargetIcon, CashIcon, ChevronDownIcon, DownloadIcon, UploadIcon, BellIcon } from './Icons';
import { CURRENCY_DETAILS } from '../constants';
import { Currency, ExchangeRates } from '../types';


export interface SettingsData {
    threshold: number;
    percentage: number;
    rates: ExchangeRates;
}

interface SettingsModalProps {
  currentThreshold: number;
  currentPercentage: number;
  exchangeRates: ExchangeRates;
  onClose: () => void;
  onSave: (data: SettingsData) => void;
  onOpenGoals: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentThreshold, currentPercentage, exchangeRates, onClose, onSave, onOpenGoals }) => {
  const [threshold, setThreshold] = useState(currentThreshold.toString());
  const [percentage, setPercentage] = useState(currentPercentage.toString());
  const [rates, setRates] = useState<ExchangeRates>(exchangeRates);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSavingsSettingsOpen, setIsSavingsSettingsOpen] = useState(false);
  const [isRatesSettingsOpen, setIsRatesSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRateChange = (currency: Currency, value: string) => {
    const numValue = parseFloat(value);
    setRates(prev => ({
        ...prev,
        [currency]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedThreshold = parseInt(threshold, 10);
    const parsedPercentage = parseInt(percentage, 10);

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError('الرجاء إدخال مبلغ صحيح لحد التنبيه.');
      setSuccess('');
      return;
    }

    if (isNaN(parsedPercentage) || parsedPercentage < 1 || parsedPercentage > 100) {
        setError('الرجاء إدخال نسبة ادخار صحيحة بين 1 و 100.');
        setSuccess('');
        return;
    }
    
    setError('');
    onSave({
        threshold: parsedThreshold,
        percentage: parsedPercentage,
        rates: rates
    });
    onClose();
  };
  
  const handleBackup = () => {
    try {
        setError('');
        const dataToBackup = {
            accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
            goals: JSON.parse(localStorage.getItem('goals') || '[]'),
            savingsThreshold: parseInt(localStorage.getItem('savingsThreshold') || '100000', 10),
            savingsPercentage: parseInt(localStorage.getItem('savingsPercentage') || '15', 10),
            exchangeRates: JSON.parse(localStorage.getItem('exchangeRates') || '{}'),
        };

        const jsonString = JSON.stringify(dataToBackup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `my-wallet-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccess('تم إنشاء النسخة الاحتياطية بنجاح!');
    } catch (err) {
        setError('حدث خطأ أثناء إنشاء النسخة الاحتياطية.');
        setSuccess('');
        console.error(err);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            setError('خطأ في قراءة الملف.');
            setSuccess('');
            return;
        }

        if (!window.confirm('هل أنت متأكد من رغبتك في استعادة هذه النسخة؟ سيتم الكتابة فوق جميع بياناتك الحالية.')) {
            return;
        }

        try {
            const data = JSON.parse(text);
            if (data && data.accounts && data.goals && data.savingsThreshold && data.savingsPercentage && data.exchangeRates) {
                localStorage.setItem('accounts', JSON.stringify(data.accounts));
                localStorage.setItem('goals', JSON.stringify(data.goals));
                localStorage.setItem('savingsThreshold', data.savingsThreshold.toString());
                localStorage.setItem('savingsPercentage', data.savingsPercentage.toString());
                localStorage.setItem('exchangeRates', JSON.stringify(data.exchangeRates));

                alert('تمت استعادة البيانات بنجاح! سيتم تحديث التطبيق الآن.');
                window.location.reload();
            } else {
                setError('ملف النسخة الاحتياطية غير صالح أو تالف.');
                setSuccess('');
            }
        } catch (err) {
            setError('لا يمكن تحليل ملف النسخة الاحتياطية. تأكد من أنه ملف صحيح.');
            setSuccess('');
            console.error(err);
        }
    };
    reader.readAsText(file);
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition">
            <CloseIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            إعدادات التطبيق
        </h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <button 
                    type="button" 
                    onClick={onOpenGoals} 
                    className="w-full text-start group flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <TargetIcon className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-lg text-blue-800">الأهداف المستقبلية</span>
                    </div>
                    <span className="text-sm text-blue-600 group-hover:underline">إدارة أهدافك</span>
                </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2">النسخ الاحتياطي والاستعادة</h3>
                <p className="text-xs text-gray-500 mb-4">
                    احفظ بياناتك في مكان آمن أو انقلها إلى جهاز آخر.
                </p>
                <div className="flex gap-3">
                    <button type="button" onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-3 rounded-md font-semibold hover:bg-gray-700 transition">
                        <DownloadIcon className="w-5 h-5" />
                        <span>نسخ البيانات</span>
                    </button>
                    <button type="button" onClick={handleRestoreClick} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-2 px-3 rounded-md font-semibold hover:bg-gray-300 transition">
                        <UploadIcon className="w-5 h-5" />
                        <span>استعادة البيانات</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
            </div>

             <div className="border border-gray-200 rounded-lg">
                <button
                    type="button"
                    onClick={() => setIsRatesSettingsOpen(!isRatesSettingsOpen)}
                    className="w-full flex justify-between items-center p-4 text-start group"
                >
                    <div className="flex items-center gap-3">
                        <CashIcon className="w-6 h-6 text-gray-500 group-hover:text-green-600 transition-colors" />
                        <span className="font-bold text-lg text-gray-800">أسعار الصرف</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isRatesSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRatesSettingsOpen && (
                    <div className="p-4 border-t border-gray-200 space-y-4 animate-fade-in-up">
                        <p className="text-xs text-gray-500">
                            حدد قيمة كل عملة مقابل العملة الأساسية ({CURRENCY_DETAILS.YER.name}).
                        </p>
                        {Object.values(Currency).filter(c => c !== Currency.YER).map(currency => (
                             <div key={currency}>
                                <label htmlFor={`rate-${currency}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    1 {CURRENCY_DETAILS[currency].name} =
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        id={`rate-${currency}`}
                                        value={rates[currency] || ''}
                                        onChange={(e) => handleRateChange(currency, e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="0.00"
                                    />
                                     <div className="absolute inset-y-0 left-0 ps-3 flex items-center pointer-events-none text-gray-500">
                                        {CURRENCY_DETAILS.YER.symbol}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    type="button"
                    onClick={() => setIsSavingsSettingsOpen(!isSavingsSettingsOpen)}
                    className="w-full flex justify-between items-center p-4 text-start group"
                    aria-expanded={isSavingsSettingsOpen}
                >
                    <div className="flex items-center gap-3">
                        <BellIcon className="w-6 h-6 text-gray-500 group-hover:text-yellow-600 transition-colors" />
                        <span className="font-bold text-lg text-gray-800">إعدادات تنبيه الادخار</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isSavingsSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSavingsSettingsOpen && (
                    <div className="p-4 border-t border-gray-200 space-y-4 animate-fade-in-up">
                        <div>
                            <label htmlFor="savingsThreshold" className="block text-sm font-medium text-gray-700 mb-1">حد تنبيه الادخار</label>
                            <p className="text-xs text-gray-500 mb-2">
                                تنبيهك عندما يتجاوز الرصيد النقدي (المحوّل للريال) هذا المبلغ.
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="savingsThreshold"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="100000"
                                />
                                <div className="absolute inset-y-0 left-0 ps-3 flex items-center pointer-events-none text-gray-500">
                                {CURRENCY_DETAILS[Currency.YER].symbol}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="savingsPercentage" className="block text-sm font-medium text-gray-700 mb-1">نسبة الادخار الموصى بها</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="savingsPercentage"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="15"
                                    min="1"
                                    max="100"
                                />
                                <div className="absolute inset-y-0 left-0 ps-3 flex items-center pointer-events-none text-gray-500">
                                %
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t">
                <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                        حفظ الإعدادات
                    </button>
                    <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-300">
                        إغلاق
                    </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                    تطوير: شركة ياس تنكنو
                </p>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;