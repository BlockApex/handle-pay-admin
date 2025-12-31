import apiClient from './client';

export interface Admin {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    mfaEnabled: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export interface InviteAdminRequest {
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'admin' | 'support' | 'viewer';
    permissions?: string[];
}

export interface UpdateAdminRequest {
    firstName?: string;
    lastName?: string;
    role?: string;
    permissions?: string[];
    isActive?: boolean;
}

export const adminsApi = {
    list: async (): Promise<Admin[]> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<Admin[]>('/admin/auth/users', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    getById: async (id: string): Promise<Admin> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<Admin>(`/admin/auth/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    invite: async (data: InviteAdminRequest): Promise<{ inviteToken: string }> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<{ inviteToken: string }>(
            '/admin/auth/users/invite',
            data,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    },

    update: async (id: string, data: UpdateAdminRequest): Promise<Admin> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<Admin>(`/admin/auth/users/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    deactivate: async (id: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.post(
            `/admin/auth/users/${id}/deactivate`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    },
};
