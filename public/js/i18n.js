document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('i18nextLng') || 'en';

    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLang,
            fallbackLng: 'en',
            backend: {
                loadPath: '/locales/{{lng}}/translation.json'
            }
        }, function (err, t) {
            if (err) return console.error('Error loading i18n:', err);
            updateContent();
            updateLanguageSwitcher(savedLang);
        });

    function updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const options = element.getAttribute('data-i18n-options');

            if (options) {
                element.innerText = i18next.t(key, JSON.parse(options));
            } else {
                // Check if it's an input placeholder
                if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                    element.setAttribute('placeholder', i18next.t(key));
                } else {
                    element.innerText = i18next.t(key);
                }
            }
        });
    }

    // Language Switcher Logic
    const langBtn = document.getElementById('language-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const currentLang = i18next.language;
            const newLang = currentLang === 'en' ? 'es' : 'en';

            i18next.changeLanguage(newLang, (err, t) => {
                if (err) return console.error('Error changing language:', err);
                updateContent();
                updateLanguageSwitcher(newLang);
                localStorage.setItem('i18nextLng', newLang);
            });
        });
    }

    function updateLanguageSwitcher(lang) {
        const langText = document.getElementById('language-text');
        if (langText) {
            langText.innerText = lang === 'en' ? 'ES' : 'EN';
        }
    }
});
