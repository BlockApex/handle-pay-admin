'use client';

import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Plus,
    Edit2,
    Trash2,
    Star,
    Eye,
    EyeOff,
} from 'lucide-react';
import { usecaseApi, type Usecase, type CreateUsecaseDto, type UpdateUsecaseDto } from '@/lib/api/usecases';
import { toast } from 'sonner';

export default function SettingsPage() {
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

    useEffect(() => {
        fetchUsecases();
    }, []);

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

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Manage onboarding usecases and application settings
                    </p>
                </div>
            </div>

            {/* Usecases Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Icon
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {usecases.map((usecase) => (
                                    <tr key={usecase.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl">{usecase.icon}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">
                                                    {usecase.name}
                                                </span>
                                                {usecase.isRecommended && (
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">
                                                {usecase.description || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-900">
                                                {usecase.order}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                {usecase.isActive ? (
                                                    <>
                                                        <Eye className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm text-green-600">
                                                            Active
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="h-4 w-4 text-slate-400" />
                                                        <span className="text-sm text-slate-400">
                                                            Inactive
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(usecase)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(usecase.id, usecase.name)
                                                }
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="e.g., Personal Finance"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="Brief description"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Icon (Emoji) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.icon}
                                    onChange={(e) =>
                                        setFormData({ ...formData, icon: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    placeholder="💰"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.order}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            order: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecommended}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                isRecommended: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Recommended</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                isActive: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
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
