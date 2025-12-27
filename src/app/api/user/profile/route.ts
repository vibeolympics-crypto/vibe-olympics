import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { withSecurity, securityLogger, sanitizer } from "@/lib/security";

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

// 프로필 조회 (GET) - 내부 핸들러
async function handleGetProfile(request: NextRequest): Promise<NextResponse> {
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

// 프로필 조회 (GET) - 보안 래퍼 적용
export async function GET(request: NextRequest) {
  return withSecurity(request, handleGetProfile, {
    rateLimit: "api",
  });
}

// 프로필 업데이트 (PATCH) - 내부 핸들러
async function handleUpdateProfile(request: NextRequest): Promise<NextResponse> {
  const context = securityLogger.extractContext(request);

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

    // XSS 방지: 프로필 내용 정화
    const sanitizedName = data.name ? sanitizer.text(data.name) : undefined;
    const sanitizedBio = data.bio ? sanitizer.html(data.bio) : undefined;
    const sanitizedGithub = data.github ? sanitizer.text(data.github) : undefined;
    const sanitizedTwitter = data.twitter ? sanitizer.text(data.twitter) : undefined;

    // 빈 문자열 처리 (null로 변환)
    const updateData: Record<string, string | null> = {};
    if (sanitizedName !== undefined) updateData.name = sanitizedName || null;
    if (sanitizedBio !== undefined) updateData.bio = sanitizedBio || null;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (sanitizedGithub !== undefined) updateData.github = sanitizedGithub || null;
    if (sanitizedTwitter !== undefined) updateData.twitter = sanitizedTwitter || null;
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

    // 보안 로그: 프로필 업데이트 이벤트
    securityLogger.log({
      type: "LOGIN_SUCCESS", // 일반 활동 로그로 사용
      severity: "low",
      userId: session.user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      details: {
        action: "PROFILE_UPDATED",
        updatedFields: Object.keys(updateData),
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

// 프로필 업데이트 (PATCH) - 보안 래퍼 적용
export async function PATCH(request: NextRequest) {
  return withSecurity(request, handleUpdateProfile, {
    rateLimit: "api",
  });
}
