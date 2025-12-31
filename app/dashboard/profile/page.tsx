'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Shield, Mail, User, Key, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';
import Image from 'next/image';

export default function ProfilePage() {
    const { admin, updateAdmin } = useAuthStore();
    const [showMFASetup, setShowMFASetup] = useState(false);
    const [mfaData, setMFAData] = useState<{ qrCode: string; secret: string; backupCodes: string[] } | null>(null);
    const [mfaCode, setMFACode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch fresh profile data on mount to ensure MFA status is current
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await authApi.getProfile();
                updateAdmin(profile);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };
        fetchProfile();
    }, [updateAdmin]);

    if (!admin) return null;

    const handleSetupMFA = async () => {
        setIsLoading(true);
        try {
            const data = await authApi.setupMFA();
            setMFAData(data);
            setShowMFASetup(true);
            toast.success('MFA setup initiated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to setup MFA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMFA = async () => {
        if (!mfaCode || mfaCode.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.verifyMFA(mfaCode);
            updateAdmin({ mfaEnabled: true });
            toast.success('MFA enabled successfully!');
            setShowMFASetup(false);
            setMFAData(null);
            setMFACode('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid MFA code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <User className="h-5 w-5 text-slate-400 mr-3" />
                                <div>
                                    <p className="text-sm text-slate-600">Name</p>
                                    <p className="font-medium text-slate-900">
                                        {admin.firstName} {admin.lastName}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Mail className="h-5 w-5 text-slate-400 mr-3" />
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="font-medium text-slate-900">{admin.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Shield className="h-5 w-5 text-slate-400 mr-3" />
                                <div>
                                    <p className="text-sm text-slate-600">Role</p>
                                    <p className="font-medium text-slate-900 capitalize">
                                        {admin.role.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MFA Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Enhance your account security with MFA
                                </p>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${admin.mfaEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                                }`}>
                                {admin.mfaEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>

                        {!admin.mfaEnabled && !showMFASetup && (
                            <button
                                onClick={handleSetupMFA}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-5 w-5 mr-2" />
                                        Setup MFA
                                    </>
                                )}
                            </button>
                        )}

                        {showMFASetup && mfaData && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-sm text-slate-600 mb-4">
                                        Scan this QR code with your authenticator app
                                    </p>
                                    <div className="inline-block p-4 bg-white border-2 border-slate-200 rounded-lg">
                                        <Image
                                            src={mfaData.qrCode}
                                            alt="MFA QR Code"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Enter the 6-digit code from your app
                                    </label>
                                    <input
                                        type="text"
                                        value={mfaCode}
                                        onChange={(e) => setMFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-2xl tracking-widest font-mono text-slate-900"
                                        placeholder="000000"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    onClick={handleVerifyMFA}
                                    disabled={isLoading || mfaCode.length !== 6}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify and Enable MFA'
                                    )}
                                </button>

                                {mfaData.backupCodes.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm font-medium text-yellow-900 mb-2">
                                            ⚠️ Save these backup codes
                                        </p>
                                        <div className="space-y-1">
                                            {mfaData.backupCodes.slice(0, 3).map((code, i) => (
                                                <p key={i} className="text-sm font-mono text-yellow-900">
                                                    {code}
                                                </p>
                                            ))}
                                        </div>
                                        <p className="text-xs text-yellow-700 mt-2">
                                            Store these codes securely. They can be used to access your account if you lose your device.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Permissions */}
                <div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Permissions</h2>
                        <div className="space-y-2">
                            {admin.permissions.map((permission) => (
                                <div
                                    key={permission}
                                    className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
                                >
                                    {permission}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
