import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordChangedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

// POST /api/auth/reset-password - 비밀번호 재설정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "토큰과 새 비밀번호를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    // 토큰 확인
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다. 비밀번호 재설정을 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 토큰 만료 확인
    if (passwordResetToken.expires < new Date()) {
      // 만료된 토큰 삭제
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });

      return NextResponse.json(
        { error: "토큰이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { email: passwordResetToken.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 사용된 토큰 삭제
    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    // 비밀번호 변경 알림 이메일 발송
    await sendPasswordChangedEmail(user.email, {
      userName: user.name || "회원",
    });

    return NextResponse.json({
      message: "비밀번호가 성공적으로 변경되었습니다",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET /api/auth/reset-password - 토큰 유효성 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "토큰이 필요합니다", valid: false },
        { status: 400 }
      );
    }

    // 토큰 확인
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return NextResponse.json({
        valid: false,
        error: "유효하지 않은 토큰입니다",
      });
    }

    // 토큰 만료 확인
    if (passwordResetToken.expires < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "토큰이 만료되었습니다",
      });
    }

    return NextResponse.json({
      valid: true,
      email: passwordResetToken.email,
    });
  } catch (error) {
    console.error("Validate token error:", error);
    return NextResponse.json(
      { error: "토큰 확인 중 오류가 발생했습니다", valid: false },
      { status: 500 }
    );
  }
}
