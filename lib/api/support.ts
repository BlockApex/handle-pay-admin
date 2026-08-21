import apiClient from './client';

/**
 * AI customer support — admin side.
 *
 * Users chat with an AI assistant in one permanent thread each. When
 * the assistant can't safely answer (wrong-network deposit, lost
 * funds, an angry user, an explicit request for a person) it opens a
 * ticket and posts it to Slack. An agent answers from here, and the
 * reply lands in the user's own chat thread — they never leave the
 * app or repeat themselves.
 */
export interface SupportTicket {
    id: string;
    /** Human-readable reference the user sees in-app, e.g. HP-48392. */
    ticketNumber: string;
    conversationId: string;
    userHandle: string;
    subject: string;
    category: string;
    reason: string | null;
    status: 'open' | 'resolved';
    slackDelivered: boolean;
    createdAt: string;
}

export interface SupportMessage {
    /** `support` is a human agent; `assistant` is the AI. */
    role: 'user' | 'assistant' | 'support';
    content: string;
    /** `ticket` renders as the escalation card, using `meta`. */
    type: 'text' | 'ticket';
    meta: Record<string, unknown> | null;
    /**
     * Image attachments. `url` is a SIGNED link that expires (~30 min)
     * and is regenerated every time the transcript is fetched — never
     * cache or store it. Null means signing failed; show a placeholder
     * rather than a broken image.
     */
    attachments?: {
        url: string | null;
        mime: string;
        size: number;
    }[];
    createdAt: string;
}

export interface SupportStats {
    periodDays: number;
    conversations: number;
    escalated: number;
    /** Healthy range is roughly 15-30%. */
    escalationRatePct: number;
    byCategory: Record<string, number>;
    ticketsByStatus: Record<string, number>;
}

export const supportApi = {
    listTickets: async (
        status?: 'open' | 'resolved',
    ): Promise<SupportTicket[]> => {
        const response = await apiClient.get<SupportTicket[]>(
            '/support/admin/tickets',
            { params: status ? { status } : undefined },
        );
        return response.data;
    },

    stats: async (days = 30): Promise<SupportStats> => {
        const response = await apiClient.get<SupportStats>(
            '/support/admin/stats',
            { params: { days } },
        );
        return response.data;
    },

    /**
     * The user's full thread. Admin reads it through the same
     * conversation the user sees, so context is never partial.
     */
    conversation: async (
        conversationId: string,
    ): Promise<SupportMessage[]> => {
        const response = await apiClient.get<SupportMessage[]>(
            `/support/admin/conversations/${conversationId}/messages`,
        );
        return response.data;
    },

    reply: async (
        conversationId: string,
        message: string,
    ): Promise<{ success: boolean }> => {
        const response = await apiClient.post<{ success: boolean }>(
            `/support/admin/conversations/${conversationId}/reply`,
            { message },
        );
        return response.data;
    },

    resolve: async (
        ticketId: string,
    ): Promise<{ success: boolean }> => {
        const response = await apiClient.patch<{ success: boolean }>(
            `/support/admin/tickets/${ticketId}/resolve`,
        );
        return response.data;
    },
};
