/**
 * Support Ticket Detail API
 * 티켓 상세 조회, 수정, 메시지 추가
 * 
 * Session 80 - 고객 지원 기능
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 메시지 추가 스키마
const addMessageSchema = z.object({
  content: z.string().min(1, "내용을 입력해주세요"),
  attachments: z.array(z.string()).optional(),
});

// 티켓 업데이트 스키마
const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  ratingComment: z.string().optional(),
});

// GET: 티켓 상세 조회
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    // 티켓 조회
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "티켓을 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 확인 (본인 티켓 또는 관리자)
    let isAdmin = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    }

    if (!isAdmin && ticket.userId !== session?.user?.id) {
      return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
    }

    return NextResponse.json({
      ticket: {
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
        rating: ticket.rating,
        ratingComment: ticket.ratingComment,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString(),
        messages: ticket.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          attachments: msg.attachments,
          isStaff: msg.isStaff,
          user: msg.user,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
      isAdmin,
    });
  } catch (error) {
    console.error("Ticket detail API error:", error);
    return NextResponse.json(
      { error: "티켓 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 티켓 수정 (상태, 담당자, 평점 등)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // 유효성 검사
    const validation = updateTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, priority, assigneeId, rating, ratingComment } = validation.data;

    // 티켓 조회
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "티켓을 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";

    // 일반 사용자는 평점만 수정 가능
    if (!isAdmin) {
      if (ticket.userId !== session.user.id) {
        return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
      }
      if (status || priority || assigneeId !== undefined) {
        return NextResponse.json({ error: "수정 권한이 없습니다" }, { status: 403 });
      }
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status as TicketStatus;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority as TicketPriority;
    }

    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId;
    }

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (ratingComment !== undefined) {
      updateData.ratingComment = ratingComment;
    }

    // 티켓 업데이트
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "티켓이 업데이트되었습니다",
      ticket: {
        id: updatedTicket.id,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assigneeId: updatedTicket.assigneeId,
        rating: updatedTicket.rating,
      },
    });
  } catch (error) {
    console.error("Ticket update API error:", error);
    return NextResponse.json(
      { error: "티켓 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 메시지 추가
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // 유효성 검사
    const validation = addMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, attachments } = validation.data;

    // 티켓 조회
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "티켓을 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";
    const isOwner = ticket.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
    }

    // 메시지 추가 및 티켓 상태 업데이트
    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: id,
          userId: session.user.id,
          content,
          attachments: attachments || [],
          isStaff: isAdmin,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      // 상태 자동 업데이트
      prisma.supportTicket.update({
        where: { id },
        data: {
          status: isAdmin ? "IN_PROGRESS" : "WAITING",
          updatedAt: new Date(),
        },
      }),
    ]);

    // TODO: 알림 발송 (이메일, 푸시)

    return NextResponse.json({
      message: "메시지가 추가되었습니다",
      ticketMessage: {
        id: message.id,
        content: message.content,
        attachments: message.attachments,
        isStaff: message.isStaff,
        user: message.user,
        createdAt: message.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Ticket message API error:", error);
    return NextResponse.json(
      { error: "메시지 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
