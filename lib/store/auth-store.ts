'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Admin {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    mfaEnabled: boolean;
}

interface AuthState {
    admin: Admin | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;

    login: (admin: Admin, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    updateAdmin: (admin: Partial<Admin>) => void;
}

// Helper to set cookie
function setCookie(name: string, value: string, days: number = 7) {
    if (typeof document !== 'undefined') {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
}

// Helper to delete cookie
function deleteCookie(name: string) {
    if (typeof document !== 'undefined') {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            admin: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            login: (admin, accessToken, refreshToken) => {
                // Store tokens in localStorage
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Set cookie for middleware
                setCookie('accessToken', accessToken, 7);

                set({
                    admin,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                // Clear localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                // Clear cookie
                deleteCookie('accessToken');

                set({
                    admin: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                setCookie('accessToken', accessToken, 7);

                set({ accessToken, refreshToken });
            },

            updateAdmin: (updates) =>
                set((state) => ({
                    admin: state.admin ? { ...state.admin, ...updates } : null,
                })),
        }),
        {
            name: 'admin-storage',
            partialize: (state) => ({
                // Only persist admin info, not tokens (security)
                admin: state.admin,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
