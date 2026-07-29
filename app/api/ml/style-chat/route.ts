/**
 * app/api/ml/style-chat/route.ts
 *
 * POST /api/ml/style-chat
 *
 * Server-side proxy to the ML microservice's style chat endpoint.
 * Keeps ML_API_KEY server-side only — never sent to the browser.
 *
 * Accepts: { message, conversation_id?, history?, extract_brief? }
 * Forwards to: ${ML_SERVICE_URL}/api/v1/style-chat with X-API-Key header
 *
 * Responses:
 *   200  { reply, conversation_id, brief? }
 *   502  ML service unavailable / bad gateway
 *   503  ML service timed out
 */

import { NextRequest, NextResponse } from "next/server";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_API_KEY = process.env.ML_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "message is required and must be a string.", code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(`${ML_SERVICE_URL}/api/v1/style-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ML_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.detail || "ML style chat service returned an error.",
          code: "ML_SERVICE_ERROR",
        },
        { status: response.status === 504 ? 503 : 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Style chat service timed out. Please try again.", code: "TIMEOUT" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Style chat service is temporarily unavailable.", code: "UNAVAILABLE" },
      { status: 502 }
    );
  }
}
