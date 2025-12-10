import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CollectionsContent } from "./collections-content";

export const metadata = {
  title: "컬렉션 관리 | Vibe Olympics",
  description: "상품 컬렉션 및 번들을 관리하세요",
};

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/collections");
  }

  return <CollectionsContent />;
}
