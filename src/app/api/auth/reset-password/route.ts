import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordChangedEmail } from "@/lib/email";
import { withSecurity, securityLogger, accountSecurity } from "@/lib/security";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

// POST /api/auth/reset-password - 비밀번호 재설정
// Rate Limit 적용 (민감 작업: 분당 3회, 초과 시 10분 차단)
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req) => {
    const context = securityLogger.extractContext(req);

    try {
      const body = await req.json();
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
        // 보안 이벤트 로깅 - 유효하지 않은 토큰
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          ip: context.ip,
          userAgent: context.userAgent,
          details: {
            action: 'invalid_reset_token',
            tokenPrefix: token.substring(0, 8) + '...'
          },
        });

        // 토큰 기반 실패 시도 기록 (무차별 대입 공격 방지)
        accountSecurity.recordFailedAttempt(`reset_token:${context.ip}`);

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

        // 보안 이벤트 로깅 - 만료된 토큰
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          ip: context.ip,
          userAgent: context.userAgent,
          details: { action: 'expired_reset_token' },
        });

        return NextResponse.json(
          { error: "토큰이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요." },
          { status: 400 }
        );
      }

      // 계정 잠금 상태 확인
      const lockCheck = accountSecurity.checkLoginAttempt(`reset:${passwordResetToken.email}`);
      if (!lockCheck.allowed) {
        securityLogger.log({
          type: 'ACCOUNT_LOCKED',
          severity: 'high',
          ip: context.ip,
          userAgent: context.userAgent,
          details: {
            action: 'password_reset_blocked',
            email: passwordResetToken.email.substring(0, 3) + '***',
            lockedUntil: lockCheck.lockedUntil?.toISOString()
          },
        });

        return NextResponse.json(
          { error: "너무 많은 시도로 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
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

      // 계정 잠금 해제
      accountSecurity.clearAttempts(`reset:${user.email}`);
      accountSecurity.clearAttempts(`reset_token:${context.ip}`);

      // 비밀번호 변경 알림 이메일 발송
      await sendPasswordChangedEmail(user.email, {
        userName: user.name || "회원",
      });

      // 보안 이벤트 로깅 - 비밀번호 변경 성공
      securityLogger.log({
        type: 'LOGIN_SUCCESS',
        severity: 'low',
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        details: { action: 'password_reset_success' },
      });

      return NextResponse.json({
        message: "비밀번호가 성공적으로 변경되었습니다",
        success: true,
      });
    } catch (error) {
      console.error("Reset password error:", error);

      // 보안 이벤트 로깅 - 오류
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        details: {
          action: 'password_reset_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
      });

      return NextResponse.json(
        { error: "비밀번호 재설정 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
  }, { rateLimit: 'sensitive' });
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
