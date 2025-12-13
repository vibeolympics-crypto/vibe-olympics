'use client';

/**
 * 통합 결제 선택기 컴포넌트
 * - PayPal, Toss, Stripe 등 다양한 결제 제공자 지원
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CreditCard,
  Globe,
  Smartphone,
  Building2,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Shield,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// 타입 정의
type PaymentProvider = 'paypal' | 'toss' | 'stripe' | 'bootpay';
type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY';
type PaymentMethod = 'card' | 'bank_transfer' | 'virtual_account' | 'paypal' | 'toss' | 'kakao' | 'naver';

interface PaymentProviderInfo {
  id: PaymentProvider;
  name: string;
  description: string;
  currencies: string[];
  methods: string[];
  available: boolean;
  icon: string;
}

interface PaymentSelectorProps {
  amount: number;
  currency?: Currency;
  productId?: string;
  productName: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  transactionId?: string;
  orderId?: string;
  status: string;
  amount?: number;
  demo?: boolean;
}

// 결제 제공자 아이콘 매핑
const providerIcons: Record<PaymentProvider, React.ReactNode> = {
  paypal: <Globe className="w-5 h-5 text-blue-600" />,
  toss: <Smartphone className="w-5 h-5 text-blue-500" />,
  stripe: <CreditCard className="w-5 h-5 text-purple-600" />,
  bootpay: <Wallet className="w-5 h-5 text-green-600" />,
};

// 결제 수단 아이콘 매핑
const methodIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4" />,
  bank_transfer: <Building2 className="w-4 h-4" />,
  virtual_account: <Building2 className="w-4 h-4" />,
  paypal: <Globe className="w-4 h-4" />,
  toss: <Smartphone className="w-4 h-4" />,
  kakao: <Smartphone className="w-4 h-4" />,
  naver: <Smartphone className="w-4 h-4" />,
};

// 금액 포맷팅
function formatAmount(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat(currency === 'KRW' ? 'ko-KR' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KRW' ? 0 : 2,
  });
  return formatter.format(amount);
}

export function PaymentSelector({
  amount,
  currency = 'KRW',
  productId,
  productName,
  onSuccess,
  onError,
  onCancel,
  className,
}: PaymentSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'result'>('select');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // 결제 제공자 목록 조회
  const { data: providersData, isLoading: isLoadingProviders } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: async () => {
      const response = await fetch('/api/payment/providers?type=providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json();
    },
  });

  // 결제 생성 mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      provider: PaymentProvider;
      orderName: string;
      amount: number;
      currency: Currency;
      productId?: string;
    }) => {
      const response = await fetch('/api/payment/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...data,
        }),
      });
      if (!response.ok) throw new Error('Payment creation failed');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        // PayPal은 리다이렉트 필요
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        
        // 데모 모드 또는 즉시 완료
        setPaymentResult(result);
        setStep('result');
        onSuccess?.(result);
      } else {
        onError?.(result.error || '결제 생성 실패');
        setStep('select');
      }
    },
    onError: (error) => {
      onError?.(error instanceof Error ? error.message : '결제 오류');
      setStep('select');
    },
  });

  // 추천 제공자 자동 선택
  useEffect(() => {
    if (providersData?.recommended) {
      const recommended = providersData.recommended[currency];
      if (recommended && !selectedProvider) {
        setSelectedProvider(recommended);
      }
    }
  }, [providersData, currency, selectedProvider]);

  // 제공자별 결제 수단 목록
  const getMethodsForProvider = useCallback((provider: PaymentProvider): PaymentMethod[] => {
    const providerInfo = providersData?.providers?.find(
      (p: PaymentProviderInfo) => p.id === provider
    );
    return (providerInfo?.methods || []) as PaymentMethod[];
  }, [providersData]);

  // 결제 시작
  const handleStartPayment = () => {
    if (!selectedProvider) return;
    
    setStep('processing');
    createPaymentMutation.mutate({
      provider: selectedProvider,
      orderName: productName,
      amount,
      currency,
      productId,
    });
  };

  // 결제 제공자 선택 UI
  const renderProviderSelection = () => (
    <div className="space-y-4">
      <div className="grid gap-3">
        {providersData?.providers?.map((provider: PaymentProviderInfo) => (
          <motion.div
            key={provider.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all',
                selectedProvider === provider.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-gray-400',
                !provider.available && 'opacity-60'
              )}
              onClick={() => {
                if (provider.available || true) { // 데모 모드 허용
                  setSelectedProvider(provider.id as PaymentProvider);
                  setSelectedMethod(null);
                }
              }}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{provider.icon}</div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {provider.name}
                      {!provider.available && (
                        <Badge variant="secondary" className="text-xs">데모</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {selectedProvider === provider.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 결제 수단 선택 (선택적) */}
      {selectedProvider && selectedProvider !== 'paypal' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <Label>결제 수단 선택</Label>
          <div className="flex flex-wrap gap-2">
            {getMethodsForProvider(selectedProvider).map((method) => (
              <Button
                key={method}
                variant={selectedMethod === method ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMethod(method)}
                className="gap-2"
              >
                {methodIcons[method]}
                {method === 'card' && '카드'}
                {method === 'bank_transfer' && '계좌이체'}
                {method === 'virtual_account' && '가상계좌'}
                {method === 'toss' && '토스페이'}
                {method === 'kakao' && '카카오페이'}
                {method === 'naver' && '네이버페이'}
                {method === 'paypal' && 'PayPal'}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  // 결제 확인 UI
  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">상품명</span>
          <span className="font-medium">{productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">결제 금액</span>
          <span className="font-bold text-lg">{formatAmount(amount, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">결제 수단</span>
          <span className="flex items-center gap-2">
            {selectedProvider && providerIcons[selectedProvider]}
            {providersData?.providers?.find((p: PaymentProviderInfo) => p.id === selectedProvider)?.name}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>결제 정보는 SSL 암호화로 안전하게 보호됩니다.</p>
      </div>
    </div>
  );

  // 결제 처리 중 UI
  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-12 h-12 text-primary" />
      </motion.div>
      <p className="text-lg font-medium">결제 처리 중...</p>
      <p className="text-sm text-muted-foreground">잠시만 기다려주세요.</p>
    </div>
  );

  // 결제 결과 UI
  const renderResult = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {paymentResult?.success ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-bold">결제 완료!</h3>
          {paymentResult.demo && (
            <Badge variant="secondary">데모 모드</Badge>
          )}
          <div className="text-center space-y-1">
            <p className="text-muted-foreground">주문번호: {paymentResult.orderId}</p>
            <p className="text-lg font-medium">{formatAmount(amount, currency)}</p>
          </div>
        </>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <AlertCircle className="w-16 h-16 text-red-500" />
          </motion.div>
          <h3 className="text-xl font-bold">결제 실패</h3>
          <p className="text-muted-foreground text-center">
            결제 처리 중 문제가 발생했습니다.<br />
            다시 시도해주세요.
          </p>
        </>
      )}
    </div>
  );

  if (isLoadingProviders) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          안전한 결제
        </CardTitle>
        <CardDescription>
          결제 방법을 선택해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderProviderSelection()}
            </motion.div>
          )}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderConfirmation()}
            </motion.div>
          )}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderProcessing()}
            </motion.div>
          )}
          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {renderResult()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 버튼 */}
        <div className="flex gap-3 mt-6">
          {step === 'select' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                취소
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!selectedProvider}
                onClick={() => setStep('confirm')}
              >
                다음
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('select')}
              >
                이전
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleStartPayment}
                disabled={createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {formatAmount(amount, currency)} 결제하기
                  </>
                )}
              </Button>
            </>
          )}
          {step === 'result' && (
            <>
              {paymentResult?.success ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setStep('select');
                    setPaymentResult(null);
                  }}
                >
                  완료
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      setStep('select');
                      setPaymentResult(null);
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    다시 시도
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 결제 내역 컴포넌트
export function PaymentHistory({ className }: { className?: string }) {
  // 데모 결제 내역
  const demoHistory = [
    {
      id: 'PAY-001',
      provider: 'toss' as PaymentProvider,
      amount: 29000,
      currency: 'KRW' as Currency,
      status: 'completed',
      productName: '프리미엄 템플릿 팩',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: 'PAY-002',
      provider: 'paypal' as PaymentProvider,
      amount: 15.99,
      currency: 'USD' as Currency,
      status: 'completed',
      productName: 'Icon Set Bundle',
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: 'PAY-003',
      provider: 'stripe' as PaymentProvider,
      amount: 49000,
      currency: 'KRW' as Currency,
      status: 'refunded',
      productName: 'UI Kit Pro',
      createdAt: new Date(Date.now() - 86400000 * 10),
    },
  ];

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    completed: '완료',
    pending: '대기중',
    failed: '실패',
    refunded: '환불',
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>결제 내역</CardTitle>
        <CardDescription>최근 결제 내역을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoHistory.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {providerIcons[payment.provider]}
                <div>
                  <p className="font-medium">{payment.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {formatAmount(payment.amount, payment.currency)}
                </p>
                <Badge className={cn('text-xs', statusColors[payment.status])}>
                  {statusLabels[payment.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 결제 설정 컴포넌트 (판매자용)
export function PaymentSettings({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>결제 설정</CardTitle>
        <CardDescription>결제 제공자 및 수수료 설정</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="providers">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">결제사</TabsTrigger>
            <TabsTrigger value="fees">수수료</TabsTrigger>
            <TabsTrigger value="currencies">통화</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4 mt-4">
            <div className="space-y-3">
              {[
                { id: 'toss', name: 'Toss Payments', status: '미연동' },
                { id: 'paypal', name: 'PayPal', status: '미연동' },
                { id: 'stripe', name: 'Stripe', status: '미연동' },
              ].map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {providerIcons[provider.id as PaymentProvider]}
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{provider.status}</Badge>
                    <Button variant="outline" size="sm">
                      연동하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>플랫폼 수수료</span>
                <span className="font-bold">10%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>결제 수수료 (Toss)</span>
                <span className="font-bold">2.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>결제 수수료 (PayPal)</span>
                <span className="font-bold">3.4% + $0.30</span>
              </div>
              <div className="flex justify-between items-center">
                <span>결제 수수료 (Stripe)</span>
                <span className="font-bold">2.9% + $0.30</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="currencies" className="space-y-4 mt-4">
            <div className="space-y-3">
              {[
                { code: 'KRW', name: '한국 원', enabled: true },
                { code: 'USD', name: '미국 달러', enabled: true },
                { code: 'EUR', name: '유로', enabled: false },
                { code: 'JPY', name: '일본 엔', enabled: false },
              ].map((currency) => (
                <div
                  key={currency.code}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-muted-foreground ml-2">{currency.name}</span>
                  </div>
                  <Badge variant={currency.enabled ? 'default' : 'secondary'}>
                    {currency.enabled ? '활성화' : '비활성화'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PaymentSelector;
