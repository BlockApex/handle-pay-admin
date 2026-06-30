'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Settings as SettingsIcon,
    Plus,
    Edit2,
    Trash2,
    Star,
    Eye,
    EyeOff,
    RefreshCw,
    Save,
    Palette,
    Image as ImageIcon,
} from 'lucide-react';
import { usecaseApi, type Usecase, type CreateUsecaseDto, type UpdateUsecaseDto } from '@/lib/api/usecases';
import { avatarApi, type CuratedAvatar } from '@/lib/api/avatars';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function SettingsPage() {
    // ── Usecase state ───────────────────────────────────────────
    const [usecases, setUsecases] = useState<Usecase[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUsecase, setEditingUsecase] = useState<Usecase | null>(null);
    const [formData, setFormData] = useState<CreateUsecaseDto>({
        name: '',
        description: '',
        icon: '',
        order: 0,
        isRecommended: false,
        isActive: true,
    });

    // ── Avatar state ────────────────────────────────────────────
    const [styles, setStyles] = useState<string[]>([]);
    const [curatedAvatars, setCuratedAvatars] = useState<CuratedAvatar[]>([]);
    const [avatarsLoading, setAvatarsLoading] = useState(true);

    // Playground state
    const [selectedStyle, setSelectedStyle] = useState('adventurer');
    const [seed, setSeed] = useState('');
    const [bgColor, setBgColor] = useState('b6e3f4');
    const [previewSvg, setPreviewSvg] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [avatarLabel, setAvatarLabel] = useState('');

    useEffect(() => {
        fetchUsecases();
        fetchStyles();
        fetchCuratedAvatars();
    }, []);

    // Auto-preview on any playground change
    useEffect(() => {
        if (!selectedStyle) return;
        const currentSeed = seed || generateRandomSeed();
        if (!seed) {
            setSeed(currentSeed);
            return; // will re-trigger via seed change
        }
        const timer = setTimeout(() => {
            (async () => {
                setPreviewLoading(true);
                try {
                    const options: Record<string, any> = {};
                    if (bgColor && bgColor !== 'transparent') options.backgroundColor = [bgColor];
                    const svg = await avatarApi.preview(selectedStyle, currentSeed, options);
                    setPreviewSvg(svg);
                } catch (err) {
                    // silent — don't toast on every keystroke
                } finally {
                    setPreviewLoading(false);
                }
            })();
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedStyle, seed, bgColor]);

    // ── Usecase methods ─────────────────────────────────────────

    const fetchUsecases = async () => {
        try {
            const data = await usecaseApi.getAll();
            setUsecases(data);
        } catch (error) {
            toast.error('Failed to load usecases');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (usecase?: Usecase) => {
        if (usecase) {
            setEditingUsecase(usecase);
            setFormData({
                name: usecase.name,
                description: usecase.description || '',
                icon: usecase.icon,
                order: usecase.order,
                isRecommended: usecase.isRecommended,
                isActive: usecase.isActive,
            });
        } else {
            setEditingUsecase(null);
            setFormData({
                name: '',
                description: '',
                icon: '',
                order: usecases.length,
                isRecommended: false,
                isActive: true,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUsecase(null);
        setFormData({
            name: '',
            description: '',
            icon: '',
            order: 0,
            isRecommended: false,
            isActive: true,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUsecase) {
                await usecaseApi.update(editingUsecase.id, formData);
                toast.success('Usecase updated successfully');
            } else {
                await usecaseApi.create(formData);
                toast.success('Usecase created successfully');
            }
            fetchUsecases();
            handleCloseModal();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save usecase');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await usecaseApi.delete(id);
            toast.success('Usecase deleted successfully');
            fetchUsecases();
        } catch (error) {
            toast.error('Failed to delete usecase');
        }
    };

    // ── Avatar methods ──────────────────────────────────────────

    const fetchStyles = async () => {
        try {
            const data = await avatarApi.getStyles();
            setStyles(data);
        } catch (error) {
            console.error('Failed to load styles');
        }
    };

    const fetchCuratedAvatars = async () => {
        setAvatarsLoading(true);
        try {
            const data = await avatarApi.getAll();
            setCuratedAvatars(data);
        } catch (error) {
            console.error('Failed to load curated avatars');
        } finally {
            setAvatarsLoading(false);
        }
    };

    const generateRandomSeed = () => {
        const words = ['cat', 'dog', 'bird', 'fox', 'bear', 'lion', 'wolf', 'owl', 'fish', 'star', 'moon', 'sun', 'fire', 'ice', 'rock', 'leaf', 'wave', 'wind', 'bolt', 'gem'];
        const adjs = ['happy', 'cool', 'wild', 'calm', 'brave', 'swift', 'dark', 'gold', 'blue', 'red', 'neon', 'zen', 'epic', 'mega', 'tiny'];
        const adj = adjs[Math.floor(Math.random() * adjs.length)];
        const word = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(Math.random() * 100);
        return `${adj}-${word}-${num}`;
    };

    const handlePreview = useCallback(async () => {
        if (!selectedStyle) return;
        const currentSeed = seed || generateRandomSeed();
        if (!seed) setSeed(currentSeed);

        setPreviewLoading(true);
        try {
            const options: Record<string, any> = {};
            if (bgColor) options.backgroundColor = [bgColor];

            const svg = await avatarApi.preview(selectedStyle, currentSeed, options);
            setPreviewSvg(svg);
        } catch (error) {
            toast.error('Failed to generate preview');
        } finally {
            setPreviewLoading(false);
        }
    }, [selectedStyle, seed, bgColor]);

    const handleRandomize = () => {
        setSeed(generateRandomSeed());
        // Auto-preview after seed change
        setTimeout(() => handlePreview(), 50);
    };

    const handleSaveAvatar = async () => {
        if (!previewSvg) {
            toast.error('Generate a preview first');
            return;
        }
        setSavingAvatar(true);
        try {
            const options: Record<string, any> = {};
            if (bgColor) options.backgroundColor = [bgColor];

            await avatarApi.save({
                style: selectedStyle,
                seed: seed,
                options,
                label: avatarLabel || undefined,
            });
            toast.success('Avatar saved to curated list!');
            setAvatarLabel('');
            fetchCuratedAvatars();
        } catch (error) {
            toast.error('Failed to save avatar');
        } finally {
            setSavingAvatar(false);
        }
    };

    const handleDeleteAvatar = async (id: string) => {
        if (!confirm('Remove this avatar from the curated list?')) return;
        try {
            await avatarApi.delete(id);
            toast.success('Avatar removed');
            fetchCuratedAvatars();
        } catch (error) {
            toast.error('Failed to delete avatar');
        }
    };

    // Friendly display name for style
    const styleDisplayName = (s: string) =>
        s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

    // Background color presets
    const bgPresets = [
        { color: 'b6e3f4', label: 'Sky' },
        { color: 'c0aede', label: 'Lilac' },
        { color: 'd1d4f9', label: 'Lavender' },
        { color: 'ffd5dc', label: 'Blush' },
        { color: 'ffdfbf', label: 'Peach' },
        { color: 'c8f7c5', label: 'Mint' },
        { color: 'f9e79f', label: 'Lemon' },
        { color: 'e0e0e0', label: 'Silver' },
        { color: 'transparent', label: 'None' },
    ];

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Manage onboarding usecases, avatars, and application settings
                    </p>
                </div>
            </div>

            {/* ═══ Usecases Section ═══ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Onboarding Usecases
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Manage usecases shown during user onboarding
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Usecase
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-600">Loading...</p>
                    </div>
                ) : usecases.length === 0 ? (
                    <div className="p-12 text-center">
                        <SettingsIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">
                            No Usecases Yet
                        </p>
                        <p className="text-sm text-slate-600">
                            Create your first usecase to get started
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Icon</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {usecases.map((usecase) => (
                                    <tr key={usecase.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-2xl">{usecase.icon}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{usecase.name}</span>
                                                {usecase.isRecommended && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-sm text-slate-600">{usecase.description || '-'}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-slate-900">{usecase.order}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                {usecase.isActive ? (
                                                    <><Eye className="h-4 w-4 text-green-600" /><span className="text-sm text-green-600">Active</span></>
                                                ) : (
                                                    <><EyeOff className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-400">Inactive</span></>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button onClick={() => handleOpenModal(usecase)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 className="h-3.5 w-3.5" /> Edit
                                            </button>
                                            <button onClick={() => handleDelete(usecase.id, usecase.name)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ═══ Avatar Playground Section ═══ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Avatar Playground</h2>
                            <p className="text-sm text-slate-600 mt-0.5">
                                Generate and curate avatars for users to select
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Controls */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Style selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                                <div className="flex flex-wrap gap-2">
                                    {styles.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setSelectedStyle(s); setPreviewSvg(null); }}
                                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                                selectedStyle === s
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                                            }`}
                                        >
                                            {styleDisplayName(s)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Seed input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Seed</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        placeholder="e.g. happy-cat-42"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={handleRandomize}
                                        className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                                        title="Randomize"
                                    >
                                        <RefreshCw className="h-4 w-4 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* BG color */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {bgPresets.map((p) => (
                                        <button
                                            key={p.color}
                                            onClick={() => setBgColor(p.color)}
                                            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition ${
                                                bgColor === p.color
                                                    ? 'border-purple-500'
                                                    : 'border-transparent hover:border-slate-200'
                                            }`}
                                            title={p.label}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-full border border-slate-200"
                                                style={{
                                                    backgroundColor: p.color === 'transparent' ? 'transparent' : `#${p.color}`,
                                                    backgroundImage: p.color === 'transparent'
                                                        ? 'repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%)'
                                                        : undefined,
                                                    backgroundSize: p.color === 'transparent' ? '8px 8px' : undefined,
                                                }}
                                            />
                                            <span className="text-[10px] text-slate-500">{p.label}</span>
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <span className="text-xs text-slate-500">Custom:</span>
                                        <input
                                            type="text"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value.replace('#', ''))}
                                            className="w-20 px-2 py-1 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            placeholder="hex..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Label (optional)</label>
                                <input
                                    type="text"
                                    value={avatarLabel}
                                    onChange={(e) => setAvatarLabel(e.target.value)}
                                    placeholder="e.g. Cool Cat"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handlePreview}
                                    disabled={previewLoading}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    {previewLoading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    Generate Preview
                                </button>
                                <button
                                    onClick={handleSaveAvatar}
                                    disabled={!previewSvg || savingAvatar}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingAvatar ? 'Saving...' : 'Save to List'}
                                </button>
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-medium text-slate-700 mb-3">Preview</p>
                            <div
                                className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50"
                                style={{ position: 'relative' }}
                            >
                                {previewSvg ? (
                                    <div
                                        className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                        dangerouslySetInnerHTML={{ __html: previewSvg }}
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">Select a style</p>
                                    </div>
                                )}
                            </div>
                            {previewSvg && (
                                <p className="mt-2 text-xs text-slate-400 text-center">
                                    {styleDisplayName(selectedStyle)} · {seed}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Curated Avatars Grid ═══ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Curated Avatars ({curatedAvatars.length})
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Avatars available for users to select
                    </p>
                </div>

                {avatarsLoading ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-600">Loading...</p>
                    </div>
                ) : curatedAvatars.length === 0 ? (
                    <div className="p-12 text-center">
                        <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">No Curated Avatars Yet</p>
                        <p className="text-sm text-slate-600">Use the playground above to generate and save avatars</p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {curatedAvatars.map((avatar) => (
                                <div key={avatar._id} className="group relative">
                                    <div className={`aspect-square rounded-xl border overflow-hidden ${
                                        avatar.isActive ? 'border-slate-200' : 'border-red-200 opacity-50'
                                    }`}>
                                        <img
                                            src={`${API_BASE}${avatar.svgUrl}`}
                                            alt={avatar.label || avatar.seed}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-500 text-center truncate">
                                        {avatar.label || avatar.seed}
                                    </p>
                                    <p className="text-[9px] text-slate-400 text-center">
                                        {styleDisplayName(avatar.style)}
                                    </p>
                                    {/* Delete overlay */}
                                    <button
                                        onClick={() => handleDeleteAvatar(avatar._id)}
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full transition-opacity shadow-sm"
                                        title="Remove"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                    {!avatar.isActive && (
                                        <span className="absolute top-1 left-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Usecase Modal ═══ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingUsecase ? 'Edit Usecase' : 'Create Usecase'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input type="text" required value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="e.g., Personal Finance"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="Brief description" rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Icon (Emoji) *</label>
                                <input type="text" required value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="💰"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                                <input type="number" min="0" value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isRecommended}
                                        onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Recommended</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Active</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    {editingUsecase ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
