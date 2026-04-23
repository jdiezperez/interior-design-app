document.addEventListener('DOMContentLoaded', async () => {
    const teamList = document.getElementById('team-list');
    const mainUserRow = document.getElementById('main-user-row');
    const memberModal = document.getElementById('member-modal');
    const memberForm = document.getElementById('member-form');
    const modalTitle = document.getElementById('modal-title');
    const userInfoName = document.getElementById('user-info-name');
    const locationSelect = document.getElementById('member-location');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const navTeam = document.getElementById('nav-team');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');

    let currentUser = null;
    let locations = []; // Store locations for lookup

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
            // Get Locations first
            const locationsRes = await fetch('/api/locations');
            if (locationsRes.ok) {
                locations = await locationsRes.json();
                populateLocationDropdown(locations);
            }

            // Get Team Members
            const membersRes = await fetch('/api/team');
            if (membersRes.ok) {
                const members = await membersRes.json();
                renderMembers(members);
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

                renderMainUser(currentUser);
            }

        } catch (err) {
            console.error('Error loading data:', err);
        }
    }

    function getLocationName(locationId) {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : '-';
    }

    function renderMainUser(user) {
        mainUserRow.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                ${user.name || user.email}
                <span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">${i18next.t('team.you')}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${getLocationName(user.locationId)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold" id="main-user-credits">${user.credits || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="shareCredits()" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">${i18next.t('team.shareCredits')}</button>
            </td>
        `;
    }

    function renderMembers(members) {
        // Clear existing members (keep first 2 rows: main user + separator)
        while (teamList.children.length > 2) {
            teamList.removeChild(teamList.lastChild);
        }

        members.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${member.name || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${getLocationName(member.locationId)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${member.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div class="flex items-center space-x-2">
                        <button onclick="transferCredits(${member.id}, -1)" class="text-gray-500 hover:text-red-500 focus:outline-none">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                        </button>
                        <span class="font-bold w-8 text-center">${member.credits || 0}</span>
                        <button onclick="transferCredits(${member.id}, 1)" class="text-gray-500 hover:text-green-500 focus:outline-none">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editMember(${member.id}, '${member.name || ''}', '${member.email}', ${member.locationId || 'null'})" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">${i18next.t('team.edit')}</button>
                    <button onclick="deleteMember(${member.id})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">${i18next.t('team.remove')}</button>
                </td>
            `;
            teamList.appendChild(tr);
        });
    }

    function populateLocationDropdown(locations) {
        locationSelect.innerHTML = '<option value="">Select Location</option>';
        locations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.id; // Use ID instead of name
            option.textContent = loc.name;
            locationSelect.appendChild(option);
        });
    }

    // Modal Functions
    window.openAddMemberModal = () => {
        modalTitle.textContent = i18next.t('team.addMember');
        memberForm.reset();
        document.getElementById('member-id').value = '';
        memberModal.classList.remove('hidden');
    };

    window.closeMemberModal = () => {
        memberModal.classList.add('hidden');
    };

    window.editMember = (id, name, email, locationId) => {
        modalTitle.textContent = i18next.t('team.editMember');
        document.getElementById('member-id').value = id;
        document.getElementById('member-name').value = name;
        document.getElementById('member-email').value = email;
        document.getElementById('member-location').value = locationId || '';
        document.getElementById('member-password').value = ''; // Reset password field
        memberModal.classList.remove('hidden');
    };

    window.submitMemberForm = async () => {
        const id = document.getElementById('member-id').value;
        const formData = new FormData(memberForm);
        const data = Object.fromEntries(formData.entries());

        // Rename 'location' to 'locationId' and convert to integer
        if (data.location && data.location !== '') {
            data.locationId = parseInt(data.location);
            delete data.location;
        } else {
            // Remove location field if empty
            delete data.location;
        }

        const url = id ? `/api/team/${id}` : '/api/team/add';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                closeMemberModal();
                loadData();
                alert(id ? i18next.t('team.memberUpdated') : i18next.t('team.memberAdded'));
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error saving member');
        }
    };

    window.deleteMember = async (id) => {
        if (!confirm(i18next.t('team.confirmRemove'))) return;
        try {
            const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadData();
            } else {
                alert('Error removing member');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Credit Functions
    window.transferCredits = async (targetUserId, amount) => {
        try {
            const res = await fetch('/api/team/credits/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, amount })
            });

            if (res.ok) {
                loadData(); // Reload to show updated credits
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error transferring credits');
        }
    };

    window.shareCredits = async () => {
        if (!confirm(i18next.t('team.confirmDistribute'))) return;
        try {
            const res = await fetch('/api/team/credits/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                loadData();
                alert(i18next.t('team.creditsDistributed'));
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error distributing credits');
        }
    };

    // Initial Load
    loadData();
});
