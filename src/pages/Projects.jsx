import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronRight,
    Camera,
    Folder,
    FolderOpen,
    Image as ImageIcon,
    Wand2,
    X,
    Check,
    Loader2,
    RefreshCw,
    Upload,
    ArrowLeft,
    Monitor,
    Smartphone,
    Layers,
    SkipForward,
    Box,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [categories, setCategories] = useState([]);
    const [styles, setStyles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Modals
    const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
    const [projectModal, setProjectModal] = useState({ open: false, data: null, categoryId: null });
    const [deleteData, setDeleteData] = useState({ open: false, type: null, id: null });
    const [viewerModal, setViewerModal] = useState({ open: false, url: '', image: null });
    const [furniture, setFurniture] = useState([]);

    // Edit Modal
    const [editModal, setEditModal] = useState({ open: false, image: null, projectId: null });
    const [editStep, setEditStep] = useState(1);
    const [editMode, setEditMode] = useState('prompt'); // 'prompt' | 'furniture'
    const [editParams, setEditParams] = useState({ prompt: '', furnitureId: null, resolution: 'HD', versions: 1 });
    const [maskImage, setMaskImage] = useState(null); // Blob/File
    const [isEditing, setIsEditing] = useState(false);
    const [editPreview, setEditPreview] = useState(null);

    // Generation Modal
    const [generateModal, setGenerateModal] = useState({ open: false, projectId: null });
    const [genStep, setGenStep] = useState(1); // 1: Source, 2: Style, 3: Params, 4: Preview
    const [genSource, setGenSource] = useState(null); // { type: 'upload'|'camera', file: File, preview: base64 } or NULL if skipped
    const [genStyle, setGenStyle] = useState(null); // { type: 'predefined'|'reference'|'custom', value: string|File, preview: string, prompt?: string, styleId?: number }
    const [genParams, setGenParams] = useState({ prompt: '', resolution: 'HD', orientation: 'Horizontal', versions: 1 });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPreview, setGeneratedPreview] = useState(null);
    const [isGenDryRun, setIsGenDryRun] = useState(false);
    const [genDryRunData, setGenDryRunData] = useState(null);

    // Form states
    const [formName, setFormName] = useState('');

    // Camera Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/projects/data');
            // Check if response has new structure with categories and styles
            if (res.data.categories) {
                setCategories(res.data.categories);
                setStyles(res.data.styles || []);
                setFurniture(res.data.furniture || []);
            } else if (Array.isArray(res.data)) {
                // Fallback for array response
                setCategories(res.data);
            } else {
                // Fallback if data is wrapped differently or empty
                console.error("Unexpected API response structure:", res.data);
                setCategories([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        return () => {
            stopCamera();
        };
    }, []);

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Camera Functions ---
    const startCamera = async () => {
        try {
            if (cameraStream) stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            setCameraStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert(t('projects.cameraError') || "Could not access camera");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                setGenSource({ type: 'camera', file, preview: URL.createObjectURL(blob) });
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    useEffect(() => {
        if (generateModal.open && genStep === 1 && !genSource && !cameraStream) {
            // Optional auto-start logic
        } else if ((!generateModal.open || genStep !== 1 || genSource) && cameraStream) {
            stopCamera();
        }
    }, [generateModal.open, genStep, genSource]);

    useEffect(() => {
        if (cameraStream) startCamera();
    }, [facingMode]);

    // --- CRUD Handlers ---

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!categoryModal.data;
            const url = isEdit ? `/api/projects/categories/${categoryModal.data.id}` : '/api/projects/categories/add';
            const method = isEdit ? 'put' : 'post';
            await axios[method](url, { name: formName });
            setCategoryModal({ open: false, data: null });
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving category');
        }
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        try {
            const isEdit = !!projectModal.data;
            const url = isEdit ? `/api/projects/${projectModal.data.id}` : '/api/projects/add';
            const method = isEdit ? 'put' : 'post';
            await axios[method](url, { name: formName, projectCategoryId: projectModal.categoryId });
            setProjectModal({ open: false, data: null, categoryId: null });
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving project');
        }
    };

    const handleDelete = async () => {
        try {
            let url = '';
            if (deleteData.type === 'category') url = `/api/projects/categories/${deleteData.id}`;
            else if (deleteData.type === 'project') url = `/api/projects/${deleteData.id}`;
            else if (deleteData.type === 'image') url = `/api/projects/images/${deleteData.id}`;

            await axios.delete(url);
            setDeleteData({ open: false, type: null, id: null });
            fetchCategories();
        } catch (err) {
            alert('Error deleting item');
        }
    };

    // --- Generation Modal Logic ---
    const openGenerateModal = (projectId) => {
        setGenerateModal({ open: true, projectId });
        setGenStep(1);
        setGenSource(null);
        setGenStyle(null);
        setCategoryFilter('all'); // Reset filter
        setGenParams({ prompt: '', resolution: 'HD', orientation: 'Horizontal', versions: 1 });
        setGeneratedPreview(null);
        setIsGenDryRun(false);
        setGenDryRunData(null);
    };

    // --- Generation Logic ---

    const handleFileUpload = (e, target) => {
        const file = e.target.files[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            if (target === 'source') {
                setGenSource({ type: 'upload', file, preview });
            } else if (target === 'style') {
                setGenStyle({ type: 'reference', value: file, preview });
            }
        }
    };

    const [selectedIndices, setSelectedIndices] = useState(new Set([0]));

    const handleGenerate = async () => {
        if (!genStyle) {
            alert("Please select a style");
            return;
        }

        // Calculate cost
        let costPerImage = 1;
        if (genParams.resolution === '2K') costPerImage = 2;
        if (genParams.resolution === '4K') costPerImage = 4;
        const totalCost = costPerImage * genParams.versions;

        if (user.credits < totalCost) {
            alert(t('projects.insufficientCredits'));
            return;
        }

        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('prompt', genParams.prompt);
            formData.append('resolution', genParams.resolution);
            formData.append('orientation', genParams.orientation);
            formData.append('versions', genParams.versions);

            if (genSource) formData.append('source', genSource.file);

            if (genStyle.type === 'predefined') {
                formData.append('predefinedStyle', genStyle.value);
                if (genStyle.prompt) formData.append('stylePrompt', genStyle.prompt);
            } else if (genStyle.type === 'custom') {
                formData.append('predefinedStyle', genStyle.value);
                if (genStyle.styleId) formData.append('styleId', genStyle.styleId);
            } else if (genStyle.type === 'reference') {
                formData.append('styleRef', genStyle.value);
            }

            if (isGenDryRun) formData.append('dryRun', 'true');

            const res = await axios.post('/api/projects/generate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = res.data;

            if (data.dryRun) {
                setGenDryRunData(data.payload);
                return;
            }
            // Ensure we have an array of image objects { url, filename }
            if (!data.images && data.previewUrl) {
                data.images = [{ url: data.previewUrl, filename: 'mock.jpg' }];
            }

            setGeneratedPreview({ ...data, projectId: generateModal.projectId });
            setSelectedIndices(new Set([0]));
            setGenStep(4);
        } catch (err) {
            alert(err.response?.data?.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleSelection = (index) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                if (next.size > 1) next.delete(index); // Prevent empty selection? Or allow? Let's allow empty but disable save button
                else next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleSaveGenerated = async () => {
        try {
            if (selectedIndices.size === 0) return;

            const selectedFilenames = Array.from(selectedIndices).map(i => generatedPreview.images[i].filename);

            await axios.post('/api/projects/images/save', {
                projectId: generateModal.projectId, // Using modal state which is guaranteed
                filenames: selectedFilenames,
                cost: generatedPreview.cost
            });

            // Cleanup unused versions
            const unusedFilenames = generatedPreview.images
                .filter((_, i) => !selectedIndices.has(i))
                .map(img => img.filename);

            if (unusedFilenames.length > 0) {
                // Non-blocking cleanup
                axios.post('http://localhost:3000/api/projects/discard', { filenames: unusedFilenames }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).catch(err => console.error("Cleanup warning", err));
            }

            setGenerateModal({ open: false, projectId: null });
            setGeneratedPreview(null);
            fetchCategories();
            refreshUser();
        } catch (err) {
            alert('Error saving image');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('projects.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">{t('projects.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setFormName(''); setCategoryModal({ open: true, data: null }); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={20} />
                    {t('projects.newCategory')}
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mt-1">{t('projects.noCategoriesDesc')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories.map(category => (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Category Header */}
                            <div
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                        <Folder size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                        {category.name}
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                                        {t('projects.projectsCount', { count: category.projects?.length || 0 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => { setFormName(''); setProjectModal({ open: true, data: null, categoryId: category.id }); }}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                                        title={t('projects.newProject')}
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        onClick={() => { setFormName(category.name); setCategoryModal({ open: true, data: category }); }}
                                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteData({ open: true, type: 'category', id: category.id })}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
                                    {expandedCategories[category.id] ? <ChevronDown /> : <ChevronRight />}
                                </div>
                            </div>

                            {/* Projects List */}
                            {expandedCategories[category.id] && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    {category.projects?.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">No projects yet.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {category.projects.map(project => (
                                                <div key={project.id} className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 pl-2 border-l-4 border-indigo-500">
                                                            {project.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => { setFormName(project.name); setProjectModal({ open: true, data: project, categoryId: category.id }); }}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteData({ open: true, type: 'project', id: project.id })}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Image Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                        <button
                                                            onClick={() => openGenerateModal(project.id)}
                                                            className="aspect-square rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Wand2 size={24} />
                                                            </div>
                                                            <span className="mt-2 text-sm font-bold">{t('projects.generateImage')}</span>
                                                        </button>

                                                        {project.images?.map(img => (
                                                            <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                                                <img
                                                                    src={`/api/projects/image/${img.filename}`}
                                                                    alt="Generated"
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in"
                                                                    onClick={() => setViewerModal({ open: true, url: `/api/projects/image/${img.filename}`, image: img })}
                                                                />
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteData({ open: true, type: 'image', id: img.id }); }}
                                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-700"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- Modals --- */}

            {/* CRUD Modals */}
            {categoryModal.open && (
                <div onClick={() => setCategoryModal({ open: false, data: null })} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md relative">
                        <button onClick={() => setCategoryModal({ open: false, data: null })} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <h3 className="text-2xl font-bold mb-4 dark:text-white">{categoryModal.data ? t('projects.editCategory') : t('projects.newCategory')}</h3>
                            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white" />
                            <div className="flex gap-2"><button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-bold">Save</button></div>
                        </form>
                    </div>
                </div>
            )}
            {projectModal.open && (
                <div onClick={() => setProjectModal({ open: false, data: null, categoryId: null })} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md relative">
                        <button onClick={() => setProjectModal({ open: false, data: null, categoryId: null })} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                        <form onSubmit={handleSaveProject} className="space-y-4">
                            <h3 className="text-2xl font-bold mb-4 dark:text-white">{projectModal.data ? t('projects.editProject') : t('projects.newProject')}</h3>
                            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white" />
                            <div className="flex gap-2"><button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-bold">Save</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* GENERATION MODAL */}
            {generateModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('projects.generateImage')}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    {[1, 2, 3, 4].map(step => (
                                        <div key={step} className={`h-2 rounded-full flex-1 w-12 transition-colors ${genStep >= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    ))}
                                    <span className="text-sm text-gray-500 ml-2">Step {genStep}/4</span>
                                </div>
                            </div>
                            <button onClick={() => setGenerateModal({ open: false, projectId: null })} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X /></button>
                        </div>

                        <div className="p-8 flex-1">
                            {/* Step 1: Source */}
                            {genStep === 1 && (
                                <div className="space-y-6">
                                    <h4 className="text-xl font-bold dark:text-white">Choose Source Image</h4>

                                    {!genSource ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {cameraStream ? (
                                                <div className="col-span-2 relative aspect-video bg-black rounded-3xl overflow-hidden">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                                                        <button onClick={switchCamera} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white"><RefreshCw /></button>
                                                        <button onClick={captureImage} className="p-6 bg-white rounded-full border-4 border-indigo-500 shadow-lg"></button>
                                                        <button onClick={stopCamera} className="p-4 bg-red-500/80 backdrop-blur-md rounded-full text-white"><X /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={startCamera} className="h-64 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center gap-4 transition-all group">
                                                        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                                                        <span className="font-bold text-lg dark:text-white">Use Camera</span>
                                                    </button>
                                                    <label className="h-64 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center gap-4 transition-all group cursor-pointer">
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'source')} />
                                                        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                                                        <span className="font-bold text-lg dark:text-white">Upload Photo</span>
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6">
                                            <img src={genSource.preview} alt="Source" className="max-h-[50vh] rounded-3xl shadow-lg object-contain bg-black" />
                                            <div className="flex gap-4">
                                                <button onClick={() => { setGenSource(null); stopCamera(); }} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold dark:text-white">Retake / Change</button>
                                                <button onClick={() => setGenStep(2)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Next: Select Style</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Skip option */}
                                    {!genSource && !cameraStream && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setGenStep(2)}
                                                className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-semibold transition"
                                            >
                                                <SkipForward size={20} />
                                                Skip Source (Text Only)
                                            </button>
                                        </div>
                                    )}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            )}

                            {/* Step 2: Style */}
                            {genStep === 2 && (
                                <div className="space-y-6">
                                    <h4 className="text-xl font-bold dark:text-white">Choose Style</h4>

                                    {/* Standard Styles Dropdown */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Standard Styles</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-4 rounded-xl border appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val) setGenStyle({ type: 'predefined', value: val, prompt: e.target.selectedOptions[0].dataset.prompt });
                                                    else if (genStyle?.type === 'predefined') setGenStyle(null);
                                                }}
                                                value={genStyle?.type === 'predefined' ? genStyle.value : ''}
                                            >
                                                <option value="">Select a standard style...</option>
                                                <option value="Minimalist" data-prompt="minimalist interior design, clean lines, neutral colors, uncluttered, simple geometric forms">Minimalist</option>
                                                <option value="Modern" data-prompt="modern interior design, sleek furniture, geometric shapes, functional, glass and steel elements">Modern</option>
                                                <option value="Bohemian" data-prompt="bohemian interior design, eclectic patterns, organic elements, cozy, colorful, plants, layered textures">Bohemian</option>
                                                <option value="Scandinavian" data-prompt="scandinavian interior design, hygge, light wood, white walls, functional simplicity, cozy textiles">Scandinavian</option>
                                                <option value="Industrial" data-prompt="industrial interior design, exposed brick, metal accents, raw materials, loft style, open layout">Industrial</option>
                                                <option value="Mid-Century Modern" data-prompt="mid-century modern interior design, vintage vibes, organic curves, teak wood, retro aesthetic">Mid-Century Modern</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 my-2">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                        <span className="text-sm font-bold text-gray-400">OR USE CUSTOM STYLES</span>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                    </div>

                                    {/* Custom Styles Filter */}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Saved Styles:</label>
                                        <select
                                            className="p-2 rounded-lg border bg-white dark:bg-gray-700 dark:text-white text-sm"
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {[...new Set(styles.map(s => s.StyleCategory?.name).filter(Boolean))].map(catName => (
                                                <option key={catName} value={catName}>{catName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1">
                                        {styles
                                            .filter(s => categoryFilter === 'all' || s.StyleCategory?.name === categoryFilter)
                                            .map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => { setGenStyle({ type: 'custom', value: style.name, styleId: style.id }); setGenStep(3); }}
                                                    className={`group relative aspect-square rounded-2xl border-2 overflow-hidden text-left transition-all ${genStyle?.styleId === style.id ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300'}`}
                                                >
                                                    {style.StyleImages?.[0] ? (
                                                        <img src={`/api/styles/image/${style.StyleImages[0].filename}`} alt={style.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                                                        <span className="font-bold text-white text-md leading-tight block">{style.name}</span>
                                                        {style.StyleCategory && <span className="text-xs text-gray-300">{style.StyleCategory.name}</span>}
                                                    </div>
                                                    {genStyle?.styleId === style.id && (
                                                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg"><Check size={16} /></div>
                                                    )}
                                                </button>
                                            ))}

                                        {/* Reference Upload Card - Moved to end of grid to flow nicely */}
                                        <label className={`cursor-pointer aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all p-4 text-center ${genStyle?.type === 'reference' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50/30'}`}>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleFileUpload(e, 'style'); setGenStep(3); }} />
                                            {genStyle?.type === 'reference' ? (
                                                <img src={genStyle.preview} alt="Ref" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <>
                                                    <Upload size={32} className="text-gray-400 group-hover:text-indigo-500" />
                                                    <span className="font-bold text-gray-500 text-sm">Upload Reference Image</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300"><Wand2 size={20} /></div>
                                        <div>
                                            <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">Selection Summary</p>
                                            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                                                {genStyle?.type === 'predefined' ? `Standard: ${genStyle.value}` :
                                                    genStyle?.type === 'custom' ? `Custom: ${genStyle.value}` :
                                                        genStyle?.type === 'reference' ? 'Custom Reference Image' : 'No style selected'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={() => setGenStep(1)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">Back</button>
                                        <button
                                            onClick={() => setGenStep(3)}
                                            disabled={!genStyle}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                        >
                                            Next: Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Details */}
                            {genStep === 3 && (
                                <div className="space-y-6">
                                    <h4 className="text-xl font-bold dark:text-white">Generation Details</h4>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 dark:text-gray-300">Prompt / Details</label>
                                        <textarea
                                            value={genParams.prompt}
                                            onChange={e => setGenParams({ ...genParams, prompt: e.target.value })}
                                            className="w-full p-4 rounded-xl border dark:bg-gray-900 dark:text-white"
                                            rows={3}
                                            placeholder="Describe your vision (e.g., 'Modern leather sofa, soft lighting')..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Resolution</label>
                                            <div className="flex gap-2">
                                                {['HD', '2K', '4K'].map(res => (
                                                    <button
                                                        key={res}
                                                        onClick={() => setGenParams({ ...genParams, resolution: res })}
                                                        className={`flex-1 p-3 rounded-xl border-2 font-bold ${genParams.resolution === res ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                                                    >
                                                        {res}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Orientation</label>
                                            <div className="flex gap-2">
                                                {['Horizontal', 'Vertical'].map(or => (
                                                    <button
                                                        key={or}
                                                        onClick={() => setGenParams({ ...genParams, orientation: or })}
                                                        className={`flex-1 p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${genParams.orientation === or ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                                                    >
                                                        {or === 'Horizontal' ? <Monitor size={18} /> : <Smartphone size={18} />}
                                                        {or}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Versions</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 4].map(ver => (
                                                    <button
                                                        key={ver}
                                                        onClick={() => setGenParams({ ...genParams, versions: ver })}
                                                        className={`flex-1 p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${genParams.versions === ver ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                                                    >
                                                        <Layers size={18} />
                                                        {ver}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex items-center justify-between">
                                        <span className="font-bold text-amber-700 dark:text-amber-400">Estimated Cost</span>
                                        <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                                            {(genParams.resolution === '4K' ? 4 : genParams.resolution === '2K' ? 2 : 1) * genParams.versions} Credits
                                        </span>
                                    </div>

                                    {/* Dry Run Toggle */}
                                    <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 focus-within:ring-2 ring-indigo-500 transition-all cursor-pointer" onClick={() => setIsGenDryRun(!isGenDryRun)}>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${isGenDryRun ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isGenDryRun ? 'translate-x-6' : ''}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wider flex items-center gap-2">
                                                Debug Mode: Show AI Payload
                                                <CreditCard size={14} className="opacity-50" />
                                            </span>
                                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Verify AI instructions without using credits.</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={() => setGenStep(2)} className="px-6 py-3 text-gray-500 font-bold">Back</button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-70"
                                        >
                                            {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                            {isGenerating ? 'Generating...' : 'Generate Magic'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Preview */}
                            {genStep === 4 && generatedPreview && (
                                <div className="space-y-6 text-center">
                                    <h4 className="text-xl font-bold dark:text-white">Your Design {generatedPreview.params.versions > 1 ? 'Variations Are' : 'is'} Ready!</h4>

                                    {/* Handle multiple versions display */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto max-w-4xl">
                                        {generatedPreview.images?.map((img, i) => (
                                            <div
                                                key={i}
                                                className={`relative rounded-3xl overflow-hidden shadow-xl transition-all border-4 ${selectedIndices.has(i) ? 'border-indigo-600 scale-[1.02]' : 'border-transparent hover:border-indigo-200'}`}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={`Preview ${i + 1}`}
                                                    className="w-full h-auto bg-black cursor-zoom-in"
                                                    onClick={() => setViewerModal({ open: true, url: img.url })}
                                                />
                                                <div
                                                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer transition ${selectedIndices.has(i) ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
                                                    onClick={() => toggleSelection(i)}
                                                >
                                                    Var {i + 1}
                                                    {selectedIndices.has(i) ? <Check size={14} className="text-white" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/50" />}
                                                </div>
                                                {/* Select Action Overlay */}
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                                    <span className="text-white text-xs font-bold uppercase tracking-wider">Click Image to Zoom</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center gap-4 pt-4">
                                        <button onClick={() => { setGenStep(3); setGeneratedPreview(null); setSelectedIndices(new Set()); }} className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-500 rounded-xl font-bold hover:bg-gray-50">Discard</button>
                                        <button
                                            onClick={handleSaveGenerated}
                                            disabled={selectedIndices.size === 0}
                                            className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save Selected ({selectedIndices.size})
                                        </button>
                                    </div>
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
                onClose={() => setViewerModal({ open: false, url: '', image: null })}
                onEdit={() => {
                    if (viewerModal.image) {
                        setEditModal({ open: true, image: viewerModal.image, projectId: viewerModal.image.projectId });
                        setEditStep(1);
                        setEditMode('prompt');
                        setEditParams({ prompt: '', furnitureId: null, resolution: 'HD', versions: 1 });
                        setMaskImage(null);
                        setEditPreview(null);
                        setViewerModal({ open: false, url: '', image: null });
                    }
                }}
            />

            {/* Edit Wizard Modal */}
            {editModal.open && (
                <EditWizard
                    isOpen={editModal.open}
                    onClose={() => setEditModal({ open: false, image: null, projectId: null })}
                    image={editModal.image}
                    projectId={editModal.projectId}
                    step={editStep}
                    setStep={setEditStep}
                    mode={editMode}
                    setMode={setEditMode}
                    params={editParams}
                    setParams={setEditParams}
                    mask={maskImage}
                    setMask={setMaskImage}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    preview={editPreview}
                    setPreview={setEditPreview}
                    furniture={furniture}
                    fetchCategories={fetchCategories}
                    refreshUser={refreshUser}
                    user={user}
                />
            )}

            {/* Dry Run Results Modal for Generation */}
            {genDryRunData && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0">
                            <h3 className="text-xl font-bold dark:text-white uppercase tracking-tight">Generation Payload Inspection</h3>
                            <button onClick={() => setGenDryRunData(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white"><X /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-sm">
                                <strong>Debug Mode:</strong> This matches exactly what would be sent to Google Gemini Flash for standard generation.
                            </div>

                            {genDryRunData.map((part, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Part {idx} ({typeof part === 'string' ? 'Text Instructions' : 'Image Content'})
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 font-mono text-xs leading-relaxed dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                        {typeof part === 'string' ? part : (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Image Data ({part.inlineData.mimeType})</span>
                                                    <span className="text-[10px] text-gray-500 uppercase">Binary Stream</span>
                                                </div>
                                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                                    <img
                                                        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                                        className="max-w-full max-h-full object-contain"
                                                        alt="Payload Part"
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-500 italic mt-2 opacity-50 truncate">
                                                    Raw Data: {part.inlineData.data.substring(0, 100)}...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0 flex justify-end">
                            <button
                                onClick={() => setGenDryRunData(null)}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;

// Image Viewer Modal (Reused from Styles/Furniture)
const ImageViewer = ({ open, url, onClose, onEdit }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white transition-colors p-2 pointer-events-auto"
                >
                    <X size={32} />
                </button>

                {/* Content */}
                <div className="relative pointer-events-auto flex flex-col items-center gap-6">
                    <img
                        src={url}
                        alt="Preview"
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-zoom-in"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition shadow-lg"
                        >
                            <Edit2 size={18} />
                            Edit Image
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Edit Wizard Component
const EditWizard = ({ isOpen, onClose, image, projectId, step, setStep, mode, setMode, params, setParams, mask, setMask, isEditing, setIsEditing, preview, setPreview, furniture, fetchCategories, refreshUser, user }) => {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [rect, setRect] = useState(null); // {x, y, w, h} (percentage or pixel relative to displayed image)
    const [imageDisplaySize, setImageDisplaySize] = useState({ w: 0, h: 0 }); // Captured in step 1
    const [currentRect, setCurrentRect] = useState(null); // rect while drawing
    const [furnitureFilter, setFurnitureFilter] = useState('all');
    const [selectedIndices, setSelectedIndices] = useState(new Set([0]));
    const [isDryRun, setIsDryRun] = useState(false);
    const [dryRunData, setDryRunData] = useState(null);
    const [isFurniturePickerOpen, setIsFurniturePickerOpen] = useState(false);

    // Canvas Draw Logic
    const getCoords = (e) => {
        const bounds = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const coords = getCoords(e);
        setStartPos(coords);
        setCurrentRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        const w = coords.x - startPos.x;
        const h = coords.y - startPos.y;
        setCurrentRect({ x: startPos.x, y: startPos.y, w, h });

        // Draw visual feedback
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.strokeStyle = '#4F46E5'; // Indigo-600
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
        ctx.fillRect(startPos.x, startPos.y, w, h);
        ctx.strokeRect(startPos.x, startPos.y, w, h);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        setRect(currentRect);
    };

    useEffect(() => {
        // Redraw rect if exists (e.g. after resize or step switch if we preserved it, though step switch unmounts usually)
        if (canvasRef.current && rect && !isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.strokeStyle = '#4F46E5';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    }, [rect, isDrawing]);

    // Set canvas size to match image
    const handleImageLoad = () => {
        if (!imgRef.current) return;
        const w = imgRef.current.clientWidth;
        const h = imgRef.current.clientHeight;
        setImageDisplaySize({ w, h });

        if (canvasRef.current) {
            canvasRef.current.width = w;
            canvasRef.current.height = h;
            if (rect) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.strokeStyle = '#4F46E5';
                ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(79, 70, 229, 0.2)'; // Ensure fill style is reapplied
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            }
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (step === 1 && imgRef.current) {
                handleImageLoad();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [step, rect]); // Re-bind if rect or step changes to ensure accuracy

    useEffect(() => {
        // Redraw on mode or image change
        if (imgRef.current && imgRef.current.complete) {
            handleImageLoad();
        }
    }, [mode, image]);

    // REMOVED rect reset on furnitureId change to fix the "Select Region" bug
    /*
    useEffect(() => {
        setRect(null);
    }, [params.furnitureId]);
    */

    useEffect(() => {
        if (mode === 'furniture') {
            // Wait for next tick to ensure canvas is in DOM
            const timer = setTimeout(handleImageLoad, 100);
            return () => clearTimeout(timer);
        }
    }, [mode, image]);

    useEffect(() => {
        window.addEventListener('resize', handleImageLoad);
        return () => window.removeEventListener('resize', handleImageLoad);
    }, []);

    const handleGenerate = async () => {
        // Validation
        if (mode === 'furniture') {
            if (!params.furnitureId) return alert('Please select a furniture item.');
            if (!rect) return alert('Please draw a box on the image where you want to place the furniture.');
        }

        if (user.credits < params.versions) return alert(t('projects.insufficientCredits'));

        setIsEditing(true);
        try {
            console.log("DEBUG EditWizard handleGenerate:", { mode, hasRect: !!rect, params });
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('originalImageFilename', image.filename);
            formData.append('mode', mode);
            formData.append('prompt', params.prompt);
            if (params.furnitureId) formData.append('furnitureId', params.furnitureId);
            formData.append('resolution', params.resolution);
            formData.append('versions', params.versions);
            if (isDryRun) formData.append('dryRun', 'true');

            if (mode === 'furniture' && rect && imgRef.current) {
                // Generate Mask Blob
                const offCanvas = document.createElement('canvas');
                const natW = imgRef.current.naturalWidth;
                const natH = imgRef.current.naturalHeight;
                offCanvas.width = natW;
                offCanvas.height = natH;
                const ctx = offCanvas.getContext('2d');

                // Fill Black
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, natW, natH);

                // Calc Scaled Rect
                // Use captured imageDisplaySize instead of live measurements (which might be 0 if hidden)
                const dispW = imageDisplaySize.w || imgRef.current.clientWidth;
                const dispH = imageDisplaySize.h || imgRef.current.clientHeight;

                if (!dispW || !dispH) {
                    console.error("ERROR: Could not determine image display size for mask scaling.");
                }

                const scaleX = natW / dispW;
                const scaleY = natH / dispH;

                const rX = (rect.w > 0 ? rect.x : rect.x + rect.w) * scaleX;
                const rY = (rect.h > 0 ? rect.y : rect.y + rect.h) * scaleY;
                const rW = Math.abs(rect.w) * scaleX;
                const rH = Math.abs(rect.h) * scaleY;

                ctx.fillStyle = 'white';
                ctx.fillRect(rX, rY, rW, rH);

                const blob = await new Promise(resolve => offCanvas.toBlob(resolve, 'image/png'));
                console.log("DEBUG Mask Blob generated:", {
                    size: blob.size,
                    type: blob.type,
                    natSize: { natW, natH },
                    dispSize: { dispW, dispH },
                    rect: { rX, rY, rW, rH }
                });
                // IMPORTANT: Append files LAST for some multipart parsers
                formData.append('mask', blob, 'mask.png');
            }

            const res = await axios.post('/api/projects/edit-image', formData);

            if (isDryRun) {
                setDryRunData(res.data.payload);
                setIsEditing(false);
                return;
            }

            setPreview({ ...res.data, projectId });
            setSelectedIndices(new Set([0]));
            setStep(3);
            refreshUser();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Generation failed');
        } finally {
            setIsEditing(false);
        }
    };

    const toggleSelection = (index) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                if (next.size > 1) next.delete(index);
                else next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleSave = async () => {
        try {
            if (selectedIndices.size === 0) return;
            const selectedFilenames = Array.from(selectedIndices).map(i => preview.images[i].filename);

            await axios.post('/api/projects/images/save', {
                projectId,
                filenames: selectedFilenames,
                cost: preview.cost || 0
            });

            // Cleanup
            const unusedFilenames = preview.images.filter((_, i) => !selectedIndices.has(i)).map(img => img.filename);
            if (unusedFilenames.length > 0) {
                axios.post('http://localhost:3000/api/projects/discard', { filenames: unusedFilenames }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).catch(err => console.error(err));
            }

            onClose();
            fetchCategories();
            refreshUser();
        } catch (err) {
            alert('Save failed');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-black">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10 sticky top-0">
                    <h3 className="text-xl font-bold dark:text-white">Edit Image</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white"><X /></button>
                </div>

                <div className="p-8 flex-1">
                    {/* Steps Indicator */}
                    <div className="flex items-center gap-2 mb-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-2 rounded-full flex-1 transition-colors ${step >= s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                    </div>

                    {/* Step 1 & 2 content with persistence for Refs */}
                    <div className={step === 1 ? "" : "hidden"}>
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Left: Image & Canvas */}
                            <div className="flex-1 relative flex items-start justify-center overflow-hidden">
                                <div className="relative inline-block max-w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                    <img
                                        ref={imgRef}
                                        src={`/api/projects/image/${image.filename}`}
                                        alt="Original"
                                        className="max-w-full h-auto select-none block"
                                        onLoad={handleImageLoad}
                                    />
                                    {mode === 'furniture' && (
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute inset-0 cursor-crosshair touch-none"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                        />
                                    )}
                                </div>
                                {mode === 'furniture' && !rect && (
                                    <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
                                        Draw a box where you want the furniture
                                    </div>
                                )}
                                {mode === 'furniture' && rect && (
                                    <button
                                        onClick={() => { setRect(null); handleImageLoad(); }}
                                        className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-lg"
                                    >
                                        Clear Selection
                                    </button>
                                )}
                            </div>

                            {/* Right: Controls */}
                            <div className="w-full md:w-1/3 space-y-6">
                                {/* Mode Tabs */}
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                    <button
                                        onClick={() => setMode('prompt')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${mode === 'prompt' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        Text Prompt
                                    </button>
                                    <button
                                        onClick={() => setMode('furniture')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${mode === 'furniture' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        Furniture
                                    </button>
                                </div>

                                {mode === 'prompt' ? (
                                    <div>
                                        <label className="block text-sm font-bold mb-2 dark:text-gray-300">Description</label>
                                        <textarea
                                            value={params.prompt}
                                            onChange={e => setParams({ ...params, prompt: e.target.value })}
                                            className="w-full p-4 rounded-xl border dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                            rows={6}
                                            placeholder="Describe what you want to change..."
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-bold dark:text-gray-300">Selected Furniture</label>
                                            <button
                                                onClick={() => setIsFurniturePickerOpen(true)}
                                                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-xs flex items-center gap-1"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {params.furnitureId ? (
                                            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                                                    {(() => {
                                                        const item = furniture.find(f => f.id === params.furnitureId);
                                                        return item?.images?.[0] ? (
                                                            <img src={`/api/furniture/image/${item.images[0].filename}`} className="w-full h-full object-cover" alt="" />
                                                        ) : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={20} /></div>;
                                                    })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-xs dark:text-white truncate">
                                                        {furniture.find(f => f.id === params.furnitureId)?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate">
                                                        {furniture.find(f => f.id === params.furnitureId)?.category?.name || 'Furniture'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsFurniturePickerOpen(true)}
                                                className="w-full p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex flex-col items-center gap-2"
                                            >
                                                <Box size={24} />
                                                <span className="text-xs font-bold">Select Furniture Item</span>
                                            </button>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Additional Instructions</label>
                                            <textarea
                                                value={params.prompt}
                                                onChange={e => setParams({ ...params, prompt: e.target.value })}
                                                className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:text-white dark:border-gray-700 text-sm"
                                                rows={3}
                                                placeholder="e.g. 'Match floor lighting'..."
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                                >
                                    Next: Settings
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={step === 2 ? "" : "hidden"}>
                        <div className="max-w-xl mx-auto space-y-8">
                            <h4 className="text-2xl font-bold text-center dark:text-white">Generation Settings</h4>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-gray-300">Resolution</label>
                                    <div className="flex gap-2">
                                        {['HD', '2K', '4K'].map(res => (
                                            <button
                                                key={res}
                                                onClick={() => setParams({ ...params, resolution: res })}
                                                className={`flex-1 p-3 rounded-xl border-2 font-bold ${params.resolution === res ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-gray-300">Versions</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 4].map(ver => (
                                            <button
                                                key={ver}
                                                onClick={() => setParams({ ...params, versions: ver })}
                                                className={`flex-1 p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${params.versions === ver ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                                            >
                                                <Layers size={18} />
                                                {ver}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dry Run Toggle */}
                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="dryRun"
                                    className="w-5 h-5 rounded accent-amber-600"
                                    checked={isDryRun}
                                    onChange={(e) => setIsDryRun(e.target.checked)}
                                />
                                <label htmlFor="dryRun" className="text-sm font-medium text-amber-800 dark:text-amber-400 cursor-pointer">
                                    <strong>Debug Mode:</strong> Show AI Payload instead of generating (No credits charged)
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Back</button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isEditing}
                                    className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isEditing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                    {isEditing ? 'Editing...' : 'Generate Edits'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {step === 3 && preview && (
                        <div className="space-y-6">
                            <h4 className="text-xl font-bold text-center dark:text-white">Edit Results</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                {preview.images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`relative rounded-3xl overflow-hidden shadow-xl border-4 transition-all ${selectedIndices.has(i) ? 'border-indigo-600' : 'border-transparent'}`}
                                        onClick={() => toggleSelection(i)}
                                    >
                                        <img src={img.url} className="w-full h-auto" />
                                        {selectedIndices.has(i) && (
                                            <div className="absolute top-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg"><Check /></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setStep(2)} className="px-8 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl font-bold">Try Again</button>
                                <button
                                    onClick={handleSave}
                                    disabled={selectedIndices.size === 0}
                                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                                >
                                    Save Selected ({selectedIndices.size})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Furniture Picker Modal */}
            {isFurniturePickerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10 sticky top-0">
                            <h3 className="text-lg font-bold dark:text-white">Select Furniture</h3>
                            <button onClick={() => setIsFurniturePickerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Filter Sidebar */}
                            <div className="w-full md:w-48 border-r border-gray-100 dark:border-gray-700 overflow-y-auto p-4 flex md:flex-col gap-2 bg-gray-50/50 dark:bg-gray-900/20">
                                <button
                                    onClick={() => setFurnitureFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-left text-sm transition-colors whitespace-nowrap ${furnitureFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >
                                    All Categories
                                </button>
                                {[...new Set(furniture.map(f => f.category?.name).filter(Boolean))].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFurnitureFilter(cat)}
                                        className={`px-4 py-2 rounded-lg text-left text-sm transition-colors whitespace-nowrap ${furnitureFilter === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            {/* Grid View */}
                            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {furniture
                                        .filter(f => furnitureFilter === 'all' || f.category?.name === furnitureFilter)
                                        .map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    setParams({ ...params, furnitureId: f.id });
                                                    setIsFurniturePickerOpen(false);
                                                }}
                                                className={`group relative aspect-square rounded-2xl border-2 overflow-hidden transition-all ${params.furnitureId === f.id ? 'border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300'}`}
                                            >
                                                {f.images?.[0] ? (
                                                    <img src={`/api/furniture/image/${f.images[0].filename}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-300">
                                                        <Box size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                                    <div className="text-white text-[11px] font-medium truncate">{f.name}</div>
                                                </div>
                                                {params.furnitureId === f.id && (
                                                    <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dry Run Results Modal */}
            {dryRunData && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0">
                            <h3 className="text-xl font-bold dark:text-white">AI Payload Inspection</h3>
                            <button onClick={() => setDryRunData(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white"><X /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-sm">
                                <strong>Dry Run Mode:</strong> This matches exactly what would be sent to Google Gemini Flash.
                            </div>

                            {dryRunData.map((part, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Part {idx} ({typeof part === 'string' ? 'Text Instructions' : 'Image Content'})
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 font-mono text-xs leading-relaxed dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                        {typeof part === 'string' ? part : (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Image Data ({part.inlineData.mimeType})</span>
                                                    <span className="text-[10px] text-gray-500 uppercase">Binary Stream</span>
                                                </div>
                                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                                    <img
                                                        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                                        className="max-w-full max-h-full object-contain"
                                                        alt="Payload Part"
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-500 italic mt-2 opacity-50 truncate">
                                                    Raw Data: {part.inlineData.data.substring(0, 100)}...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0 flex justify-end">
                            <button
                                onClick={() => setDryRunData(null)}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg"
                            >
                                Got it, proceed to edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
