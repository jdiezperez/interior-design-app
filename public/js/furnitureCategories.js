document.addEventListener('DOMContentLoaded', async () => {
    const userInfoName = document.getElementById('user-info-name');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');
    const navTeam = document.getElementById('nav-team');
    const profileSection = document.getElementById('profile-section');
    const furnitureCategoriesList = document.getElementById('furniture-categories-list');
    const furnitureCategoryModal = document.getElementById('furniture-category-modal');
    const furnitureCategoryForm = document.getElementById('furniture-category-form');
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

    // Fetch furniture categories
    async function loadFurnitureCategories() {
        try {
            const res = await fetch('/api/furniture/categories');
            if (res.ok) {
                const furnitureCategories = await res.json();
                renderFurnitureCategories(furnitureCategories);
            }
        } catch (err) {
            console.error('Error loading furniture categories:', err);
        }
    }

    function renderFurnitureCategories(furnitureCategories) {
        furnitureCategoriesList.innerHTML = '';
        if (furnitureCategories.length === 0) {
            furnitureCategoriesList.innerHTML = `<tr><td colspan="2" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${i18next.t('furniture.noCategories')}</td></tr>`;
            return;
        }
        furnitureCategories.forEach(furnitureCategory => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${furnitureCategory.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editFurnitureCategory(${furnitureCategory.id}, '${furnitureCategory.name}')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">${i18next.t('furniture.edit')}</button>
                    <button onclick="deleteFurnitureCategory(${furnitureCategory.id})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">${i18next.t('furniture.remove')}</button>
                </td>
            `;
            furnitureCategoriesList.appendChild(tr);
        });
    }

    // Modal Functions
    window.openAddFurnitureCategoryModal = () => {
        modalTitle.textContent = i18next.t('furniture.addCategory');
        furnitureCategoryForm.reset();
        document.getElementById('furnitureCategory-id').value = '';
        furnitureCategoryModal.classList.remove('hidden');
    };

    window.closeFurnitureCategoryModal = () => {
        furnitureCategoryModal.classList.add('hidden');
    };

    window.editFurnitureCategory = (id, name) => {
        modalTitle.textContent = i18next.t('furniture.editCategory');
        document.getElementById('furnitureCategory-id').value = id;
        document.getElementById('furnitureCategory-name').value = name;
        furnitureCategoryModal.classList.remove('hidden');
    };

    window.submitFurnitureCategoryForm = async () => {
        const id = document.getElementById('furnitureCategory-id').value;
        const name = document.getElementById('furnitureCategory-name').value;

        const url = id ? `/api/furniture/categories/${id}` : '/api/furniture/categories/add';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                closeFurnitureCategoryModal();
                loadFurnitureCategories();
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving furniture category');
        }
    };

    window.deleteFurnitureCategory = async (id) => {
        if (!confirm(i18next.t('furniture.confirmRemove'))) return;
        try {
            const res = await fetch(`/api/furniture/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadFurnitureCategories();
            } else {
                alert('Error removing furniture category');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Initial Load
    loadFurnitureCategories();
});
