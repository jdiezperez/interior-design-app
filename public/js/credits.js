document.addEventListener('DOMContentLoaded', async () => {
    const navTeam = document.getElementById('nav-team');
    const userInfoName = document.getElementById('user-info-name');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const currentCredits = document.getElementById('current-credits');

    let currentUser = null;

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

    // Fetch current user and members
    async function loadData() {
        try {
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

                // Update credits display in page
                if (currentCredits) currentCredits.textContent = currentUser.credits || 0;

                if (isMainUser) {
                    if (navTeam) navTeam.classList.remove('hidden');
                } else {
                    if (profileSection) profileSection.classList.remove('hidden');
                }

            }
        } catch (err) {
            console.error('Error loading data:', err);
        }
    }

    // Purchase credits form
    const purchaseForm = document.getElementById('purchase-credits-form');
    purchaseForm.addEventListener('submit', handlePurchase);

    // Handle credit purchase
    async function handlePurchase(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('credit-amount').value);

        if (isNaN(amount) || amount <= 0) {
            showMessage(i18next.t('credits.invalidAmount', 'Please enter a valid amount'), 'error');
            return;
        }

        try {
            const response = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(i18next.t('credits.success', data.message), 'success');
                // Update credits display
                if (userCreditsDisplay) userCreditsDisplay.textContent = data.credits || 0;
                if (currentCredits) currentCredits.textContent = data.credits || 0;
                // Reset to default
                document.getElementById('credit-amount').value = '100'; // Reset to default
            } else {
                showMessage(i18next.t('credits.error', data.message), 'error');
            }
        } catch (error) {
            console.error('Error purchasing credits:', error);
            showMessage(i18next.t('credits.error', 'Failed to purchase credits'), 'error');
        }
    }

    // Show message
    function showMessage(message, type) {
        const messageContainer = document.getElementById('message-container');
        const messageDiv = document.getElementById('message');

        messageDiv.textContent = message;
        messageDiv.className = `p-4 rounded-md ${type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`;

        messageContainer.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }

    // Initial Load
    loadData();
});
