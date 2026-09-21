'use client';

import { useState, useEffect } from 'react';
import {
    Loader2,
    Megaphone,
    UserPlus,
    Info,
    Landmark,
    Send,
    ArrowLeftRight,
    HandCoins,
    CreditCard,
    MessageCircle,
    Trophy,
    TrendingUp,
    Wrench,
    ShieldAlert,
    UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    featuresApi,
    type AppFeatures,
    type UserFeatureOverrides,
    type UserOverridableFlag,
    type UserOverridesResponse,
} from '@/lib/api/features';
import { adminsApi } from '@/lib/api/admins';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiErrorMessage, formatDateTime } from '@/lib/utils';

/** Every boolean flag on the doc that renders as a simple on/off toggle. */
type ToggleKey =
    | 'guestModeCta'
    | 'marketingBanner'
    | 'enableBankWithdraw'
    | 'enableOnChainWithdraw'
    | 'enableHandleTransfer'
    | 'enableGetPaid'
    | 'enableCardTab'
    | 'enableChatTab'
    | 'enableLeaderboard'
    | 'enableInvestWallet';

interface FlagMeta {
    key: ToggleKey;
    name: string;
    description: string;
    icon: typeof Megaphone;
}

/**
 * Grouped for scanability. The "App features" flags map 1:1 to the public
 * GET /features action flags the app honors; the pre-login group is the
 * allowlist-style marketing switches.
 */
const GROUPS: { title: string; note?: string; flags: FlagMeta[] }[] = [
    {
        title: 'Money & transfers',
        flags: [
            {
                key: 'enableBankWithdraw',
                name: 'Bank Withdraw',
                description:
                    'Lets users cash out to a linked bank account (off-ramp).',
                icon: Landmark,
            },
            {
                key: 'enableOnChainWithdraw',
                name: 'On-chain Withdraw',
                description:
                    'Lets users withdraw to an external crypto wallet address.',
                icon: Send,
            },
            {
                key: 'enableHandleTransfer',
                name: 'Handle Transfer',
                description:
                    'Lets users send money to another user by @handle.',
                icon: ArrowLeftRight,
            },
            {
                key: 'enableGetPaid',
                name: 'Get Paid',
                description:
                    'Enables the Get Paid / payment-request flow.',
                icon: HandCoins,
            },
        ],
    },
    {
        title: 'Tabs & surfaces',
        flags: [
            {
                key: 'enableCardTab',
                name: 'Card Tab',
                description: 'Shows the Card tab in the app.',
                icon: CreditCard,
            },
            {
                key: 'enableChatTab',
                name: 'Chat Tab',
                description: 'Shows the Chat tab in the app.',
                icon: MessageCircle,
            },
            {
                key: 'enableLeaderboard',
                name: 'Leaderboard',
                description: 'Shows the referral leaderboard.',
                icon: Trophy,
            },
            {
                key: 'enableInvestWallet',
                name: 'Invest Wallet',
                description: 'Shows the Invest wallet experience.',
                icon: TrendingUp,
            },
        ],
    },
    {
        title: 'Pre-login',
        flags: [
            {
                key: 'marketingBanner',
                name: 'Marketing Banner',
                description:
                    'Shows the campaign banner on the app home screen. When off, no banner appears regardless of the campaign content published.',
                icon: Megaphone,
            },
            {
                key: 'guestModeCta',
                name: 'Guest Mode CTA',
                description:
                    'Shows the "continue as guest" call to action on the pre-login screen.',
                icon: UserPlus,
            },
        ],
    },
];

/** The flags a super-admin can override per user (maintenanceMode excluded). */
const OVERRIDABLE: { key: UserOverridableFlag; name: string }[] = [
    { key: 'enableBankWithdraw', name: 'Bank Withdraw' },
    { key: 'enableOnChainWithdraw', name: 'On-chain Withdraw' },
    { key: 'enableHandleTransfer', name: 'Handle Transfer' },
    { key: 'enableGetPaid', name: 'Get Paid' },
    { key: 'enableCardTab', name: 'Card Tab' },
    { key: 'enableChatTab', name: 'Chat Tab' },
    { key: 'enableLeaderboard', name: 'Leaderboard' },
    { key: 'enableInvestWallet', name: 'Invest Wallet' },
];

type OverrideChoice = 'leave' | 'on' | 'off' | 'clear';

