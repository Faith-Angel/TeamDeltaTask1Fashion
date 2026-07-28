/**
 * app/api/designers/route.ts
 *
 * GET /api/designers
 *
 * Designer directory — publicly accessible (no auth required).
 *
 * Query params:
 *   location  — exact match on user.location (case-insensitive, optional)
 *   sort      — "ranking" (default) | "recent"
 *   q         — keyword search on designer's full name or location (optional, 1–100 chars)
 *   cursor    — pagination cursor (designerProfile ID)
 *   limit     — page size (default 20, max 50)
 *
 * Sort behaviour (spec requirement):
 *   - Primary:   rankingScore DESC
 *   - Tiebreak:  updatedAt DESC (most recently active first)
 *
 * Each result includes:
 *   - name, location (from User)
 *   - rankingScore, reviewCount, availability
 *   - Single portfolio thumbnail (most recent image)
 *
 * Responses:
 *   200  { designers, nextCursor, hasMore }
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internalError } from "@/lib/auth/errors";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get("location")?.trim() ?? undefined;
    const q        = searchParams.get("q")?.trim() ?? undefined;
    const cursor   = searchParams.get("cursor") ?? undefined;
    const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
    const limit    = Math.min(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, MAX_LIMIT);

    const profiles = await db.designerProfile.findMany({
      where: {
        // Location filter — exact match, case-insensitive
        ...(location
          ? {
              user: {
                location: { equals: location, mode: "insensitive" },
              },
            }
          : {}),
        // Keyword search — name OR location contains the query
        ...(q
          ? {
              user: {
                OR: [
                  { fullName: { contains: q, mode: "insensitive" } },
                  { location: { contains: q, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      // Primary sort: ranking DESC, tiebreak: updatedAt DESC
      orderBy: [
        { rankingScore: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        availability: true,
        rankingScore: true,
        reviewCount: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            location: true,
          },
        },
        // Single thumbnail — most recent portfolio image
        portfolioImages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { url: true },
        },
      },
    });

    const hasMore = profiles.length > limit;
    const page    = hasMore ? profiles.slice(0, limit) : profiles;

    // Flatten thumbnail for convenience
    const designers = page.map((p) => ({
      id:           p.id,
      fullName:     p.user.fullName,
      location:     p.user.location,
      userId:       p.user.id,
      availability: p.availability,
      rankingScore: p.rankingScore,
      reviewCount:  p.reviewCount,
      thumbnail:    p.portfolioImages[0]?.url ?? null,
    }));

    return NextResponse.json(
      {
        designers,
        nextCursor: hasMore ? page[page.length - 1].id : null,
        hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
