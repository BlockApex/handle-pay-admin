import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    mfaCode: z.string().length(6, 'MFA code must be 6 digits').optional().or(z.literal('')),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const inviteAdminSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.enum(['super_admin', 'admin', 'support', 'viewer']),
    permissions: z.array(z.string()).optional(),
});

export type InviteAdminFormData = z.infer<typeof inviteAdminSchema>;

export const updateAdminSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    role: z.enum(['super_admin', 'admin', 'support', 'viewer']).optional(),
    permissions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export type UpdateAdminFormData = z.infer<typeof updateAdminSchema>;
