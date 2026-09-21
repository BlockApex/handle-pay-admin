import apiClient from './client';

/**
 * Admin override for the early-access invite gate. The gate *config*
 * (enable, rollout %, threshold, allowlist, waitlist ETA, from-date) is
 * managed through PATCH /admin/features (see featuresApi); these endpoints
 * only act on the waiting cohort: list it, force-clear one user, or open
 * the doors for a batch.
 */
export type GateScope = 'all' | 'waitlist';

export interface WaitingUser {
    userId: string;
    username: string;
    path: 'invite' | 'waitlist' | null;
    waitlistJoinedAt: string | null;
}

export interface WaitingList {
    total: number;
    users: WaitingUser[];
}

export const inviteGateApi = {
    /**
     * The queue of still-gated, uncleared users. scope=waitlist narrows to
     * those who tapped "Join Waitlist" (ordered by when they joined).
     */
    waiting: async (
        scope: GateScope = 'all',
        limit = 100,
    ): Promise<WaitingList> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<WaitingList>(
            '/admin/invite-gate/waiting',
            {
                params: { scope, limit },
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        return response.data;
    },

    /** Force-clear one user's gate and notify them. */
    clear: async (userId: string): Promise<{ cleared: boolean }> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<{ cleared: boolean }>(
            `/admin/invite-gate/${encodeURIComponent(userId)}/clear`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    /**
     * Open the doors — clear a whole cohort (omit limit) or the first N in
     * the queue, and notify each released user. This actually lets the
     * waiting cohort in; flipping the master flag off only stops gating NEW
     * users.
     */
    release: async (
        scope: GateScope,
        limit?: number,
    ): Promise<{ released: number }> => {
        const token = localStorage.getItem('accessToken');
        const body: { scope: GateScope; limit?: number } = { scope };
        if (limit && limit > 0) body.limit = limit;
        const response = await apiClient.post<{ released: number }>(
            '/admin/invite-gate/release',
            body,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },
};
