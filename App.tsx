
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Account, Transaction, TransactionType, Goal, Currency, ExchangeRates } from './types';
import { INITIAL_ACCOUNTS, TRANSACTION_TYPE_DETAILS, CURRENCY_DETAILS } from './constants';
import HomeSafeDisplay from './components/HomeSafeDisplay';
import DeferredAccountDisplay from './components/DeferredAccountDisplay';
import BankAccountDisplay from './components/BankAccountDisplay';
import TransactionList from './components/TransactionList';
import TransactionForm, { TransactionFormData } from './components/TransactionForm';
import Summary from './components/Summary';
import { PlusIcon, SettingsIcon, BellIcon, RefreshIcon, CurrencyExchangeIcon, LockClosedIcon, LockOpenIcon } from './components/Icons';
import SettleDebtForm, { SettleDebtFormData } from './components/SettleDebtForm';
import SettingsModal, { SettingsData } from './components/SettingsModal';
import NotificationCenter from './components/NotificationCenter';
import GoalsModal from './components/GoalsModal';
import GoalForm from './components/GoalForm';
import SummaryDetailModal, { AugmentedTransaction } from './components/SummaryDetailModal';
import { calculateBalance } from './components/AccountCard';
import ExchangeForm, { ExchangeFormData } from './components/ExchangeForm';
import AuthScreen from './components/AuthScreen';
import SavingsTransferForm, { SavingsTransferFormData } from './components/SavingsTransferForm';


