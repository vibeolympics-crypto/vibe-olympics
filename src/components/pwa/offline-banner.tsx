"use client";

/**
 * 오프라인 배너 컴포넌트
 * - 네트워크 상태에 따라 배너 표시
 * - 동기화 대기 중인 항목 알림
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const { isOnline, isServiceWorkerReady, triggerBackgroundSync, getPendingActions } = useOffline();
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 대기 중인 액션 확인
  useEffect(() => {
    const checkPendingActions = async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    };
    
    checkPendingActions();
    
    // 주기적 확인
    const interval = setInterval(checkPendingActions, 10000);
    return () => clearInterval(interval);
  }, [getPendingActions]);

  // 오프라인 상태 변경 시 배너 표시
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else if (isOnline && pendingCount === 0) {
      // 온라인 복귀 후 동기화 완료되면 잠시 후 숨김
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  // 수동 동기화
  const handleSync = async () => {
    setIsSyncing(true);
    await triggerBackgroundSync();
    
    // 잠시 후 상태 갱신
    setTimeout(async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
      setIsSyncing(false);
    }, 2000);
  };

  // 표시할 필요 없으면 렌더링 안함
  if (!isVisible && isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50",
        "rounded-xl shadow-2xl backdrop-blur-lg transition-all duration-300",
        isOnline
          ? "bg-green-500/90 text-white"
          : "bg-red-500/90 text-white"
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <WifiOff className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {isOnline ? '온라인 상태' : '오프라인 상태'}
            </p>
            <p className="text-sm opacity-90">
              {!isOnline ? (
                '인터넷 연결이 끊겼습니다. 일부 기능이 제한됩니다.'
              ) : pendingCount > 0 ? (
                `${pendingCount}개의 대기 중인 변경사항이 있습니다.`
              ) : (
                '연결이 복구되었습니다!'
              )}
            </p>
          </div>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                "flex-shrink-0 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors",
                isSyncing && "animate-spin"
              )}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 오프라인 기능 안내 */}
        {!isOnline && isServiceWorkerReady && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-80 flex items-center gap-2">
              <CloudOff className="w-4 h-4" />
              <span>이전에 방문한 페이지는 오프라인에서도 볼 수 있습니다.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OfflineBanner;
