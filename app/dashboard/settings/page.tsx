'use client';

import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <SettingsIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">Settings Coming Soon</p>
                        <p className="text-sm text-slate-600">
                            Application settings will be available in a future update
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
