import { Metadata } from "next";
import { LoginContent } from "./login-content";

export const metadata: Metadata = {
  title: "로그인",
  description: "Vibe Olympics에 로그인하여 다양한 디지털 상품을 탐색하고 창작자로 활동하세요.",
};

export default function LoginPage() {
  return <LoginContent />;
}
