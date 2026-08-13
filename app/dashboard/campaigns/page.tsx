'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Loader2,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    campaignsApi,
    type AdminBanner,
    type AdminBannersResponse,
} from '@/lib/api/campaigns';
import { apiErrorMessage, formatDateTime } from '@/lib/utils';

const STATE_STYLES: Record<
    AdminBanner['state'],
    { label: string; className: string; note: string }
> = {
    active: {
        label: 'Live',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        note: 'Showing in the app now',
    },
    scheduled: {
        label: 'Scheduled',
        className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        note: 'Starts on its start date',
    },
    expired: {
        label: 'Ended',
        className: 'bg-slate-100 text-slate-600 ring-slate-500/20',
        note: 'Its end date has passed',
    },
    invalid: {
        label: 'Not usable',
        className: 'bg-red-50 text-red-700 ring-red-600/20',
        note: 'Missing a title, image or valid start date — it will never show',
    },
};

/** `**bold**` marks the accent-highlighted words; `\n` marks line breaks. */
function renderTitle(title: string) {
    return title.split('\n').map((line, i) => (
        <span key={i} className="block">
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                    <span key={j} className="font-semibold text-emerald-600">
                        {part.slice(2, -2)}
                    </span>
                ) : (
                    <span key={j}>{part}</span>
                ),
            )}
        </span>
    ));
}

export default function CampaignsPage() {
    const [data, setData] = useState<AdminBannersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setIsLoading(true);
        try {
            setData(await campaignsApi.list());
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not load banners'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await campaignsApi.refresh();
            setData(await campaignsApi.list());
            toast.success('Reloaded the latest published content');
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Could not reload banners'));
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Campaign Banners
                    </h1>
                    <p className="text-slate-600 mt-2">
                        The banners published to the app home screen
                        {data?.version && ` · content version ${data.version}`}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Reload content
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
            ) : !data ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-600">
                    Could not load banners.{' '}
                    <button
                        onClick={load}
                        className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        Try again
                    </button>
                </div>
            ) : data.banners.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-sm font-medium text-slate-900">
                        No banners published
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        The content file has no banners in it yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {data.banners.map((banner) => {
                        const state = STATE_STYLES[banner.state];
                        return (
                            <div
                                key={banner.id}
                                className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200"
                            >
                                <div className="flex flex-col gap-4 p-6 sm:flex-row">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={banner.imageUrl}
                                        alt=""
                                        className="h-20 w-full shrink-0 rounded-lg bg-slate-100 object-cover sm:w-48"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${state.className}`}
                                            >
                                                {state.label}
                                            </span>
                                            <code className="text-xs text-slate-400">
                                                {banner.id}
                                            </code>
                                            {banner.badgeText && (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                    {banner.badgeText}
                                                </span>
                                            )}
                                            {banner.cta && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                    <ChevronRight className="h-3 w-3" />
                                                    {banner.actionType || 'button'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2 text-sm leading-snug text-slate-900">
                                            {renderTitle(banner.title)}
                                        </div>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {state.note}
                                            {banner.startDate && (
                                                <>
                                                    {' · '}
                                                    {formatDateTime(banner.startDate)} →{' '}
                                                    {banner.endDate
                                                        ? formatDateTime(banner.endDate)
                                                        : 'no end date'}
                                                </>
                                            )}
                                        </p>

                                        {banner.actionUrl && (
                                            <a
                                                href={banner.actionUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                            >
                                                {banner.actionUrl}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-start gap-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p>
                    Banner content is edited as a file in storage, not here — use{' '}
                    <span className="font-medium">Reload content</span> after an upload
                    to publish it immediately instead of waiting a few minutes. Nothing
                    shows at all unless the{' '}
                    <Link
                        href="/dashboard/features"
                        className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        marketing banner flag
                    </Link>{' '}
                    is on.
                </p>
            </div>
        </div>
    );
}
