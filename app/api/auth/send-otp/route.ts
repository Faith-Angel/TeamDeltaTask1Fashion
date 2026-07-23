/**
 * app/api/auth/send-otp/route.ts
 *
 * POST /api/auth/send-otp
 *
 * Sends a 6-digit OTP to the provided phone number via Supabase Auth
 * (which uses Twilio under the hood).
 *
 * This endpoint is intentionally stateless — it does NOT distinguish
 * between new registrations and returning users. The client passes
 * registration fields only when verifying (not when requesting the OTP).
 *
 * Rate limiting is handled at the middleware level (Task 18).
 *
 * Request body:
 *   { phone: string }  — E.164 format e.g. +237612345678
 *
 * Responses:
 *   200  { message: string }
 *   422  Validation error
 *   502  Supabase / Twilio failed to send
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendOtpSchema } from "@/lib/validations/auth";
import {
  validationError,
  otpSendFailedError,
  internalError,
} from "@/lib/auth/errors";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return validationError(fieldErrors);
    }

    const { phone } = parsed.data;

    // 2. Ask Supabase Auth to send the OTP via Twilio
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        // If the phone is not registered, Supabase will create a new
        // auth.users entry automatically. We then create the Prisma User
        // record on /verify-otp after the user confirms registration details.
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("[send-otp] Supabase error:", error.message);
      return otpSendFailedError(
        // Surface rate-limit messages from Supabase but mask internal ones
        error.message.toLowerCase().includes("rate")
          ? "Too many OTP requests. Please wait a moment and try again."
          : undefined
      );
    }

    return NextResponse.json(
      { message: "OTP sent successfully. Please check your phone." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
