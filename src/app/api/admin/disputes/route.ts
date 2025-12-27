/**
 * 관리자 분쟁 관리 API
 * GET /api/admin/disputes - 분쟁 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDisputes } from "@/lib/trust-safety";
import { DisputeStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status") as DisputeStatus | null;

    const disputes = await getDisputes({
      status: status ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    console.error("Admin disputes fetch error:", error);
    return NextResponse.json(
      { error: "분쟁 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