const App: React.FC = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authStatus, setAuthStatus] = useState<'loading' | 'required' | 'setup'>('loading');
    const [decoyMode, setDecoyMode] = useState(true);
    
    // State Initialization
    const [accounts, setAccounts] = useState<Account[]>(() => {
        const savedAccounts = localStorage.getItem('accounts');
        return savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS;
    });

    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
        const savedRates = localStorage.getItem('exchangeRates');
        return savedRates ? JSON.parse(savedRates) : { [Currency.YER]: 1, [Currency.USD]: 550, [Currency.SAR]: 140 };
    });

    const [selectedAccountId, setSelectedAccountId] = useState<string>('safe-yer');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isExchangeFormOpen, setIsExchangeFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [settlingDebtTransaction, setSettlingDebtTransaction] = useState<Transaction | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGoalsListOpen, setIsGoalsListOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSavingsFormOpen, setIsSavingsFormOpen] = useState(false);
    const [savingsFormData, setSavingsFormData] = useState<{ suggestedAmount: number } | null>(null);


    // Savings alert settings
    const [savingsThreshold, setSavingsThreshold] = useState<number>(() => parseInt(localStorage.getItem('savingsThreshold') || '100000', 10));
    const [savingsPercentage, setSavingsPercentage] = useState<number>(() => parseInt(localStorage.getItem('savingsPercentage') || '15', 10));

    // Goals
    const [goals, setGoals] = useState<Goal[]>(() => {
        const savedGoals = localStorage.getItem('goals');
        return savedGoals ? JSON.parse(savedGoals) : [];
    });
    const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    
    // Summary Detail Modal State
    const [summaryDetail, setSummaryDetail] = useState<{ isOpen: boolean; title: string; transactions: AugmentedTransaction[] }>({
        isOpen: false,
        title: '',
        transactions: [],
    });

    // Alert dismissal states (session-based)
    const [savingsAlertDismissed, setSavingsAlertDismissed] = useState(false);
    const [debtAlertDismissed, setDebtAlertDismissed] = useState(false);
    const [dismissedGoalAlerts, setDismissedGoalAlerts] = useState<string[]>([]);
    
    // Check for password on initial load
    useEffect(() => {
        const hash = localStorage.getItem('passwordHash');
        if (hash) {
            setAuthStatus('required');
        } else {
            setAuthStatus('setup');
        }
    }, []);


    // Data Persistence Effects
    useEffect(() => {
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }, [accounts]);
    
    useEffect(() => {
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
    }, [exchangeRates]);

    useEffect(() => {
        localStorage.setItem('savingsThreshold', savingsThreshold.toString());
        localStorage.setItem('savingsPercentage', savingsPercentage.toString());
    }, [savingsThreshold, savingsPercentage]);
    
    useEffect(() => {
        localStorage.setItem('goals', JSON.stringify(goals));
    }, [goals]);

    // Decoy Mode Data Transformation
    const displayedAccounts = useMemo(() => {
        if (!decoyMode) return accounts;
        const decoyFactor = 0.20;
        return accounts.map(acc => ({
            ...acc,
            transactions: acc.transactions.map(t => ({
                ...t,
                amount: t.amount * decoyFactor,
                history: t.history?.map(h => ({ ...h, previousAmount: h.previousAmount * decoyFactor }))
            }))
        }));
    }, [accounts, decoyMode]);
    
    const displayedGoals = useMemo(() => {
        if (!decoyMode) return goals;
        const decoyFactor = 0.20;
        return goals.map(g => ({
            ...g,
            targetAmount: g.targetAmount * decoyFactor
        }));
    }, [goals, decoyMode]);

    // Memoized selectors for derived data (using displayed data)
    const selectedAccount = useMemo(() => displayedAccounts.find(acc => acc.id === selectedAccountId), [displayedAccounts, selectedAccountId]);
    const safeAccounts = useMemo(() => displayedAccounts.filter(acc => acc.id.startsWith('safe-')), [displayedAccounts]);
    const deferredAccounts = useMemo(() => displayedAccounts.filter(acc => acc.id.startsWith('acc-deferred-')), [displayedAccounts]);
    const bankAccounts = useMemo(() => displayedAccounts.filter(acc => acc.id.startsWith('acc-bank-')), [displayedAccounts]);
    
    // Calculations based on REAL data
    const cashBalance = useMemo(() => {
        const cashHoldingAccounts = accounts.filter(acc => acc.id.startsWith('safe-') || acc.id.startsWith('acc-bank-'));
        return cashHoldingAccounts.reduce((total, acc) => {
            const balance = calculateBalance(acc.transactions);
            const convertedBalance = balance * (exchangeRates[acc.currency] || 1);
            return total + convertedBalance;
        }, 0);
    }, [accounts, exchangeRates]);

    const totalLiabilities = useMemo(() => {
        return accounts.filter(acc => acc.id.startsWith('acc-deferred-')).reduce((total, acc) => {
            const accLiabilities = acc.transactions.reduce((accTotal, t) => {
                if (t.type === TransactionType.LIABILITY) {
                    const settledAmount = accounts.flatMap(a => a.transactions)
                                                .filter(settle => settle.settlesTransactionId === t.id)
                                                .reduce((sum, settle) => sum + settle.amount, 0);
                    const remaining = t.amount - settledAmount;
                    return accTotal + (remaining * (exchangeRates[t.currency] || 1));
                }
                return accTotal;
            }, 0);
            return total + accLiabilities;
        }, 0);
    }, [accounts, exchangeRates]);

    // Alert Logic
    const showSavingsAlert = useMemo(() => {
        return cashBalance > savingsThreshold && !savingsAlertDismissed;
    }, [cashBalance, savingsThreshold, savingsAlertDismissed]);
    
    const showDebtAlert = useMemo(() => {
        return cashBalance > 0 && totalLiabilities > 0 && !debtAlertDismissed;
    }, [cashBalance, totalLiabilities, debtAlertDismissed]);

    const goalAlerts = useMemo(() => {
        const now = new Date();
        const currentMonthId = `${now.getFullYear()}-${now.getMonth()}`;
        return goals.filter(g => {
            const dismissedThisMonth = dismissedGoalAlerts.some(id => id === `${g.id}-${currentMonthId}`);
            return !dismissedThisMonth;
        });
    }, [goals, dismissedGoalAlerts]);

    const alertCount = (showSavingsAlert ? 1 : 0) + (showDebtAlert ? 1 : 0) + goalAlerts.length;


    // Handlers
    const handleSelectAccount = (id: string) => {
        setSelectedAccountId(id);
    };

    const handleOpenForm = (transaction: Transaction | null = null) => {
        if (transaction) {
            // Find the REAL transaction from the original state using the ID
            const realTransaction = accounts.flatMap(acc => acc.transactions).find(t => t.id === transaction.id);
            setEditingTransaction(realTransaction || null);
        } else {
            setEditingTransaction(null);
        }
        setIsFormOpen(true);
    };

    const handleDeleteTransaction = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه العملية؟ سيتم أيضاً حذف أي تسويات مرتبطة بها.')) {
            setAccounts(prevAccounts =>
                prevAccounts.map(acc => ({
                    ...acc,
                    transactions: acc.transactions.filter(t => t.id !== id && t.settlesTransactionId !== id),
                }))
            );
        }
    };
    
    const handleSettleDebt = (transaction: Transaction) => {
        // Find real transaction and calculate real remaining amount
        const realTransaction = accounts.flatMap(acc => acc.transactions).find(t => t.id === transaction.id);
        if (realTransaction) {
            const settlementMap = new Map<string, number>();
            accounts.forEach(acc => {
                acc.transactions.forEach(t => {
                    if (t.settlesTransactionId) {
                        const currentSettled = settlementMap.get(t.settlesTransactionId) || 0;
                        settlementMap.set(t.settlesTransactionId, currentSettled + t.amount);
                    }
                });
            });
            const settledAmount = settlementMap.get(realTransaction.id) || 0;
            const remainingAmount = realTransaction.amount - settledAmount;

            setSettlingDebtTransaction({ ...realTransaction, amount: remainingAmount });
        }
    };


    const handleSettleDebtSubmit = (data: SettleDebtFormData) => {
        const { debtTransaction, amountPaid, accountId } = data;
    
        setAccounts(prev => {
            const newAccounts = JSON.parse(JSON.stringify(prev)); // Deep copy
            const deferredAcc = newAccounts.find((a: Account) => a.id === `acc-deferred-${debtTransaction.currency.toLowerCase()}`);
            const targetAcc = newAccounts.find((a: Account) => a.id === accountId);
    
            if (!deferredAcc || !targetAcc) {
                console.error("Account not found for settlement");
                return prev;
            }
            
            if(targetAcc.currency !== debtTransaction.currency) {
                alert(`لا يمكن تسوية الدين إلا من حساب بنفس العملة (${CURRENCY_DETAILS[debtTransaction.currency].name}).`);
                return prev;
            }
    
            const isReceivable = debtTransaction.type === TransactionType.RECEIVABLE;
            const now = new Date().toISOString();
    
            const settlementTransaction: Transaction = {
                id: `trans-${Date.now()}`,
                amount: amountPaid,
                currency: debtTransaction.currency,
                type: isReceivable ? TransactionType.INCOME : TransactionType.EXPENSE,
                description: `${isReceivable ? 'تحصيل' : 'سداد'} دين: ${debtTransaction.description}`,
                date: now,
                settlesTransactionId: debtTransaction.id,
            };
            targetAcc.transactions.push(settlementTransaction);
            
            const deferredSettlement: Transaction = {
                id: `trans-${Date.now() + 1}`,
                amount: amountPaid,
                currency: debtTransaction.currency,
                type: isReceivable ? TransactionType.LIABILITY : TransactionType.RECEIVABLE,
                description: `تسوية دين: ${debtTransaction.description}`,
                date: now,
                settlesTransactionId: debtTransaction.id,
            };
            deferredAcc.transactions.push(deferredSettlement);
    
            [targetAcc, deferredAcc].forEach(acc => {
                acc.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
    
            return newAccounts;
        });
        setSettlingDebtTransaction(null);
    };


    const handleSubmitTransaction = (data: TransactionFormData) => {
        setAccounts(prevAccounts => {
            let updatedAccounts = [...prevAccounts];
            const isEditing = !!data.id;
    
            let originalTransaction: Transaction | undefined;
            if (isEditing) {
                for (const acc of prevAccounts) {
                    const found = acc.transactions.find(t => t.id === data.id);
                    if (found) {
                        originalTransaction = found;
                        break;
                    }
                }
            }
    
            const finalTransaction: Transaction = {
                id: data.id || `trans-${Date.now()}`,
                amount: data.amount,
                currency: data.currency,
                type: data.type,
                description: data.description,
                date: data.date,
            };
            
            if (originalTransaction) {
                finalTransaction.history = originalTransaction.history;
                if (originalTransaction.amount !== data.amount) {
                    const historyEntry = {
                        previousAmount: originalTransaction.amount,
                        modifiedAt: new Date().toISOString(),
                    };
                    finalTransaction.history = [...(finalTransaction.history || []), historyEntry];
                }
            }
            
            if (isEditing) {
                updatedAccounts = updatedAccounts.map(acc => ({
                    ...acc,
                    transactions: acc.transactions.filter(t => t.id !== data.id),
                }));
            }
            
            const findAcc = (id: string) => updatedAccounts.find(a => a.id === id);
    
            if (data.type === TransactionType.TRANSFER && data.fromAccountId && data.toAccountId) {
                const fromAccount = findAcc(data.fromAccountId);
                const toAccount = findAcc(data.toAccountId);
                if (fromAccount && toAccount) {
                    const fromTrans: Transaction = { ...finalTransaction, type: TransactionType.EXPENSE, description: `تحويل إلى ${toAccount.name}: ${data.description}` };
                    const toTrans: Transaction = { ...finalTransaction, type: TransactionType.INCOME, description: `تحويل من ${fromAccount.name}: ${data.description}` };
                    fromAccount.transactions.push(fromTrans);
                    toAccount.transactions.push(toTrans);
                }
            } else {
                let targetAccountId: string | undefined;

                switch (data.type) {
                    case TransactionType.EXPENSE:
                        targetAccountId = data.sourceAccountId;
                        break;
                    case TransactionType.INCOME:
                        targetAccountId = findAcc(`safe-${data.currency.toLowerCase()}`)?.id;
                        break;
                    case TransactionType.LIABILITY:
                    case TransactionType.RECEIVABLE:
                        targetAccountId = findAcc(`acc-deferred-${data.currency.toLowerCase()}`)?.id;
                        break;
                }

                if (!targetAccountId) {
                    console.error("Could not determine target account for transaction:", data);
                    return prevAccounts;
                }
                
                const targetAccount = findAcc(targetAccountId);
                if (targetAccount) {
                    if (data.type === TransactionType.INCOME && data.incomeSource === 'debt') {
                         const deferredAcc = findAcc(`acc-deferred-${data.currency.toLowerCase()}`);
                         if(deferredAcc){
                             const liability: Transaction = {
                                 ...finalTransaction,
                                 id: `trans-${Date.now() + 1}`,
                                 type: TransactionType.LIABILITY,
                                 description: `مقابل دين: ${data.description}`,
                                 history: undefined,
                             };
                             deferredAcc.transactions.push(liability);
                         }
                    }
                    targetAccount.transactions.push(finalTransaction);
                }
            }
            
            updatedAccounts.forEach(acc => {
                acc.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
    
            return updatedAccounts;
        });
    
        setIsFormOpen(false);
        setEditingTransaction(null);
    };

    const handleExchangeSubmit = (data: ExchangeFormData) => {
        const { amountToSell, fromCurrency, toCurrency, exchangeRate, amountToReceive } = data;
        const fromAccountId = `safe-${fromCurrency.toLowerCase()}`;
        const toAccountId = `safe-${toCurrency.toLowerCase()}`;

        setAccounts(prevAccounts => {
            const updatedAccounts = JSON.parse(JSON.stringify(prevAccounts));
            const fromAccount = updatedAccounts.find((a: Account) => a.id === fromAccountId);
            const toAccount = updatedAccounts.find((a: Account) => a.id === toAccountId);

            if (!fromAccount || !toAccount) {
                console.error("Source or destination account not found for exchange");
                return prevAccounts;
            }

            const expenseTransaction: Transaction = {
                id: `trans-${Date.now()}`,
                amount: amountToSell,
                currency: fromCurrency,
                type: TransactionType.EXPENSE,
                description: `مصارفة إلى ${amountToReceive.toLocaleString()} ${CURRENCY_DETAILS[toCurrency].symbol} بسعر ${exchangeRate}`,
                date: new Date().toISOString(),
            };
            fromAccount.transactions.push(expenseTransaction);

            const incomeTransaction: Transaction = {
                id: `trans-${Date.now() + 1}`,
                amount: amountToReceive,
                currency: toCurrency,
                type: TransactionType.INCOME,
                description: `مصارفة من ${amountToSell.toLocaleString()} ${CURRENCY_DETAILS[fromCurrency].symbol} بسعر ${exchangeRate}`,
                date: new Date().toISOString(),
            };
            toAccount.transactions.push(incomeTransaction);
            
            updatedAccounts.forEach((acc: Account) => {
                acc.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            
            return updatedAccounts;
        });
        setIsExchangeFormOpen(false);
    };

    const handleSaveSettings = (settings: SettingsData) => {
        setSavingsThreshold(settings.threshold);
        setSavingsPercentage(settings.percentage);
        setExchangeRates(settings.rates);
        setIsSettingsOpen(false);
    };
    
    const handleTransferForSavings = (amount: number) => {
        setSavingsFormData({ suggestedAmount: amount });
        setIsSavingsFormOpen(true);
        setIsNotificationsOpen(false);
    };

    const handleSavingsTransferSubmit = (data: SavingsTransferFormData) => {
        const { amount, fromCurrency } = data;
        const fromAccount = accounts.find(a => a.id === `safe-${fromCurrency.toLowerCase()}`);
        const toAccount = accounts.find(a => a.id === `acc-bank-${fromCurrency.toLowerCase()}`);
        
        if (!fromAccount || !toAccount) {
            console.error("Source or destination account for savings transfer not found.");
            return;
        }

        handleSubmitTransaction({
            amount,
            currency: fromCurrency,
            type: TransactionType.TRANSFER,
            description: 'تحويل للادخار',
            date: new Date().toISOString().split('T')[0],
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
        });

        setIsSavingsFormOpen(false);
        setSavingsAlertDismissed(true);
    };

    const handleViewDebtsForPayment = () => {
        setSelectedAccountId('acc-deferred-yer');
        setIsNotificationsOpen(false);
    }
    
    // Goal Handlers
    const handleAddGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
        const newGoal: Goal = {
            ...data,
            id: `goal-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setGoals(prev => [...prev, newGoal]);
    };
    const handleUpdateGoal = (data: Goal) => {
        setGoals(prev => prev.map(g => g.id === data.id ? data : g));
    };
    const handleDeleteGoal = (id: string) => {
        if(window.confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
           setGoals(prev => prev.filter(g => g.id !== id));
        }
    };
    const handleGoalFormSubmit = (data: Omit<Goal, 'id' | 'createdAt'> | Goal) => {
        if ('id' in data) {
            handleUpdateGoal(data);
        } else {
            handleAddGoal(data);
        }
        setIsGoalFormOpen(false);
    };

    const handleDismissGoal = (goalId: string) => {
        const now = new Date();
        const currentMonthId = `${now.getFullYear()}-${now.getMonth()}`;
        const dismissalId = `${goalId}-${currentMonthId}`;
        setDismissedGoalAlerts(prev => [...prev, dismissalId]);
    };
    
    const openSummaryDetail = useCallback((type: TransactionType) => {
        const title = `تفاصيل: ${TRANSACTION_TYPE_DETAILS[type].label}`;
        const isInternalTransfer = (t: Transaction) => (t.description.startsWith('تحويل إلى') || t.description.startsWith('تحويل من'));

        const augmentedTransactions: AugmentedTransaction[] = displayedAccounts.flatMap(account => 
            account.transactions
                .filter(t => t.type === type)
                .filter(t => (type === TransactionType.INCOME || type === TransactionType.EXPENSE) ? !isInternalTransfer(t) : true)
                .map(t => ({...t, accountName: account.name}))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setSummaryDetail({ isOpen: true, title, transactions: augmentedTransactions });
    }, [displayedAccounts]);
    
    const handleRefresh = useCallback(() => { window.location.reload(); }, []);

    const handleAuthenticated = () => {
        setIsAuthenticated(true);
        const hash = localStorage.getItem('passwordHash');
        if (hash) { setAuthStatus('required'); }
    };
    
    const handleLock = () => {
        setIsAuthenticated(false);
        setDecoyMode(true);
    };

    // Triple-click handler for decoy mode
    // FIX: Replace NodeJS.Timeout with ReturnType<typeof setTimeout> for browser environments.
    const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clickCount = useRef(0);
    const handleHeaderClick = () => {
        clickCount.current += 1;
        if (clickCount.current === 3) {
            setDecoyMode(prev => !prev);
            clickCount.current = 0;
            if (clickTimeout.current) clearTimeout(clickTimeout.current);
        } else {
            if (clickTimeout.current) clearTimeout(clickTimeout.current);
            clickTimeout.current = setTimeout(() => {
                clickCount.current = 0;
            }, 500);
        }
    };


    if (authStatus === 'loading') {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center"><p>جار التحميل...</p></div>;
    }

    if (!isAuthenticated && (authStatus === 'required' || authStatus === 'setup')) {
        return <AuthScreen mode={authStatus} onAuthenticated={handleAuthenticated} />;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans" dir="rtl">
            <div className="container mx-auto p-4 max-w-5xl">
                <header className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={handleHeaderClick} title="انقر ثلاث مرات للكشف">
                        <h1 className="text-3xl font-bold text-gray-800">محفظتي الذكية</h1>
                        {!decoyMode && <LockOpenIcon className="w-6 h-6 text-green-600 animate-fade-in-up" title="الوضع الحقيقي" />}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleOpenForm()} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition transform hover:scale-110" title="إضافة عملية"><PlusIcon className="w-6 h-6"/></button>
                        <button onClick={() => setIsExchangeFormOpen(true)} className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 shadow-md transition transform hover:scale-110" title="مصارفة عملات"><CurrencyExchangeIcon className="w-6 h-6"/></button>
                        <div className="relative">
                           <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 transition relative">
                                <BellIcon className="w-6 h-6 text-gray-600"/>
                                {alertCount > 0 && <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">{alertCount}</span>}
                           </button>
                           <NotificationCenter
                                isOpen={isNotificationsOpen}
                                onClose={() => setIsNotificationsOpen(false)}
                                showSavingsAlert={showSavingsAlert}
                                onDismissSavings={() => setSavingsAlertDismissed(true)}
                                onTransferSavings={handleTransferForSavings}
                                safeBalance={cashBalance}
                                savingsPercentage={savingsPercentage}
                                isDecoyMode={decoyMode}
                                showDebtAlert={showDebtAlert}
                                onDismissDebt={() => setDebtAlertDismissed(true)}
                                onViewDebts={handleViewDebtsForPayment}
                                goalAlerts={goalAlerts}
                                onDismissGoal={handleDismissGoal}
                           />
                        </div>
                        <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 transition" title="تحديث التطبيق"><RefreshIcon className="w-6 h-6 text-gray-600"/></button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 transition" title="الإعدادات"><SettingsIcon className="w-6 h-6 text-gray-600"/></button>
                        <button onClick={handleLock} className="p-2 rounded-full hover:bg-gray-200 transition" title="قفل التطبيق"><LockClosedIcon className="w-6 h-6 text-gray-600"/></button>
                    </div>
                </header>

                <main className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                        <DeferredAccountDisplay deferredAccounts={deferredAccounts} selectedAccountId={selectedAccountId} onSelect={handleSelectAccount}/>
                        <HomeSafeDisplay safeAccounts={safeAccounts} selectedAccountId={selectedAccountId} onSelect={handleSelectAccount}/>
                        <BankAccountDisplay bankAccounts={bankAccounts} selectedAccountId={selectedAccountId} onSelect={handleSelectAccount}/>
                    </div>

                    {selectedAccount && (
                        <div className="bg-white p-4 rounded-lg shadow">
                             <h2 className="text-xl font-bold text-gray-800 mb-4 no-print">العمليات في: {selectedAccount.name}</h2>
                            <TransactionList
                                key={selectedAccountId}
                                transactions={selectedAccount.transactions}
                                accountName={selectedAccount.name}
                                onEdit={handleOpenForm}
                                onDelete={handleDeleteTransaction}
                                onSettleDebt={handleSettleDebt}
                            />
                        </div>
                    )}

                    <Summary accounts={displayedAccounts} exchangeRates={exchangeRates} onItemClick={openSummaryDetail} />
                </main>
            </div>
            
            {isFormOpen && <TransactionForm accounts={accounts} selectedAccountId={selectedAccountId} editingTransaction={editingTransaction} onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} onSubmit={handleSubmitTransaction}/>}
            {isExchangeFormOpen && <ExchangeForm accounts={safeAccounts} exchangeRates={exchangeRates} onClose={() => setIsExchangeFormOpen(false)} onSubmit={handleExchangeSubmit}/>}
            {settlingDebtTransaction && <SettleDebtForm transaction={settlingDebtTransaction} accounts={accounts.filter(a => !a.id.startsWith('acc-deferred-'))} onClose={() => setSettlingDebtTransaction(null)} onSubmit={handleSettleDebtSubmit}/>}
            {isSettingsOpen && <SettingsModal currentThreshold={savingsThreshold} currentPercentage={savingsPercentage} exchangeRates={exchangeRates} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} onOpenGoals={() => { setIsSettingsOpen(false); setIsGoalsListOpen(true); }}/>}
            
            <GoalsModal
                isOpen={isGoalsListOpen}
                onClose={() => setIsGoalsListOpen(false)}
                goals={displayedGoals}
                onAddRequest={() => { setEditingGoal(null); setIsGoalFormOpen(true); }}
                onEditRequest={(goal) => {
                    const realGoal = goals.find(g => g.id === goal.id);
                    setEditingGoal(realGoal || null);
                    setIsGoalFormOpen(true);
                }}
                onDelete={handleDeleteGoal}
            />

            {isGoalFormOpen && (
                <GoalForm 
                    onClose={() => setIsGoalFormOpen(false)}
                    onSubmit={handleGoalFormSubmit}
                    initialData={editingGoal}
                />
            )}
            
            <SummaryDetailModal isOpen={summaryDetail.isOpen} onClose={() => setSummaryDetail(prev => ({ ...prev, isOpen: false }))} title={summaryDetail.title} transactions={summaryDetail.transactions}/>
            
            {isSavingsFormOpen && savingsFormData && (
                <SavingsTransferForm
                    isOpen={isSavingsFormOpen}
                    onClose={() => setIsSavingsFormOpen(false)}
                    onSubmit={handleSavingsTransferSubmit}
                    suggestedAmount={savingsFormData.suggestedAmount}
                    accounts={accounts}
                />
            )}
        </div>
    );
}

export default App;