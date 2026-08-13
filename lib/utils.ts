import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Pull a human-readable message out of an axios error. NestJS validation
 * errors arrive as an array of strings; everything else is a single one.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
    const message = (
        error as {
            response?: { data?: { message?: string | string[] } };
        }
    )?.response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    return message ?? fallback;
}
