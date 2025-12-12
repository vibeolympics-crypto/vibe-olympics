import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// POST /api/auth/forgot-password - 비밀번호 재설정 이메일 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요" },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다" },
        { status: 400 }
      );
    }

    // 사용자 확인 - 존재하지 않아도 보안을 위해 같은 응답
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, password: true },
    });

    // OAuth 전용 계정인 경우 (비밀번호가 없는 경우)
    if (user && !user.password) {
      // 보안을 위해 동일한 메시지 반환
      return NextResponse.json({
        message: "이메일이 존재하면 비밀번호 재설정 링크가 발송됩니다",
        success: true,
      });
    }

    // 사용자가 존재하고 비밀번호 로그인을 사용하는 경우
    if (user) {
      // 기존 토큰 삭제 (해당 이메일의 모든 토큰)
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      });

      // 새 토큰 생성 (32바이트 랜덤 문자열)
      const token = crypto.randomBytes(32).toString("hex");
      
      // 토큰 만료 시간 (1시간)
      const expires = new Date(Date.now() + 3600000);

      // 토큰 저장
      await prisma.passwordResetToken.create({
        data: {
          email: user.email,
          token,
          expires,
        },
      });

      // 재설정 링크 생성
      const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

      // 이메일 발송
      await sendPasswordResetEmail(user.email, {
        userName: user.name || "회원",
        resetLink,
      });
    }

    // 보안을 위해 사용자 존재 여부와 관계없이 동일한 응답
    return NextResponse.json({
      message: "이메일이 존재하면 비밀번호 재설정 링크가 발송됩니다",
      success: true,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
