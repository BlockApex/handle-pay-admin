import apiClient from './client';

/**
 * App feature flags — the remotely-toggleable switches the mobile app
 * reads on launch (GET /features). A change reaches every app within
 * the backend's ~30s read cache.
 *
 * Flags are allowlist-style server-side: a flag that has never been set
 * reads as OFF, so a fresh environment shows nothing until an admin
 * turns it on here.
 */
export interface AppFeatures {
    /** Guest-mode CTA on the app's pre-login screen. */
    guestModeCta: boolean;
    /**
     * Master switch for the home-screen marketing banner. Off means
     * /campaigns/active-banner serves nothing, regardless of the
     * campaign content published to S3.
     */
    marketingBanner: boolean;
    /** Admin who last changed the flags. */
    updatedBy: string | null;
    updatedAt: string;
}

export interface UpdateFeaturesRequest {
    guestModeCta?: boolean;
    marketingBanner?: boolean;
}

export const featuresApi = {
    get: async (): Promise<AppFeatures> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<AppFeatures>('/admin/features', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Partial update — only the flags passed are changed. */
    update: async (data: UpdateFeaturesRequest): Promise<AppFeatures> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<AppFeatures>('/admin/features', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};
