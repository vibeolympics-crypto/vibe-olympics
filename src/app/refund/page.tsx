"use client";

import { motion } from "framer-motion";
import { RotateCcw, ChevronLeft, Mail, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RefundPage() {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-orange)] to-[var(--accent-red)] flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                환불정책
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
          {/* 중요 안내 */}
          <div className="mb-12 p-6 bg-gradient-to-r from-[var(--accent-orange)]/10 to-[var(--accent-red)]/10 rounded-xl border border-[var(--accent-orange)]/30">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[var(--accent-orange)] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  디지털 상품의 특성상 환불에 제한이 있습니다
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  디지털 상품은 구매 즉시 다운로드 및 이용이 가능하며, 복제가 용이한 특성상 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 환불이 제한될 수 있습니다. 구매 전 상품 설명, 미리보기, 리뷰 등을 충분히 확인해 주세요.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* 환불 가능한 경우 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-green)] flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  환불 가능한 경우
                </h2>
              </div>
              <div className="grid gap-4">
                <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-green)] text-white text-xs flex items-center justify-center">1</span>
                    상품 설명과 현저히 다른 경우
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    상품 설명에 명시된 기능이나 내용이 실제와 현저히 다른 경우 환불이 가능합니다.
                  </p>
                  <ul className="list-disc list-inside text-sm text-[var(--text-tertiary)] space-y-1">
                    <li>설명된 기능이 전혀 작동하지 않는 경우</li>
                    <li>명시된 파일 형식이나 기술 스택이 다른 경우</li>
                    <li>상품 설명과 실제 내용이 50% 이상 다른 경우</li>
                  </ul>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-green)] text-white text-xs flex items-center justify-center">2</span>
                    다운로드 또는 이용이 불가능한 경우
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    기술적 문제로 상품을 다운로드하거나 이용할 수 없는 경우 환불이 가능합니다.
                  </p>
                  <ul className="list-disc list-inside text-sm text-[var(--text-tertiary)] space-y-1">
                    <li>파일이 손상되어 열리지 않는 경우</li>
                    <li>다운로드 링크가 유효하지 않은 경우</li>
                    <li>판매자가 더 이상 서비스를 제공하지 않는 경우</li>
                  </ul>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-green)] text-white text-xs flex items-center justify-center">3</span>
                    중복 결제된 경우
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    동일한 상품이 중복 결제된 경우, 중복 결제분에 대해 환불이 가능합니다.
                  </p>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-green)] text-white text-xs flex items-center justify-center">4</span>
                    저작권 침해 상품인 경우
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    구매한 상품이 제3자의 저작권을 침해한 것으로 확인된 경우 환불이 가능합니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 환불이 불가능한 경우 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-red)] flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  환불이 불가능한 경우
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">단순 변심에 의한 환불</p>
                      <p className="text-sm text-[var(--text-tertiary)]">구매 후 단순히 마음이 바뀐 경우</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">이미 다운로드 또는 사용한 경우</p>
                      <p className="text-sm text-[var(--text-tertiary)]">상품을 다운로드하거나 사용한 이후에는 환불이 불가합니다</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">구매자 환경 문제</p>
                      <p className="text-sm text-[var(--text-tertiary)]">구매자의 컴퓨터 환경, 기술 수준 등의 문제로 인한 경우</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">상품 설명에 명시된 제한사항</p>
                      <p className="text-sm text-[var(--text-tertiary)]">상품 설명에 명시된 제한사항이나 요구사항을 확인하지 않은 경우</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">환불 요청 기간 경과</p>
                      <p className="text-sm text-[var(--text-tertiary)]">구매일로부터 7일이 경과한 경우</p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* 환불 절차 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  환불 절차 및 처리 기간
                </h2>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">1</div>
                      <div className="w-0.5 h-full bg-[var(--bg-border)] mt-2" />
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-[var(--text-primary)]">환불 요청</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        대시보드 &gt; 구매 내역에서 해당 상품의 환불 요청 버튼을 클릭하거나, 고객센터로 문의해 주세요. 환불 사유를 상세히 작성해 주시면 더 빠른 처리가 가능합니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">2</div>
                      <div className="w-0.5 h-full bg-[var(--bg-border)] mt-2" />
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-[var(--text-primary)]">환불 심사 (1-3영업일)</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        환불 요청이 접수되면 담당자가 환불 사유를 검토합니다. 필요시 추가 정보를 요청드릴 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">3</div>
                      <div className="w-0.5 h-full bg-[var(--bg-border)] mt-2" />
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-[var(--text-primary)]">환불 승인/거절 통보</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        심사 결과를 이메일로 안내드립니다. 환불이 승인된 경우 결제 취소 절차가 진행됩니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] text-white flex items-center justify-center text-sm font-bold">4</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">환불 완료 (3-7영업일)</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        결제 수단에 따라 환불 처리 기간이 상이합니다. 신용카드의 경우 카드사 정책에 따라 청구 취소 또는 다음 결제일에 환급됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 환불 금액 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                환불 금액 안내
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--bg-border)]">
                        <th className="text-left py-3 px-4 text-[var(--text-primary)]">환불 사유</th>
                        <th className="text-left py-3 px-4 text-[var(--text-primary)]">환불 금액</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--text-secondary)]">
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">상품 설명과 현저히 다른 경우</td>
                        <td className="py-3 px-4 text-[var(--accent-green)]">100% 환불</td>
                      </tr>
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">다운로드/이용 불가</td>
                        <td className="py-3 px-4 text-[var(--accent-green)]">100% 환불</td>
                      </tr>
                      <tr className="border-b border-[var(--bg-border)]">
                        <td className="py-3 px-4">중복 결제</td>
                        <td className="py-3 px-4 text-[var(--accent-green)]">중복분 100% 환불</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">저작권 침해 상품</td>
                        <td className="py-3 px-4 text-[var(--accent-green)]">100% 환불</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-4">
                  * 결제 수수료는 결제 대행사 정책에 따라 환불되지 않을 수 있습니다.
                </p>
              </div>
            </section>

            {/* 분쟁 해결 */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                분쟁 해결
              </h2>
              <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--bg-border)] space-y-4">
                <p className="text-[var(--text-secondary)]">
                  환불 관련 분쟁이 발생한 경우, 다음의 절차를 통해 해결할 수 있습니다:
                </p>
                <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2 text-sm">
                  <li>고객센터를 통한 내부 분쟁 조정</li>
                  <li>한국소비자원 소비자분쟁조정위원회 조정 신청</li>
                  <li>전자거래분쟁조정위원회 조정 신청</li>
                </ol>
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <strong>한국소비자원:</strong> 전화 1372 / 홈페이지 www.kca.go.kr
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">환불 문의</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              환불 관련 문의사항이 있으시면 아래 이메일로 연락해 주세요. 영업일 기준 24시간 이내에 답변드리겠습니다.
            </p>
            <a
              href="mailto:support@vibeolympics.com"
              className="text-[var(--primary)] hover:underline text-sm"
            >
              support@vibeolympics.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
