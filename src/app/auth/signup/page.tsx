import { Metadata } from "next";
import { SignupContent } from "./signup-content";

export const metadata: Metadata = {
  title: "회원가입",
  description: "Vibe Olympics에 가입하여 창작자로서 여정을 시작하세요. 무료 가입, 쉬운 시작.",
};

export default function SignupPage() {
  return <SignupContent />;
}
