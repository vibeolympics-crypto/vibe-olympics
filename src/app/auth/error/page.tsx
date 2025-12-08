import { Metadata } from "next";
import { AuthErrorContent } from "./error-content";

export const metadata: Metadata = {
  title: "인증 오류",
  description: "인증 과정에서 오류가 발생했습니다.",
};

export default function AuthErrorPage() {
  return <AuthErrorContent />;
}
