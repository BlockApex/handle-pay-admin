import apiClient from './client';

export interface WaitlistEntry {
    id: string;
    email: string;
    status: 'pending' | 'contacted' | 'approved' | 'rejected';
    notes?: string;
    contactedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WaitlistStats {
    total: number;
    pending: number;
    contacted: number;
    approved: number;
    rejected: number;
}

export interface WaitlistListResponse {
    data: WaitlistEntry[];
    total: number;
    page: number;
    totalPages: number;
}

export interface UpdateWaitlistRequest {
    status?: 'pending' | 'contacted' | 'approved' | 'rejected';
    notes?: string;
}

export const waitlistApi = {
    list: async (page: number = 1, limit: number = 50, status?: string): Promise<WaitlistListResponse> => {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (status) {
            params.append('status', status);
        }

        const response = await apiClient.get<WaitlistListResponse>(`/waitlist/admin?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    getStats: async (): Promise<WaitlistStats> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<WaitlistStats>('/waitlist/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    getById: async (id: string): Promise<WaitlistEntry> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<WaitlistEntry>(`/waitlist/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    update: async (id: string, data: UpdateWaitlistRequest): Promise<WaitlistEntry> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<WaitlistEntry>(`/waitlist/admin/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.delete(`/waitlist/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};
