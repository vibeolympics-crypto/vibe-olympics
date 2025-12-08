import { Metadata } from "next";
import { SettingsContent } from "./settings-content";

export const metadata: Metadata = {
  title: "설정",
  description: "계정 및 프로필 설정을 관리하세요.",
};

export default function SettingsPage() {
  return <SettingsContent />;
}
