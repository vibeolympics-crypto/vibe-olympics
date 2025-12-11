"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TicketCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  startDate: string;
  endDate: string | null;
  applicableType: "ALL" | "PRODUCTS" | "CATEGORIES" | "SELLER";
  applicableIds: string[];
  sellerId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CouponsResponse {
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startDate: string;
  endDate: string;
  applicableType: "ALL" | "PRODUCTS" | "CATEGORIES" | "SELLER";
  isPlatformCoupon: boolean;
  isActive: boolean;
}

const initialFormData: CouponFormData = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  usageLimitPerUser: "1",
  startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  endDate: "",
  applicableType: "ALL",
  isPlatformCoupon: false,
  isActive: true,
};

export default function CouponsManagementPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  // 쿠폰 목록 조회
  const { data, isLoading, refetch } = useQuery<CouponsResponse>({
    queryKey: ["coupons", filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (filter === "active") {
        params.append("activeOnly", "true");
      }
      const res = await fetch(`/api/coupons?${params}`);
      if (!res.ok) throw new Error("Failed to fetch coupons");
      return res.json();
    },
  });

  // 쿠폰 생성
  const createMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          name: data.name,
          description: data.description || null,
          discountType: data.discountType,
          discountValue: parseFloat(data.discountValue),
          minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
          maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
          usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
          usageLimitPerUser: data.usageLimitPerUser ? parseInt(data.usageLimitPerUser) : 1,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          applicableType: data.applicableType,
          isPlatformCoupon: data.isPlatformCoupon,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("쿠폰이 생성되었습니다.");
      setIsCreateOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 쿠폰 수정
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponFormData> }) => {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("쿠폰이 수정되었습니다.");
      setEditingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 쿠폰 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("쿠폰이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 코드 생성
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  // 코드 복사
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("쿠폰 코드가 복사되었습니다.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.discountValue) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    createMutation.mutate(formData);
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: "비활성", variant: "secondary" as const };
    if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
      return { label: "만료", variant: "danger" as const };
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { label: "소진", variant: "outline" as const };
    }
    return { label: "활성", variant: "default" as const };
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "PERCENTAGE") {
      return `${coupon.discountValue}%`;
    }
    return `₩${coupon.discountValue.toLocaleString()}`;
  };

  // 통계 카드 데이터
  const stats = data
    ? {
        total: data.pagination.total,
        active: data.coupons.filter(
          (c) =>
            c.isActive &&
            (!c.endDate || new Date(c.endDate) >= new Date()) &&
            (!c.usageLimit || c.usedCount < c.usageLimit)
        ).length,
        totalUsed: data.coupons.reduce((sum, c) => sum + c.usedCount, 0),
      }
    : { total: 0, active: 0, totalUsed: 0 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">쿠폰 관리</h1>
          <p className="text-muted-foreground">
            할인 쿠폰을 생성하고 관리하세요
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              쿠폰 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 쿠폰 생성</DialogTitle>
              <DialogDescription>
                할인 쿠폰의 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 코드 */}
              <div className="space-y-2">
                <Label htmlFor="code">쿠폰 코드 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="예: WELCOME2024"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    자동 생성
                  </Button>
                </div>
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">쿠폰명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="예: 신규 회원 환영 쿠폰"
                />
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="쿠폰에 대한 설명을 입력하세요"
                  rows={2}
                />
              </div>

              {/* 할인 타입 및 값 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>할인 타입 *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, discountType: value as "PERCENTAGE" | "FIXED_AMOUNT" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">퍼센트 (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">고정 금액 (₩)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">할인 값 *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discountValue: e.target.value }))
                    }
                    placeholder={formData.discountType === "PERCENTAGE" ? "10" : "1000"}
                    min="1"
                    max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                  />
                </div>
              </div>

              {/* 최소/최대 금액 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">최소 주문 금액</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minOrderAmount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                {formData.discountType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">최대 할인 금액</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))
                      }
                      placeholder="무제한"
                    />
                  </div>
                )}
              </div>

              {/* 사용 제한 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">총 사용 횟수</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                    placeholder="무제한"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageLimitPerUser">1인당 사용 횟수</Label>
                  <Input
                    id="usageLimitPerUser"
                    type="number"
                    value={formData.usageLimitPerUser}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimitPerUser: e.target.value }))
                    }
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              {/* 유효 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료일</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* 적용 대상 */}
              <div className="space-y-2">
                <Label>적용 대상</Label>
                <Select
                  value={formData.applicableType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, applicableType: value as "ALL" | "PRODUCTS" | "CATEGORIES" | "SELLER" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">모든 상품</SelectItem>
                    <SelectItem value="PRODUCTS">특정 상품</SelectItem>
                    <SelectItem value="CATEGORIES">특정 카테고리</SelectItem>
                    <SelectItem value="SELLER">특정 판매자</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 플랫폼 쿠폰 (관리자만) */}
              {isAdmin && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPlatformCoupon">플랫폼 쿠폰</Label>
                    <p className="text-sm text-muted-foreground">
                      전체 상품에 적용되는 플랫폼 발행 쿠폰
                    </p>
                  </div>
                  <Switch
                    id="isPlatformCoupon"
                    checked={formData.isPlatformCoupon}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isPlatformCoupon: checked }))
                    }
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "생성 중..." : "쿠폰 생성"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 쿠폰</CardTitle>
            <Tag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 쿠폰</CardTitle>
            <TicketCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용 횟수</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsed}회</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 탭 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>쿠폰 목록</CardTitle>
              <CardDescription>
                등록된 모든 쿠폰을 확인하고 관리하세요
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="active">활성</TabsTrigger>
                  <TabsTrigger value="expired">만료/비활성</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : !data?.coupons.length ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 쿠폰이 없습니다
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>쿠폰명</TableHead>
                    <TableHead>할인</TableHead>
                    <TableHead className="hidden md:table-cell">사용</TableHead>
                    <TableHead className="hidden md:table-cell">유효기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 rounded bg-muted text-sm font-mono">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(coupon.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{coupon.name}</p>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {coupon.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {coupon.discountType === "PERCENTAGE" ? (
                              <Percent className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className="font-medium">{formatDiscount(coupon)}</span>
                          </div>
                          {coupon.minOrderAmount && (
                            <p className="text-xs text-muted-foreground">
                              {coupon.minOrderAmount.toLocaleString()}원 이상
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {coupon.usedCount}
                              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            {coupon.endDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span>
                                  {format(new Date(coupon.endDate), "yy.MM.dd", {
                                    locale: ko,
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">무기한</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {!coupon.sellerId && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              플랫폼
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyCode(coupon.code)}>
                                <Copy className="w-4 h-4 mr-2" />
                                코드 복사
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: coupon.id,
                                    data: { isActive: !coupon.isActive },
                                  })
                                }
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {coupon.isActive ? "비활성화" : "활성화"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("정말로 이 쿠폰을 삭제하시겠습니까?")) {
                                    deleteMutation.mutate(coupon.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 페이지네이션 */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
