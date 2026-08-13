import apiClient from './client';

/**
 * Marketing campaign banners.
 *
 * Banner content lives in a JSON file on S3, not in the database — the
 * backend re-reads it about every 5 minutes. Refreshing forces that
 * re-read immediately, so a content change goes live without waiting.
 */
/** A banner plus why it is or isn't being served. */
export interface AdminBanner {
    id: string;
    title: string;
    badgeText?: string | null;
    imageUrl: string;
    startDate?: string | null;
    endDate?: string | null;
    durationDays?: number | null;
    showProgress?: boolean;
    cta?: boolean;
    actionType?: string | null;
    actionUrl?: string | null;
    /** active = live now; scheduled = starts later; expired = finished; invalid = malformed entry. */
    state: 'active' | 'scheduled' | 'expired' | 'invalid';
}

export interface AdminBannersResponse {
    version: string | null;
    updatedAt: string | null;
    banners: AdminBanner[];
}

export const campaignsApi = {
    list: async (): Promise<AdminBannersResponse> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<{ data: AdminBannersResponse }>(
            '/campaigns/admin/banners',
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data.data;
    },

    refresh: async (): Promise<{ refreshed: boolean }> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<{ refreshed: boolean }>(
            '/campaigns/refresh',
            {},
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },
};
