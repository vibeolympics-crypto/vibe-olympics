/**
 * 이메일 테스트 API
 * POST: 테스트 이메일 발송 (관리자 전용)
 * GET: Resend 도메인 상태 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

// Resend 도메인 상태 확인
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        configured: false,
        error: "RESEND_API_KEY가 설정되지 않았습니다.",
      });
    }

    const resend = new Resend(apiKey);

    // 도메인 목록 조회
    const { data: domains, error } = await resend.domains.list();

    if (error) {
      return NextResponse.json({
        configured: true,
        apiKeyValid: false,
        error: error.message,
      });
    }

    // API 키 목록 조회 (선택적)
    const apiKeyInfo = await resend.apiKeys.list();

    return NextResponse.json({
      configured: true,
      apiKeyValid: true,
      domains: domains?.data?.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        region: d.region,
        createdAt: d.created_at,
      })) || [],
      verifiedDomains: domains?.data?.filter((d) => d.status === "verified").length || 0,
      apiKeysCount: apiKeyInfo.data?.data?.length || 0,
      fromEmail: process.env.FROM_EMAIL || "noreply@vibeolympics.com",
    });
  } catch (error) {
    console.error("Error checking Resend status:", error);
    return NextResponse.json(
      { error: "Resend 상태 확인에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 테스트 이메일 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true, name: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { to, templateType = "test" } = body;

    const recipientEmail = to || user?.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "수신자 이메일이 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const appName = "Vibe Olympics";
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

    // 템플릿 선택
    let subject: string;
    let html: string;

    switch (templateType) {
      case "purchase":
        subject = `[${appName}] 구매 완료 테스트 이메일`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
              .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 8px; }
              .info-box { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
              .price { font-size: 24px; font-weight: bold; color: #059669; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎮 ${appName}</div>
              </div>
              <h2>구매해 주셔서 감사합니다! 🎉</h2>
              <p>안녕하세요, <strong>${user?.name || "고객"}님</strong>!</p>
              <p>상품 구매가 성공적으로 완료되었습니다.</p>
              <div class="info-box">
                <p><strong>상품명:</strong> 테스트 상품</p>
                <p><strong>결제 금액:</strong> <span class="price">₩10,000</span></p>
                <p><strong>주문 번호:</strong> TEST-${Date.now()}</p>
              </div>
              <p style="text-align: center;">
                <a href="${appUrl}/dashboard/purchases" class="button">다운로드 하러 가기</a>
              </p>
            </div>
          </body>
          </html>
        `;
        break;

      case "welcome":
        subject = `[${appName}] 환영합니다! 🎉`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
              .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎮 ${appName}</div>
              </div>
              <h2>${appName}에 오신 것을 환영합니다!</h2>
              <p>안녕하세요, <strong>${user?.name || "회원"}님</strong>!</p>
              <p>VIBE 코딩 기반 지식재산 마켓플레이스에서 다양한 디지털 상품을 만나보세요.</p>
              <p style="text-align: center;">
                <a href="${appUrl}/marketplace" class="button">마켓플레이스 둘러보기</a>
              </p>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        subject = `[${appName}] 테스트 이메일`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
              .success { color: #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎮 ${appName}</div>
              </div>
              <h2>이메일 발송 테스트 ✅</h2>
              <p>이 이메일은 Resend API 연동 테스트를 위해 발송되었습니다.</p>
              <p class="success">이메일 시스템이 정상적으로 작동하고 있습니다!</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                발송 시간: ${new Date().toLocaleString("ko-KR")}<br>
                발신자: ${fromEmail}<br>
                수신자: ${recipientEmail}
              </p>
            </div>
          </body>
          </html>
        `;
    }

    // 이메일 발송
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "테스트 이메일이 발송되었습니다.",
      emailId: data?.id,
      to: recipientEmail,
      templateType,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "테스트 이메일 발송에 실패했습니다." },
      { status: 500 }
    );
  }
}
