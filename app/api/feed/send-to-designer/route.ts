/**
 * app/api/feed/send-to-designer/route.ts
 *
 * GET /api/feed/send-to-designer?location=<clientLocation>
 *
 * Returns designers whose registered location matches the client's location.
 * Used by the "Send to Designer" button on the Inspiration Feed image detail view.
 *
 * Per the spec:
 *   - Returns only designers whose location exactly matches (case-insensitive)
 *   - Returns empty array (not 404) when no designers match
 *   - No pagination needed — this is a contextual picker list (max 20 results)
 *
 * Query params:
 *   location  — the client's location to match against (required)
 *
 * Accessible to authenticated users only (guests cannot use Send to Designer).
 *
 * Responses:
 *   200  { designers }         — may be empty array
 *   400  Missing location param
 *   401  Not authenticated
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.trim();

    if (!location) {
      return NextResponse.json(
        { error: "location query parameter is required.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const profiles = await db.designerProfile.findMany({
      where: {
        user: {
          location: { equals: location, mode: "insensitive" },
        },
        // Only return available or busy designers — not unavailable
        availability: { not: "Unavailable" },
      },
      orderBy: [
        { rankingScore: "desc" },
        { updatedAt: "desc" },
      ],
      take: 20,
      select: {
        id: true,
        availability: true,
        rankingScore: true,
        user: {
          select: {
            id: true,
            fullName: true,
            location: true,
          },
        },
        portfolioImages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { url: true },
        },
      },
    });

    const designers = profiles.map((p) => ({
      id:           p.id,
      userId:       p.user.id,
      fullName:     p.user.fullName,
      location:     p.user.location,
      availability: p.availability,
      rankingScore: p.rankingScore,
      thumbnail:    p.portfolioImages[0]?.url ?? null,
    }));

    // Per spec: return empty array with message when no matches found
    return NextResponse.json(
      {
        designers,
        message:
          designers.length === 0
            ? "No designers available in your area."
            : undefined,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
