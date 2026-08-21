'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Inbox,
    Loader2,
    RefreshCw,
    Send,
    Ticket as TicketIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    supportApi,
    type SupportMessage,
    type SupportStats,
    type SupportTicket,
} from '@/lib/api/support';
import { apiErrorMessage, formatDateTime } from '@/lib/utils';

/** How often the open thread refreshes while an agent has it open. */
const POLL_MS = 8000;

const CATEGORY_LABELS: Record<string, string> = {
    unsupported_asset: 'Wrong asset / network',
    missing_deposit: 'Missing deposit',
    lost_funds: 'Lost funds',
    security: 'Security',
    user_requested: 'Asked for a human',
    account_issue: 'Account issue',
    llm_error: 'Assistant unavailable',
    other: 'Other',
};

/** Categories where money may be at stake get visual weight. */
const URGENT = new Set([
    'unsupported_asset',
    'lost_funds',
    'missing_deposit',
    'security',
]);

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState<SupportStats | null>(null);
    const [filter, setFilter] = useState<'open' | 'resolved'>('open');
    const [selected, setSelected] = useState<SupportTicket | null>(null);
    const [thread, setThread] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isThreadLoading, setIsThreadLoading] = useState(false);
    const [draft, setDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const loadTickets = useCallback(async () => {
        try {
            const [rows, s] = await Promise.all([
                supportApi.listTickets(filter),
                supportApi.stats().catch(() => null),
            ]);
            setTickets(rows);
            if (s) setStats(s);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not load tickets'));
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setIsLoading(true);
        void loadTickets();
    }, [loadTickets]);

    const loadThread = useCallback(
        async (conversationId: string, showSpinner = true) => {
            if (showSpinner) setIsThreadLoading(true);
            try {
                setThread(await supportApi.conversation(conversationId));
            } catch (error) {
                toast.error(
                    apiErrorMessage(error, 'Could not load the conversation'),
                );
            } finally {
                setIsThreadLoading(false);
            }
        },
        [],
    );

    // Poll the open thread so a reply from the user appears without a
    // manual refresh. Only while a ticket is selected — no background
    // polling, and the ticket list leans on Slack for new-ticket alerts.
    useEffect(() => {
        if (!selected) return;
        const id = setInterval(
            () => void loadThread(selected.conversationId, false),
            POLL_MS,
        );
        return () => clearInterval(id);
    }, [selected, loadThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread]);

    const openTicket = async (ticket: SupportTicket) => {
        setSelected(ticket);
        setDraft('');
        setThread([]);
        await loadThread(ticket.conversationId);
    };

    const handleSend = async () => {
        if (!selected || !draft.trim()) return;
        setIsSending(true);
        try {
            await supportApi.reply(selected.conversationId, draft.trim());
            setDraft('');
            await loadThread(selected.conversationId, false);
            toast.success('Reply sent — the user has been notified');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not send the reply'));
        } finally {
            setIsSending(false);
        }
    };

    const handleResolve = async () => {
        if (!selected) return;
        const ok = window.confirm(
            `Resolve ${selected.ticketNumber}?\n\nThe assistant takes the conversation back over. The user can still write, and a new issue would open a fresh ticket.`,
        );
        if (!ok) return;
        setIsResolving(true);
        try {
            await supportApi.resolve(selected.id);
            toast.success(`${selected.ticketNumber} resolved`);
            setSelected(null);
            await loadTickets();
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not resolve the ticket'));
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Support
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Conversations the assistant handed to a person
                    </p>
                </div>
                <button
                    onClick={() => void loadTickets()}
                    disabled={isLoading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        label="Open tickets"
                        value={String(stats.ticketsByStatus.open ?? 0)}
                        icon={Inbox}
                    />
                    <StatCard
                        label="Escalation rate"
                        value={`${stats.escalationRatePct}%`}
                        icon={AlertTriangle}
                        hint="Healthy is roughly 15-30%"
                    />
                    <StatCard
                        label={`Conversations (${stats.periodDays}d)`}
                        value={String(stats.conversations)}
                        icon={TicketIcon}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Ticket list */}
                <div className="lg:col-span-2">
                    <div className="mb-3 flex gap-2">
                        {(['open', 'resolved'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    setSelected(null);
                                }}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                                    filter === f
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
                            <p className="text-sm font-medium text-slate-900">
                                No {filter} tickets
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {filter === 'open'
                                    ? 'The assistant is handling everything right now.'
                                    : 'Nothing has been resolved yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => void openTicket(t)}
                                    className={`w-full rounded-xl border p-4 text-left transition ${
                                        selected?.id === t.id
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold text-slate-900">
                                            {t.ticketNumber}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                URGENT.has(t.category)
                                                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                                                    : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                                            }`}
                                        >
                                            {CATEGORY_LABELS[t.category] ??
                                                t.category}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm text-slate-900">
                                        @{t.userHandle}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                        {t.reason ?? t.subject}
                                    </p>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        {formatDateTime(t.createdAt)}
                                        {!t.slackDelivered && ' · not in Slack'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversation */}
                <div className="lg:col-span-3">
                    {!selected ? (
                        <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                            <p className="text-sm text-slate-500">
                                Select a ticket to read the conversation and
                                reply.
                            </p>
                        </div>
                    ) : (
                        <div className="flex h-[36rem] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                            {/* Thread header */}
                            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        @{selected.userHandle}{' '}
                                        <span className="font-mono text-xs font-normal text-slate-500">
                                            {selected.ticketNumber}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {CATEGORY_LABELS[selected.category] ??
                                            selected.category}
                                    </p>
                                </div>
                                {selected.status === 'open' && (
                                    <button
                                        onClick={() => void handleResolve()}
                                        disabled={isResolving}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {isResolving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Resolve
                                    </button>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                                {isThreadLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                    </div>
                                ) : (
                                    thread.map((m, i) => (
                                        <Message key={i} message={m} />
                                    ))
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Composer */}
                            <div className="border-t border-slate-200 p-3">
                                <div className="flex gap-2">
                                    <textarea
                                        value={draft}
                                        rows={2}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                (e.metaKey || e.ctrlKey)
                                            ) {
                                                void handleSend();
                                            }
                                        }}
                                        placeholder="Reply to the user… (Cmd/Ctrl + Enter to send)"
                                        className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                        onClick={() => void handleSend()}
                                        disabled={!draft.trim() || isSending}
                                        className="inline-flex shrink-0 items-center gap-2 self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Send
                                    </button>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Sends a push notification and appears in the
                                    user&apos;s own chat thread.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    hint,
}: {
    label: string;
    value: string;
    icon: typeof Inbox;
    hint?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <Icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-600">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

/** One turn. The escalation card renders as a card, not a bubble. */
function Message({ message }: { message: SupportMessage }) {
    if (message.type === 'ticket') {
        const meta = (message.meta ?? {}) as {
            ticketNumber?: string;
            body?: string;
            expectedResponse?: string;
        };
        return (
            <div className="mx-auto max-w-md rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="font-mono text-xs font-semibold text-emerald-900">
                    {meta.ticketNumber ?? 'Support ticket'}
                </p>
                <p className="mt-1 text-xs text-emerald-800">{meta.body}</p>
                {meta.expectedResponse && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                        {meta.expectedResponse}
                    </p>
                )}
            </div>
        );
    }

    const isUser = message.role === 'user';
    const label =
        message.role === 'user'
            ? 'User'
            : message.role === 'support'
              ? 'You (support)'
              : 'Assistant';
    return (
        <div className={isUser ? '' : 'flex justify-end'}>
            <div className={isUser ? 'max-w-[80%]' : 'max-w-[80%]'}>
                <p
                    className={`mb-0.5 text-xs ${isUser ? 'text-slate-500' : 'text-right text-slate-500'}`}
                >
                    {label} · {formatDateTime(message.createdAt)}
                </p>
                <div
                    className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isUser
                            ? 'bg-slate-100 text-slate-900'
                            : message.role === 'support'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-white'
                    }`}
                >
                    {message.content}
                </div>
            </div>
        </div>
    );
}
