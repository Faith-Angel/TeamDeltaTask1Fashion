/**
 * lib/validations/auth.ts
 *
 * Zod schemas for all authentication inputs.
 * Used in both API route handlers (server-side) and React Hook Form (client-side).
 */

import { z } from "zod";
import { Role, MarketerSubRole } from "@prisma/client";

// ── Phone number ───────────────────────────────────────────────────────────────
// Must be E.164 format: +237 followed by 9 digits (Cameroon)
// Also accepts other country codes for flexibility during development.

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, {
    message:
      "Phone number must be in E.164 format (e.g. +237612345678)",
  });

// ── Send OTP ───────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

// ── Verify OTP (first-time registration) ──────────────────────────────────────

export const verifyOtpRegisterSchema = z
  .object({
    phone: phoneSchema,
    token: z
      .string()
      .trim()
      .length(6, { message: "OTP must be exactly 6 digits" })
      .regex(/^\d+$/, { message: "OTP must contain digits only" }),
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

export type VerifyOtpRegisterInput = z.infer<typeof verifyOtpRegisterSchema>;

// ── Verify OTP (returning user login) ─────────────────────────────────────────

export const verifyOtpLoginSchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .trim()
    .length(6, { message: "OTP must be exactly 6 digits" })
    .regex(/^\d+$/, { message: "OTP must contain digits only" }),
});

export type VerifyOtpLoginInput = z.infer<typeof verifyOtpLoginSchema>;

// ── Refresh token ──────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required" }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
