/**
 * 사용자 신뢰 정보 API
 * GET /api/user/trust - 내 신뢰 정보 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserTrust } from "@/lib/trust-safety";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 다른 사용자의 신뢰 정보 조회는 관리자만 가능
    if (userId && userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const userTrust = await getUserTrust(userId ?? session.user.id);

    return NextResponse.json({
      success: true,
      data: userTrust,
    });
  } catch (error) {
    console.error("User trust fetch error:", error);
    return NextResponse.json(
      { error: "신뢰 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
