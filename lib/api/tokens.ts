import api from './client';

export interface TokenContract {
    chainId: number;
    chainType: 'evm' | 'svm';
    address: string;
    isActive: boolean;
}

export interface Token {
    _id: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    contracts: TokenContract[];
    isActive: boolean;
    createdAt: string;
}

export interface CreateTokenDto {
    symbol: string;
    name: string;
    decimals?: number;
    logoURI?: string;
}

export interface AddContractDto {
    chainId: number;
    chainType: 'evm' | 'svm';
    address: string;
    isActive?: boolean;
}

export const tokenApi = {
    getAll: async () => {
        const response = await api.get<Token[]>('/tokens');
        return response.data;
    },

    create: async (data: CreateTokenDto) => {
        const response = await api.post<Token>('/tokens', data);
        return response.data;
    },

    addContract: async (symbol: string, data: AddContractDto) => {
        const response = await api.post<Token>(`/tokens/${symbol}/contracts`, data);
        return response.data;
    },
};
