import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    Coins,
    CreditCard,
    CheckCircle,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const Credits = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState('100');
    const [status, setStatus] = useState({ type: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePurchase = async (e) => {
        e.preventDefault();
        const purchaseAmount = parseFloat(amount);

        if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
            setStatus({ type: 'error', message: t('credits.invalidAmount') });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: null, message: '' });

        try {
            const res = await axios.post('/api/credits/purchase', { amount: purchaseAmount });
            setStatus({
                type: 'success',
                message: res.data.message || t('credits.success')
            });
            refreshUser();
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || t('credits.error')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const presetAmounts = ['100', '500', '1000', '5000'];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('credits.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('credits.subtitle')}</p>
                </div>
                <div className="bg-indigo-600 px-6 py-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20 flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Coins size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">{t('credits.availableBalance')}</p>
                        <p className="text-2xl font-bold line-height-1">{user?.credits || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700/50">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-indigo-600" />
                                {t('credits.purchase')}
                            </h2>
                        </div>

                        <form onSubmit={handlePurchase} className="p-8 space-y-8">
                            {status.type && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${status.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
                                    }`}>
                                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <p className="text-sm font-medium">{status.message}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('credits.selectAmount')}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {presetAmounts.map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val)}
                                            className={`py-3 rounded-xl border-2 transition-all font-bold ${amount === val
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                                : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-200 dark:hover:border-indigo-800'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative mt-4">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Coins className="text-gray-400" size={20} />
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-bold"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={t('credits.customAmountPlaceholder')}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group text-lg"
                            >
                                {isSubmitting ? t('credits.processing') : t('credits.completePurchase')}
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                        <h3 className="font-bold text-lg mb-2">{t('credits.agencyTitle')}</h3>
                        <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                            {t('credits.agencyDesc')}
                        </p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-bold text-sm backdrop-blur-sm border border-white/10">
                            {t('credits.upgradeAgency')}
                        </button>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('credits.faqTitle')}</h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('credits.faqQ1')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('credits.faqA1')}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('credits.faqQ2')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('credits.faqA2')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Credits;
