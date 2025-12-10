"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Save,
  Github,
  ExternalLink,
  CheckCircle,
  Loader2,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/use-api";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { NotificationSettings } from "@/lib/api";

const tabs = [
  { id: "profile", name: "프로필", icon: User },
  { id: "account", name: "계정", icon: Mail },
  { id: "notifications", name: "알림", icon: Bell },
  { id: "billing", name: "결제", icon: CreditCard },
  { id: "security", name: "보안", icon: Shield },
];

export function SettingsContent() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [_isFetching, setIsFetching] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    website: "",
    twitter: "",
    github: "",
    image: "",
  });

  // 프로필 데이터 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.user.name || "",
            bio: data.user.bio || "",
            website: data.user.website || "",
            twitter: data.user.twitter || "",
            github: data.user.github || "",
            image: data.user.image || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    } else {
      setIsFetching(false);
    }
  }, [session?.user]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "프로필 저장 실패");
      }

      // 세션 업데이트 (이름, 이미지 변경 시)
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: profile.name,
          image: profile.image,
        },
      });

      setSaveMessage("프로필이 저장되었습니다!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage(error instanceof Error ? error.message : "저장 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (file: { url: string }) => {
    setProfile({ ...profile, image: file.url });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">설정</h1>
        <p className="text-[var(--text-tertiary)] mt-1">
          계정 및 프로필 설정을 관리하세요
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "profile" && (
              <Card variant="glass">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    프로필 정보
                  </h2>

                  {/* Success/Error Message */}
                  {saveMessage && (
                    <div className={cn(
                      "mb-6 p-4 rounded-lg flex items-center gap-2",
                      saveMessage.includes("저장") 
                        ? "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]"
                        : "bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]"
                    )}>
                      <CheckCircle className="w-5 h-5" />
                      {saveMessage}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      {profile.image ? (
                        <img 
                          src={profile.image} 
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center">
                          <span className="text-white text-3xl font-bold">
                            {profile.name?.[0] || session?.user?.name?.[0] || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--text-primary)] mb-2">
                        프로필 이미지
                      </h3>
                      <FileUpload
                        type="avatar"
                        onUpload={handleAvatarUpload}
                        maxSize={2}
                        label="이미지 변경"
                        hint="JPG, PNG 파일 (최대 2MB)"
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        이름
                      </label>
                      <Input
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        placeholder="이름을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        소개
                      </label>
                      <Textarea
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        placeholder="자신을 소개해주세요"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                          웹사이트
                        </label>
                        <Input
                          value={profile.website}
                          onChange={(e) =>
                            setProfile({ ...profile, website: e.target.value })
                          }
                          placeholder="https://yoursite.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                          GitHub
                        </label>
                        <Input
                          value={profile.github}
                          onChange={(e) =>
                            setProfile({ ...profile, github: e.target.value })
                          }
                          placeholder="github-username"
                          icon={<Github className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8 pt-6 border-t border-[var(--bg-border)]">
                    <Button
                      variant="neon"
                      onClick={handleSave}
                      isLoading={isLoading}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      저장하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "account" && (
              <Card variant="glass">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    계정 설정
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        이메일
                      </label>
                      <Input
                        value={session?.user?.email || ""}
                        disabled
                        icon={<Mail className="w-4 h-4" />}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        이메일은 변경할 수 없습니다
                      </p>
                    </div>

                    {/* Connected Accounts */}
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                        연결된 계정
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
                          <div className="flex items-center gap-3">
                            <Github className="w-5 h-5 text-[var(--text-primary)]" />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                GitHub
                              </p>
                              <p className="text-sm text-[var(--text-tertiary)]">
                                @github-user
                              </p>
                            </div>
                          </div>
                          <Badge variant="success">연결됨</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-[var(--bg-border)]">
                      <h3 className="text-sm font-medium text-[var(--semantic-error)] mb-4">
                        위험 영역
                      </h3>
                      <Button variant="outline" className="text-[var(--semantic-error)] border-[var(--semantic-error)]">
                        계정 삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <NotificationsTab />
            )}

            {activeTab === "billing" && (
              <Card variant="glass">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    결제 정보
                  </h2>

                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-[var(--text-disabled)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                      결제 수단 없음
                    </h3>
                    <p className="text-[var(--text-tertiary)] mb-6">
                      판매 수익금을 받으려면 결제 수단을 등록하세요
                    </p>
                    <Button variant="neon">결제 수단 추가</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card variant="glass">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    보안 설정
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            비밀번호 변경
                          </p>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            마지막 변경: 30일 전
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        변경
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            2단계 인증
                          </p>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            계정 보안을 강화하세요
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        설정
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            활성 세션
                          </p>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            2개의 기기에서 로그인됨
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        관리
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// 알림 설정 토글 스위치 컴포넌트
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn(
      "relative inline-flex items-center cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="sr-only peer"
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-[var(--bg-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
    </label>
  );
}

// 알림 설정 탭 컴포넌트
function NotificationsTab() {
  const { data, isLoading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // 데이터 로드 시 로컬 상태 업데이트를 위한 콜백
  const syncLocalSettings = useCallback((settings: NotificationSettings) => {
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      setLocalSettings(settings);
    }
  }, []);

  // 데이터 로드 시 로컬 상태 업데이트
  // 외부 데이터 소스(API)와 로컬 상태 동기화를 위한 정당한 패턴입니다
  useEffect(() => {
    if (data?.settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      syncLocalSettings(data.settings);
    }
  }, [data, syncLocalSettings]);

  const handleToggle = async (
    category: "email" | "push",
    key: string,
    value: boolean
  ) => {
    if (!localSettings) return;

    // 즉시 UI 업데이트 (낙관적 업데이트)
    const newSettings = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value,
      },
    };
    setLocalSettings(newSettings);

    // API 호출
    try {
      await updateSettings.mutateAsync({
        [category]: { [key]: value },
      });
      setSaveMessage("설정이 저장되었습니다");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      // 실패 시 롤백
      setLocalSettings(data?.settings || null);
      setSaveMessage("저장에 실패했습니다");
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !localSettings) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-[var(--text-tertiary)]">
              알림 설정을 불러오는 데 실패했습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const emailNotifications = [
    {
      key: "sales",
      title: "판매 알림",
      description: "상품이 판매될 때 이메일 알림을 받습니다",
    },
    {
      key: "reviews",
      title: "리뷰 알림",
      description: "새로운 리뷰가 작성될 때 이메일 알림을 받습니다",
    },
    {
      key: "purchases",
      title: "구매 확인",
      description: "구매 완료 시 확인 이메일을 받습니다",
    },
    {
      key: "community",
      title: "커뮤니티 알림",
      description: "게시글 댓글, 답글 등 커뮤니티 활동 알림을 받습니다",
    },
    {
      key: "followers",
      title: "팔로우 알림",
      description: "새로운 팔로워가 생길 때 알림을 받습니다",
    },
    {
      key: "wishlistSale",
      title: "위시리스트 할인 알림",
      description: "위시리스트 상품이 할인될 때 알림을 받습니다",
    },
    {
      key: "subscriptionReminder",
      title: "구독 만료 알림",
      description: "구독 갱신 및 만료 전 알림을 받습니다",
    },
    {
      key: "paymentFailed",
      title: "결제 실패 알림",
      description: "결제 실패 시 알림을 받습니다",
    },
    {
      key: "weeklyDigest",
      title: "주간 요약",
      description: "주간 판매/활동 요약 리포트를 받습니다",
    },
    {
      key: "marketing",
      title: "마케팅 이메일",
      description: "프로모션, 이벤트, 할인 정보를 받습니다",
    },
    {
      key: "newsletter",
      title: "뉴스레터",
      description: "주간 뉴스레터 및 업데이트 정보를 받습니다",
    },
  ];

  const pushNotifications = [
    {
      key: "sales",
      title: "판매 알림",
      description: "상품이 판매될 때 푸시 알림을 받습니다",
    },
    {
      key: "reviews",
      title: "리뷰 알림",
      description: "새로운 리뷰가 작성될 때 푸시 알림을 받습니다",
    },
    {
      key: "purchases",
      title: "구매 확인",
      description: "구매 완료 시 푸시 알림을 받습니다",
    },
    {
      key: "community",
      title: "커뮤니티 알림",
      description: "게시글 댓글, 답글 등 커뮤니티 활동 알림을 받습니다",
    },
    {
      key: "followers",
      title: "팔로우 알림",
      description: "새로운 팔로워가 생길 때 알림을 받습니다",
    },
    {
      key: "mentions",
      title: "멘션 알림",
      description: "누군가 나를 멘션할 때 알림을 받습니다",
    },
    {
      key: "subscriptionReminder",
      title: "구독 만료 알림",
      description: "구독 갱신 및 만료 전 알림을 받습니다",
    },
    {
      key: "paymentFailed",
      title: "결제 실패 알림",
      description: "결제 실패 시 즉시 알림을 받습니다",
    },
    {
      key: "promotion",
      title: "프로모션 알림",
      description: "특가, 이벤트, 할인 정보를 받습니다",
    },
    {
      key: "marketing",
      title: "마케팅 알림",
      description: "프로모션, 이벤트, 할인 정보를 받습니다",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-2",
          saveMessage.includes("저장") 
            ? "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]"
            : "bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]"
        )}>
          <CheckCircle className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      {/* 브라우저 푸시 알림 구독 */}
      <PushNotificationSetup />

      {/* 이메일 알림 설정 */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              이메일 알림
            </h2>
          </div>

          <div className="space-y-4">
            {emailNotifications.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {item.description}
                  </p>
                </div>
                <ToggleSwitch
                  checked={localSettings.email[item.key as keyof typeof localSettings.email] ?? false}
                  onChange={(checked) => handleToggle("email", item.key, checked)}
                  disabled={updateSettings.isPending}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 푸시/인앱 알림 설정 */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              푸시 알림
            </h2>
          </div>

          <div className="space-y-4">
            {pushNotifications.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {item.description}
                  </p>
                </div>
                <ToggleSwitch
                  checked={localSettings.push[item.key as keyof typeof localSettings.push] ?? false}
                  onChange={(checked) => handleToggle("push", item.key, checked)}
                  disabled={updateSettings.isPending}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 브라우저 푸시 알림 설정 컴포넌트
function PushNotificationSetup() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    showNotification,
  } = usePushNotifications();

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      // 테스트 알림 전송
      await showNotification("Vibe Olympics", {
        body: "🎉 푸시 알림이 활성화되었습니다!",
        tag: "subscription-success",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              브라우저 알림
            </h2>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-elevated)]">
            <AlertCircle className="w-5 h-5 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)]">
              이 브라우저는 푸시 알림을 지원하지 않습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            브라우저 알림
          </h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              브라우저 푸시 알림
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              {isSubscribed
                ? "브라우저에서 실시간 알림을 받고 있습니다"
                : permission === "denied"
                ? "브라우저 설정에서 알림을 허용해주세요"
                : "브라우저에서 실시간 알림을 받으세요"}
            </p>
            {error && (
              <p className="text-sm text-[var(--semantic-error)] mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSubscribed && (
              <Badge variant="success" className="mr-2">활성화됨</Badge>
            )}
            {permission === "denied" ? (
              <Badge variant="outline" className="text-[var(--semantic-error)]">
                차단됨
              </Badge>
            ) : isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "비활성화"
                )}
              </Button>
            ) : (
              <Button
                variant="neon"
                size="sm"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "알림 받기"
                )}
              </Button>
            )}
          </div>
        </div>

        {isSubscribed && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => showNotification("테스트 알림", {
                body: "푸시 알림이 정상 작동합니다! 🎉",
                tag: "test-notification",
              })}
            >
              테스트 알림 보내기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
