'use client';

import { useState, useEffect } from 'react';
import { Loader2, Megaphone, UserPlus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { featuresApi, type AppFeatures } from '@/lib/api/features';
import { adminsApi } from '@/lib/api/admins';
import { apiErrorMessage, formatDateTime } from '@/lib/utils';

type FlagKey = 'marketingBanner' | 'guestModeCta';

const FLAGS: {
    key: FlagKey;
    name: string;
    description: string;
    icon: typeof Megaphone;
}[] = [
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
];

export default function FeaturesPage() {
    const [features, setFeatures] = useState<AppFeatures | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<FlagKey | null>(null);
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

    const handleToggle = async (key: FlagKey, next: boolean) => {
        if (!features) return;
        const previous = features[key];

        // Optimistic — the switch should feel immediate; revert on failure.
        setFeatures({ ...features, [key]: next });
        setSavingKey(key);
        try {
            const updated = await featuresApi.update({ [key]: next });
            setFeatures(updated);
            toast.success(
                `${FLAGS.find((f) => f.key === key)?.name} turned ${next ? 'on' : 'off'}`,
            );
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
                <h1 className="text-3xl font-bold text-slate-900">
                    Feature Flags
                </h1>
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
                    {/* Flag cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {FLAGS.map(({ key, name, description, icon: Icon }) => {
                            const enabled = features[key];
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
                                            onClick={() => handleToggle(key, !enabled)}
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
                        })}
                    </div>

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
