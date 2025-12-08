import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center opacity-80">
            <FileQuestion className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        
        <p className="text-[var(--text-secondary)] mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          URL을 확인하시거나 아래 링크를 이용해 주세요.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="default" size="lg">
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" size="lg">
              <Search className="w-4 h-4 mr-2" />
              마켓플레이스 둘러보기
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-[var(--bg-border)]">
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            자주 찾는 페이지
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/marketplace" 
              className="text-[var(--primary)] hover:underline"
            >
              마켓플레이스
            </Link>
            <Link 
              href="/education" 
              className="text-[var(--primary)] hover:underline"
            >
              교육 센터
            </Link>
            <Link 
              href="/community" 
              className="text-[var(--primary)] hover:underline"
            >
              커뮤니티
            </Link>
            <Link 
              href="/dashboard" 
              className="text-[var(--primary)] hover:underline"
            >
              대시보드
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