export default function FeaturesPage() {
    const { admin } = useAuthStore();
    const isSuperAdmin = admin?.role === 'super_admin';

    const [features, setFeatures] = useState<AppFeatures | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<ToggleKey | 'maintenanceMode' | null>(
        null,
    );
    /** id -> email, so the audit line names a person rather than an id. */
    const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchFeatures();
        // Best-effort: if this fails the audit line just shows the raw id.
        adminsApi
            .list()
            .then((admins) =>
                setAdminEmails(
                    Object.fromEntries(admins.map((a) => [a.id, a.email])),
                ),
            )
            .catch(() => undefined);
    }, []);

    const fetchFeatures = async () => {
        try {
            setFeatures(await featuresApi.get());
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to load feature flags'));
        } finally {
            setLoading(false);
        }
    };

    const flagName = (key: string) =>
        GROUPS.flatMap((g) => g.flags).find((f) => f.key === key)?.name ??
        (key === 'maintenanceMode' ? 'Maintenance mode' : key);

    const handleToggle = async (
        key: ToggleKey | 'maintenanceMode',
        next: boolean,
    ) => {
        if (!features) return;
        const previous = features[key];

        // Optimistic — the switch should feel immediate; revert on failure.
        setFeatures({ ...features, [key]: next });
        setSavingKey(key);
        try {
            const updated = await featuresApi.update({ [key]: next });
            setFeatures(updated);
            toast.success(`${flagName(key)} turned ${next ? 'on' : 'off'}`);
        } catch (error) {
            setFeatures({ ...features, [key]: previous });
            toast.error(apiErrorMessage(error, 'Failed to update feature flag'));
        } finally {
            setSavingKey(null);
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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Feature Flags</h1>
                <p className="text-slate-600 mt-2">
                    Turn app features on or off without a release
                </p>
            </div>

            {!features ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-600">Could not load feature flags.</p>
                    <button
                        onClick={fetchFeatures}
                        className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    {/* Grouped flag cards */}
                    {GROUPS.map((group) => (
                        <section key={group.title} className="mb-8">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                                {group.title}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.flags.map(
                                    ({ key, name, description, icon: Icon }) => {
                                        const enabled = !!features[key];
                                        const saving = savingKey === key;
                                        return (
                                            <div
                                                key={key}
                                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                                                enabled
                                                                    ? 'bg-emerald-50'
                                                                    : 'bg-slate-100'
                                                            }`}
                                                        >
                                                            <Icon
                                                                className={`h-6 w-6 ${
                                                                    enabled
                                                                        ? 'text-emerald-600'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-600">
                                                                {name}
                                                            </p>
                                                            <p
                                                                className={`text-2xl font-bold mt-1 ${
                                                                    enabled
                                                                        ? 'text-emerald-600'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {enabled ? 'On' : 'Off'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={enabled}
                                                        aria-label={name}
                                                        disabled={saving}
                                                        onClick={() =>
                                                            handleToggle(key, !enabled)
                                                        }
                                                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 ${
                                                            enabled
                                                                ? 'bg-emerald-600'
                                                                : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        {saving ? (
                                                            <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                                                        ) : (
                                                            <span
                                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                                                    enabled
                                                                        ? 'translate-x-6'
                                                                        : 'translate-x-1'
                                                                }`}
                                                            />
                                                        )}
                                                    </button>
                                                </div>

                                                <p className="text-sm text-slate-600 mt-4">
                                                    {description}
                                                </p>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </section>
                    ))}

                    {/* Maintenance mode — global-only, high-impact, styled apart */}
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                            Maintenance
                        </h2>
                        <div
                            className={`rounded-xl border p-6 ${
                                features.maintenanceMode
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-slate-200 bg-white shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                            features.maintenanceMode
                                                ? 'bg-amber-100'
                                                : 'bg-slate-100'
                                        }`}
                                    >
                                        <Wrench
                                            className={`h-6 w-6 ${
                                                features.maintenanceMode
                                                    ? 'text-amber-600'
                                                    : 'text-slate-400'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Maintenance Mode
                                        </p>
                                        <p
                                            className={`text-2xl font-bold mt-1 ${
                                                features.maintenanceMode
                                                    ? 'text-amber-600'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {features.maintenanceMode ? 'On' : 'Off'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={features.maintenanceMode}
                                    aria-label="Maintenance Mode"
                                    disabled={savingKey === 'maintenanceMode'}
                                    onClick={() =>
                                        handleToggle(
                                            'maintenanceMode',
                                            !features.maintenanceMode,
                                        )
                                    }
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 ${
                                        features.maintenanceMode
                                            ? 'bg-amber-500'
                                            : 'bg-slate-300'
                                    }`}
                                >
                                    {savingKey === 'maintenanceMode' ? (
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                                features.maintenanceMode
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-4 flex items-start gap-2">
                                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                                Global only — this cannot be overridden per user. Turning
                                it on puts every app into maintenance state.
                            </p>
                        </div>
                    </section>

                    {/* Per-user overrides — super-admin only */}
                    {isSuperAdmin && (
                        <PerUserOverrides flagName={(k) => flagName(k)} />
                    )}

                    {/* Audit */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    Last changed by{' '}
                                    {features.updatedBy
                                        ? (adminEmails[features.updatedBy] ??
                                          features.updatedBy)
                                        : 'system'}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {features.updatedAt
                                        ? formatDateTime(features.updatedAt)
                                        : 'never'}{' '}
                                    · Apps cache these values for about 30 seconds, so a
                                    change can take that long to appear.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Super-admin control to pin feature flags for a single user. There is no
 * read endpoint for one user's overrides, so this is write-only: pick an
 * action per flag, apply, and the server echoes back the resulting stored
 * overrides.
 */
function PerUserOverrides({
    flagName,
}: {
    flagName: (key: string) => string;
}) {
    const [userId, setUserId] = useState('');
    const [choices, setChoices] = useState<
        Record<UserOverridableFlag, OverrideChoice>
    >(
        () =>
            Object.fromEntries(
                OVERRIDABLE.map((f) => [f.key, 'leave']),
            ) as Record<UserOverridableFlag, OverrideChoice>,
    );
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<UserOverridesResponse | null>(null);

    const setChoice = (key: UserOverridableFlag, choice: OverrideChoice) =>
        setChoices((c) => ({ ...c, [key]: choice }));

    const reset = () => {
        setChoices(
            Object.fromEntries(
                OVERRIDABLE.map((f) => [f.key, 'leave']),
            ) as Record<UserOverridableFlag, OverrideChoice>,
        );
        setResult(null);
    };

    const apply = async () => {
        const id = userId.trim();
        if (!id) {
            toast.error('Enter a user id');
            return;
        }
        const overrides: UserFeatureOverrides = {};
        for (const { key } of OVERRIDABLE) {
            const c = choices[key];
            if (c === 'on') overrides[key] = true;
            else if (c === 'off') overrides[key] = false;
            else if (c === 'clear') overrides[key] = null;
            // 'leave' → omit
        }
        if (Object.keys(overrides).length === 0) {
            toast.error('Pick at least one flag to change');
            return;
        }
        setSaving(true);
        try {
            const res = await featuresApi.setUserOverrides(id, overrides);
            setResult(res);
            toast.success('Overrides applied');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to apply overrides'));
        } finally {
            setSaving(false);
        }
    };

    const CHOICES: { value: OverrideChoice; label: string; active: string }[] = [
        { value: 'leave', label: 'Leave', active: 'bg-slate-200 text-slate-800' },
        { value: 'on', label: 'Force On', active: 'bg-emerald-600 text-white' },
        { value: 'off', label: 'Force Off', active: 'bg-rose-600 text-white' },
        {
            value: 'clear',
            label: 'Clear',
            active: 'bg-slate-700 text-white',
        },
    ];

    return (
        <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Per-user overrides
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start gap-3 mb-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <UserCog className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Override flags for one user
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                            Super-admin only. Force a flag on or off for a single
                            user, or clear the override to fall back to the global
                            value. Flags left on “Leave” are untouched.
                        </p>
                    </div>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                    User ID
                </label>
                <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. 665f1a2b3c4d5e6f7a8b9c0d"
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-5"
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <tbody>
                            {OVERRIDABLE.map(({ key, name }) => (
                                <tr
                                    key={key}
                                    className="border-t border-slate-100"
                                >
                                    <td className="py-3 pr-4 font-medium text-slate-700 whitespace-nowrap">
                                        {name}
                                    </td>
                                    <td className="py-3">
                                        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                                            {CHOICES.map((opt) => {
                                                const selected =
                                                    choices[key] === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setChoice(key, opt.value)
                                                        }
                                                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                            selected
                                                                ? opt.active
                                                                : 'bg-white text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        type="button"
                        onClick={apply}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Apply overrides
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        disabled={saving}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-60"
                    >
                        Reset
                    </button>
                </div>

                {result && (
                    <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4">
                        <p className="text-sm font-medium text-slate-900 mb-2">
                            Stored overrides for {result.userId}
                        </p>
                        {Object.keys(result.featureOverrides).length === 0 ? (
                            <p className="text-sm text-slate-600">
                                None — this user now inherits all global flags.
                            </p>
                        ) : (
                            <ul className="text-sm text-slate-700 space-y-1">
                                {Object.entries(result.featureOverrides).map(
                                    ([k, v]) => (
                                        <li key={k}>
                                            <span className="font-medium">
                                                {flagName(k)}
                                            </span>
                                            :{' '}
                                            <span
                                                className={
                                                    v
                                                        ? 'text-emerald-600'
                                                        : 'text-rose-600'
                                                }
                                            >
                                                {v ? 'On' : 'Off'}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
