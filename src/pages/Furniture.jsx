import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    Armchair,
    ChevronDown,
    ChevronRight,
    Camera,
    Upload,
    X,
    RefreshCw,
    Check,
    Image as ImageIcon
} from 'lucide-react';

const Furniture = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Modals state
    const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
    const [furnitureModal, setFurnitureModal] = useState({ open: false, data: null, categoryId: null });
    const [cameraModal, setCameraModal] = useState({ open: false, furnitureId: null });
    const [deleteData, setDeleteData] = useState({ open: false, type: null, id: null });
    const [viewerModal, setViewerModal] = useState({ open: false, url: '' });

    // Form states
    const [formName, setFormName] = useState('');

    // Camera states
    const [cameraStream, setCameraStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // environment = back, user = front
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/furniture/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Category Handlers ---
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!categoryModal.data;
            const url = isEdit ? `/api/furniture/categories/${categoryModal.data.id}` : '/api/furniture/categories/add';
            const method = isEdit ? 'put' : 'post';
            await axios[method](url, { name: formName });
            setCategoryModal({ open: false, data: null });
            fetchCategories();
        } catch (err) {
            alert(t('furniture.errorSavingCategory'));
        }
    };

    const confirmDeleteCategory = async () => {
        try {
            await axios.delete(`/api/furniture/categories/${deleteData.id}`);
            setDeleteData({ open: false, type: null, id: null });
            fetchCategories();
        } catch (err) {
            alert(t('furniture.errorDeletingCategory'));
        }
    };

    // --- Furniture Handlers ---
    const handleSaveFurniture = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!furnitureModal.data;
            const url = isEdit ? `/api/furniture/${furnitureModal.data.id}` : '/api/furniture/add';
            const method = isEdit ? 'put' : 'post';
            await axios[method](url, { name: formName, furnitureCategoryId: furnitureModal.categoryId });
            setFurnitureModal({ open: false, data: null, categoryId: null });
            fetchCategories();
        } catch (err) {
            alert(t('furniture.errorSavingFurniture'));
        }
    };

    const confirmDeleteFurniture = async () => {
        try {
            await axios.delete(`/api/furniture/${deleteData.id}`);
            setDeleteData({ open: false, type: null, id: null });
            fetchCategories();
        } catch (err) {
            alert(t('furniture.errorDeletingFurniture'));
        }
    };

    // --- Image Handlers ---
    const startCamera = async () => {
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            setCameraStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert(t('furniture.cameraError'));
        }
    };

    useEffect(() => {
        if (cameraModal.open && !capturedImage) {
            startCamera();
        }
        return () => {
            if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
        };
    }, [cameraModal.open, facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
        setCapturedImage(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const handleFileUpload = async (e, furnitureId) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadImage(file, furnitureId);
    };

    const confirmCapture = async () => {
        // Convert base64 to blob
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        await uploadImage(file, cameraModal.furnitureId);
        setCameraModal({ open: false, furnitureId: null });
        setCapturedImage(null);
    };

    const uploadImage = async (file, furnitureId) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('furnitureId', furnitureId);
        try {
            await axios.post('/api/furniture/images', formData);
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.message || t('furniture.errorUploadingImage'));
        }
    };

    const handleDeleteImage = async (id) => {
        if (window.confirm(t('furniture.deleteImageConfirm'))) {
            try {
                await axios.delete(`/api/furniture/images/${id}`);
                fetchCategories();
            } catch (err) {
                alert(t('furniture.errorDeletingImage'));
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('furniture.inventory')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">{t('furniture.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setFormName(''); setCategoryModal({ open: true, data: null }); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-500/20 font-bold"
                >
                    <Plus size={20} />
                    {t('furniture.addCategory')}
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Armchair size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mt-1">{t('furniture.noCategoriesDesc')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
                            <div
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Armchair size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                        {category.name}
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                                        {t('furniture.furnituresCount', { count: category.furnitures?.length || 0 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => { setFormName(''); setFurnitureModal({ open: true, data: null, categoryId: category.id }); }}
                                        className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition"
                                        title={t('furniture.addFurniture')}
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        onClick={() => { setFormName(category.name); setCategoryModal({ open: true, data: category }); }}
                                        className="p-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                                        title={t('furniture.editCategory')}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteData({ open: true, type: 'category', id: category.id })}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition"
                                        title={t('furniture.deleteCategory')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
                                    {expandedCategories[category.id] ? <ChevronDown /> : <ChevronRight />}
                                </div>
                            </div>

                            {expandedCategories[category.id] && (
                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {(!category.furnitures || category.furnitures.length === 0) ? (
                                        <div className="p-8 text-center text-gray-400 text-sm">{t('furniture.noFurnitures')}</div>
                                    ) : (
                                        category.furnitures.map(furniture => (
                                            <div key={furniture.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{furniture.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => { setFormName(furniture.name); setFurnitureModal({ open: true, data: furniture, categoryId: category.id }); }}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                                                            title={t('furniture.editFurniture')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteData({ open: true, type: 'furniture', id: furniture.id })}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                            title={t('furniture.deleteFurniture')}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Image Grid */}
                                                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
                                                    {/* Add Button */}
                                                    {(furniture.images?.length || 0) < 9 && (
                                                        <button
                                                            onClick={() => setCameraModal({ open: true, furnitureId: furniture.id })}
                                                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-all hover:bg-indigo-50/50"
                                                        >
                                                            <Plus size={24} />
                                                        </button>
                                                    )}

                                                    {furniture.images?.map(img => (
                                                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-700">
                                                            <img
                                                                src={`/api/furniture/image/${img.filename}`}
                                                                alt={furniture.name}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in"
                                                                onClick={() => setViewerModal({ open: true, url: `/api/furniture/image/${img.filename}` })}
                                                            />
                                                            <button
                                                                onClick={() => handleDeleteImage(img.id)}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- Modals --- */}

            {/* Category Modal */}
            {categoryModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCategoryModal({ open: false, data: null })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                        <button
                            onClick={() => setCategoryModal({ open: false, data: null })}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {categoryModal.data ? t('furniture.editCategoryModal') : t('furniture.newCategoryModal')}
                            </h3>
                            <form onSubmit={handleSaveCategory} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('furniture.nameLabel')}</label>
                                    <input
                                        autoFocus
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder={t('furniture.namePlaceholder')}
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setCategoryModal({ open: false, data: null })} className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold hover:bg-gray-50 transition">{t('furniture.cancel')}</button>
                                    <button type="submit" className="flex-1 p-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">{t('furniture.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Furniture Modal */}
            {furnitureModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFurnitureModal({ open: false, data: null, categoryId: null })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                        <button
                            onClick={() => setFurnitureModal({ open: false, data: null, categoryId: null })}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {furnitureModal.data ? t('furniture.editFurnitureModal') : t('furniture.newFurnitureModal')}
                            </h3>
                            <form onSubmit={handleSaveFurniture} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('furniture.furnitureNameLabel')}</label>
                                    <input
                                        autoFocus
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder={t('furniture.furnitureNamePlaceholder')}
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setFurnitureModal({ open: false, data: null, categoryId: null })} className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold hover:bg-gray-50 transition">{t('furniture.cancel')}</button>
                                    <button type="submit" className="flex-1 p-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">{t('furniture.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteData.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteData({ open: false, id: null, type: null })} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('furniture.deleteConfirmTitle')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {deleteData.type === 'category'
                                    ? t('furniture.deleteCategoryWarning')
                                    : t('furniture.deleteFurnitureWarning')}
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteData({ open: false, id: null, type: null })} className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-bold hover:bg-gray-50 transition">{t('furniture.cancel')}</button>
                                <button
                                    onClick={deleteData.type === 'category' ? confirmDeleteCategory : confirmDeleteFurniture}
                                    className="flex-1 p-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20"
                                >
                                    {t('furniture.yesDelete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {cameraModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setCameraModal({ open: false, furnitureId: null })} />
                    <div className="relative bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up h-[600px] flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-white">{t('furniture.captureTitle')}</h3>
                            <button onClick={() => setCameraModal({ open: false, furnitureId: null })} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                            {capturedImage ? (
                                <img src={capturedImage} className="w-full h-full object-contain" />
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="p-8 bg-black/40 backdrop-blur-md">
                            {capturedImage ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCapturedImage(null)}
                                        className="flex-1 p-4 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={20} /> {t('furniture.retake')}
                                    </button>
                                    <button
                                        onClick={confirmCapture}
                                        className="flex-1 p-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                    >
                                        <Check size={20} /> {t('furniture.usePhoto')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-6">
                                    <label className="p-4 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition cursor-pointer">
                                        <Upload size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            handleFileUpload(e, cameraModal.furnitureId);
                                            setCameraModal({ open: false, furnitureId: null });
                                        }} />
                                    </label>

                                    <button
                                        onClick={capturePhoto}
                                        className="w-20 h-20 bg-white rounded-full border-8 border-gray-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                                    >
                                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                    </button>

                                    <button
                                        onClick={toggleCamera}
                                        className="p-4 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition"
                                    >
                                        <RefreshCw size={24} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Image Viewer */}
            <ImageViewer
                open={viewerModal.open}
                url={viewerModal.url}
                onClose={() => setViewerModal({ open: false, url: '' })}
            />
        </div>
    );
};

// Image Viewer Modal
const ImageViewer = ({ open, url, onClose }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white transition-colors p-2"
                >
                    <X size={32} />
                </button>
                <img
                    src={url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export default Furniture;
