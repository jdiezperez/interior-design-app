import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Edit2,
    Trash2,
    MapPin,
    Mail,
    Coins,
    Users,
    ChevronDown,
    ChevronRight,
    Briefcase,
    Settings,
    UserPlus,
    Share2,
    Loader2
} from 'lucide-react';

const Team = () => {
    const { user: currentUser, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [locations, setLocations] = useState([]);
    const [unassignedMembers, setUnassignedMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedLocations, setExpandedLocations] = useState({});

    // Modals
    const [locationModal, setLocationModal] = useState({ open: false, editing: null });
    const [memberModal, setMemberModal] = useState({ open: false, editing: null, locationId: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null, name: '' });
    const [distributeModal, setDistributeModal] = useState(false);

    // Forms
    const [locationName, setLocationName] = useState('');
    const [memberForm, setMemberForm] = useState({ name: '', email: '', password: '', locationId: '' });

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/team/data');
            setLocations(res.data.locations);
            setUnassignedMembers(res.data.unassignedMembers);

            // Locations are collapsed by default (empty state)
        } catch (err) {
            console.error('Error fetching team data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleLocation = (id) => {
        setExpandedLocations(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Credit Distribution ---
    const handleDistribute = async () => {
        try {
            await axios.post('/api/team/credits/distribute');
            setDistributeModal(false);
            fetchData();
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || t('team.errorDistributing'));
        }
    };

    // --- Credit Transfer ---
    const handleTransfer = async (targetUserId, amount) => {
        try {
            await axios.post('/api/team/credits/transfer', { targetUserId, amount });
            fetchData();
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Error transferring credits');
        }
    };

    // --- Location Actions ---
    const handleSaveLocation = async (e) => {
        e.preventDefault();
        try {
            if (locationModal.editing) {
                await axios.put(`/api/team/locations/${locationModal.editing.id}`, { name: locationName });
            } else {
                await axios.post('/api/team/locations/add', { name: locationName });
            }
            setLocationModal({ open: false, editing: null });
            setLocationName('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving location');
        }
    };

    const handleDeleteLocation = async (id) => {
        try {
            await axios.delete(`/api/team/locations/${id}`);
            setDeleteModal({ open: false, type: '', id: null, name: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting location');
        }
    };

    // --- Member Actions ---
    const handleSaveMember = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...memberForm };
            // Ensure locationId is handled correctly
            payload.locationId = payload.locationId ? parseInt(payload.locationId) : null;

            if (memberModal.editing) {
                await axios.put(`/api/team/members/${memberModal.editing.id}`, payload);
            } else {
                await axios.post('/api/team/members/add', payload);
            }
            setMemberModal({ open: false, editing: null, locationId: null });
            setMemberForm({ name: '', email: '', password: '', locationId: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving member');
        }
    };

    const handleDeleteMember = async (id) => {
        try {
            await axios.delete(`/api/team/members/${id}`);
            setDeleteModal({ open: false, type: '', id: null, name: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting member');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    const totalTeamMembers = locations.reduce((acc, loc) => acc + (loc.members?.length || 0), 0) + unassignedMembers.length;
    const creditsToDistribute = Math.floor(currentUser?.credits || 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('team.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">
                        {t('team.subtitle')}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setDistributeModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl hover:bg-amber-100 transition-all font-bold border border-amber-200 dark:border-amber-800"
                    >
                        <Share2 size={20} />
                        {t('team.distributeCredits')} ({creditsToDistribute})
                    </button>
                    <button
                        onClick={() => {
                            setLocationModal({ open: true, editing: null });
                            setLocationName('');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/20"
                    >
                        <Plus size={20} />
                        {t('team.addLocation')}
                    </button>
                </div>
            </div>

            {/* Locations List */}
            <div className="space-y-4">
                {locations.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('team.noLocations')}</h3>
                        <p className="text-gray-500 mt-1">{t('team.noLocationsDesc')}</p>
                    </div>
                ) : (
                    locations.map(location => (
                        <div key={location.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
                            {/* Location Header */}
                            <div
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleLocation(location.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                        <MapPin size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                        {location.name}
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                                        {location.members?.length || 0} {t('team.membersCount')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => {
                                            setMemberModal({ open: true, editing: null, locationId: location.id });
                                            setMemberForm({ name: '', email: '', password: '', locationId: location.id.toString() });
                                        }}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors tip"
                                        title={t('team.addMember')}
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLocationModal({ open: true, editing: location });
                                            setLocationName(location.name);
                                        }}
                                        className="p-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ open: true, type: 'location', id: location.id, name: location.name })}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
                                    {expandedLocations[location.id] ? <ChevronDown /> : <ChevronRight />}
                                </div>
                            </div>

                            {/* Members Expansion */}
                            {expandedLocations[location.id] && (
                                <div className="divide-y divide-gray-50 dark:divide-gray-700 border-t border-gray-50 dark:border-gray-700">
                                    {(!location.members || location.members.length === 0) ? (
                                        <div className="p-8 text-center text-gray-400 text-sm font-medium">
                                            {t('team.noMembersInLocation')}
                                        </div>
                                    ) : (
                                        location.members.map(member => (
                                            <div key={member.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{member.name}</h4>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                            <Mail size={14} />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    {/* Credit Controls */}
                                                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                        <button
                                                            onClick={() => handleTransfer(member.id, -10)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                                                        >
                                                            -10
                                                        </button>
                                                        <button
                                                            onClick={() => handleTransfer(member.id, -1)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                                                        >
                                                            -
                                                        </button>
                                                        <div className="flex items-center gap-1.5 px-4 font-bold text-amber-600 dark:text-amber-500 min-w-[70px] justify-center">
                                                            <Coins size={16} />
                                                            {member.credits || 0}
                                                        </div>
                                                        <button
                                                            onClick={() => handleTransfer(member.id, 1)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => handleTransfer(member.id, 10)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
                                                        >
                                                            +10
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => alert('Projects coming soon...')}
                                                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
                                                        >
                                                            <Briefcase size={18} />
                                                            {t('team.projects')}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setMemberModal({ open: true, editing: member, locationId: location.id });
                                                                setMemberForm({
                                                                    name: member.name,
                                                                    email: member.email,
                                                                    password: '',
                                                                    locationId: member.locationId ? member.locationId.toString() : ''
                                                                });
                                                            }}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal({ open: true, type: 'member', id: member.id, name: member.name })}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Location Modal */}
            {locationModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setLocationModal({ open: false, editing: null })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {locationModal.editing ? t('team.editLocation') : t('team.newLocation')}
                            </h3>
                        </div>
                        <form onSubmit={handleSaveLocation} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('team.locationName')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-0 transition-all text-lg font-medium"
                                    placeholder={t('team.locationNamePlateholder')}
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setLocationModal({ open: false, editing: null })}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 transition-all"
                                >
                                    {t('team.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    {t('team.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Member Modal */}
            {memberModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setMemberModal({ open: false, editing: null, locationId: null })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {memberModal.editing ? t('team.editMember') : t('team.newMember')}
                            </h3>
                        </div>
                        <form onSubmit={handleSaveMember} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('team.name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white"
                                        value={memberForm.name}
                                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('team.email')}</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={memberModal.editing}
                                        className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white disabled:opacity-50"
                                        value={memberForm.email}
                                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('team.password')}</label>
                                <input
                                    type="password"
                                    required={!memberModal.editing}
                                    placeholder={memberModal.editing ? t('team.leaveBlankToKeep') : undefined}
                                    className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white"
                                    value={memberForm.password}
                                    onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('team.location')}</label>
                                <div className="relative group">
                                    <select
                                        required
                                        className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-0 appearance-none cursor-pointer transition-all pr-12"
                                        value={memberForm.locationId || ''}
                                        onChange={(e) => setMemberForm({ ...memberForm, locationId: e.target.value })}
                                    >
                                        <option value="" disabled>{t('team.selectLocation')}</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id.toString()}>{loc.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setMemberModal({ open: false, editing: null, locationId: null })}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 transition-all"
                                >
                                    {t('team.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    {t('team.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Distribute Credits Modal */}
            {distributeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDistributeModal(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Share2 size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('team.distributeConfirmTitle')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            {t('team.distributeConfirmText', { amount: creditsToDistribute, count: totalTeamMembers })}
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDistributeModal(false)}
                                className="flex-1 px-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 transition-all"
                            >
                                {t('team.cancel')}
                            </button>
                            <button
                                onClick={handleDistribute}
                                className="flex-1 px-6 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                            >
                                {t('team.distributeNow')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, type: '', id: null, name: '' })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('team.deleteConfirmTitle')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                {deleteModal.type === 'location'
                                    ? t('team.deleteLocationWarning', { name: deleteModal.name })
                                    : t('team.deleteMemberWarning', { name: deleteModal.name })}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteModal({ open: false, type: '', id: null, name: '' })}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 transition-all"
                                >
                                    {t('team.cancel')}
                                </button>
                                <button
                                    onClick={() => deleteModal.type === 'location' ? handleDeleteLocation(deleteModal.id) : handleDeleteMember(deleteModal.id)}
                                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                >
                                    {t('team.yesDelete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
