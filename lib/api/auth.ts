import apiClient from './client';

export interface AdminLoginRequest {
    email: string;
    password: string;
    mfaCode?: string;
}

export interface AdminLoginResponse {
    accessToken: string;
    refreshToken: string;
    mfaRequired?: boolean;
    tempToken?: string;
    admin: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        mfaEnabled: boolean;
    };
}

export interface SetupMFAResponse {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}

export const authApi = {
    login: async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<AdminLoginResponse>('/admin/auth/login', data, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
    },

    setupMFA: async (): Promise<SetupMFAResponse> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<SetupMFAResponse>(
            '/admin/auth/mfa/setup',
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    },

    verifyMFA: async (mfaCode: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.post(
            '/admin/auth/mfa/verify',
            { mfaCode },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    },

    getProfile: async () => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get('/admin/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    logout: async (): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.post(
            '/admin/auth/logout',
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    },

    acceptInvite: async (token: string, password: string): Promise<void> => {
        await apiClient.post('/admin/auth/invite/accept', { token, password });
    },
};
