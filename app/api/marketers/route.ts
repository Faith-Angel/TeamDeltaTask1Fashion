/**
 * app/api/marketers/route.ts
 *
 * GET /api/marketers
 *
 * Marketer directory — accessible to authenticated Designers.
 *
 * Query params:
 *   subRole   — "Model" | "Content_Creator" (optional)
 *   location  — exact match, case-insensitive (optional)
 *   cursor    — pagination cursor (marketerProfile ID)
 *   limit     — page size (default 20, max 100 per spec)
 *
 * Per spec: up to 100 profiles per page.
 * Returns: name, subRole, location, bookingStatus, portfolio thumbnail.
 *
 * Responses:
 *   200  { marketers, nextCursor, hasMore }
 *   401  Not authenticated
 *   403  Only Designers can browse marketers
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role, MarketerSubRole } from "@prisma/client";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can browse the Marketer directory.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subRoleParam = searchParams.get("subRole");
    const location     = searchParams.get("location")?.trim() ?? undefined;
    const cursor       = searchParams.get("cursor") ?? undefined;
    const limitParam   = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
    const limit        = Math.min(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, MAX_LIMIT);

    const validSubRoles = Object.values(MarketerSubRole);
    const subRoleFilter =
      subRoleParam && validSubRoles.includes(subRoleParam as MarketerSubRole)
        ? (subRoleParam as MarketerSubRole)
        : undefined;

    const profiles = await db.marketerProfile.findMany({
      where: {
        ...(subRoleFilter ? { subRole: subRoleFilter } : {}),
        ...(location
          ? { user: { location: { equals: location, mode: "insensitive" } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        subRole: true,
        bookingStatus: true,
        user: {
          select: {
            id: true,
            fullName: true,
            location: true,
          },
        },
        portfolioFiles: {
          where: { fileType: "image" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { url: true },
        },
      },
    });

    const hasMore = profiles.length > limit;
    const page    = hasMore ? profiles.slice(0, limit) : profiles;

    const marketers = page.map((p) => ({
      id:            p.id,
      userId:        p.user.id,
      fullName:      p.user.fullName,
      location:      p.user.location,
      subRole:       p.subRole,
      bookingStatus: p.bookingStatus,
      thumbnail:     p.portfolioFiles[0]?.url ?? null,
    }));

    return NextResponse.json(
      {
        marketers,
        nextCursor: hasMore ? page[page.length - 1].id : null,
        hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
