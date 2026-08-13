import apiClient from './client';

/**
 * Push notifications — admin operations.
 *
 * A broadcast reaches every user with a registered device and cannot be
 * recalled, so the backend defaults to a dry run: a request without
 * `dryRun: false` only counts the audience. The campaign id is also the
 * per-user dedupe key, so repeating a broadcast with the same id can
 * never notify anyone twice.
 */
export interface BroadcastRequest {
    title: string;
    body: string;
    /** Lowercase letters, digits and dashes. Doubles as the dedupe key. */
    campaignId: string;
    dryRun: boolean;
}

export interface BroadcastResult {
    dryRun: boolean;
    /** Users with at least one active device. */
    recipients: number;
    /** Messages handed to the delivery queue (0 on a dry run). */
    queued: number;
    failed: number;
}

export interface TestNotificationRequest {
    /** App user to notify. Without it the push goes to the admin's own id. */
    userId: string;
    title: string;
    body: string;
}

export const notificationsApi = {
    broadcast: async (data: BroadcastRequest): Promise<BroadcastResult> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<BroadcastResult>(
            '/notifications/broadcast',
            data,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    sendTest: async (
        data: TestNotificationRequest,
    ): Promise<{ success: boolean; message: string }> => {
        const token = localStorage.getItem('accessToken');
        const response = await apiClient.post<{ success: boolean; message: string }>(
            '/notifications/test',
            data,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },
};
