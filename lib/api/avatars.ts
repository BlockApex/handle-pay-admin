import apiClient from './client';

export interface CuratedAvatar {
    _id: string;
    style: string;
    seed: string;
    options: Record<string, any>;
    label?: string;
    isActive: boolean;
    svgUrl: string;
}

export const avatarApi = {
    /** List available DiceBear styles */
    getStyles: async (): Promise<string[]> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<string[]>('/avatar/admin/styles', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Generate preview SVG (returns SVG string) */
    preview: async (style: string, seed: string, options: Record<string, any> = {}): Promise<string> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post('/avatar/admin/preview', { style, seed, options }, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'text',
        });
        return response.data;
    },

    /** List all curated avatars (admin view — includes inactive) */
    getAll: async (): Promise<CuratedAvatar[]> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<CuratedAvatar[]>('/avatar/admin/curated', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Save a curated avatar */
    save: async (data: { style: string; seed: string; options?: Record<string, any>; label?: string }): Promise<CuratedAvatar> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<CuratedAvatar>('/avatar/admin/curated', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Delete (soft-delete) a curated avatar */
    delete: async (id: string): Promise<void> => {
        const token = localStorage.getItem('accessToken');
        await apiClient.delete(`/avatar/admin/curated/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};
