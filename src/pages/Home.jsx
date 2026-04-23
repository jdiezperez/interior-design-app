import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    Image,
    Zap,
    Video,
    Coins,
    Layout as GalleryIcon,
    Edit3,
    ChevronRight,
    Play
} from 'lucide-react';

const Home = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                                Interior AI
                            </h1>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">{t('nav.features')}</a>
                            <a href="#gallery" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">{t('nav.gallery')}</a>
                            <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">{t('nav.pricing')}</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
                            >
                                {t('nav.login')}
                            </Link>
                            <Link
                                to="/dashboard"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-500/30 font-medium"
                            >
                                {t('nav.getStarted')}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800"></div>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8 animate-fade-in">
                        <Zap size={16} />
                        <span>{t('hero.poweredBy', { model: 'Gemini 3 Pro' })}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-slide-up">
                        <span className="block text-gray-900 dark:text-white">{t('hero.title1')}</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-500">
                            {t('hero.title2')}
                        </span>
                    </h1>

                    <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-slide-up delay-100">
                        {t('hero.subtitle')}
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-slide-up delay-200">
                        <Link
                            to="/dashboard"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 group"
                        >
                            {t('hero.startDesigning')}
                            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2">
                            <Play size={20} fill="currentColor" />
                            {t('hero.watchDemo')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('features.title')}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">{t('features.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: t('features.styleTransfer.title'), desc: t('features.styleTransfer.desc'), icon: Image, color: 'indigo' },
                            { title: t('features.gemini.title'), desc: t('features.gemini.desc'), icon: Zap, color: 'emerald' },
                            { title: t('features.video.title'), desc: t('features.video.desc'), icon: Video, color: 'purple' },
                            { title: t('features.credit.title'), desc: t('features.credit.desc'), icon: Coins, color: 'blue' },
                            { title: t('features.gallery.title'), desc: t('features.gallery.desc'), icon: GalleryIcon, color: 'orange' },
                            { title: t('features.editing.title'), desc: t('features.editing.desc'), icon: Edit3, color: 'pink' },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:scale-[1.02] transition-all duration-300 border border-gray-100 dark:border-gray-700"
                            >
                                <div className={`w-12 h-12 bg-${feature.color}-100 dark:bg-${feature.color}-900/50 rounded-lg flex items-center justify-center mb-6 text-${feature.color}-600 dark:text-${feature.color}-400 group-hover:rotate-6 transition-transform`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-8 md:mb-0">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                            Interior AI
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('footer.rights')}</p>
                    </div>
                    <div className="flex space-x-12">
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><a href="#" className="hover:text-indigo-600 transition">Features</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Gallery</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Pricing</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><a href="#" className="hover:text-indigo-600 transition">About</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Contact</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition">Terms</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
