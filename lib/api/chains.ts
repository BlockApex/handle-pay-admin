import apiClient from './client';

export interface ChainConfiguration {
    _id: string; // Using _id as default Mongoose ID
    type: 'evm' | 'svm';
    evm?: {
        chainId: number;
        name: string;
        symbol: string;
        rpcUrl: string;
        explorerUrl: string;
        zerodev: {
            projectId: string;
            bundlerUrl: string;
            paymasterUrl: string;
        };
        isTestnet: boolean;
        rpId?: string;
    };
    svm?: {
        network: 'devnet' | 'testnet' | 'mainnet-beta';
        name: string;
        symbol: string;
        rpcUrl: string;
        explorerUrl: string;
        lazorkit: {
            portalUrl: string;
            paymasterUrl: string;
        };
        isTestnet: boolean;
    };
    isPrimary: boolean;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export type CreateChainDto = Partial<ChainConfiguration>;
export type UpdateChainDto = Partial<ChainConfiguration>;

export const chainApi = {
    // Get all chains (admin)
    getAll: async (): Promise<ChainConfiguration[]> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<ChainConfiguration[]>('/admin/chains', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Get chain by ID
    getById: async (id: string): Promise<ChainConfiguration> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<ChainConfiguration>(`/admin/chains/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Create chain
    create: async (data: CreateChainDto): Promise<ChainConfiguration> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<ChainConfiguration>('/admin/chains', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Update chain
    update: async (id: string, data: UpdateChainDto): Promise<ChainConfiguration> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<ChainConfiguration>(`/admin/chains/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Delete chain
    delete: async (id: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.delete(`/admin/chains/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};
