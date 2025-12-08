import { Metadata } from "next";
import { ForgotPasswordContent } from "./forgot-password-content";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "Vibe Olympics 계정 비밀번호를 재설정합니다.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
