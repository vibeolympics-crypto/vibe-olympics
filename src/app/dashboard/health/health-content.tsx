"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Database,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Cpu,
  HardDrive,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  period: string;
  summary: {
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    errorRate: string | number;
    avgResponseTime: number;
  };
  database: {
    status: string;
    latency: number;
    records: {
      users: number;
      products: number;
      purchases: number;
    };
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  callsByTime: { time: string; calls: number; errors: number }[];
  topEndpoints: {
    endpoint: string;
    count: number;
    avgDuration: number;
    errors: number;
  }[];
  recentErrors: { timestamp: number; endpoint: string; message: string }[];
}

export default function HealthDashboardContent() {
  const { data: session } = useSession();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/health?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch health data");
      const data = await res.json();
      setHealthData(data);
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-500">헬스 데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const isHealthy = healthData.status === "healthy";
  const memoryPercent = Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            서버 헬스 모니터링
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            마지막 업데이트: {new Date(healthData.timestamp).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 선택 */}
          <div className="flex gap-1">
            {["1h", "6h", "24h", "7d"].map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          
          {/* 자동 새로고침 토글 */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            자동
          </Button>
          
          <Button variant="outline" size="sm" onClick={fetchHealthData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 서버 상태 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">서버 상태</span>
              </div>
              <Badge variant={isHealthy ? "success" : "warning"}>
                {isHealthy ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    정상
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    주의
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 평균 응답 시간 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">평균 응답 시간</span>
              </div>
              <span className="text-2xl font-bold">
                {healthData.summary.avgResponseTime}ms
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 에러율 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">에러율</span>
              </div>
              <span className={`text-2xl font-bold ${Number(healthData.summary.errorRate) > 5 ? "text-red-500" : "text-green-500"}`}>
                {healthData.summary.errorRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 총 요청 수 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">총 요청</span>
              </div>
              <span className="text-2xl font-bold">
                {healthData.summary.totalCalls.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 데이터베이스 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              데이터베이스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">상태</span>
                <Badge variant={healthData.database.status === "healthy" ? "success" : "danger"}>
                  {healthData.database.status === "healthy" ? "정상" : "오류"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">지연 시간</span>
                <span className="font-medium">{healthData.database.latency}ms</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{healthData.database.records.users.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">사용자</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{healthData.database.records.products.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">상품</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{healthData.database.records.purchases.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">구매</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메모리 사용량 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              메모리 사용량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 메모리 바 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Heap 사용량</span>
                  <span>{memoryPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${memoryPercent > 80 ? "bg-red-500" : memoryPercent > 60 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${memoryPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Heap Used</div>
                    <div className="font-medium">{healthData.memory.heapUsed} MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Heap Total</div>
                    <div className="font-medium">{healthData.memory.heapTotal} MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">RSS</div>
                    <div className="font-medium">{healthData.memory.rss} MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">External</div>
                    <div className="font-medium">{healthData.memory.external} MB</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API 호출 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              API 호출 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-end gap-1">
              {healthData.callsByTime.map((slot, idx) => {
                const maxCalls = Math.max(...healthData.callsByTime.map(s => s.calls), 1);
                const height = (slot.calls / maxCalls) * 100;
                const errorHeight = slot.calls > 0 ? (slot.errors / slot.calls) * height : 0;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                      <div
                        className="w-full bg-blue-500 rounded-t relative"
                        style={{ height: `${height}%`, minHeight: slot.calls > 0 ? "4px" : "0" }}
                      >
                        {errorHeight > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-red-500 rounded-t"
                            style={{ height: `${errorHeight}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">
                      {slot.time}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>성공</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>에러</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상위 엔드포인트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              상위 API 엔드포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.topEndpoints.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  데이터가 없습니다
                </p>
              ) : (
                healthData.topEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{ep.endpoint}</div>
                      <div className="text-xs text-gray-500">
                        {ep.count}회 호출 · 평균 {ep.avgDuration}ms
                      </div>
                    </div>
                    {ep.errors > 0 && (
                      <Badge variant="danger" className="ml-2">
                        {ep.errors} 에러
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 에러 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            최근 에러
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData.recentErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500">최근 에러가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {healthData.recentErrors.map((error, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-700 dark:text-red-400">
                      {error.endpoint}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-300 truncate">
                      {error.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(error.timestamp).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
