"use client";

import { motion } from "framer-motion";
import { Shield, ChevronLeft, Mail, Lock, Eye, Database, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--bg-border)]">
        <div className="container-app py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              홈으로
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                개인정보처리방침
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                최종 수정일: 2025년 12월 7일
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* 개요 */}
          <div className="mb-12 p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--bg-border)]">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Vibe Olympics(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수하고 있습니다. 본 개인정보처리방침을 통해 회사가 수집하는 개인정보의 항목, 수집 및 이용 목적, 보유 및 이용 기간, 제3자 제공에 관한 사항 등을 안내드립니다.
            </p>
          </div>

          <div className="space-y-12">
            {/* 제1조 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-violet)] flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  1. 수집하는 개인정보 항목
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-6">
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">회원가입 시 수집 항목</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                      <span className="text-xs font-medium text-[var(--primary)] mb-2 block">필수항목</span>
                      <p className="text-sm text-[var(--text-secondary)]">이메일, 비밀번호, 닉네임</p>
                    </div>
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                      <span className="text-xs font-medium text-[var(--accent-yellow)] mb-2 block">선택항목</span>
                      <p className="text-sm text-[var(--text-secondary)]">프로필 이미지, 소개, 웹사이트, SNS 계정</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">서비스 이용 과정에서 수집되는 정보</h4>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                    <li>결제 정보: 결제 수단, 결제 내역 (카드 정보는 결제 대행사에서 관리)</li>
                    <li>서비스 이용 기록: 접속 일시, IP 주소, 쿠키, 기기 정보</li>
                    <li>판매자 정보: 정산 계좌, 사업자 정보 (사업자인 경우)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">소셜 로그인 시 수집 항목</h4>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                    <li>GitHub: 이메일, 프로필 이미지, 사용자명</li>
                    <li>Google: 이메일, 이름, 프로필 이미지 (추후 지원 예정)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)] flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  2. 개인정보의 수집 및 이용 목적
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">회원 관리</h4>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                      <li>• 회원 식별 및 가입 의사 확인</li>
                      <li>• 본인 인증 및 연령 확인</li>
                      <li>• 부정 이용 방지</li>
                      <li>• 서비스 관련 고지 및 안내</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">서비스 제공</h4>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                      <li>• 디지털 상품 거래 중개</li>
                      <li>• 결제 및 정산 처리</li>
                      <li>• 고객 문의 응대</li>
                      <li>• 맞춤형 서비스 제공</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">서비스 개선</h4>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                      <li>• 서비스 이용 통계 분석</li>
                      <li>• 신규 서비스 개발</li>
                      <li>• 이용자 경험 개선</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">마케팅 (선택 동의)</h4>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                      <li>• 이벤트 및 프로모션 안내</li>
                      <li>• 뉴스레터 발송</li>
                      <li>• 맞춤형 광고 제공</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-orange)] flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  3. 개인정보의 보유 및 이용 기간
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-6">
                <p className="text-[var(--text-secondary)]">
                  회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우 아래 기간 동안 보관합니다:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--bg-border)]">
                        <th className="text-left py-3 px-4 text-[var(--text-primary)]">보관 정보</th>
                        <th className="text-left py-3 px-4 text-[var(--text-primary)]">보관 기간</th>
                        <th className="text-left py-3 px-4 text-[var(--text-primary)]">근거 법령</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--text-secondary)]">
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">계약 또는 청약철회 기록</td>
                        <td className="py-3 px-4">5년</td>
                        <td className="py-3 px-4">전자상거래법</td>
                      </tr>
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">대금결제 및 재화 공급 기록</td>
                        <td className="py-3 px-4">5년</td>
                        <td className="py-3 px-4">전자상거래법</td>
                      </tr>
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">소비자 불만 또는 분쟁 처리 기록</td>
                        <td className="py-3 px-4">3년</td>
                        <td className="py-3 px-4">전자상거래법</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">서비스 이용 기록, 접속 로그</td>
                        <td className="py-3 px-4">3개월</td>
                        <td className="py-3 px-4">통신비밀보호법</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-magenta)] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  4. 개인정보의 제3자 제공
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령에 의해 제공이 요구되는 경우</li>
                  <li>서비스 제공을 위해 필요한 경우 (결제 대행사, 배송 업체 등)</li>
                </ul>
                <div className="mt-6 p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">업무 위탁 현황</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--bg-border)]">
                          <th className="text-left py-2 px-3 text-[var(--text-primary)]">위탁 업체</th>
                          <th className="text-left py-2 px-3 text-[var(--text-primary)]">위탁 업무</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--text-secondary)]">
                        <tr className="border-b border-[var(--bg-border)]">
                          <td className="py-2 px-3">Stripe Inc.</td>
                          <td className="py-2 px-3">결제 처리</td>
                        </tr>
                        <tr className="border-b border-[var(--bg-border)]">
                          <td className="py-2 px-3">Supabase Inc.</td>
                          <td className="py-2 px-3">데이터 저장 및 파일 호스팅</td>
                        </tr>
                        <tr className="border-b border-[var(--bg-border)]">
                          <td className="py-2 px-3">Vercel Inc.</td>
                          <td className="py-2 px-3">서비스 호스팅</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">Resend</td>
                          <td className="py-2 px-3">이메일 발송</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                5. 개인정보의 파기 절차 및 방법
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-2">파기 절차</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 혹은 즉시 파기됩니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-2">파기 방법</h4>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 text-sm">
                    <li>전자적 파일: 기술적 방법을 사용하여 복구 불가능하게 삭제</li>
                    <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                6. 이용자의 권리와 행사 방법
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>개인정보 열람 요청</li>
                  <li>개인정보 정정 요청</li>
                  <li>개인정보 삭제 요청</li>
                  <li>개인정보 처리 정지 요청</li>
                </ul>
                <p className="text-sm text-[var(--text-tertiary)]">
                  위 권리 행사는 대시보드 &gt; 설정 &gt; 개인정보 메뉴에서 직접 처리하거나, 개인정보 보호책임자에게 이메일로 요청할 수 있습니다.
                </p>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                7. 쿠키의 사용
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다. 쿠키는 서버가 이용자의 브라우저에 보내는 소량의 정보로, 이용자 컴퓨터의 하드디스크에 저장됩니다.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">쿠키 사용 목적</h4>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                      <li>• 로그인 상태 유지</li>
                      <li>• 이용자 선호 설정 저장</li>
                      <li>• 서비스 이용 통계 분석</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">쿠키 거부 방법</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      브라우저 설정에서 쿠키 허용/차단을 설정할 수 있습니다. 쿠키를 차단하면 일부 서비스 이용에 제한이 있을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                8. 개인정보 보호책임자
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">개인정보 보호책임자</h4>
                    <p className="text-sm text-[var(--text-secondary)]">성명: 개인정보보호팀</p>
                    <p className="text-sm text-[var(--text-secondary)]">이메일: privacy@vibeolympics.com</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">개인정보 보호담당자</h4>
                    <p className="text-sm text-[var(--text-secondary)]">부서: 운영팀</p>
                    <p className="text-sm text-[var(--text-secondary)]">이메일: support@vibeolympics.com</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                9. 개인정보처리방침 변경
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <p className="text-[var(--text-secondary)]">
                  이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경되는 경우 시행일 최소 7일 전부터 서비스 내 공지사항을 통해 고지합니다.
                </p>
              </div>
            </section>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">문의하기</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              개인정보처리방침에 대한 문의사항이 있으시면 아래 이메일로 연락해 주세요.
            </p>
            <a
              href="mailto:privacy@vibeolympics.com"
              className="text-[var(--primary)] hover:underline text-sm"
            >
              privacy@vibeolympics.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
