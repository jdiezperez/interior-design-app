import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
    LayoutDashboard,
    Users,
    MapPin,
    Armchair,
    Palette,
    Coins,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    Folder
} from 'lucide-react';

const Layout = () => {
    const { t } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    const menuItems = [
        { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        ...(user?.role === 'main_user' ? [{ name: t('nav.team'), path: '/team', icon: Users }] : []),
        { name: t('projects.title'), path: '/projects', icon: Folder },
        { name: t('nav.styles'), path: '/styles', icon: Palette },
        { name: t('nav.furniture'), path: '/furniture', icon: Armchair },
        {
            name: t('nav.credits'),
            path: '/credits',
            icon: Coins,
            extra: user?.credits !== undefined ? (
                <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-bold">
                    {user.credits}
                </span>
            ) : null
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                            Interior AI
                        </h1>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            // Check for active path (taking into account translations if name is used as key, but path is better)
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        flex items-center space-x-3 p-3 rounded-lg transition-colors
                                        ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                    `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                    {item.extra}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Language Switcher in Sidebar */}
                    <div className="px-4 mb-4">
                        <LanguageSwitcher />
                    </div>

                    {/* User Profile Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 p-2">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                                <UserIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role === 'main_user' ? t('team.teamManager') : t('team.teamMember')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full mt-4 flex items-center space-x-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">{t('nav.logout')}</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="ml-4 flex-1">
                        <h2 className="text-lg font-bold truncate">
                            {menuItems.find(i => i.path === location.pathname)?.name || 'Interior AI'}
                        </h2>
                    </div>
                    <div className="flex items-center">
                        <LanguageSwitcher minimal />
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
