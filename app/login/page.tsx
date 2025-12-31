'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { loginSchema, type LoginFormData } from '@/lib/validators/schemas';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [requiresMFA, setRequiresMFA] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        try {
            const response = await authApi.login(data);

            if (response.mfaRequired && !data.mfaCode) {
                setRequiresMFA(true);
                toast.info('Please enter your MFA code');
                setIsLoading(false);
                return;
            }

            login(response.admin, response.accessToken, response.refreshToken);
            toast.success('Login successful!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 100);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Handle Pay Admin
                        </h1>
                        <p className="text-slate-600">Sign in to your admin account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-slate-900 placeholder:text-slate-400"
                                placeholder="admin@handlepay.io"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...register('password')}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••••••"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {requiresMFA && (
                            <div>
                                <label htmlFor="mfaCode" className="block text-sm font-medium text-slate-700 mb-2">
                                    MFA Code
                                </label>
                                <input
                                    id="mfaCode"
                                    type="text"
                                    {...register('mfaCode')}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono text-slate-900"
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={isLoading}
                                    autoComplete="one-time-code"
                                />
                                {errors.mfaCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.mfaCode.message}</p>
                                )}
                                <p className="mt-2 text-xs text-slate-500">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Handle Pay Admin Dashboard v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
