import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vibeolympics.com";
const SITE_TITLE = "Vibe Olympics";
const SITE_DESCRIPTION = "VIBE 코딩 기반 지적 상품 마켓플레이스. 아이디어를 현실로, 지식을 가치로 만들어보세요.";

// Atom 1.0 형식 생성
function generateAtomFeed(items: AtomEntry[], updated: Date): string {
  const entriesXml = items.map(entry => `
  <entry>
    <title><![CDATA[${entry.title}]]></title>
    <link href="${entry.link}" rel="alternate" type="text/html"/>
    <id>${entry.link}</id>
    <updated>${new Date(entry.updated).toISOString()}</updated>
    <published>${new Date(entry.published).toISOString()}</published>
    <summary type="html"><![CDATA[${entry.summary}]]></summary>
    ${entry.author ? `
    <author>
      <name>${entry.author}</name>
    </author>` : ""}
    ${entry.category ? `<category term="${entry.category}"/>` : ""}
    ${entry.image ? `<link href="${entry.image}" rel="enclosure" type="image/jpeg"/>` : ""}
  </entry>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_TITLE}</title>
  <subtitle>${SITE_DESCRIPTION}</subtitle>
  <link href="${BASE_URL}" rel="alternate" type="text/html"/>
  <link href="${BASE_URL}/api/feed/atom" rel="self" type="application/atom+xml"/>
  <id>${BASE_URL}/</id>
  <updated>${updated.toISOString()}</updated>
  <rights>© 2025 Vibe Olympics. All rights reserved.</rights>
  <generator uri="https://vibeolympics.com" version="1.0">Vibe Olympics</generator>
  <icon>${BASE_URL}/favicon.ico</icon>
  <logo>${BASE_URL}/logo.png</logo>
  ${entriesXml}
</feed>`;
}

interface AtomEntry {
  title: string;
  link: string;
  summary: string;
  published: string;
  updated: string;
  author?: string;
  category?: string;
  image?: string;
}

// GET /api/feed/atom - Atom 피드 반환
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, products, tutorials, posts
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const entries: AtomEntry[] = [];
    let latestUpdate = new Date(0);

    // 상품 피드
    if (type === "all" || type === "products") {
      try {
        const products = await prisma.product.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
          take: type === "all" ? Math.floor(limit / 3) : limit,
          include: {
            seller: { select: { name: true, email: true } },
            category: { select: { name: true } },
          },
        });

        products.forEach(product => {
          if (product.updatedAt > latestUpdate) {
            latestUpdate = product.updatedAt;
          }
          entries.push({
            title: product.title,
            link: `${BASE_URL}/marketplace/${product.id}`,
            summary: product.shortDescription || product.description.slice(0, 300),
            published: product.createdAt.toISOString(),
            updated: product.updatedAt.toISOString(),
            author: product.seller.name || product.seller.email || undefined,
            category: product.category?.name,
            image: product.images?.[0] || undefined,
          });
        });
      } catch {
        // DB 연결 실패 시 무시
      }
    }

    // 튜토리얼 피드
    if (type === "all" || type === "tutorials") {
      try {
        const tutorials = await prisma.tutorial.findMany({
          where: { isPublished: true },
          orderBy: { updatedAt: "desc" },
          take: type === "all" ? Math.floor(limit / 3) : limit,
          include: {
            author: { select: { name: true, email: true } },
          },
        });

        tutorials.forEach(tutorial => {
          if (tutorial.updatedAt > latestUpdate) {
            latestUpdate = tutorial.updatedAt;
          }
          const typeLabel = {
            TUTORIAL: "튜토리얼",
            MAKING: "제작기",
            TIPS: "팁",
            EXTERNAL: "외부 자료",
          }[tutorial.type] || "교육";

          entries.push({
            title: `[${typeLabel}] ${tutorial.title}`,
            link: `${BASE_URL}/education/${tutorial.id}`,
            summary: tutorial.description,
            published: tutorial.createdAt.toISOString(),
            updated: tutorial.updatedAt.toISOString(),
            author: tutorial.author.name || tutorial.author.email || undefined,
            category: typeLabel,
            image: tutorial.thumbnail || undefined,
          });
        });
      } catch {
        // DB 연결 실패 시 무시
      }
    }

    // 커뮤니티 게시글 피드
    if (type === "all" || type === "posts") {
      try {
        const posts = await prisma.post.findMany({
          where: { isDeleted: false },
          orderBy: { updatedAt: "desc" },
          take: type === "all" ? Math.floor(limit / 3) : limit,
          include: {
            author: { select: { name: true, email: true } },
          },
        });

        const categoryLabels: Record<string, string> = {
          FREE: "자유게시판",
          QA: "Q&A",
          FEEDBACK: "피드백",
          NOTICE: "공지사항",
        };

        posts.forEach(post => {
          if (post.updatedAt > latestUpdate) {
            latestUpdate = post.updatedAt;
          }
          entries.push({
            title: post.title,
            link: `${BASE_URL}/community/${post.id}`,
            summary: post.content.replace(/[#*`\n]/g, " ").slice(0, 300),
            published: post.createdAt.toISOString(),
            updated: post.updatedAt.toISOString(),
            author: post.author.name || post.author.email || undefined,
            category: categoryLabels[post.category] || post.category,
          });
        });
      } catch {
        // DB 연결 실패 시 무시
      }
    }

    // 업데이트 날짜순 정렬
    entries.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

    // 최대 개수 제한
    const limitedEntries = entries.slice(0, limit);

    // 최신 업데이트가 없으면 현재 시간 사용
    if (latestUpdate.getTime() === 0) {
      latestUpdate = new Date();
    }

    const atomFeed = generateAtomFeed(limitedEntries, latestUpdate);

    return new NextResponse(atomFeed, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Atom 피드 생성 오류:", error);
    return NextResponse.json(
      { error: "Atom 피드 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
