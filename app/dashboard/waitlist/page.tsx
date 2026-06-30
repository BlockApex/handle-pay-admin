'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Edit, Trash2, Users, UserCheck, UserPlus, UserX, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { waitlistApi, type WaitlistEntry, type WaitlistStats } from '@/lib/api/waitlist';
import { formatDateTime } from '@/lib/utils';

export default function WaitlistPage() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [stats, setStats] = useState<WaitlistStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
    const [editStatus, setEditStatus] = useState<string>('');
    const [editNotes, setEditNotes] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentPage, statusFilter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [listData, statsData] = await Promise.all([
                waitlistApi.list(currentPage, 50, statusFilter || undefined),
                waitlistApi.getStats(),
            ]);
            setEntries(listData.data);
            setTotalPages(listData.totalPages);
            setStats(statsData);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load waitlist data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (entry: WaitlistEntry) => {
        setSelectedEntry(entry);
        setEditStatus(entry.status);
        setEditNotes(entry.notes || '');
        setShowEditDialog(true);
    };

    const handleUpdate = async () => {
        if (!selectedEntry) return;

        setIsUpdating(true);
        try {
            await waitlistApi.update(selectedEntry.id, {
                status: editStatus as any,
                notes: editNotes,
            });
            toast.success('Waitlist entry updated successfully!');
            setShowEditDialog(false);
            setSelectedEntry(null);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update entry');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete ${email} from the waitlist?`)) return;

        try {
            await waitlistApi.remove(id);
            toast.success('Waitlist entry deleted');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete entry');
        }
    };

    const filteredEntries = entries.filter(entry =>
        entry.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800';
            case 'contacted':
                return 'bg-blue-100 text-blue-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Waitlist Management</h1>
                <p className="text-slate-600 mt-2">Manage and track waitlist entries</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                            </div>
                            <Users className="h-8 w-8 text-slate-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Pending</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                            </div>
                            <Mail className="h-8 w-8 text-amber-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Contacted</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.contacted}</p>
                            </div>
                            <UserPlus className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                            </div>
                            <UserX className="h-8 w-8 text-red-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 bg-white"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Notes</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Contacted At</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Created At</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                                                        {entry.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="ml-3 text-sm font-medium text-slate-900">{entry.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                                                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700 max-w-xs truncate block" title={entry.notes}>
                                                    {entry.notes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700">
                                                    {entry.contactedAt ? formatDateTime(entry.contactedAt) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-700">
                                                    {formatDateTime(entry.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id, entry.email)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredEntries.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">No waitlist entries found</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Dialog */}
            {showEditDialog && selectedEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Edit Waitlist Entry</h2>
                            <p className="text-sm text-slate-600 mt-1">{selectedEntry.email}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                                    disabled={isUpdating}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="Add notes about this entry..."
                                    disabled={isUpdating}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditDialog(false);
                                        setSelectedEntry(null);
                                    }}
                                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Entry'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
