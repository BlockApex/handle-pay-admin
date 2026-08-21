'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Home, Users, Settings, User, LogOut, Shield, Mail, Link2, ToggleLeft, Bell, Megaphone, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { admin, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        // Only redirect if we're sure the user is not authenticated
        // Don't redirect during hydration (when admin is null but localStorage has data)
        const token = localStorage.getItem('accessToken');
        if (!isAuthenticated && !token) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            logout();
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            logout();
            router.push('/login');
        }
    };

    // Show loading during hydration
    if (!admin) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Admins', href: '/dashboard/admins', icon: Users },
        { name: 'Networks', href: '/dashboard/networks', icon: Link2 },
        { name: 'Waitlist', href: '/dashboard/waitlist', icon: Mail },
        { name: 'Feature flags', href: '/dashboard/features', icon: ToggleLeft },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
        { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <Shield className="h-8 w-8 text-emerald-600 mr-2" />
                    <span className="font-bold text-lg text-slate-900">Handle Pay</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">
                            {getInitials(admin.firstName, admin.lastName)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {admin.firstName} {admin.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate capitalize">{admin.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
