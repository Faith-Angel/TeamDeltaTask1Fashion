/**
 * app/api/designers/[id]/route.ts
 *
 * GET /api/designers/:id
 *
 * Returns a designer's full public profile including:
 *   - User info (name, location)
 *   - Up to 20 portfolio images (ordered by most recent)
 *   - Ranking score and review count
 *   - Availability status
 *   - Completed fits and pending appointments count
 *   - Published training programs (title, price, remaining slots)
 *   - Active collaboration projects
 *
 * Accessible to any authenticated user and guests (read-only browse).
 *
 * Responses:
 *   200  { designer }
 *   404  Designer not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internalError } from "@/lib/auth/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await db.designerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        availability: true,
        rankingScore: true,
        reviewCount: true,
        completedFitsCount: true,
        pendingAppointmentsCount: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            location: true,
            role: true,
          },
        },
        portfolioImages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            url: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        trainingPrograms: {
          where: { status: "Published" },
          select: {
            id: true,
            title: true,
            durationCategory: true,
            startDate: true,
            priceXAF: true,
            maxCapacity: true,
            enrolledCount: true,
            timetable: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Designer not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Compute remaining slots for each training program
    const designer = {
      ...profile,
      trainingPrograms: profile.trainingPrograms.map((p) => ({
        ...p,
        remainingSlots: p.maxCapacity - p.enrolledCount,
      })),
    };

    return NextResponse.json({ designer }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
