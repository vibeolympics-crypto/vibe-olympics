import { Resend } from "resend";

// Resend 클라이언트 (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// 이메일 발송자 주소
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@vibeolympics.com";
const APP_NAME = "Vibe Olympics";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

// ==========================================
// 이메일 템플릿
// ==========================================

interface EmailTemplate {
  subject: string;
  html: string;
}

// 기본 이메일 레이아웃
const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #7c3aed;
    }
    .content {
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #7c3aed;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
    .button:hover {
      background-color: #6d28d9;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .highlight {
      color: #7c3aed;
      font-weight: 600;
    }
    .info-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      color: #059669;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎮 ${APP_NAME}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>이 이메일은 ${APP_NAME}에서 발송되었습니다.</p>
      <p><a href="${APP_URL}">웹사이트 방문하기</a></p>
    </div>
  </div>
</body>
</html>
`;

// 구매 완료 이메일 (구매자용)
export const purchaseConfirmationEmail = (data: {
  buyerName: string;
  productTitle: string;
  price: number;
  purchaseId: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구매가 완료되었습니다 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>구매해 주셔서 감사합니다! 🎉</h2>
    <p>안녕하세요, <span class="highlight">${data.buyerName}</span>님!</p>
    <p>상품 구매가 성공적으로 완료되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>결제 금액:</strong> <span class="price">₩${data.price.toLocaleString()}</span></p>
      <p><strong>주문 번호:</strong> ${data.purchaseId}</p>
    </div>
    
    <p>구매하신 상품은 대시보드의 구매 내역에서 다운로드하실 수 있습니다.</p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/purchases" class="button">다운로드 하러 가기</a>
    </p>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      문의사항이 있으시면 언제든 연락해 주세요.
    </p>
  `),
});

// 판매 알림 이메일 (판매자용)
export const saleNotificationEmail = (data: {
  sellerName: string;
  productTitle: string;
  price: number;
  buyerName: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 새로운 판매가 발생했습니다! 🎊`,
  html: baseLayout(`
    <h2>축하합니다! 판매가 발생했습니다 🎊</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>회원님의 상품이 판매되었습니다.</p>
    
    <div class="info-box">
      <p><strong>판매 상품:</strong> ${data.productTitle}</p>
      <p><strong>판매 금액:</strong> <span class="price">₩${data.price.toLocaleString()}</span></p>
      <p><strong>구매자:</strong> ${data.buyerName}</p>
    </div>
    
    <p>판매 현황은 대시보드에서 확인하실 수 있습니다.</p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/analytics" class="button">대시보드 보기</a>
    </p>
  `),
});

// 리뷰 알림 이메일 (판매자용)
export const reviewNotificationEmail = (data: {
  sellerName: string;
  productTitle: string;
  rating: number;
  reviewerName: string;
  reviewContent: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 새로운 리뷰가 작성되었습니다 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>새로운 리뷰가 작성되었습니다 ⭐</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>회원님의 상품에 새로운 리뷰가 작성되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품:</strong> ${data.productTitle}</p>
      <p><strong>평점:</strong> ${"⭐".repeat(data.rating)}${"☆".repeat(5 - data.rating)} (${data.rating}/5)</p>
      <p><strong>작성자:</strong> ${data.reviewerName}</p>
      <p style="margin-top: 12px; font-style: italic;">"${data.reviewContent}"</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/products" class="button">상품 관리하기</a>
    </p>
  `),
});

