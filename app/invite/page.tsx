'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Check, X, Shield } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function InvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid invitation link');
            setIsValidToken(false);
        }
    }, [token]);

    // Password strength validation
    const passwordRequirements = {
        minLength: password.length >= 12,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*]/.test(password),
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            await authApi.acceptInvite(token!, password);
            toast.success('Invitation accepted! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to accept invitation';
            toast.error(message);
            setIsSubmitting(false);
        }
    };

    if (!token || !isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h1>
                    <p className="text-slate-600 mb-6">
                        This invitation link is invalid or has expired.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Accept Invitation
                        </h1>
                        <p className="text-slate-600">Set up your admin account password</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-slate-900 placeholder:text-slate-400"
                                placeholder="Enter strong password"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {/* Password Requirements */}
                        {password && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium text-slate-700 mb-2">Password must contain:</p>
                                <PasswordRequirement met={passwordRequirements.minLength} text="At least 12 characters" />
                                <PasswordRequirement met={passwordRequirements.hasUppercase} text="One uppercase letter" />
                                <PasswordRequirement met={passwordRequirements.hasLowercase} text="One lowercase letter" />
                                <PasswordRequirement met={passwordRequirements.hasNumber} text="One number" />
                                <PasswordRequirement met={passwordRequirements.hasSpecial} text="One special character (!@#$%^&*)" />
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-slate-900 placeholder:text-slate-400"
                                placeholder="Confirm your password"
                                disabled={isSubmitting}
                                required
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                            )}
                            {confirmPassword && passwordsMatch && (
                                <p className="mt-2 text-sm text-emerald-600 flex items-center">
                                    <Check className="h-4 w-4 mr-1" />
                                    Passwords match
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
                            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Setting up account...
                                </>
                            ) : (
                                'Accept Invitation'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div className="flex items-center text-sm">
            {met ? (
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
            ) : (
                <X className="h-4 w-4 text-slate-400 mr-2" />
            )}
            <span className={met ? 'text-emerald-600' : 'text-slate-600'}>{text}</span>
        </div>
    );
}
