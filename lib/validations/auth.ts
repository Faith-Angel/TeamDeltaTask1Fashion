/**
 * lib/validations/auth.ts
 *
 * Zod schemas for all authentication inputs.
 * Used in both API route handlers (server-side) and React Hook Form (client-side).
 */

import { z } from "zod";
import { Role, MarketerSubRole } from "@prisma/client";

// ── Email ──────────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" })
  .max(255, { message: "Email must be 255 characters or fewer" })
  .toLowerCase();

// ── Password ───────────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password must be 128 characters or fewer" });

// ── Registration ───────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z
      .string()
      .trim()
      .min(1, { message: "Full name is required" })
      .max(100, { message: "Full name must be 100 characters or fewer" }),
    location: z
      .string()
      .trim()
      .min(1, { message: "Location is required" })
      .max(100, { message: "Location must be 100 characters or fewer" }),
    role: z.nativeEnum(Role, {
      errorMap: () => ({
        message: "Role must be Client, Designer, Vendor, or Marketer",
      }),
    }),
    marketerSubRole: z.nativeEnum(MarketerSubRole).optional(),
  })
  .superRefine((data, ctx) => {
    // marketerSubRole is required when role is Marketer
    if (data.role === Role.Marketer && !data.marketerSubRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["marketerSubRole"],
        message:
          "Marketers must choose a sub-role: Model or Content_Creator",
      });
    }
    // marketerSubRole must not be set for non-Marketer roles
    if (data.role !== Role.Marketer && data.marketerSubRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["marketerSubRole"],
        message: "Sub-role is only applicable for Marketers",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Login ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Refresh token ──────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required" }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
