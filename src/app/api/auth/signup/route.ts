import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { recordSignup } from "@/lib/realtime-events";
import { withSecurity, rateLimit, securityLogger } from "@/lib/security";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 회원가입 스키마
const signupSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "비밀번호는 영문 대소문자와 숫자를 포함해야 합니다"
    ),
});

// Rate Limit 적용 (인증 API: 분당 5회, 초과 시 5분 차단)
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req) => {
    const context = securityLogger.extractContext(req);

    try {
      const body = await req.json();

      // 유효성 검사
      const validation = signupSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, password } = validation.data;

      // 이메일 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // 보안 이벤트 로깅 - 중복 이메일 시도
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          ip: context.ip,
          userAgent: context.userAgent,
          details: {
            action: 'signup_duplicate_email',
            email: email.substring(0, 3) + '***'
          },
        });

        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다" },
          { status: 400 }
        );
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);

      // 사용자 생성
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // 환영 이메일 발송 (비동기)
      try {
        await sendWelcomeEmail(email, {
          userName: name,
        });
      } catch (emailError) {
        console.error("Welcome email sending failed:", emailError);
      }

      // 실시간 이벤트 기록 (관리자 대시보드용)
      recordSignup(user.id, name);

      // 보안 이벤트 로깅 - 회원가입 성공
      securityLogger.log({
        type: 'LOGIN_SUCCESS',
        severity: 'low',
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        details: { action: 'signup_success' },
      });

      return NextResponse.json(
        {
          message: "회원가입이 완료되었습니다",
          user,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Signup error:", error);

      // 보안 이벤트 로깅 - 회원가입 오류
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        details: {
          action: 'signup_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
      });

      return NextResponse.json(
        { error: "회원가입 처리 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
  }, { rateLimit: 'auth' });
}