// 환영 이메일 (신규 가입자용)
export const welcomeEmail = (data: {
  userName: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 가입을 환영합니다! 🎮`,
  html: baseLayout(`
    <h2>환영합니다! 🎮</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>${APP_NAME}에 가입해 주셔서 감사합니다.</p>
    
    <div class="info-box">
      <h3>이제 무엇을 할 수 있나요?</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>다양한 VIBE 코딩 작품을 둘러보고 구매하기</li>
        <li>나만의 작품을 등록하고 판매하기</li>
        <li>커뮤니티에서 다른 창작자들과 교류하기</li>
        <li>교육 콘텐츠로 새로운 기술 배우기</li>
      </ul>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/marketplace" class="button">마켓플레이스 둘러보기</a>
    </p>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      궁금한 점이 있으시면 언제든 문의해 주세요!
    </p>
  `),
});

// ==========================================
// 이메일 발송 함수
// ==========================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // 개발 환경에서 API 키가 없으면 로그만 출력
  if (!process.env.RESEND_API_KEY) {
    console.log("📧 [DEV] Email would be sent:", {
      to: options.to,
      subject: options.subject,
    });
    return { success: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이메일 발송 실패" 
    };
  }
}

// 구매 완료 이메일 발송
export async function sendPurchaseConfirmationEmail(
  to: string,
  data: Parameters<typeof purchaseConfirmationEmail>[0]
) {
  const template = purchaseConfirmationEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// 판매 알림 이메일 발송
export async function sendSaleNotificationEmail(
  to: string,
  data: Parameters<typeof saleNotificationEmail>[0]
) {
  const template = saleNotificationEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// 리뷰 알림 이메일 발송
export async function sendReviewNotificationEmail(
  to: string,
  data: Parameters<typeof reviewNotificationEmail>[0]
) {
  const template = reviewNotificationEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// 환영 이메일 발송
export async function sendWelcomeEmail(
  to: string,
  data: Parameters<typeof welcomeEmail>[0]
) {
  const template = welcomeEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// 비밀번호 재설정 이메일 템플릿
export const passwordResetEmail = (data: {
  userName: string;
  resetLink: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 비밀번호 재설정 요청`,
  html: baseLayout(`
    <h2>비밀번호 재설정 🔐</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
    
    <p style="text-align: center; margin: 32px 0;">
      <a href="${data.resetLink}" class="button">비밀번호 재설정</a>
    </p>
    
    <div class="info-box">
      <p><strong>⚠️ 중요:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>이 링크는 <strong>1시간</strong> 동안만 유효합니다.</li>
        <li>본인이 요청하지 않았다면 이 이메일을 무시하세요.</li>
        <li>계정 보안을 위해 링크를 다른 사람과 공유하지 마세요.</li>
      </ul>
    </div>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 붙여넣으세요:
    </p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
      ${data.resetLink}
    </p>
  `),
});

// 비밀번호 재설정 이메일 발송
export async function sendPasswordResetEmail(
  to: string,
  data: Parameters<typeof passwordResetEmail>[0]
) {
  const template = passwordResetEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// 비밀번호 변경 완료 이메일 템플릿
export const passwordChangedEmail = (data: {
  userName: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 비밀번호가 변경되었습니다`,
  html: baseLayout(`
    <h2>비밀번호가 변경되었습니다 ✅</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>회원님의 계정 비밀번호가 성공적으로 변경되었습니다.</p>
    
    <div class="info-box">
      <p><strong>⚠️ 본인이 변경하지 않았나요?</strong></p>
      <p>만약 본인이 비밀번호를 변경하지 않았다면, 즉시 비밀번호를 재설정하고 계정 보안을 확인해 주세요.</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/auth/login" class="button">로그인하기</a>
    </p>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      문의사항이 있으시면 언제든 연락해 주세요.
    </p>
  `),
});

// 비밀번호 변경 완료 이메일 발송
export async function sendPasswordChangedEmail(
  to: string,
  data: Parameters<typeof passwordChangedEmail>[0]
) {
  const template = passwordChangedEmail(data);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// ==========================================
// 추가 이메일 템플릿
// ==========================================

// 새로운 팔로워 알림 이메일
export const newFollowerEmail = (data: {
  userName: string;
  followerName: string;
  followerUrl: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] ${data.followerName}님이 팔로우하기 시작했습니다!`,
  html: baseLayout(`
    <h2>새로운 팔로워가 생겼습니다! 🎉</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p><strong>${data.followerName}</strong>님이 회원님을 팔로우하기 시작했습니다.</p>
    
    <p style="text-align: center; margin: 32px 0;">
      <a href="${data.followerUrl}" class="button">프로필 보기</a>
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      꾸준한 활동으로 더 많은 팔로워를 얻어보세요!
    </p>
  `),
});

// 새로운 댓글 알림 이메일
export const newCommentEmail = (data: {
  userName: string;
  commenterName: string;
  contentTitle: string;
  commentContent: string;
  contentUrl: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] ${data.commenterName}님이 댓글을 남겼습니다`,
  html: baseLayout(`
    <h2>새로운 댓글이 달렸습니다 💬</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p><strong>${data.commenterName}</strong>님이 "<em>${data.contentTitle}</em>"에 댓글을 남겼습니다.</p>
    
    <div class="info-box">
      <p style="font-style: italic; margin: 0;">"${data.commentContent}"</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.contentUrl}" class="button">댓글 확인하기</a>
    </p>
  `),
});

// 상품 승인 완료 이메일
export const productApprovedEmail = (data: {
  sellerName: string;
  productTitle: string;
  productUrl: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 상품이 승인되었습니다 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>상품이 승인되었습니다! 🎊</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>등록하신 상품 "<strong>${data.productTitle}</strong>"이 검토를 통과하여 마켓플레이스에 공개되었습니다.</p>
    
    <p style="text-align: center; margin: 32px 0;">
      <a href="${data.productUrl}" class="button">상품 페이지 보기</a>
    </p>
    
    <div class="info-box">
      <p><strong>💡 판매 팁:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>상품 설명을 자세히 작성하세요</li>
        <li>고품질 스크린샷을 추가하세요</li>
        <li>소셜 미디어에 공유하세요</li>
        <li>커뮤니티에서 적극적으로 활동하세요</li>
      </ul>
    </div>
  `),
});

