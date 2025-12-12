import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL, SITE_CONFIG } from "@/lib/config";

export const dynamic = 'force-dynamic';

const SITE_TITLE = SITE_CONFIG.name;
const SITE_DESCRIPTION = SITE_CONFIG.description;

// RSS 2.0 형식 생성
function generateRssFeed(items: RssItem[]): string {
  const now = new Date().toUTCString();
  
  const itemsXml = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
      ${item.author ? `<author>${item.author}</author>` : ""}
      ${item.category ? `<category>${item.category}</category>` : ""}
      ${item.image ? `<enclosure url="${item.image}" type="image/jpeg" />` : ""}
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${APP_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${APP_URL}/api/feed/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${APP_URL}/logo.png</url>
      <title>${SITE_TITLE}</title>
      <link>${APP_URL}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`;
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  category?: string;
  image?: string;
}

// GET /api/feed/rss - RSS 피드 반환
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, products, tutorials, posts
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const items: RssItem[] = [];

    // 상품 피드
    if (type === "all" || type === "products") {
      try {
        const products = await prisma.product.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: type === "all" ? Math.floor(limit / 3) : limit,
          include: {
            seller: { select: { name: true, email: true } },
            category: { select: { name: true } },
          },
        });

        products.forEach(product => {
          items.push({
            title: product.title,
            link: `${APP_URL}/marketplace/${product.id}`,
            description: product.shortDescription || product.description.slice(0, 300),
            pubDate: product.createdAt.toISOString(),
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
          orderBy: { createdAt: "desc" },
          take: type === "all" ? Math.floor(limit / 3) : limit,
          include: {
            author: { select: { name: true, email: true } },
          },
        });

        tutorials.forEach(tutorial => {
          const typeLabel = {
            TUTORIAL: "튜토리얼",
            MAKING: "제작기",
            TIPS: "팁",
            EXTERNAL: "외부 자료",
          }[tutorial.type] || "교육";

          items.push({
            title: `[${typeLabel}] ${tutorial.title}`,
            link: `${APP_URL}/education/${tutorial.id}`,
            description: tutorial.description,
            pubDate: tutorial.createdAt.toISOString(),
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
          orderBy: { createdAt: "desc" },
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
          items.push({
            title: post.title,
            link: `${APP_URL}/community/${post.id}`,
            description: post.content.replace(/[#*`\n]/g, " ").slice(0, 300),
            pubDate: post.createdAt.toISOString(),
            author: post.author.name || post.author.email || undefined,
            category: categoryLabels[post.category] || post.category,
          });
        });
      } catch {
        // DB 연결 실패 시 무시
      }
    }

    // 날짜순 정렬
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 최대 개수 제한
    const limitedItems = items.slice(0, limit);

    const rssFeed = generateRssFeed(limitedItems);

    return new NextResponse(rssFeed, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("RSS 피드 생성 오류:", error);
    return NextResponse.json(
      { error: "RSS 피드 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
