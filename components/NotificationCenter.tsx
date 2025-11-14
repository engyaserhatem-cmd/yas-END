import React from 'react';
import SavingsAlert from './SavingsAlert';
import DebtAlert from './DebtAlert';
import { Goal } from '../types';
import GoalAlert from './GoalAlert';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    showSavingsAlert: boolean;
    showDebtAlert: boolean;
    goalAlerts: Goal[];
    safeBalance: number;
    savingsPercentage: number;
    isDecoyMode: boolean;
    onDismissSavings: () => void;
    onTransferSavings: (amount: number) => void;
    onDismissDebt: () => void;
    onViewDebts: () => void;
    onDismissGoal: (goalId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen,
    onClose,
    showSavingsAlert,
    showDebtAlert,
    goalAlerts,
    safeBalance,
    savingsPercentage,
    isDecoyMode,
    onDismissSavings,
    onTransferSavings,
    onDismissDebt,
    onViewDebts,
    onDismissGoal,
}) => {
    if (!isOpen) return null;

    const alertCount = (showSavingsAlert ? 1 : 0) + (showDebtAlert ? 1 : 0) + goalAlerts.length;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
            <div className="absolute top-full left-0 mt-2 w-96 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in-up">
                <div className="p-4 border-b">
                    <h3 className="font-bold text-lg text-gray-800">مركز الإشعارات</h3>
                </div>
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                    {alertCount === 0 ? (
                        <p className="text-center text-gray-500 p-4">لا توجد إشعارات جديدة.</p>
                    ) : (
                        <>
                            {showSavingsAlert && (
                                <div className="p-2">
                                     <SavingsAlert 
                                        balance={safeBalance} 
                                        onDismiss={onDismissSavings} 
                                        onTransfer={onTransferSavings} 
                                        savingsPercentage={savingsPercentage}
                                        isDecoyMode={isDecoyMode}
                                     />
                                </div>
                            )}
                            {showDebtAlert && (
                                <div className="p-2">
                                    <DebtAlert onDismiss={onDismissDebt} onViewDebts={onViewDebts} />
                                </div>
                            )}
                            {goalAlerts.map(goal => (
                                <div key={goal.id} className="p-2">
                                    <GoalAlert goal={goal} onDismiss={() => onDismissGoal(goal.id)} />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationCenter;