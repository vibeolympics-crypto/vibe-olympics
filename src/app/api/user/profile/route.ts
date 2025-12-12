import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  image: z.string().url().optional(),
});

// 프로필 조회 (GET)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        github: true,
        twitter: true,
        isSeller: true,
        sellerVerified: true,
        sellerBio: true,
        totalSales: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "프로필 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 프로필 업데이트 (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 유효성 검사
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 빈 문자열 처리 (null로 변환)
    const updateData: Record<string, string | null> = {};
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.github !== undefined) updateData.github = data.github || null;
    if (data.twitter !== undefined) updateData.twitter = data.twitter || null;
    if (data.image !== undefined) updateData.image = data.image || null;

    // 업데이트
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        github: true,
        twitter: true,
        isSeller: true,
        sellerVerified: true,
      },
    });

    return NextResponse.json({ 
      message: "프로필이 업데이트되었습니다",
      user 
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
