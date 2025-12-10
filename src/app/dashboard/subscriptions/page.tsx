"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  features: string[];
  seller: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
  } | null;
}

interface Subscription {
  id: string;
  planId: string;
  plan: SubscriptionPlan;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  isTrialUsed: boolean;
  nextBillingDate: string | null;
  lastBillingDate: string | null;
  totalPaid: number;
  paymentCount: number;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  createdAt: string;
}

const statusConfig = {
  ACTIVE: { label: "활성", color: "bg-green-100 text-green-800", icon: CheckCircle },
  PAUSED: { label: "일시정지", color: "bg-yellow-100 text-yellow-800", icon: Pause },
  CANCELLED: { label: "취소됨", color: "bg-gray-100 text-gray-800", icon: XCircle },
  EXPIRED: { label: "만료됨", color: "bg-red-100 text-red-800", icon: XCircle },
  PAST_DUE: { label: "연체", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
};

export default function SubscriptionsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const t = useTranslations();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/subscriptions");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptions();
    }
  }, [session]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      const data = await response.json();
      if (response.ok) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error("구독 목록 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (subscriptionId: string) => {
    if (payments[subscriptionId]) return;
    
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/payments`);
      const data = await response.json();
      if (response.ok) {
        setPayments((prev) => ({ ...prev, [subscriptionId]: data.payments }));
      }
    } catch (error) {
      console.error("결제 내역 조회 오류:", error);
    }
  };

  const handleAction = async (subscriptionId: string, action: string) => {
    setActionLoading(subscriptionId);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub.id === subscriptionId ? { ...sub, ...data.subscription } : sub
          )
        );
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("구독 액션 오류:", error);
      alert("처리 중 오류가 발생했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("정말 구독을 취소하시겠습니까? 현재 기간이 종료되면 만료됩니다.")) {
      return;
    }
    await handleAction(subscriptionId, "cancel");
  };

  const toggleExpand = (subscriptionId: string) => {
    if (expandedId === subscriptionId) {
      setExpandedId(null);
    } else {
      setExpandedId(subscriptionId);
      fetchPayments(subscriptionId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isInTrial = (sub: Subscription) => {
    if (!sub.trialEnd) return false;
    return new Date(sub.trialEnd) > new Date();
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">구독 관리</h1>
        <p className="text-gray-600">내 구독 현황을 확인하고 관리하세요</p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">구독이 없습니다</h3>
            <p className="text-gray-500 mb-4">
              다양한 구독 플랜을 둘러보고 콘텐츠에 무제한 접근하세요
            </p>
            <Button onClick={() => router.push("/marketplace")}>
              플랜 둘러보기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const statusInfo = statusConfig[subscription.status];
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === subscription.id;
            const inTrial = isInTrial(subscription);

            return (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {subscription.plan.name}
                        {inTrial && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            무료 체험 중
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {subscription.plan.seller?.displayName || subscription.plan.seller?.name || "플랫폼 구독"}
                      </CardDescription>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 구독 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">결제 주기</span>
                      <p className="font-medium">
                        {formatPrice(Number(subscription.plan.price))}/
                        {subscription.plan.interval === "MONTHLY" ? "월" : "년"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">다음 결제일</span>
                      <p className="font-medium">
                        {subscription.nextBillingDate
                          ? formatDate(subscription.nextBillingDate)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">구독 기간</span>
                      <p className="font-medium">
                        {formatDate(subscription.currentPeriodStart)} ~{" "}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">총 결제 금액</span>
                      <p className="font-medium">
                        {formatPrice(Number(subscription.totalPaid))}
                        <span className="text-gray-400 text-xs ml-1">
                          ({subscription.paymentCount}회)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 트라이얼 정보 */}
                  {inTrial && subscription.trialEnd && (
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        무료 체험이 {formatDate(subscription.trialEnd)}에 종료됩니다
                      </span>
                    </div>
                  )}

                  {/* 연체 경고 */}
                  {subscription.status === "PAST_DUE" && (
                    <div className="bg-orange-50 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-700">
                        결제가 실패했습니다. 결제 수단을 확인해주세요.
                      </span>
                    </div>
                  )}

                  {/* 취소 정보 */}
                  {subscription.status === "CANCELLED" && subscription.cancelledAt && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        {formatDate(subscription.cancelledAt)}에 취소됨
                        {subscription.cancelReason && ` - ${subscription.cancelReason}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(subscription.currentPeriodEnd)}까지 이용 가능합니다
                      </p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {subscription.status === "ACTIVE" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(subscription.id, "pause")}
                          disabled={actionLoading === subscription.id}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          일시정지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCancel(subscription.id)}
                          disabled={actionLoading === subscription.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          구독 취소
                        </Button>
                      </>
                    )}
                    {subscription.status === "PAUSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(subscription.id, "resume")}
                        disabled={actionLoading === subscription.id}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        재개하기
                      </Button>
                    )}
                    {subscription.status === "PAST_DUE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(subscription.id, "update-payment")}
                        disabled={actionLoading === subscription.id}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        결제 수단 변경
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(subscription.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          결제 내역 숨기기
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          결제 내역 보기
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 결제 내역 (확장) */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        결제 내역
                      </h4>
                      {payments[subscription.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {payments[subscription.id].map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {formatDate(payment.periodStart)} ~{" "}
                                  {formatDate(payment.periodEnd)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {payment.paymentMethod || "카드"} •{" "}
                                  {formatDate(payment.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {formatPrice(Number(payment.amount))}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={
                                    payment.status === "COMPLETED"
                                      ? "text-green-600"
                                      : payment.status === "FAILED"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }
                                >
                                  {payment.status === "COMPLETED"
                                    ? "완료"
                                    : payment.status === "FAILED"
                                    ? "실패"
                                    : payment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          결제 내역이 없습니다
                        </p>
                      )}
                    </div>
                  )}

                  {/* 플랜 혜택 */}
                  {subscription.plan.features.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-sm text-gray-600">
                        플랜 혜택
                      </h4>
                      <ul className="grid grid-cols-2 gap-1">
                        {subscription.plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
