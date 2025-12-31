'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, UserX, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminsApi, type Admin } from '@/lib/api/admins';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteAdminSchema, type InviteAdminFormData } from '@/lib/validators/schemas';
import { formatDateTime, getInitials } from '@/lib/utils';

export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<InviteAdminFormData>({
        resolver: zodResolver(inviteAdminSchema),
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const data = await adminsApi.list();
            setAdmins(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load admins');
        } finally {
            setIsLoading(false);
        }
    };

    const onInvite = async (data: InviteAdminFormData) => {
        setIsInviting(true);
        try {
            await adminsApi.invite(data);
            toast.success('Admin invited successfully!');
            setShowInviteDialog(false);
            reset();
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to invite admin');
        } finally {
            setIsInviting(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this admin?')) return;

        try {
            await adminsApi.deactivate(id);
            toast.success('Admin deactivated');
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to deactivate admin');
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
                    <p className="text-slate-600 mt-2">Manage admin access and permissions</p>
                </div>

                <button
                    onClick={() => setShowInviteDialog(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Invite Admin
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Admin</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">MFA</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Last Login</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                                                    {getInitials(admin.firstName, admin.lastName)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {admin.firstName} {admin.lastName}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{admin.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 capitalize">
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.mfaEnabled
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {admin.mfaEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700">
                                                {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : 'Never'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeactivate(admin.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                <UserX className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredAdmins.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-slate-500">No admins found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Invite Dialog */}
            {showInviteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Invite Admin</h2>
                        </div>

                        <form onSubmit={handleSubmit(onInvite)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        {...register('firstName')}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                                        disabled={isInviting}
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        {...register('lastName')}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                                        disabled={isInviting}
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                                    disabled={isInviting}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Role
                                </label>
                                <select
                                    {...register('role')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                                    disabled={isInviting}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="support">Support</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteDialog(false);
                                        reset();
                                    }}
                                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                                    disabled={isInviting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center"
                                >
                                    {isInviting ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            Inviting...
                                        </>
                                    ) : (
                                        'Send Invite'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
