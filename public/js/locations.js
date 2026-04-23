document.addEventListener('DOMContentLoaded', async () => {
    const userInfoName = document.getElementById('user-info-name');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');
    const navTeam = document.getElementById('nav-team');
    const profileSection = document.getElementById('profile-section');
    const locationsList = document.getElementById('locations-list');
    const locationModal = document.getElementById('location-modal');
    const locationForm = document.getElementById('location-form');
    const modalTitle = document.getElementById('modal-title');

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

    // Fetch locations
    async function loadLocations() {
        try {
            const res = await fetch('/api/locations');
            if (res.ok) {
                const locations = await res.json();
                renderLocations(locations);
            }
        } catch (err) {
            console.error('Error loading locations:', err);
        }
    }

    function renderLocations(locations) {
        locationsList.innerHTML = '';
        locations.forEach(location => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${location.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editLocation(${location.id}, '${location.name}')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">${i18next.t('locations.edit')}</button>
                    <button onclick="deleteLocation(${location.id})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">${i18next.t('locations.remove')}</button>
                </td>
            `;
            locationsList.appendChild(tr);
        });
    }

    // Modal Functions
    window.openAddLocationModal = () => {
        modalTitle.textContent = i18next.t('locations.addLocation');
        locationForm.reset();
        document.getElementById('location-id').value = '';
        locationModal.classList.remove('hidden');
    };

    window.closeLocationModal = () => {
        locationModal.classList.add('hidden');
    };

    window.editLocation = (id, name) => {
        modalTitle.textContent = i18next.t('locations.editLocation');
        document.getElementById('location-id').value = id;
        document.getElementById('location-name').value = name;
        locationModal.classList.remove('hidden');
    };

    window.submitLocationForm = async () => {
        const id = document.getElementById('location-id').value;
        const name = document.getElementById('location-name').value;

        const url = id ? `/api/locations/${id}` : '/api/locations/add';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                closeLocationModal();
                loadLocations();
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving location');
        }
    };

    window.deleteLocation = async (id) => {
        if (!confirm(i18next.t('locations.confirmRemove'))) return;
        try {
            const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadLocations();
            } else {
                alert('Error removing location');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Initial Load
    loadLocations();
});