// 위시리스트 상품 세일 알림
export const wishlistSaleEmail = (data: {
  userName: string;
  productTitle: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  productUrl: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 위시리스트 상품이 ${data.discountPercent}% 할인 중! 🔥`,
  html: baseLayout(`
    <h2>위시리스트 상품이 할인 중입니다! 🔥</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>찜해두신 "<strong>${data.productTitle}</strong>"이 할인 중입니다!</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="text-decoration: line-through; color: #9ca3af; margin: 0;">
        ₩${data.originalPrice.toLocaleString()}
      </p>
      <p class="price" style="font-size: 32px; margin: 8px 0;">
        ₩${data.salePrice.toLocaleString()}
      </p>
      <p style="background-color: #ef4444; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
        ${data.discountPercent}% OFF
      </p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.productUrl}" class="button">지금 구매하기</a>
    </p>
    
    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      할인은 곧 종료될 수 있습니다. 서두르세요!
    </p>
  `),
});

// 주간 다이제스트 이메일
export const weeklyDigestEmail = (data: {
  userName: string;
  newProductsCount: number;
  topProducts: { title: string; price: number; url: string }[];
  yourStats?: {
    views: number;
    sales: number;
    revenue: number;
  };
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 이번 주 하이라이트 📬`,
  html: baseLayout(`
    <h2>이번 주 ${APP_NAME} 소식입니다 📬</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    
    ${data.yourStats ? `
    <div class="info-box">
      <h3 style="margin-top: 0;">📊 내 활동 요약</h3>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${data.yourStats.views}</div>
            <div style="font-size: 12px; color: #6b7280;">조회수</div>
          </td>
          <td style="padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${data.yourStats.sales}</div>
            <div style="font-size: 12px; color: #6b7280;">판매</div>
          </td>
          <td style="padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #059669;">₩${data.yourStats.revenue.toLocaleString()}</div>
            <div style="font-size: 12px; color: #6b7280;">수익</div>
          </td>
        </tr>
      </table>
    </div>
    ` : ''}
    
    <h3>🔥 이번 주 인기 상품</h3>
    ${data.topProducts.map((product, index) => `
      <div style="display: flex; align-items: center; padding: 12px; background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-radius: 8px; margin-bottom: 8px;">
        <span style="font-weight: bold; color: #7c3aed; width: 24px;">${index + 1}</span>
        <span style="flex: 1;">${product.title}</span>
        <span style="color: #059669; font-weight: 600;">₩${product.price.toLocaleString()}</span>
      </div>
    `).join('')}
    
    <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
      이번 주에 <strong>${data.newProductsCount}개</strong>의 새로운 상품이 등록되었습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/marketplace" class="button">마켓플레이스 둘러보기</a>
    </p>
  `),
});

