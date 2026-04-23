document.addEventListener('DOMContentLoaded', async () => {
    const teamSection = document.getElementById('team-section');
    const profileSection = document.getElementById('profile-section');
    const teamList = document.getElementById('team-list');
    const changePasswordForm = document.getElementById('change-password-form');
    const userInfoName = document.getElementById('user-info-name');
    const navTeam = document.getElementById('nav-team');
    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleDisplay = document.getElementById('user-role-display');
    const userCreditsDisplay = document.getElementById('user-credits-display');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

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

    // Fetch current user
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            currentUser = await res.json();

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
                if (teamSection) teamSection.classList.remove('hidden');
                if (navTeam) navTeam.classList.remove('hidden');
                loadTeamMembers();
            } else {
                if (profileSection) profileSection.classList.remove('hidden');
            }
        } else {
            window.location.href = '/login.html';
        }
    } catch (err) {
        console.error('Error fetching user:', err);
    }

    // Load Team Members
    async function loadTeamMembers() {
        try {
            const res = await fetch('/api/team');
            const members = await res.json();
            if (teamList) {
                teamList.innerHTML = '';
                if (members.length === 0) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                            No team members found. <button onclick="document.querySelector('input[name=\\'name\\']').focus()" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 underline">Create</button>
                        </td>
                    `;
                    teamList.appendChild(tr);
                } else {
                    members.forEach(member => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${member.name || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${member.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${member.location || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${member.credits || 0}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="editMember(${member.id}, '${member.name || ''}', '${member.location || ''}')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">Edit</button>
                                <button onclick="deleteMember(${member.id})" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                            </td>
                        `;
                        teamList.appendChild(tr);
                    });
                }
            }
        } catch (err) {
            console.error('Error loading members:', err);
        }
    }



    // Change Password
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(changePasswordForm);
            const data = Object.fromEntries(formData.entries());

            if (data.newPassword !== data.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const res = await fetch('/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword: data.currentPassword,
                        newPassword: data.newPassword
                    })
                });
                if (res.ok) {
                    changePasswordForm.reset();
                    alert('Password changed successfully');
                } else {
                    const error = await res.json();
                    alert(error.message);
                }
            } catch (err) {
                console.error(err);
                alert('Error changing password');
            }
        });
    }

    // Expose functions to window for onclick handlers
    window.editMember = async (id, currentName, currentLocation) => {
        const newName = prompt('Enter new name:', currentName);
        if (newName === null) return;
        const newLocation = prompt('Enter new location:', currentLocation);
        if (newLocation === null) return;

        try {
            const res = await fetch(`/api/team/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, location: newLocation })
            });
            if (res.ok) {
                loadTeamMembers();
            } else {
                alert('Error updating member');
            }
        } catch (err) {
            console.error(err);
        }
    };

    window.deleteMember = async (id) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        try {
            const res = await fetch(`/api/team/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadTeamMembers();
            } else {
                alert('Error deleting member');
            }
        } catch (err) {
            console.error(err);
        }
    };
});
