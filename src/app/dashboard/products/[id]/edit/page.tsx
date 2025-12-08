import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EditProductContent } from "./edit-product-content";

interface EditProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { title: true },
  });

  return {
    title: product ? `${product.title} 수정` : "상품 수정",
    description: "상품 정보를 수정합니다.",
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      files: true,
    },
  });

  if (!product) {
    notFound();
  }

  // 본인 상품인지 확인
  if (product.sellerId !== session.user.id) {
    notFound();
  }

  // 직렬화 가능한 형태로 변환
  const serializedProduct = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription || "",
    price: Number(product.price),
    pricingType: product.pricingType,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    categoryId: product.categoryId,
    images: product.images,
    tags: product.tags,
    features: product.features,
    techStack: product.techStack,
    licenseType: product.licenseType,
    status: product.status,
    files: product.files.map(file => ({
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
    })),
  };

  return <EditProductContent product={serializedProduct} />;
}
