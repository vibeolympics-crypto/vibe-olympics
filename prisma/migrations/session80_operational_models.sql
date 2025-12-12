-- Session 80: 운영 관리 모델 마이그레이션
-- 실행: Supabase SQL Editor 또는 psql에서 실행

-- ==========================================
-- 감사 활동 유형 Enum
-- ==========================================
DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM (
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_BAN', 'USER_UNBAN', 'USER_ROLE_CHANGE',
        'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_APPROVE', 'PRODUCT_REJECT', 'PRODUCT_FEATURE',
        'ORDER_REFUND', 'ORDER_CANCEL', 'PAYMENT_MANUAL',
        'SETTLEMENT_APPROVE', 'SETTLEMENT_PROCESS', 'SETTLEMENT_REJECT',
        'SETTING_CHANGE',
        'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'BULK_ACTION', 'EXPORT_DATA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 감사 로그 상태 Enum
DO $$ BEGIN
    CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 티켓 카테고리 Enum
DO $$ BEGIN
    CREATE TYPE "TicketCategory" AS ENUM (
        'GENERAL', 'ORDER', 'REFUND', 'PRODUCT', 'ACCOUNT', 'TECHNICAL', 'REPORT', 'SELLER', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 티켓 우선순위 Enum
DO $$ BEGIN
    CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 티켓 상태 Enum
DO $$ BEGIN
    CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- AuditLog 테이블 (관리자 활동 로그)
-- ==========================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AuditLog 인덱스
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_status_idx" ON "AuditLog"("status");

-- ==========================================
-- SupportTicket 테이블 (고객 지원 티켓)
-- ==========================================
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subject" VARCHAR(200) NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "orderId" TEXT,
    "productId" TEXT,
    "assigneeId" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- SupportTicket 인덱스
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_assigneeId_idx" ON "SupportTicket"("assigneeId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- ==========================================
-- TicketMessage 테이블 (티켓 메시지)
-- ==========================================
CREATE TABLE IF NOT EXISTS "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- TicketMessage 인덱스
CREATE INDEX IF NOT EXISTS "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketMessage_userId_idx" ON "TicketMessage"("userId");
CREATE INDEX IF NOT EXISTS "TicketMessage_createdAt_idx" ON "TicketMessage"("createdAt");

-- ==========================================
-- NewsletterSubscriber 테이블 (뉴스레터 구독자)
-- ==========================================
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "userId" TEXT,
    "unsubscribeToken" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- NewsletterSubscriber 인덱스 및 유니크
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_isActive_idx" ON "NewsletterSubscriber"("isActive");

-- ==========================================
-- Post 테이블 SEO 필드 추가
-- ==========================================
DO $$ BEGIN
    ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "slug" TEXT;
    ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
    ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Post slug 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug");

-- ==========================================
-- Tutorial 테이블 SEO 필드 추가
-- ==========================================
DO $$ BEGIN
    ALTER TABLE "Tutorial" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
    ALTER TABLE "Tutorial" ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- 외래 키 관계 설정
-- ==========================================

-- AuditLog -> User
DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SupportTicket -> User (요청자)
DO $$ BEGIN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SupportTicket -> User (담당자)
DO $$ BEGIN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" 
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TicketMessage -> SupportTicket
DO $$ BEGIN
    ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TicketMessage -> User
DO $$ BEGIN
    ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 확인 쿼리
-- ==========================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM "AuditLog" LIMIT 5;
-- SELECT * FROM "SupportTicket" LIMIT 5;
-- SELECT * FROM "NewsletterSubscriber" LIMIT 5;
