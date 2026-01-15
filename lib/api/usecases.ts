import apiClient from './client';

export interface Usecase {
    id: string;
    name: string;
    description?: string;
    icon: string;
    order: number;
    isActive: boolean;
    isRecommended: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUsecaseDto {
    name: string;
    description?: string;
    icon: string;
    order?: number;
    isRecommended?: boolean;
    isActive?: boolean;
}

export interface UpdateUsecaseDto {
    name?: string;
    description?: string;
    icon?: string;
    order?: number;
    isRecommended?: boolean;
    isActive?: boolean;
}

export const usecaseApi = {
    // Get all usecases (admin)
    getAll: async (): Promise<Usecase[]> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<Usecase[]>('/onboarding/admin/usecases', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Get usecase by ID
    getById: async (id: string): Promise<Usecase> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<Usecase>(`/onboarding/admin/usecases/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Create usecase
    create: async (data: CreateUsecaseDto): Promise<Usecase> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<Usecase>('/onboarding/admin/usecases', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Update usecase
    update: async (id: string, data: UpdateUsecaseDto): Promise<Usecase> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<Usecase>(`/onboarding/admin/usecases/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Delete usecase
    delete: async (id: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.delete(`/onboarding/admin/usecases/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};
