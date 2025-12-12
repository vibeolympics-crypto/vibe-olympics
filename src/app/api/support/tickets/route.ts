/**
 * Support Ticket API
 * 고객 지원 티켓 관리 API
 * 
 * Session 80 - 고객 지원 기능
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 티켓 생성 스키마
const createTicketSchema = z.object({
  subject: z.string().min(5, "제목은 5자 이상이어야 합니다").max(200),
  category: z.enum(["GENERAL", "ORDER", "REFUND", "PRODUCT", "ACCOUNT", "TECHNICAL", "REPORT", "SELLER", "OTHER"]),
  message: z.string().min(10, "내용은 10자 이상이어야 합니다"),
  email: z.string().email("유효한 이메일을 입력해주세요").optional(),
  name: z.string().min(2).optional(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
});

// GET: 티켓 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // 필터 파라미터
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as TicketStatus | null;
    const category = searchParams.get("category") as TicketCategory | null;
    const priority = searchParams.get("priority") as TicketPriority | null;
    const myOnly = searchParams.get("myOnly") === "true";
    const assigned = searchParams.get("assigned") === "true";
    const search = searchParams.get("search");

    // 관리자 확인
    let isAdmin = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    }

    // 필터 조건 구성
    const where: Record<string, unknown> = {};

    // 일반 사용자는 자신의 티켓만
    if (!isAdmin) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
      }
      where.userId = session.user.id;
    } else {
      // 관리자 필터
      if (myOnly && session?.user?.id) {
        where.userId = session.user.id;
      }
      if (assigned && session?.user?.id) {
        where.assigneeId = session.user.id;
      }
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // 티켓 조회
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    // 상태별 통계 (관리자용)
    let statusCounts = null;
    if (isAdmin) {
      const counts = await prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { status: true },
      });
      statusCounts = counts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);
    }

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        email: ticket.email,
        name: ticket.name,
        user: ticket.user,
        assignee: ticket.assignee,
        orderId: ticket.orderId,
        productId: ticket.productId,
        messageCount: ticket._count.messages,
        rating: ticket.rating,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    });
  } catch (error) {
    console.error("Support ticket API error:", error);
    return NextResponse.json(
      { error: "티켓 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 티켓 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // 유효성 검사
    const validation = createTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { subject, category, message, email, name, orderId, productId } = validation.data;

    // 이메일 결정 (로그인 사용자 > 입력 이메일)
    const ticketEmail = session?.user?.email || email;
    if (!ticketEmail) {
      return NextResponse.json(
        { error: "이메일이 필요합니다" },
        { status: 400 }
      );
    }

    // 티켓 생성
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.user?.id,
        email: ticketEmail,
        name: name || session?.user?.name,
        subject,
        category: category as TicketCategory,
        priority: "NORMAL",
        status: "OPEN",
        orderId,
        productId,
        messages: {
          create: {
            userId: session?.user?.id,
            content: message,
            isStaff: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // TODO: 알림 이메일 발송

    return NextResponse.json({
      message: "문의가 접수되었습니다",
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Support ticket creation error:", error);
    return NextResponse.json(
      { error: "티켓 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
