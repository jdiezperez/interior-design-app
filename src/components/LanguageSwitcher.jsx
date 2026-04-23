import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher = ({ minimal = false }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguage = i18n.language || 'en';

    return (
        <div className={`flex items-center gap-2 ${minimal ? '' : 'p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700'}`}>
            {!minimal && <Languages size={18} className="text-gray-400" />}
            <div className="flex gap-1">
                <button
                    onClick={() => changeLanguage('en')}
                    className={`px-2 py-1 text-xs font-bold rounded ${currentLanguage.startsWith('en')
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } transition-all`}
                >
                    EN
                </button>
                <button
                    onClick={() => changeLanguage('es')}
                    className={`px-2 py-1 text-xs font-bold rounded ${currentLanguage.startsWith('es')
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } transition-all`}
                >
                    ES
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
