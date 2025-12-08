import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostDetailContent } from "./post-detail-content";

// 게시글 데이터 조회
const getPost = async (id: string) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            isSeller: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) return null;

    // 조회수 증가
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      viewCount: post.viewCount + 1,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isPinned: post.isPinned,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.name || "익명",
        username: post.author.email?.split("@")[0] || "unknown",
        image: post.author.image,
        bio: post.author.bio || "",
        isSeller: post.author.isSeller,
      },
    };
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return null;
  }
};

// 카테고리 한글 변환
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    FREE: "자유게시판",
    QA: "Q&A",
    FEEDBACK: "피드백",
    NOTICE: "공지사항",
  };
  return labels[category] || category;
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  const description = post.content.replace(/[#*`\n]/g, " ").slice(0, 160);
  const categoryLabel = getCategoryLabel(post.category);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibeolympics.com";

  return {
    title: `${post.title} | ${categoryLabel} | Vibe Olympics`,
    description,
    keywords: [
      "VIBE Olympics",
      "커뮤니티",
      categoryLabel,
      "디지털 상품",
      "크리에이터",
      post.author.name,
    ],
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: categoryLabel,
      url: `${appUrl}/community/${post.id}`,
      siteName: "Vibe Olympics",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
    alternates: {
      canonical: `${appUrl}/community/${post.id}`,
    },
  };
}

// JSON-LD 구조화된 데이터 생성
function generateJsonLd(post: NonNullable<Awaited<ReturnType<typeof getPost>>>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibeolympics.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `${appUrl}/community/${post.id}`,
    headline: post.title,
    text: post.content.slice(0, 500),
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: `${appUrl}/seller/${post.author.id}`,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: post.viewCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likeCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.commentCount,
      },
    ],
    discussionUrl: `${appUrl}/community/${post.id}`,
    isPartOf: {
      "@type": "DiscussionForum",
      name: "Vibe Olympics 커뮤니티",
      url: `${appUrl}/community`,
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const jsonLd = generateJsonLd(post);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostDetailContent post={post} />
    </>
  );
}
