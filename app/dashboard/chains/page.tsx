'use client';

import { useState, useEffect } from 'react';
import {
    Link as LinkIcon,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    ExternalLink,
} from 'lucide-react';
import { chainApi, type ChainConfiguration, type CreateChainDto } from '@/lib/api/chains';
import { toast } from 'sonner';

export default function ChainsPage() {
    const [chains, setChains] = useState<ChainConfiguration[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingChain, setEditingChain] = useState<ChainConfiguration | null>(null);
    const [chainType, setChainType] = useState<'evm' | 'svm'>('evm');

    // Default form states
    const defaultEvm = {
        chainId: 11155111,
        name: '',
        symbol: 'ETH',
        rpcUrl: '',
        explorerUrl: '',
        zerodev: {
            projectId: '',
            bundlerUrl: '',
            paymasterUrl: '',
        },
        isTestnet: true,
        rpId: '',
    };

    const defaultSvm = {
        network: 'devnet' as const,
        name: '',
        symbol: 'SOL',
        rpcUrl: '',
        explorerUrl: '',
        lazorkit: {
            portalUrl: 'https://api.lazorkit.com',
            paymasterUrl: 'https://api.lazorkit.com/paymaster',
        },
        isTestnet: true,
    };

    const [formData, setFormData] = useState<CreateChainDto>({
        type: 'evm',
        isPrimary: false,
        isActive: true,
        order: 0,
        evm: defaultEvm,
    });

    useEffect(() => {
        fetchChains();
    }, []);

    const fetchChains = async () => {
        try {
            const data = await chainApi.getAll();
            setChains(data);
        } catch (error) {
            toast.error('Failed to load chains');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (chain?: ChainConfiguration) => {
        if (chain) {
            setEditingChain(chain);
            setChainType(chain.type);
            setFormData({
                type: chain.type,
                isPrimary: chain.isPrimary,
                isActive: chain.isActive,
                order: chain.order,
                evm: chain.evm || defaultEvm,
                svm: chain.svm || defaultSvm,
            });
        } else {
            setEditingChain(null);
            setChainType('evm');
            setFormData({
                type: 'evm',
                isPrimary: false,
                isActive: true,
                order: chains.length,
                evm: defaultEvm,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingChain(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clean up data based on type
        const submitData = { ...formData, type: chainType };
        if (chainType === 'evm') delete submitData.svm;
        if (chainType === 'svm') delete submitData.evm;

        try {
            if (editingChain) {
                await chainApi.update(editingChain._id, submitData);
                toast.success('Chain updated successfully');
            } else {
                await chainApi.create(submitData);
                toast.success('Chain created successfully');
            }
            fetchChains();
            handleCloseModal();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save chain');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await chainApi.delete(id);
            toast.success('Chain deleted successfully');
            fetchChains();
        } catch (error) {
            toast.error('Failed to delete chain');
        }
    };

    const updateEvmField = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            evm: { ...prev.evm!, [field]: value }
        }));
    };

    const updateSvmField = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            svm: { ...prev.svm!, [field]: value }
        }));
    };

    const updateZeroDev = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            evm: {
                ...prev.evm!,
                zerodev: { ...prev.evm!.zerodev, [field]: value }
            }
        }));
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Chain Management</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Configure blockchain networks (EVM & SVM)
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Chain
                </button>
            </div>

            {/* Chains List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {loading ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-600">Loading...</p>
                    </div>
                ) : chains.length === 0 ? (
                    <div className="p-12 text-center">
                        <LinkIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">
                            No Chains Configured
                        </p>
                        <p className="text-sm text-slate-600">
                            Add a chain to enable wallet generation
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Chain ID / Network</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Symbol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {chains.map((chain) => {
                                    const details = chain.type === 'evm' ? chain.evm : chain.svm;
                                    return (
                                        <tr key={chain._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${chain.type === 'evm' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {chain.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900">{details?.name}</span>
                                                    {chain.isPrimary && (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {chain.type === 'evm' ? chain.evm?.chainId : chain.svm?.network}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {details?.symbol}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    {chain.isActive ? (
                                                        <>
                                                            <Eye className="h-4 w-4 text-emerald-600" />
                                                            <span className="text-sm text-emerald-600">Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-4 w-4 text-slate-400" />
                                                            <span className="text-sm text-slate-400">Inactive</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(chain)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(chain._id, details?.name || 'Chain')}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingChain ? 'Edit Chain' : 'Add Chain'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* General Settings */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Chain Type</label>
                                    <select
                                        value={chainType}
                                        onChange={(e) => setChainType(e.target.value as 'evm' | 'svm')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        disabled={!!editingChain}
                                    >
                                        <option value="evm">EVM (Ethereum Compatible)</option>
                                        <option value="svm">SVM (Solana Compatible)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPrimary}
                                        onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Primary Chain</span>
                                </label>
                            </div>

                            {/* EVM Fields */}
                            {chainType === 'evm' && (
                                <div className="space-y-4 border-t border-slate-200 pt-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">EVM Configuration</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Chain Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.evm?.name}
                                                onChange={(e) => updateEvmField('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Chain ID</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.evm?.chainId}
                                                onChange={(e) => updateEvmField('chainId', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.evm?.symbol}
                                                onChange={(e) => updateEvmField('symbol', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">RPC URL</label>
                                            <input
                                                type="url"
                                                required
                                                value={formData.evm?.rpcUrl}
                                                onChange={(e) => updateEvmField('rpcUrl', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Explorer URL</label>
                                        <input
                                            type="url"
                                            value={formData.evm?.explorerUrl}
                                            onChange={(e) => updateEvmField('explorerUrl', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                                        <h4 className="text-xs font-semibold text-blue-800 uppercase">ZeroDev Settings</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-blue-900 mb-1">Project ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.evm?.zerodev.projectId}
                                                    onChange={(e) => updateZeroDev('projectId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-blue-900 mb-1">Bundler URL (Auto-generated if empty)</label>
                                                <input
                                                    type="url"
                                                    value={formData.evm?.zerodev.bundlerUrl}
                                                    onChange={(e) => updateZeroDev('bundlerUrl', e.target.value)}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900"
                                                    placeholder="Leave empty to use default"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SVM Fields */}
                            {chainType === 'svm' && (
                                <div className="space-y-4 border-t border-slate-200 pt-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">SVM Configuration</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Chain Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.svm?.name}
                                                onChange={(e) => updateSvmField('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                                            <select
                                                value={formData.svm?.network}
                                                onChange={(e) => updateSvmField('network', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            >
                                                <option value="devnet">Devnet</option>
                                                <option value="testnet">Testnet</option>
                                                <option value="mainnet-beta">Mainnet Beta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.svm?.symbol}
                                                onChange={(e) => updateSvmField('symbol', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">RPC URL</label>
                                            <input
                                                type="url"
                                                required
                                                value={formData.svm?.rpcUrl}
                                                onChange={(e) => updateSvmField('rpcUrl', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Explorer URL</label>
                                        <input
                                            type="url"
                                            value={formData.svm?.explorerUrl}
                                            onChange={(e) => updateSvmField('explorerUrl', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    {editingChain ? 'Update Chain' : 'Add Chain'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
