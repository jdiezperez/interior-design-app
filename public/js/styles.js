document.addEventListener('DOMContentLoaded', async () => {
    const stylesList = document.getElementById('styles-list');
    const styleModal = document.getElementById('style-modal');
    const styleForm = document.getElementById('style-form');
    const modalTitle = document.getElementById('modal-title');
    const userInfoName = document.getElementById('user-info-name');
    const categorySelect = document.getElementById('style-category');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const navTeam = document.getElementById('nav-team');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');

    let currentUser = null;
    let categories = [];

    // Toggle User Dropdown
    if (userMenuButton && userMenuDropdown) {
        const userMenuCaret = document.getElementById('user-menu-caret');

        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('hidden');
            if (userMenuCaret) userMenuCaret.classList.toggle('rotate-180');
        });

        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
                if (userMenuCaret) userMenuCaret.classList.remove('rotate-180');
            }
        });
    }

    // Fetch current user and categories
    async function loadData() {
        try {
            // Get Current User
            const userRes = await fetch('/auth/me');
            if (userRes.ok) {
                currentUser = await userRes.json();
                if (userInfoName) userInfoName.textContent = currentUser.name || currentUser.email;
                const roleText = currentUser.role === 'main_user' ? 'Team Manager' : 'Team Member';
                if (userRoleDisplay) userRoleDisplay.textContent = roleText;
                if (userNameDisplay) userNameDisplay.textContent = currentUser.name || currentUser.email;
                if (userCreditsDisplay) userCreditsDisplay.textContent = currentUser.credits || 0;

                const isMainUser = currentUser.role === 'main_user' || !currentUser.parentId;
                const creditsLink = document.getElementById('user-credits-link');
                if (creditsLink) {
                    if (isMainUser) {
                        creditsLink.href = '/credits.html';
                        creditsLink.style.cursor = 'pointer';
                    } else {
                        creditsLink.removeAttribute('href');
                        creditsLink.style.cursor = 'default';
                        creditsLink.onclick = (e) => e.preventDefault();
                    }
                }
                if (isMainUser && navTeam) navTeam.classList.remove('hidden');
            }

            // Get Categories
            const categoriesRes = await fetch('/api/styles/categories');
            if (categoriesRes.ok) {
                categories = await categoriesRes.json();
                populateCategoryDropdown(categories);
            }

            // Load Styles (Placeholder)
            renderStyles([]);

        } catch (err) {
            console.error('Error loading data:', err);
        }
    }

    function renderStyles(stylesItems) {
        stylesList.innerHTML = '';
        if (stylesItems.length === 0) {
            stylesList.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">${i18next.t('styles.noStyles') || 'No styles found'}</td></tr>`;
            return;
        }
        // Future implementation for rendering styles
    }

    function populateCategoryDropdown(categories) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }

    // Modal Functions
    window.openAddStyleModal = () => {
        modalTitle.textContent = i18next.t('styles.addStyle');
        styleForm.reset();
        document.getElementById('style-id').value = '';
        styleModal.classList.remove('hidden');
    };

    window.closeStyleModal = () => {
        styleModal.classList.add('hidden');
    };

    window.submitStyleForm = async () => {
        alert('Style management implementation is coming soon!');
        closeStyleModal();
    };

    // Initial Load
    loadData();
});
