'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Users, Shield, Activity } from 'lucide-react';

export default function DashboardPage() {
    const { admin } = useAuthStore();

    if (!admin) return null;

    const stats = [
        {
            name: 'Total Admins',
            value: '-',
            icon: Users,
            color: 'bg-blue-500',
        },
        {
            name: 'Active Sessions',
            value: '-',
            icon: Activity,
            color: 'bg-green-500',
        },
        {
            name: 'Your Role',
            value: admin.role.replace('_', ' ').toUpperCase(),
            icon: Shield,
            color: 'bg-emerald-500',
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {admin.firstName}!
                </h1>
                <p className="text-slate-600 mt-2">
                    Here's what's happening with your admin dashboard today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                        href="/dashboard/admins"
                        className="p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition group"
                    >
                        <Users className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 mb-2" />
                        <h3 className="font-medium text-slate-900">Manage Admins</h3>
                        <p className="text-sm text-slate-600 mt-1">View and manage admin users</p>
                    </a>

                    <a
                        href="/dashboard/profile"
                        className="p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition group"
                    >
                        <Shield className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 mb-2" />
                        <h3 className="font-medium text-slate-900">Your Profile</h3>
                        <p className="text-sm text-slate-600 mt-1">Update your profile and security settings</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
