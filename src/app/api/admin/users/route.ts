import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  try {
    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as "USER" | "ADMIN" }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          isSeller: true,
          sellerVerified: true,
          totalSales: true,
          totalRevenue: true,
          createdAt: true,
          _count: {
            select: {
              products: true,
              purchases: true,
              reviews: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "사용자 목록을 가져오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 사용자 정보 수정 (역할 변경 등)
export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  try {
    const body = await request.json();
    const { userId, role, isSeller, sellerVerified } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isSeller !== undefined) updateData.isSeller = isSeller;
    if (sellerVerified !== undefined) updateData.sellerVerified = sellerVerified;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSeller: true,
        sellerVerified: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 사용자 삭제
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "사용자 ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 자기 자신은 삭제 불가
    if (userId === adminCheck.userId) {
      return NextResponse.json(
        { error: "자기 자신은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: "사용자 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
