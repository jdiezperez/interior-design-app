document.addEventListener('DOMContentLoaded', async () => {
    const userInfoName = document.getElementById('user-info-name');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');
    const navTeam = document.getElementById('nav-team');
    const profileSection = document.getElementById('profile-section');
    const stylesCategoriesList = document.getElementById('styles-categories-list');
    const stylesCategoryModal = document.getElementById('styles-category-modal');
    const stylesCategoryForm = document.getElementById('styles-category-form');
    const modalTitle = document.getElementById('modal-title');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    // Toggle User Dropdown
    if (userMenuButton && userMenuDropdown) {
        const userMenuCaret = document.getElementById('user-menu-caret');

        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();

            userMenuDropdown.classList.toggle('hidden');
            if (userMenuCaret) userMenuCaret.classList.toggle('rotate-180');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {

            if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
                if (userMenuCaret) userMenuCaret.classList.remove('rotate-180');
            }
        });
    }

    // Get Current User (Main User)
    const userRes = await fetch('/auth/me');
    if (userRes.ok) {
        currentUser = await userRes.json();
        if (userInfoName) userInfoName.textContent = currentUser.name || currentUser.email;
        const roleText = currentUser.role === 'main_user' ? 'Team Manager' : 'Team Member';
        if (userRoleDisplay) userRoleDisplay.textContent = roleText;
        if (userNameDisplay) userNameDisplay.textContent = currentUser.name || currentUser.email;
        if (userCreditsDisplay) userCreditsDisplay.textContent = currentUser.credits || 0;

        // Determine if main user: role is 'main_user' OR parentId is null (legacy users)
        const isMainUser = currentUser.role === 'main_user' || !currentUser.parentId;

        // Update credits link - clickable only for main users
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

        if (isMainUser) {
            if (navTeam) navTeam.classList.remove('hidden');
        } else {
            if (profileSection) profileSection.classList.remove('hidden');
        }

    }

    // Fetch styles categories
    async function loadStyleCategories() {
        try {
            const res = await fetch('/api/styles/categories');
            if (res.ok) {
                const stylesCategories = await res.json();
                renderStylesCategories(stylesCategories);
            }
        } catch (err) {
            console.error('Error loading styles categories:', err);
        }
    }

    function renderStylesCategories(stylesCategories) {
        stylesCategoriesList.innerHTML = '';
        if (stylesCategories.length === 0) {
            stylesCategoriesList.innerHTML = `<tr><td colspan="2" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${i18next.t('styles.noCategories')}</td></tr>`;
            return;
        }
        stylesCategories.forEach(styleCategory => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${styleCategory.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editStylesCategory(${styleCategory.id}, '${styleCategory.name}')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">${i18next.t('styles.edit')}</button>
                    <button onclick="deleteStylesCategory(${styleCategory.id})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">${i18next.t('styles.remove')}</button>
                </td>
            `;
            stylesCategoriesList.appendChild(tr);
        });
    }

    // Modal Functions
    window.openAddStyleCategoryModal = () => {
        modalTitle.textContent = i18next.t('styles.addCategory');
        stylesCategoryForm.reset();
        document.getElementById('styleCategory-id').value = '';
        stylesCategoryModal.classList.remove('hidden');
    };

    window.closeStyleCategoryModal = () => {
        stylesCategoryModal.classList.add('hidden');
    };

    window.editStylesCategory = (id, name) => {
        modalTitle.textContent = i18next.t('styles.editCategory');
        document.getElementById('styleCategory-id').value = id;
        document.getElementById('styleCategory-name').value = name;
        stylesCategoryModal.classList.remove('hidden');
    };

    window.submitStyleCategoryForm = async () => {
        const id = document.getElementById('styleCategory-id').value;
        const name = document.getElementById('styleCategory-name').value;

        const url = id ? `/api/styles/categories/${id}` : '/api/styles/categories/add';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                closeStyleCategoryModal();
                loadStyleCategories();
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving style category');
        }
    };

    window.deleteStylesCategory = async (id) => {
        if (!confirm(i18next.t('styles.confirmRemove'))) return;
        try {
            const res = await fetch(`/api/styles/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadStyleCategories();
            } else {
                alert('Error removing style category');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Initial Load
    loadStyleCategories();
});
