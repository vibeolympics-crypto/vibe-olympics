import { Metadata } from "next";
import { ResetPasswordContent } from "./reset-password-content";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "Vibe Olympics 계정의 새 비밀번호를 설정합니다.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
