"use client";

import { motion } from "framer-motion";
import { FileText, ChevronLeft, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-cyan)] flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                이용약관
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
          <div className="prose prose-invert max-w-none">
            {/* 제1조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">1</span>
                목적
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  이 약관은 Vibe Olympics(이하 &quot;회사&quot;)가 제공하는 디지털 상품 마켓플레이스 서비스(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
                </p>
              </div>
            </section>

            {/* 제2조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">2</span>
                용어의 정의
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">1. 서비스</h4>
                  <p className="text-[var(--text-secondary)] text-sm">
                    회사가 제공하는 디지털 상품 거래 플랫폼 및 관련 부가 서비스 일체를 의미합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">2. 회원</h4>
                  <p className="text-[var(--text-secondary)] text-sm">
                    이 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 의미합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">3. 판매자</h4>
                  <p className="text-[var(--text-secondary)] text-sm">
                    서비스를 통해 디지털 상품을 등록하고 판매하는 회원을 의미합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">4. 구매자</h4>
                  <p className="text-[var(--text-secondary)] text-sm">
                    서비스를 통해 디지털 상품을 구매하는 회원을 의미합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">5. 디지털 상품</h4>
                  <p className="text-[var(--text-secondary)] text-sm">
                    소프트웨어, 소스코드, 템플릿, 디자인 리소스, 교육 콘텐츠 등 전자적 형태로 제공되는 상품을 의미합니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">3</span>
                회원가입
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  회원가입은 이용자가 약관의 내용에 동의하고, 회원가입 신청을 한 후 회사가 이를 승낙함으로써 체결됩니다.
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>회원은 반드시 본인의 정확한 정보를 제공해야 합니다.</li>
                  <li>타인의 정보를 도용하여 가입한 경우 법적 책임을 질 수 있습니다.</li>
                  <li>만 14세 미만의 아동은 법정대리인의 동의가 필요합니다.</li>
                  <li>회사는 다음의 경우 가입을 거부할 수 있습니다:
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>이전에 약관 위반으로 회원 자격이 상실된 경우</li>
                      <li>허위 정보를 기재하거나 필수 정보를 제공하지 않은 경우</li>
                      <li>기타 서비스 운영에 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            {/* 제4조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">4</span>
                서비스의 이용
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 다만, 다음의 경우 서비스 제공이 일시적으로 중단될 수 있습니다:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>시스템 점검, 보수, 교체 등 기술적 필요가 있는 경우</li>
                  <li>천재지변, 비상사태 등 불가항력적 사유가 있는 경우</li>
                  <li>서비스 설비의 장애 또는 이용량의 폭주로 정상적인 서비스가 곤란한 경우</li>
                </ul>
              </div>
            </section>

            {/* 제5조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">5</span>
                회원의 의무
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  회원은 다음 각 호의 행위를 하여서는 안 됩니다:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>허위 정보 등록 또는 타인의 정보 도용</li>
                  <li>서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 유통, 조장</li>
                  <li>회사 및 제3자의 지적재산권 침해</li>
                  <li>회사 및 제3자의 명예 훼손 또는 업무 방해</li>
                  <li>외설적이거나 폭력적인 콘텐츠 게시</li>
                  <li>서비스의 안정적 운영을 방해하는 행위</li>
                  <li>기타 관계 법령에 위배되는 행위</li>
                </ul>
              </div>
            </section>

            {/* 제6조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">6</span>
                판매자의 의무
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  판매자는 다음 각 호의 의무를 준수해야 합니다:
                </p>
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>등록하는 상품에 대한 완전한 권리를 보유해야 합니다.</li>
                  <li>상품 정보를 정확하고 상세하게 기재해야 합니다.</li>
                  <li>구매자 문의에 성실히 응대해야 합니다.</li>
                  <li>제3자의 저작권, 상표권 등 지적재산권을 침해하지 않아야 합니다.</li>
                  <li>악성코드, 바이러스 등이 포함된 파일을 등록해서는 안 됩니다.</li>
                  <li>회사의 상품 검수 결과에 따라 수정 또는 삭제에 응해야 합니다.</li>
                </ul>
              </div>
            </section>

            {/* 제7조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">7</span>
                결제 및 수수료
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>모든 결제는 회사가 지정한 결제 시스템을 통해 처리됩니다.</li>
                  <li>판매 대금에서 회사의 수수료(기본 10%)를 제외한 금액이 판매자에게 정산됩니다.</li>
                  <li>정산은 매월 말 기준으로 익월 15일에 진행됩니다.</li>
                  <li>최소 정산 금액은 10,000원이며, 미달 시 다음 정산 기간으로 이월됩니다.</li>
                </ul>
              </div>
            </section>

            {/* 제8조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">8</span>
                지적재산권
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다. 회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속되나, 회사는 서비스 운영을 위해 필요한 범위 내에서 이를 사용할 수 있습니다.
                </p>
                <p className="text-[var(--text-secondary)]">
                  구매자는 구매한 디지털 상품을 해당 라이선스 조건에 따라 사용할 수 있으며, 라이선스 범위를 초과하는 사용은 금지됩니다.
                </p>
              </div>
            </section>

            {/* 제9조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">9</span>
                면책조항
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>회사는 회원 간 또는 회원과 제3자 간의 거래에 대해 중개자로서의 역할만을 담당합니다.</li>
                  <li>회사는 판매자가 등록한 상품의 품질, 완전성, 적법성에 대해 보증하지 않습니다.</li>
                  <li>회사는 천재지변 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                </ul>
              </div>
            </section>

            {/* 제10조 */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">10</span>
                분쟁 해결
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  이 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다. 서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사의 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
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
              이용약관에 대한 문의사항이 있으시면 아래 이메일로 연락해 주세요.
            </p>
            <a
              href="mailto:legal@vibeolympics.com"
              className="text-[var(--primary)] hover:underline text-sm"
            >
              legal@vibeolympics.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
