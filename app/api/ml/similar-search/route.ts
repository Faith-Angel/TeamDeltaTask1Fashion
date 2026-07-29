/**
 * app/api/ml/similar-search/route.ts
 *
 * POST /api/ml/similar-search
 *
 * Server-side proxy to the ML microservice's similar search endpoint.
 * Keeps ML_API_KEY server-side only — never sent to the browser.
 *
 * Accepts: { image_url, top_k?, filter? }
 * Forwards to: ${ML_SERVICE_URL}/api/v1/similar-search/url with X-API-Key header
 *
 * Responses:
 *   200  { results: [...], query_time_ms }
 *   502  ML service unavailable / bad gateway
 *   503  ML service timed out
 */

import { NextRequest, NextResponse } from "next/server";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_API_KEY = process.env.ML_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.image_url || typeof body.image_url !== "string") {
      return NextResponse.json(
        { error: "image_url is required and must be a string.", code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(`${ML_SERVICE_URL}/api/v1/similar-search/url`, {
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
          error: errorData.detail || "ML similar search service returned an error.",
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
        { error: "Similar search service timed out. Please try again.", code: "TIMEOUT" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Similar search service is temporarily unavailable.", code: "UNAVAILABLE" },
      { status: 502 }
    );
  }
}
