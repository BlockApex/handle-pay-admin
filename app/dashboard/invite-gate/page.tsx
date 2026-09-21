'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Loader2,
    Info,
    DoorOpen,
    ListChecks,
    Users2,
    RefreshCw,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { featuresApi, type AppFeatures } from '@/lib/api/features';
import {
    inviteGateApi,
    type GateScope,
    type WaitingList,
} from '@/lib/api/inviteGate';
import { apiErrorMessage, formatDateTime } from '@/lib/utils';

/** ISO/ms → the value a datetime-local input wants (YYYY-MM-DDTHH:mm, local). */
function toLocalInput(value: string | number | null): string {
    if (value === null || value === undefined || value === '') return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours(),
    )}:${pad(d.getMinutes())}`;
}

export default function InviteGatePage() {
    const [features, setFeatures] = useState<AppFeatures | null>(null);
    const [loading, setLoading] = useState(true);
    const [togglingGate, setTogglingGate] = useState(false);

    // Config form (initialised from the loaded doc).
    const [rolloutPercent, setRolloutPercent] = useState('0');
    const [threshold, setThreshold] = useState('2');
    const [waitlistEta, setWaitlistEta] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [allowlistText, setAllowlistText] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);

    // Waiting queue.
    const [scope, setScope] = useState<GateScope>('all');
    const [waiting, setWaiting] = useState<WaitingList | null>(null);
    const [loadingWaiting, setLoadingWaiting] = useState(false);
    const [clearingId, setClearingId] = useState<string | null>(null);

    // Release.
    const [releaseScope, setReleaseScope] = useState<GateScope>('waitlist');
    const [releaseLimit, setReleaseLimit] = useState('');
    const [releasing, setReleasing] = useState(false);

    const hydrateForm = (f: AppFeatures) => {
        setRolloutPercent(String(f.inviteGateRolloutPercent ?? 0));
        setThreshold(String(f.inviteGateThreshold ?? 2));
        setWaitlistEta(f.inviteGateWaitlistEta ?? '');
        setFromDate(toLocalInput(f.inviteGateFromDate));
        setAllowlistText((f.inviteGateAllowlist ?? []).join('\n'));
    };

    const fetchFeatures = async () => {
        try {
            const f = await featuresApi.get();
            setFeatures(f);
            hydrateForm(f);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to load gate config'));
        } finally {
            setLoading(false);
        }
    };

    const loadWaiting = useCallback(async (s: GateScope) => {
        setLoadingWaiting(true);
        try {
            setWaiting(await inviteGateApi.waiting(s, 200));
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to load waiting list'));
        } finally {
            setLoadingWaiting(false);
        }
    }, []);

    useEffect(() => {
        fetchFeatures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadWaiting(scope);
    }, [scope, loadWaiting]);

    const toggleGate = async (next: boolean) => {
        if (!features) return;
        const previous = features.inviteGate;
        setFeatures({ ...features, inviteGate: next });
        setTogglingGate(true);
        try {
            const updated = await featuresApi.update({ inviteGate: next });
            setFeatures(updated);
            hydrateForm(updated);
            toast.success(`Invite gate turned ${next ? 'on' : 'off'}`);
        } catch (error) {
            setFeatures({ ...features, inviteGate: previous });
            toast.error(apiErrorMessage(error, 'Failed to update the gate'));
        } finally {
            setTogglingGate(false);
        }
    };

    const saveConfig = async () => {
        const pct = Number(rolloutPercent);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            toast.error('Rollout percent must be between 0 and 100');
            return;
        }
        const thr = Number(threshold);
        if (!Number.isInteger(thr) || thr < 1) {
            toast.error('Threshold must be a whole number of 1 or more');
            return;
        }
        setSavingConfig(true);
        try {
            const allowlist = allowlistText
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
            const updated = await featuresApi.update({
                inviteGateRolloutPercent: pct,
                inviteGateThreshold: thr,
                inviteGateWaitlistEta: waitlistEta.trim() || null,
                inviteGateFromDate: fromDate ? new Date(fromDate).getTime() : null,
                inviteGateAllowlist: allowlist,
            });
            setFeatures(updated);
            hydrateForm(updated);
            toast.success('Gate config saved');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to save config'));
        } finally {
            setSavingConfig(false);
        }
    };

    const clearUser = async (userId: string, username: string) => {
        if (
            !window.confirm(
                `Clear the gate for @${username}? They'll be let in and notified.`,
            )
        )
            return;
        setClearingId(userId);
        try {
            await inviteGateApi.clear(userId);
            toast.success(`@${username} let in`);
            await loadWaiting(scope);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to clear the user'));
        } finally {
            setClearingId(null);
        }
    };

    const release = async () => {
        const limit = releaseLimit ? Number(releaseLimit) : undefined;
        if (releaseLimit && (!Number.isInteger(limit!) || limit! < 1)) {
            toast.error('Limit must be a whole number of 1 or more');
            return;
        }
        const who =
            releaseScope === 'waitlist'
                ? 'everyone on the waitlist'
                : 'every gated user';
        const scopeText = limit ? `the first ${limit} of ${who}` : who;
        if (
            !window.confirm(
                `Open the doors for ${scopeText}? Each released user is notified. This can't be undone.`,
            )
        )
            return;
        setReleasing(true);
        try {
            const { released } = await inviteGateApi.release(releaseScope, limit);
            toast.success(
                released > 0
                    ? `Released ${released} user${released === 1 ? '' : 's'}`
                    : 'No one matched — nobody to release',
            );
            setReleaseLimit('');
            await loadWaiting(scope);
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to release the cohort'));
        } finally {
            setReleasing(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
            </div>
        );
    }

    const gateOn = !!features?.inviteGate;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Invite Gate</h1>
                <p className="text-slate-600 mt-2">
                    Early-access rollout — who gets gated, and letting the waiting
                    cohort in
                </p>
            </div>

            {!features ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-600">Could not load the gate config.</p>
                    <button
                        onClick={fetchFeatures}
                        className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Master switch */}
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Master switch
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                            gateOn ? 'bg-emerald-50' : 'bg-slate-100'
                                        }`}
                                    >
                                        <DoorOpen
                                            className={`h-6 w-6 ${
                                                gateOn
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Invite Gate
                                        </p>
                                        <p
                                            className={`text-2xl font-bold mt-1 ${
                                                gateOn
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {gateOn ? 'On' : 'Off'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={gateOn}
                                    aria-label="Invite Gate"
                                    disabled={togglingGate}
                                    onClick={() => toggleGate(!gateOn)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 ${
                                        gateOn ? 'bg-emerald-600' : 'bg-slate-300'
                                    }`}
                                >
                                    {togglingGate ? (
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                                gateOn
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-4 flex items-start gap-2">
                                <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                                Turning this off only stops gating NEW users — the
                                decision is sticky, so users already waiting stay
                                gated until you release them below.
                            </p>
                        </div>
                    </section>

                    {/* Rollout config */}
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Rollout config
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Rollout percent
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={rolloutPercent}
                                        onChange={(e) =>
                                            setRolloutPercent(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Gate a new user when their id bucket (0–99) is
                                        below this. 0 = gate nobody by percentage; 100
                                        = gate everyone.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Unlock threshold
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={threshold}
                                        onChange={(e) =>
                                            setThreshold(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Friends who must join for a gated user to
                                        unlock via the invite path.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Waitlist ETA copy
                                    </label>
                                    <input
                                        type="text"
                                        value={waitlistEta}
                                        onChange={(e) =>
                                            setWaitlistEta(e.target.value)
                                        }
                                        placeholder="e.g. Mid October 2026"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Static “estimated access” text on the waitlist
                                        screen.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Gate from date
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="datetime-local"
                                            value={fromDate}
                                            onChange={(e) =>
                                                setFromDate(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        {fromDate && (
                                            <button
                                                type="button"
                                                onClick={() => setFromDate('')}
                                                className="text-xs font-medium text-slate-500 hover:text-slate-700 whitespace-nowrap"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Only users created at/after this are ever
                                        gated. Leave empty for no cutoff.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Allowlist (always gated)
                                </label>
                                <textarea
                                    value={allowlistText}
                                    onChange={(e) =>
                                        setAllowlistText(e.target.value)
                                    }
                                    rows={4}
                                    placeholder="One user id per line"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Explicit user ids that are always gated
                                    (user-specific rollout), one per line.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={saveConfig}
                                disabled={savingConfig}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {savingConfig && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Save config
                            </button>
                        </div>
                    </section>

                    {/* Release */}
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Open the doors
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-start gap-3 mb-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                    <ListChecks className="h-5 w-5 text-slate-500" />
                                </div>
                                <p className="text-sm text-slate-600">
                                    Batch-clear the gate and notify each user. Use{' '}
                                    <span className="font-medium">Waitlist</span> to
                                    let in only those who tapped Join Waitlist (oldest
                                    first), or <span className="font-medium">All</span>{' '}
                                    for every gated user. Leave the limit empty to
                                    release the whole cohort.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Scope
                                    </label>
                                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                                        {(['waitlist', 'all'] as GateScope[]).map(
                                            (s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() =>
                                                        setReleaseScope(s)
                                                    }
                                                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                                        releaseScope === s
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Limit (optional)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={releaseLimit}
                                        onChange={(e) =>
                                            setReleaseLimit(e.target.value)
                                        }
                                        placeholder="All"
                                        className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={release}
                                    disabled={releasing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {releasing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <DoorOpen className="h-4 w-4" />
                                    )}
                                    Release
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Waiting queue */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                Waiting queue
                                {waiting ? ` · ${waiting.total}` : ''}
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                                    {(['all', 'waitlist'] as GateScope[]).map(
                                        (s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setScope(s)}
                                                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                                    scope === s
                                                        ? 'bg-slate-800 text-white'
                                                        : 'bg-white text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ),
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => loadWaiting(scope)}
                                    disabled={loadingWaiting}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-60"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${
                                            loadingWaiting ? 'animate-spin' : ''
                                        }`}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {loadingWaiting ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                                </div>
                            ) : !waiting || waiting.users.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users2 className="h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-600">
                                        No one is waiting in this scope.
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                                            <th className="px-6 py-3 font-medium">
                                                User
                                            </th>
                                            <th className="px-6 py-3 font-medium">
                                                Path
                                            </th>
                                            <th className="px-6 py-3 font-medium">
                                                Joined waitlist
                                            </th>
                                            <th className="px-6 py-3 font-medium text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waiting.users.map((u) => (
                                            <tr
                                                key={u.userId}
                                                className="border-b border-slate-50 last:border-0"
                                            >
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-slate-800">
                                                        @{u.username}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        {u.userId}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {u.path ? (
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                                                u.path === 'waitlist'
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-sky-50 text-sky-700'
                                                            }`}
                                                        >
                                                            {u.path}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">
                                                    {u.waitlistJoinedAt
                                                        ? formatDateTime(
                                                              u.waitlistJoinedAt,
                                                          )
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            clearUser(
                                                                u.userId,
                                                                u.username,
                                                            )
                                                        }
                                                        disabled={
                                                            clearingId === u.userId
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                                    >
                                                        {clearingId === u.userId ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                        Let in
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
