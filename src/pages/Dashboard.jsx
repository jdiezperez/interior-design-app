import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    Palette,
    Armchair,
    Coins,
    ArrowRight,
    Plus,
    History
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const stats = [
        { label: t('dashboard.stats.availableCredits'), value: user?.credits || 0, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        { label: t('dashboard.stats.teamMembers'), value: '4', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { label: t('dashboard.stats.savedStyles'), value: '12', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    ];

    const quickLinks = [
        { name: t('quickLinks.redesign'), desc: t('quickLinks.redesignDesc'), icon: Plus, path: '/dashboard', primary: true },
        { name: t('quickLinks.team'), desc: t('quickLinks.teamDesc'), icon: Users, path: '/team' },
        { name: t('quickLinks.credits'), desc: t('quickLinks.creditsDesc'), icon: Coins, path: '/credits' },
        { name: t('quickLinks.gallery'), desc: t('quickLinks.galleryDesc'), icon: History, path: '/styles' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('dashboard.welcomeBack', { name: user?.name || t('dashboard.designer') })}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {t('dashboard.quickActions')}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {quickLinks.map((link, idx) => (
                            <Link
                                key={idx}
                                to={link.path}
                                className={`p-6 rounded-2xl border transition-all duration-300 group flex flex-col justify-between h-40 ${link.primary
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02]'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${link.primary ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400'
                                    }`}>
                                    <link.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center justify-between">
                                        {link.name}
                                        <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                    </h3>
                                    <p className={`text-sm mt-1 ${link.primary ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {link.desc}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Studio Summary */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('dashboard.studioActivity')}
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-2 bg-indigo-500 rounded-full h-12"></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white italic">"Modern Scandi Living Room"</p>
                                    <p className="text-xs text-gray-500 mt-1">Generated 2 hours ago by You</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-2 bg-emerald-500 rounded-full h-12"></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white italic">"Industrial Loft Style"</p>
                                    <p className="text-xs text-gray-500 mt-1">Generated 5 hours ago by Sarah</p>
                                </div>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="w-2 bg-gray-300 rounded-full h-12"></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">View Complete History</p>
                                    <p className="text-xs text-gray-500 mt-1">Coming soon...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                        <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
                            <Coins size={18} />
                            {t('dashboard.lowCreditAlert')}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-500/80 mb-4">
                            {t('dashboard.lowCreditDesc')}
                        </p>
                        <Link to="/credits" className="text-sm font-bold text-amber-800 dark:text-amber-400 hover:underline">
                            {t('dashboard.topUpNow')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
