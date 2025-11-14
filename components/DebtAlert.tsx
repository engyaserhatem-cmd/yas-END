import React from 'react';

interface DebtAlertProps {
  onDismiss: () => void;
  onViewDebts: () => void;
}

const DebtAlert: React.FC<DebtAlertProps> = ({ onDismiss, onViewDebts }) => {
  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md shadow-lg mb-6 flex items-center justify-between animate-fade-in-up">
      <div>
        <p className="font-bold">تنبيه بسداد الديون!</p>
        <p className="text-sm">
          لديك سيولة كافية! يوصى بسداد جزء من التزاماتك لتخفيف عبء الديون.
        </p>
      </div>
      <div className="flex items-center space-s-4">
        <button 
          onClick={onViewDebts}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          عرض الديون للسداد
        </button>
        <button onClick={onDismiss} className="text-orange-600 hover:text-orange-800 font-semibold">
          تجاهل
        </button>
      </div>
    </div>
  );
};

export default DebtAlert;