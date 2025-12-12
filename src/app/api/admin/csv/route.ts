/**
 * CSV Export/Import API
 * 상품/사용자 데이터 일괄 내보내기/가져오기
 * 
 * Phase 11 - CSV 가져오기/내보내기
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";

export const dynamic = 'force-dynamic';

// CSV 변환 유틸리티
function arrayToCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

// GET: 데이터 내보내기
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 또는 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isSeller = user?.isSeller;

    if (!isAdmin && !isSeller) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // products, users, orders, tickets
    const format = searchParams.get("format") || "csv"; // csv, json

    let data: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let filename = "";

    switch (type) {
      case "products":
        // 관리자는 모든 상품, 판매자는 자신의 상품만
        const products = await prisma.product.findMany({
          where: isAdmin ? {} : { sellerId: session.user.id },
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            price: true,
            originalPrice: true,
            status: true,
            pricingType: true,
            licenseType: true,
            productType: true,
            viewCount: true,
            salesCount: true,
            averageRating: true,
            reviewCount: true,
            isPublished: true,
            createdAt: true,
            category: { select: { name: true } },
            seller: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        data = products.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          shortDescription: p.shortDescription,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : "",
          status: p.status,
          pricingType: p.pricingType,
          licenseType: p.licenseType,
          productType: p.productType,
          category: p.category.name,
          sellerName: p.seller.name || "",
          sellerEmail: p.seller.email,
          viewCount: p.viewCount,
          salesCount: p.salesCount,
          averageRating: p.averageRating,
          reviewCount: p.reviewCount,
          isPublished: p.isPublished ? "Yes" : "No",
          createdAt: p.createdAt.toISOString(),
        }));

        columns = [
          "id", "title", "slug", "shortDescription", "price", "originalPrice",
          "status", "pricingType", "licenseType", "productType", "category",
          "sellerName", "sellerEmail", "viewCount", "salesCount", "averageRating",
          "reviewCount", "isPublished", "createdAt"
        ];

        filename = `products_${new Date().toISOString().split("T")[0]}`;
        break;

      case "users":
        // 관리자 전용
        if (!isAdmin) {
          return NextResponse.json({ error: "관리자만 사용자 데이터를 내보낼 수 있습니다" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isSeller: true,
            sellerVerified: true,
            totalSales: true,
            totalRevenue: true,
            createdAt: true,
            _count: {
              select: { products: true, purchases: true, reviews: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name || "",
          role: u.role,
          isSeller: u.isSeller ? "Yes" : "No",
          sellerVerified: u.sellerVerified ? "Yes" : "No",
          totalSales: u.totalSales,
          totalRevenue: Number(u.totalRevenue),
          productsCount: u._count.products,
          purchasesCount: u._count.purchases,
          reviewsCount: u._count.reviews,
          createdAt: u.createdAt.toISOString(),
        }));

        columns = [
          "id", "email", "name", "role", "isSeller", "sellerVerified",
          "totalSales", "totalRevenue", "productsCount", "purchasesCount",
          "reviewsCount", "createdAt"
        ];

        filename = `users_${new Date().toISOString().split("T")[0]}`;
        break;

      case "orders":
        // 판매자: 자신의 상품 주문, 관리자: 모든 주문
        const purchases = await prisma.purchase.findMany({
          where: isAdmin ? {} : { product: { sellerId: session.user.id } },
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            downloadCount: true,
            createdAt: true,
            product: {
              select: { title: true, sellerId: true },
            },
            buyer: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10000, // 최대 1만건
        });

        data = purchases.map(p => ({
          id: p.id,
          productTitle: p.product.title,
          buyerName: p.buyer.name || "",
          buyerEmail: p.buyer.email,
          status: p.status,
          amount: Number(p.amount),
          currency: p.currency,
          downloadCount: p.downloadCount,
          createdAt: p.createdAt.toISOString(),
        }));

        columns = [
          "id", "productTitle", "buyerName", "buyerEmail", "status",
          "price", "downloadCount", "createdAt"
        ];

        filename = `orders_${new Date().toISOString().split("T")[0]}`;
        break;

      case "tickets":
        // 관리자 전용
        if (!isAdmin) {
          return NextResponse.json({ error: "관리자만 티켓 데이터를 내보낼 수 있습니다" }, { status: 403 });
        }

        const tickets = await prisma.supportTicket.findMany({
          select: {
            id: true,
            subject: true,
            category: true,
            priority: true,
            status: true,
            email: true,
            name: true,
            rating: true,
            createdAt: true,
            resolvedAt: true,
            _count: { select: { messages: true } },
            user: { select: { name: true, email: true } },
            assignee: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        data = tickets.map(t => ({
          id: t.id,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          email: t.email,
          userName: t.user?.name || t.name || "",
          assigneeName: t.assignee?.name || "",
          messageCount: t._count.messages,
          rating: t.rating || "",
          createdAt: t.createdAt.toISOString(),
          resolvedAt: t.resolvedAt?.toISOString() || "",
        }));

        columns = [
          "id", "subject", "category", "priority", "status", "email",
          "userName", "assigneeName", "messageCount", "rating", "createdAt", "resolvedAt"
        ];

        filename = `tickets_${new Date().toISOString().split("T")[0]}`;
        break;

      default:
        return NextResponse.json({ error: "지원하지 않는 데이터 유형입니다" }, { status: 400 });
    }

    // 감사 로그 기록
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || "",
      userName: session.user.name,
      action: "EXPORT_DATA",
      targetType: type?.toUpperCase() || "UNKNOWN",
      targetLabel: `${data.length}건 내보내기`,
      metadata: { format, count: data.length },
    });

    // 응답 포맷
    if (format === "json") {
      return NextResponse.json({
        data,
        meta: {
          type,
          count: data.length,
          exportedAt: new Date().toISOString(),
        },
      });
    }

    // CSV 응답
    const csv = arrayToCSV(data, columns);
    
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "데이터 내보내기 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 데이터 가져오기 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 데이터를 가져올 수 있습니다" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const action = formData.get("action") as string | null; // validate, import

    if (!file) {
      return NextResponse.json({ error: "파일을 선택해주세요" }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: "데이터 유형을 선택해주세요" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.trim().split("\n");
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "데이터가 없습니다" }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    // 검증만 수행
    if (action === "validate") {
      const validationResult = validateImportData(type, rows, headers);
      return NextResponse.json({
        valid: validationResult.valid,
        totalRows: rows.length,
        validRows: validationResult.validRows,
        errors: validationResult.errors,
        preview: rows.slice(0, 5),
      });
    }

    // 실제 가져오기
    const importResult = await performImport(type, rows, session.user.id);

    // 감사 로그 기록
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || "",
      userName: session.user.name,
      action: "BULK_ACTION",
      targetType: type.toUpperCase(),
      targetLabel: `${importResult.imported}건 가져오기`,
      metadata: { 
        totalRows: rows.length,
        imported: importResult.imported,
        skipped: importResult.skipped,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${importResult.imported}건이 가져오기 되었습니다`,
      imported: importResult.imported,
      skipped: importResult.skipped,
      errors: importResult.errors,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "데이터 가져오기 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// CSV 라인 파싱 (쌍따옴표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// 데이터 검증
function validateImportData(type: string, rows: Record<string, string>[], headers: string[]): {
  valid: boolean;
  validRows: number;
  errors: string[];
} {
  const errors: string[] = [];
  let validRows = 0;

  const requiredFields: Record<string, string[]> = {
    products: ["title", "price", "categoryId"],
    users: ["email"],
    // 다른 타입 추가 가능
  };

  const required = requiredFields[type] || [];
  
  // 필수 헤더 확인
  for (const field of required) {
    if (!headers.includes(field)) {
      errors.push(`필수 열이 없습니다: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, validRows: 0, errors };
  }

  // 각 행 검증
  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    for (const field of required) {
      if (!row[field] || row[field].trim() === "") {
        rowErrors.push(`${field} 값이 비어있습니다`);
      }
    }

    if (rowErrors.length === 0) {
      validRows++;
    } else if (index < 10) {
      errors.push(`행 ${index + 2}: ${rowErrors.join(", ")}`);
    }
  });

  if (errors.length > 10) {
    errors.push(`... 외 ${errors.length - 10}개 오류`);
  }

  return {
    valid: errors.length === 0,
    validRows,
    errors: errors.slice(0, 20),
  };
}

// 실제 가져오기 수행
async function performImport(type: string, rows: Record<string, string>[], userId: string): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 타입별 가져오기 로직
  switch (type) {
    case "products":
      // 상품 가져오기는 복잡하므로 간단한 업데이트만 지원
      for (const row of rows) {
        if (!row.id) {
          skipped++;
          continue;
        }

        try {
          await prisma.product.update({
            where: { id: row.id },
            data: {
              title: row.title || undefined,
              price: row.price ? parseFloat(row.price) : undefined,
            },
          });
          imported++;
        } catch {
          skipped++;
          if (errors.length < 10) {
            errors.push(`상품 ID ${row.id} 업데이트 실패`);
          }
        }
      }
      break;

    default:
      errors.push("지원하지 않는 데이터 유형입니다");
  }

  return { imported, skipped, errors };
}
