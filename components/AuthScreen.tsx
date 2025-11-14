import React, { useState, FormEvent } from 'react';
import { KeyIcon, LockClosedIcon } from './Icons';

interface AuthScreenProps {
    mode: 'setup' | 'required';
    onAuthenticated: () => void;
}

// Helper function to hash password using browser's crypto API
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert bytes to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onAuthenticated }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        const storedHash = localStorage.getItem('passwordHash');
        if (!storedHash) {
            setError('خطأ: لا توجد كلمة مرور محفوظة.');
            return;
        }

        const inputHash = await hashPassword(password);
        if (inputHash === storedHash) {
            setError('');
            onAuthenticated();
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    const handleSetup = async (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 4) {
            setError('يجب أن تتكون كلمة المرور من 4 أحرف على الأقل.');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        
        const newHash = await hashPassword(password);
        localStorage.setItem('passwordHash', newHash);
        setError('');
        onAuthenticated();
    };

    const isSetupMode = mode === 'setup';

    return (
        <div className="fixed inset-0 bg-gray-100 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in-up">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <LockClosedIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isSetupMode ? 'تأمين المحفظة' : 'تسجيل الدخول'}
                </h2>
                <p className="text-gray-500 mb-6">
                    {isSetupMode ? 'الرجاء إنشاء كلمة مرور لحماية بياناتك.' : 'الرجاء إدخال كلمة المرور للوصول.'}
                </p>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                <form onSubmit={isSetupMode ? handleSetup : handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="sr-only">كلمة المرور</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <KeyIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="كلمة المرور"
                                autoFocus
                            />
                        </div>
                    </div>

                    {isSetupMode && (
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">تأكيد كلمة المرور</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-center"
                                    placeholder="تأكيد كلمة المرور"
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">
                        {isSetupMode ? 'حفظ وبدء الاستخدام' : 'دخول'}
                    </button>
                </form>
                 <p className="text-center text-xs text-gray-400 mt-6">
                    جميع بياناتك مخزنة محلياً في جهازك.
                </p>
            </div>
        </div>
    );
};

export default AuthScreen;
