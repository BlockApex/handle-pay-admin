import apiClient from './client';

/**
 * App feature flags — the remotely-toggleable switches the mobile app
 * reads on launch (GET /features). A change reaches every app within
 * the backend's ~30s read cache.
 *
 * Two families live in this one document:
 *  - Pre-login / marketing (guestModeCta, marketingBanner) are
 *    allowlist-style server-side: never-set reads as OFF.
 *  - The public action/UI flags (enable*) default to their launch value
 *    when unset, so a fresh environment behaves sanely. Every one of
 *    these is per-user overridable EXCEPT maintenanceMode, which is
 *    global-only.
 *
 * The invite-gate fields are managed on the Invite Gate page but share
 * this endpoint (PATCH /admin/features), so they are typed here too.
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

    // ─── Public action / UI flags (per-user overridable except maintenanceMode) ───
    enableBankWithdraw: boolean;
    enableOnChainWithdraw: boolean;
    enableHandleTransfer: boolean;
    enableGetPaid: boolean;
    enableCardTab: boolean;
    enableChatTab: boolean;
    enableLeaderboard: boolean;
    enableInvestWallet: boolean;

    /** Global maintenance switch — global-only, NOT per-user overridable. */
    maintenanceMode: boolean;

    // ─── Early-access invite gate (managed on the Invite Gate page) ───
    inviteGate: boolean;
    inviteGateRolloutPercent: number;
    inviteGateThreshold: number;
    inviteGateAllowlist: string[];
    inviteGateWaitlistEta: string | null;
    /** Unix ms timestamp or ISO string; the gate only applies to users created at/after it. */
    inviteGateFromDate: string | number | null;

    /** Admin who last changed the flags. */
    updatedBy: string | null;
    updatedAt: string;
}

export interface UpdateFeaturesRequest {
    guestModeCta?: boolean;
    marketingBanner?: boolean;
    enableBankWithdraw?: boolean;
    enableOnChainWithdraw?: boolean;
    enableHandleTransfer?: boolean;
    enableGetPaid?: boolean;
    enableCardTab?: boolean;
    enableChatTab?: boolean;
    enableLeaderboard?: boolean;
    enableInvestWallet?: boolean;
    maintenanceMode?: boolean;
    inviteGate?: boolean;
    inviteGateRolloutPercent?: number;
    inviteGateThreshold?: number;
    inviteGateAllowlist?: string[];
    inviteGateWaitlistEta?: string | null;
    /** Pass null to clear the cutoff. */
    inviteGateFromDate?: string | number | null;
}

/** The flags a super-admin can override per user. maintenanceMode is NOT in this set. */
export type UserOverridableFlag =
    | 'enableBankWithdraw'
    | 'enableOnChainWithdraw'
    | 'enableHandleTransfer'
    | 'enableGetPaid'
    | 'enableCardTab'
    | 'enableChatTab'
    | 'enableLeaderboard'
    | 'enableInvestWallet';

/**
 * A per-user override map. A boolean pins the flag for that user; `null`
 * clears the override (falls back to the global value); an omitted key is
 * left unchanged.
 */
export type UserFeatureOverrides = Partial<
    Record<UserOverridableFlag, boolean | null>
>;

export interface UserOverridesResponse {
    userId: string;
    featureOverrides: Partial<Record<UserOverridableFlag, boolean>>;
}

export const featuresApi = {
    get: async (): Promise<AppFeatures> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.get<AppFeatures>('/admin/features', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Partial update — only the fields passed are changed. */
    update: async (data: UpdateFeaturesRequest): Promise<AppFeatures> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<AppFeatures>('/admin/features', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /**
     * Set or clear a single user's feature overrides (SUPER-ADMIN only).
     * Returns the resulting stored overrides for that user.
     */
    setUserOverrides: async (
        userId: string,
        overrides: UserFeatureOverrides,
    ): Promise<UserOverridesResponse> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.patch<UserOverridesResponse>(
            `/admin/features/users/${encodeURIComponent(userId)}`,
            overrides,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },
};
