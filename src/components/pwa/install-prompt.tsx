"use client";

/**
 * PWA 설치 프롬프트 컴포넌트
 * - 앱 설치 유도
 * - 설치 가이드 제공
 */

import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // iOS 감지
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // 이미 설치된 앱인지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 설치 프롬프트 이벤트 저장
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 이전에 닫지 않았으면 표시
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 3000); // 3초 후 표시
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS에서는 수동 안내
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 5000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // 설치 실행
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  // 닫기 (다시 보지 않기)
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // 나중에 보기
  const handleLater = () => {
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleLater}
      />

      {/* 프롬프트 카드 */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Vibe Olympics</h3>
              <p className="text-sm text-gray-400">앱으로 더 편리하게!</p>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="space-y-3 mb-6">
            <Feature icon={Smartphone} text="홈 화면에서 바로 실행" />
            <Feature icon={Monitor} text="전체 화면 앱 경험" />
            <Feature icon={Download} text="오프라인에서도 사용 가능" />
          </div>

          {isIOS ? (
            // iOS 설치 가이드
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-300 mb-3">
                iOS에서 앱 설치하기:
              </p>
              <ol className="text-sm text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">1</span>
                  <span>하단의 <Share className="inline w-4 h-4" /> 공유 버튼 탭</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">2</span>
                  <span>&quot;홈 화면에 추가&quot; 선택</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">3</span>
                  <span>&quot;추가&quot; 버튼 탭</span>
                </li>
              </ol>
            </div>
          ) : (
            // Android/Desktop 설치 버튼
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold transition-all",
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "hover:from-purple-600 hover:to-pink-600",
                "text-white shadow-lg shadow-purple-500/25",
                !deferredPrompt && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                앱 설치하기
              </span>
            </button>
          )}

          <button
            onClick={handleLater}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

export default InstallPrompt;
