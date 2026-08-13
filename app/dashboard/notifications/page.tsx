'use client';

import { useState } from 'react';
import {
    Loader2,
    Send,
    Users,
    AlertTriangle,
    CheckCircle2,
    Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/utils';
import {
    notificationsApi,
    type BroadcastResult,
} from '@/lib/api/notifications';

/** Lock screens truncate past roughly these lengths. */
const TITLE_MAX = 100;
const BODY_MAX = 300;

export default function NotificationsPage() {
    // --- broadcast ---
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [dryRun, setDryRun] = useState<BroadcastResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState<BroadcastResult | null>(null);

    // --- single test push ---
    const [testUserId, setTestUserId] = useState('');
    const [testTitle, setTestTitle] = useState('Test notification');
    const [testBody, setTestBody] = useState(
        'Testing push delivery — please ignore.',
    );
    const [isTesting, setIsTesting] = useState(false);

    const campaignIdValid = /^[a-z0-9][a-z0-9-]{2,63}$/.test(campaignId);
    const canCheck =
        title.trim().length > 0 && body.trim().length > 0 && campaignIdValid;

    /** Any edit invalidates a previous count — force a fresh dry run. */
    const onFieldChange = (setter: (v: string) => void) => (v: string) => {
        setter(v);
        setDryRun(null);
        setSent(null);
    };

    const handleDryRun = async () => {
        setIsChecking(true);
        setSent(null);
        try {
            const result = await notificationsApi.broadcast({
                title: title.trim(),
                body: body.trim(),
                campaignId: campaignId.trim(),
                dryRun: true,
            });
            setDryRun(result);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not count recipients'));
        } finally {
            setIsChecking(false);
        }
    };

    const handleSend = async () => {
        if (!dryRun) return;
        const ok = window.confirm(
            `Send this notification to ${dryRun.recipients} user${
                dryRun.recipients === 1 ? '' : 's'
            }?\n\n${title}\n${body}\n\nThis cannot be undone.`,
        );
        if (!ok) return;

        setIsSending(true);
        try {
            const result = await notificationsApi.broadcast({
                title: title.trim(),
                body: body.trim(),
                campaignId: campaignId.trim(),
                dryRun: false,
            });
            setSent(result);
            setDryRun(null);
            toast.success(`Queued for ${result.queued} users`);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Broadcast failed'));
        } finally {
            setIsSending(false);
        }
    };

    const handleTest = async () => {
        if (!testUserId.trim()) return;
        setIsTesting(true);
        try {
            await notificationsApi.sendTest({
                userId: testUserId.trim(),
                title: testTitle.trim(),
                body: testBody.trim(),
            });
            toast.success('Test notification sent');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not send test notification'));
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                <p className="text-slate-600 mt-2">
                    Send a push notification to every user, or to one user for testing
                </p>
            </div>

            {/* ---------------- broadcast ---------------- */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <Users className="h-4 w-4 text-slate-400" />
                        Broadcast to all users
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Check the audience first, then send. A broadcast cannot be
                        recalled.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            maxLength={TITLE_MAX}
                            onChange={(e) => onFieldChange(setTitle)(e.target.value)}
                            placeholder="Update available"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            {title.length}/{TITLE_MAX} — lock screens usually show about
                            40 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Message
                        </label>
                        <textarea
                            value={body}
                            maxLength={BODY_MAX}
                            rows={3}
                            onChange={(e) => onFieldChange(setBody)(e.target.value)}
                            placeholder="A new version of HandlePay is ready. Update the app to continue getting the latest features."
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            {body.length}/{BODY_MAX}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Campaign ID
                        </label>
                        <input
                            type="text"
                            value={campaignId}
                            onChange={(e) =>
                                onFieldChange(setCampaignId)(
                                    e.target.value.toLowerCase(),
                                )
                            }
                            placeholder="app-update-2026-08"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            Lowercase letters, digits and dashes. Sending twice with the
                            same ID never notifies anyone twice — so a new announcement
                            needs a new ID.
                        </p>
                    </div>

                    {/* preview */}
                    {(title || body) && (
                        <div className="rounded-lg bg-slate-900 p-4">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Preview
                            </p>
                            <div className="rounded-lg bg-slate-800 p-3">
                                <p className="text-sm font-semibold text-white">
                                    {title || 'Title'}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-300">
                                    {body || 'Message'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* dry-run result */}
                    {dryRun && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-900">
                                    Ready to send to {dryRun.recipients} user
                                    {dryRun.recipients === 1 ? '' : 's'}
                                </p>
                                <p className="mt-0.5 text-amber-700">
                                    Only users with a registered device are counted.
                                    Nothing has been sent yet.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* sent result */}
                    {sent && (
                        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <div className="text-sm">
                                <p className="font-medium text-emerald-900">
                                    Queued for {sent.queued} user
                                    {sent.queued === 1 ? '' : 's'}
                                    {sent.failed > 0 && `, ${sent.failed} failed to queue`}
                                </p>
                                <p className="mt-0.5 text-emerald-700">
                                    Delivery happens in the background. Devices that can no
                                    longer receive push are cleaned up automatically.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleDryRun}
                            disabled={!canCheck || isChecking || isSending}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
                            Check audience
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!dryRun || isSending}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Send to all users
                        </button>
                    </div>
                    {!dryRun && !sent && (
                        <p className="text-xs text-slate-400">
                            Check the audience before the send button becomes available.
                        </p>
                    )}
                </div>
            </section>

            {/* ---------------- single test ---------------- */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <Smartphone className="h-4 w-4 text-slate-400" />
                        Send a test to one user
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Goes to every device that user has registered. Useful for
                        checking copy before a broadcast.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            User ID
                        </label>
                        <input
                            type="text"
                            value={testUserId}
                            onChange={(e) => setTestUserId(e.target.value)}
                            placeholder="6a7dae808b2134bc6cc10cd9"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={testTitle}
                                onChange={(e) => setTestTitle(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Message
                            </label>
                            <input
                                type="text"
                                value={testBody}
                                onChange={(e) => setTestBody(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleTest}
                        disabled={!testUserId.trim() || isTesting}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {isTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        Send test
                    </button>
                </div>
            </section>
        </div>
    );
}