// 발송 함수들
export async function sendNewFollowerEmail(
  to: string,
  data: Parameters<typeof newFollowerEmail>[0]
) {
  const template = newFollowerEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendNewCommentEmail(
  to: string,
  data: Parameters<typeof newCommentEmail>[0]
) {
  const template = newCommentEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendProductApprovedEmail(
  to: string,
  data: Parameters<typeof productApprovedEmail>[0]
) {
  const template = productApprovedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendWishlistSaleEmail(
  to: string,
  data: Parameters<typeof wishlistSaleEmail>[0]
) {
  const template = wishlistSaleEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendWeeklyDigestEmail(
  to: string,
  data: Parameters<typeof weeklyDigestEmail>[0]
) {
  const template = weeklyDigestEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

// ==========================================
// 정산/거래 관련 이메일 템플릿
// ==========================================

// 상품 등록 확인 이메일 (판매자용)
export const productRegistrationEmail = (data: {
  sellerName: string;
  productTitle: string;
  productId: string;
  status: "DRAFT" | "PENDING_REVIEW";
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 상품이 등록되었습니다 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>상품 등록이 완료되었습니다! 📦</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>상품 등록이 성공적으로 완료되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>상태:</strong> ${data.status === "PENDING_REVIEW" ? "검토 대기 중" : "임시 저장"}</p>
    </div>
    
    ${data.status === "PENDING_REVIEW" ? `
      <p>상품이 검토 대기 상태입니다. 관리자 검토 후 마켓플레이스에 게시됩니다.</p>
      <p>검토는 보통 1-2 영업일 내에 완료됩니다.</p>
    ` : `
      <p>상품이 임시 저장되었습니다. 상품 관리 페이지에서 수정 후 게시할 수 있습니다.</p>
    `}
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/products" class="button">상품 관리하기</a>
    </p>
  `),
});

// 판매자 월간 거래 내역서 이메일
export const monthlyTransactionReportEmail = (data: {
  sellerName: string;
  month: string; // "2025년 12월"
  totalSales: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  topProducts: Array<{ title: string; sales: number; revenue: number }>;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] ${data.month} 거래 내역서`,
  html: baseLayout(`
    <h2>${data.month} 거래 내역서 📊</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>${data.month} 판매 현황을 안내해 드립니다.</p>
    
    <div class="info-box">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">총 판매액</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₩${data.totalSales.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">판매 건수</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.salesCount}건</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">플랫폼 수수료 (10%)</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #ef4444;">-₩${data.platformFee.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">PG 수수료 (3.5%)</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #ef4444;">-₩${data.paymentFee.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">예상 정산 금액</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">₩${data.netAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    ${data.topProducts.length > 0 ? `
      <h3 style="margin-top: 24px;">🏆 인기 상품 TOP 3</h3>
      <div class="info-box">
        ${data.topProducts.map((p, i) => `
          <p style="margin: 8px 0;">
            <strong>${i + 1}.</strong> ${p.title} - ${p.sales}건 (₩${p.revenue.toLocaleString()})
          </p>
        `).join("")}
      </div>
    ` : ""}
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      * 정산은 환불 대기 기간(7일) 이후 처리됩니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/analytics" class="button">상세 분석 보기</a>
    </p>
  `),
});

// 정산 완료 알림 이메일 (판매자용)
export const settlementCompletedEmail = (data: {
  sellerName: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  bankName: string;
  accountNumber: string;
  paidAt: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 정산이 완료되었습니다 💰`,
  html: baseLayout(`
    <h2>정산이 완료되었습니다! 💰</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>정산금이 입금 처리되었습니다.</p>
    
    <div class="info-box">
      <p><strong>정산 기간:</strong> ${data.periodStart} ~ ${data.periodEnd}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">총 판매액 (${data.salesCount}건)</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">₩${data.totalSales.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">플랫폼 수수료</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #ef4444;">-₩${data.platformFee.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">PG 수수료</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #ef4444;">-₩${data.paymentFee.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">정산 금액</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669; font-size: 18px;">₩${data.netAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div class="info-box" style="background-color: #ecfdf5;">
      <p><strong>입금 계좌:</strong> ${data.bankName} ${data.accountNumber}</p>
      <p><strong>입금일:</strong> ${data.paidAt}</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/settlements" class="button">정산 내역 보기</a>
    </p>
  `),
});

// 환불 완료 알림 이메일 (구매자용)
export const refundCompletedEmail = (data: {
  buyerName: string;
  productTitle: string;
  refundAmount: number;
  refundReason: string;
  processedAt: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 환불이 완료되었습니다`,
  html: baseLayout(`
    <h2>환불 처리가 완료되었습니다 ✅</h2>
    <p>안녕하세요, <span class="highlight">${data.buyerName}</span>님!</p>
    <p>요청하신 환불이 정상적으로 처리되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>환불 금액:</strong> <span class="price">₩${data.refundAmount.toLocaleString()}</span></p>
      <p><strong>환불 사유:</strong> ${data.refundReason}</p>
      <p><strong>처리일:</strong> ${data.processedAt}</p>
    </div>
    
    <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
      환불 금액은 결제 수단에 따라 3-5 영업일 내에 환급됩니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/purchases" class="button">구매 내역 보기</a>
    </p>
  `),
});

// 환불 거절 알림 이메일 (구매자용)
export const refundRejectedEmail = (data: {
  buyerName: string;
  productTitle: string;
  refundAmount: number;
  rejectionReason: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 환불 요청이 거절되었습니다`,
  html: baseLayout(`
    <h2>환불 요청 검토 결과 안내</h2>
    <p>안녕하세요, <span class="highlight">${data.buyerName}</span>님!</p>
    <p>요청하신 환불이 아래 사유로 거절되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>요청 금액:</strong> ₩${data.refundAmount.toLocaleString()}</p>
      <p><strong>거절 사유:</strong> ${data.rejectionReason}</p>
    </div>
    
    <p style="margin-top: 16px;">
      환불 정책에 대해 궁금하신 점이 있으시면 고객센터로 문의해 주세요.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/refund" class="button">환불 정책 확인</a>
    </p>
  `),
});

// 발송 함수들
export async function sendProductRegistrationEmail(
  to: string,
  data: Parameters<typeof productRegistrationEmail>[0]
) {
  const template = productRegistrationEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendMonthlyTransactionReportEmail(
  to: string,
  data: Parameters<typeof monthlyTransactionReportEmail>[0]
) {
  const template = monthlyTransactionReportEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSettlementCompletedEmail(
  to: string,
  data: Parameters<typeof settlementCompletedEmail>[0]
) {
  const template = settlementCompletedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendRefundCompletedEmail(
  to: string,
  data: Parameters<typeof refundCompletedEmail>[0]
) {
  const template = refundCompletedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendRefundRejectedEmail(
  to: string,
  data: Parameters<typeof refundRejectedEmail>[0]
) {
  const template = refundRejectedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

// ==========================================
// 구독 관련 이메일 템플릿
// ==========================================

// 구독 시작 환영 이메일
export const subscriptionWelcomeEmail = (data: {
  userName: string;
  planName: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  features: string[];
  nextBillingDate: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] ${data.planName} 구독을 시작해 주셔서 감사합니다!`,
  html: baseLayout(`
    <h2>구독을 시작해 주셔서 감사합니다! 🎉</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p><strong>${data.planName}</strong> 플랜의 구독이 시작되었습니다.</p>
    
    <div class="info-box">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>결제 금액:</strong> <span class="price">₩${data.price.toLocaleString()}</span> / ${data.billingCycle === "MONTHLY" ? "월" : "년"}</p>
      <p><strong>다음 결제일:</strong> ${data.nextBillingDate}</p>
    </div>
    
    <h3 style="margin-top: 24px;">✨ 구독 혜택</h3>
    <ul style="padding-left: 20px; margin: 16px 0;">
      ${data.features.map((f) => `<li style="margin: 8px 0;">${f}</li>`).join("")}
    </ul>
    
    <p style="margin-top: 24px;">이제 모든 프리미엄 기능을 이용하실 수 있습니다!</p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button">구독 관리하기</a>
    </p>
  `),
});

// 구독 갱신 알림 이메일 (만료 전 알림)
export const subscriptionRenewalReminderEmail = (data: {
  userName: string;
  planName: string;
  price: number;
  renewalDate: string;
  daysUntilRenewal: number;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] ${data.daysUntilRenewal}일 후 구독이 갱신됩니다`,
  html: baseLayout(`
    <h2>구독 갱신 안내 📅</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p><strong>${data.daysUntilRenewal}일 후</strong> 구독이 자동 갱신됩니다.</p>
    
    <div class="info-box">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>결제 예정 금액:</strong> <span class="price">₩${data.price.toLocaleString()}</span></p>
      <p><strong>갱신 예정일:</strong> ${data.renewalDate}</p>
    </div>
    
    <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
      구독을 유지하지 않으실 경우, 갱신일 전에 구독을 취소해 주세요.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button">구독 관리하기</a>
    </p>
  `),
});

// 구독 결제 성공 이메일
export const subscriptionPaymentSuccessEmail = (data: {
  userName: string;
  planName: string;
  amount: number;
  paymentDate: string;
  nextBillingDate: string;
  receiptId?: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구독 결제가 완료되었습니다`,
  html: baseLayout(`
    <h2>결제가 완료되었습니다 ✅</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>구독 결제가 정상적으로 처리되었습니다.</p>
    
    <div class="info-box">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>결제 금액:</strong> <span class="price">₩${data.amount.toLocaleString()}</span></p>
      <p><strong>결제일:</strong> ${data.paymentDate}</p>
      ${data.receiptId ? `<p><strong>영수증 번호:</strong> ${data.receiptId}</p>` : ""}
      <p><strong>다음 결제일:</strong> ${data.nextBillingDate}</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button">결제 내역 보기</a>
    </p>
  `),
});

// 구독 결제 실패 이메일
export const subscriptionPaymentFailedEmail = (data: {
  userName: string;
  planName: string;
  amount: number;
  failureReason: string;
  retryDate?: string;
  maxRetries?: number;
  currentRetry?: number;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구독 결제에 실패했습니다 - 조치가 필요합니다`,
  html: baseLayout(`
    <h2 style="color: #ef4444;">결제에 실패했습니다 ⚠️</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>${data.planName} 구독 결제가 실패했습니다.</p>
    
    <div class="info-box" style="border-left: 4px solid #ef4444;">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>결제 시도 금액:</strong> <span class="price">₩${data.amount.toLocaleString()}</span></p>
      <p><strong>실패 사유:</strong> ${data.failureReason}</p>
      ${data.retryDate ? `<p><strong>다음 재시도 예정:</strong> ${data.retryDate}</p>` : ""}
      ${data.maxRetries && data.currentRetry ? `<p><strong>재시도 횟수:</strong> ${data.currentRetry}/${data.maxRetries}회</p>` : ""}
    </div>
    
    <p style="margin-top: 16px;">
      <strong>다음 조치를 확인해 주세요:</strong>
    </p>
    <ul style="padding-left: 20px; margin: 12px 0;">
      <li>결제 수단의 유효기간을 확인해 주세요</li>
      <li>계좌 잔액이 충분한지 확인해 주세요</li>
      <li>카드 한도를 확인해 주세요</li>
      <li>필요시 결제 수단을 변경해 주세요</li>
    </ul>
    
    <p style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border-radius: 8px; font-size: 14px;">
      ⚠️ 결제 문제가 해결되지 않으면 구독이 일시 중지될 수 있습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button" style="background-color: #ef4444;">결제 수단 변경하기</a>
    </p>
  `),
});

// 구독 취소 확인 이메일
export const subscriptionCancelledEmail = (data: {
  userName: string;
  planName: string;
  cancelDate: string;
  endDate: string;
  reason?: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구독이 취소되었습니다`,
  html: baseLayout(`
    <h2>구독 취소 확인 📋</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>요청하신 대로 구독이 취소되었습니다.</p>
    
    <div class="info-box">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>취소일:</strong> ${data.cancelDate}</p>
      <p><strong>서비스 종료일:</strong> ${data.endDate}</p>
      ${data.reason ? `<p><strong>취소 사유:</strong> ${data.reason}</p>` : ""}
    </div>
    
    <p style="margin-top: 16px;">
      <strong>${data.endDate}</strong>까지는 모든 프리미엄 기능을 계속 이용하실 수 있습니다.
    </p>
    
    <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
      언제든지 다시 구독하실 수 있습니다. 더 나은 서비스로 다시 만나뵙겠습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/marketplace" class="button" style="background-color: #6b7280;">마켓플레이스 둘러보기</a>
    </p>
  `),
});

// 구독 만료 임박 이메일
export const subscriptionExpiringEmail = (data: {
  userName: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구독이 ${data.daysRemaining}일 후 만료됩니다`,
  html: baseLayout(`
    <h2>구독 만료 안내 ⏰</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>현재 이용 중인 구독이 <strong>${data.daysRemaining}일 후</strong> 만료됩니다.</p>
    
    <div class="info-box" style="border-left: 4px solid #f59e0b;">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>만료 예정일:</strong> ${data.expiryDate}</p>
    </div>
    
    <p style="margin-top: 16px;">
      구독을 계속 이용하시려면 지금 바로 갱신해 주세요!
    </p>
    
    <h3 style="margin-top: 20px;">😢 만료 시 제한되는 기능</h3>
    <ul style="padding-left: 20px; margin: 12px 0;">
      <li>프리미엄 AI 모델 접근</li>
      <li>고급 분석 기능</li>
      <li>우선 지원 서비스</li>
      <li>무제한 다운로드</li>
    </ul>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button">지금 갱신하기</a>
    </p>
  `),
});

// 구독 일시중지 이메일
export const subscriptionPausedEmail = (data: {
  userName: string;
  planName: string;
  pauseDate: string;
  pauseReason: string;
  resumeDate?: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 구독이 일시 중지되었습니다`,
  html: baseLayout(`
    <h2>구독 일시 중지 안내 ⏸️</h2>
    <p>안녕하세요, <span class="highlight">${data.userName}</span>님!</p>
    <p>구독이 일시 중지되었습니다.</p>
    
    <div class="info-box" style="border-left: 4px solid #f59e0b;">
      <p><strong>구독 플랜:</strong> ${data.planName}</p>
      <p><strong>중지일:</strong> ${data.pauseDate}</p>
      <p><strong>사유:</strong> ${data.pauseReason}</p>
      ${data.resumeDate ? `<p><strong>자동 재개 예정일:</strong> ${data.resumeDate}</p>` : ""}
    </div>
    
    <p style="margin-top: 16px;">
      일시 중지 기간 동안에는 프리미엄 기능을 이용하실 수 없습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/subscriptions" class="button">구독 재개하기</a>
    </p>
  `),
});

// 발송 함수들 - 구독 관련
export async function sendSubscriptionWelcomeEmail(
  to: string,
  data: Parameters<typeof subscriptionWelcomeEmail>[0]
) {
  const template = subscriptionWelcomeEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionRenewalReminderEmail(
  to: string,
  data: Parameters<typeof subscriptionRenewalReminderEmail>[0]
) {
  const template = subscriptionRenewalReminderEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionPaymentSuccessEmail(
  to: string,
  data: Parameters<typeof subscriptionPaymentSuccessEmail>[0]
) {
  const template = subscriptionPaymentSuccessEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionPaymentFailedEmail(
  to: string,
  data: Parameters<typeof subscriptionPaymentFailedEmail>[0]
) {
  const template = subscriptionPaymentFailedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionCancelledEmail(
  to: string,
  data: Parameters<typeof subscriptionCancelledEmail>[0]
) {
  const template = subscriptionCancelledEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionExpiringEmail(
  to: string,
  data: Parameters<typeof subscriptionExpiringEmail>[0]
) {
  const template = subscriptionExpiringEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendSubscriptionPausedEmail(
  to: string,
  data: Parameters<typeof subscriptionPausedEmail>[0]
) {
  const template = subscriptionPausedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

// ==========================================
// 결제 영수증 및 환불 요청/판매자 알림 템플릿 (세션 75 추가)
// ==========================================

// 결제 완료 상세 이메일 (영수증 포함)
export const paymentReceiptEmail = (data: {
  buyerName: string;
  productTitle: string;
  productId: string;
  price: number;
  paymentMethod: string;
  transactionId: string;
  purchaseId: string;
  purchaseDate: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 결제 완료 영수증 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>결제가 완료되었습니다 ✅</h2>
    <p>안녕하세요, <span class="highlight">${data.buyerName}</span>님!</p>
    <p>아래 상품의 결제가 성공적으로 완료되었습니다.</p>
    
    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="margin-top: 0; border-bottom: 2px solid #7c3aed; padding-bottom: 12px;">📄 결제 영수증</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">상품명</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.productTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">결제 금액</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">₩${data.price.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">결제 수단</td>
          <td style="padding: 8px 0; text-align: right;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">결제일시</td>
          <td style="padding: 8px 0; text-align: right;">${data.purchaseDate}</td>
        </tr>
        <tr style="border-top: 1px solid #d1d5db;">
          <td style="padding: 12px 0; color: #6b7280; font-size: 12px;">거래 번호</td>
          <td style="padding: 12px 0; text-align: right; font-size: 12px; font-family: monospace;">${data.transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 12px;">주문 번호</td>
          <td style="padding: 8px 0; text-align: right; font-size: 12px; font-family: monospace;">${data.purchaseId}</td>
        </tr>
      </table>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/purchases" class="button">상품 다운로드</a>
    </p>
    
    <div class="info-box" style="margin-top: 24px; border-left: 4px solid #7c3aed;">
      <p style="margin: 0; font-size: 14px;"><strong>💡 안내</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #6b7280;">
        <li>구매하신 상품은 대시보드에서 언제든 다운로드 가능합니다.</li>
        <li>환불은 구매 후 7일 이내에 요청하실 수 있습니다.</li>
        <li>문의사항은 고객센터로 연락해 주세요.</li>
      </ul>
    </div>
  `),
});

// 환불 요청 접수 이메일 (구매자용)
export const refundRequestedEmail = (data: {
  buyerName: string;
  productTitle: string;
  price: number;
  refundId: string;
  reason: string;
  requestDate: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 환불 요청이 접수되었습니다`,
  html: baseLayout(`
    <h2>환불 요청 접수 완료 📋</h2>
    <p>안녕하세요, <span class="highlight">${data.buyerName}</span>님!</p>
    <p>환불 요청이 정상적으로 접수되었습니다.</p>
    
    <div class="info-box">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>환불 요청 금액:</strong> <span class="price">₩${data.price.toLocaleString()}</span></p>
      <p><strong>환불 요청 사유:</strong> ${data.reason}</p>
      <p><strong>요청일:</strong> ${data.requestDate}</p>
      <p style="font-size: 12px; color: #6b7280;"><strong>환불 번호:</strong> ${data.refundId}</p>
    </div>
    
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;"><strong>⏱️ 처리 안내</strong></p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
        환불 요청은 영업일 기준 1-3일 내에 검토됩니다.<br>
        처리 결과는 이메일로 안내드리겠습니다.
      </p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/purchases" class="button">구매 내역 확인</a>
    </p>
  `),
});

// 환불 발생 알림 이메일 (판매자용)
export const refundNotificationSellerEmail = (data: {
  sellerName: string;
  productTitle: string;
  buyerName: string;
  refundAmount: number;
  refundReason: string;
  refundDate: string;
}): EmailTemplate => ({
  subject: `[${APP_NAME}] 환불이 발생했습니다 - ${data.productTitle}`,
  html: baseLayout(`
    <h2>환불 처리 안내 📋</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    <p>아래 상품에 대한 환불이 처리되었습니다.</p>
    
    <div class="info-box" style="border-left: 4px solid #f59e0b;">
      <p><strong>상품명:</strong> ${data.productTitle}</p>
      <p><strong>구매자:</strong> ${data.buyerName}</p>
      <p><strong>환불 금액:</strong> <span style="color: #ef4444; font-weight: 600;">-₩${data.refundAmount.toLocaleString()}</span></p>
      <p><strong>환불 사유:</strong> ${data.refundReason}</p>
      <p><strong>처리일:</strong> ${data.refundDate}</p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
      환불 금액은 다음 정산에서 차감됩니다. 자세한 내용은 정산 내역에서 확인하실 수 있습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/settlements" class="button">정산 내역 확인</a>
    </p>
  `),
});

// 발송 함수들
export async function sendPaymentReceiptEmail(
  to: string,
  data: Parameters<typeof paymentReceiptEmail>[0]
) {
  const template = paymentReceiptEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendRefundRequestedEmail(
  to: string,
  data: Parameters<typeof refundRequestedEmail>[0]
) {
  const template = refundRequestedEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}

export async function sendRefundNotificationSellerEmail(
  to: string,
  data: Parameters<typeof refundNotificationSellerEmail>[0]
) {
  const template = refundNotificationSellerEmail(data);
  return sendEmail({ to, subject: template.subject, html: template.html });
}
