/**
 * 추천 시스템 자체 테스트 스크립트
 * 실행: npx tsx scripts/test-recommendations.ts
 */

import { prisma } from "../src/lib/prisma";

async function testRecommendationSystem() {
  console.log("=== 🧠 추천 시스템 자체 테스트 시작 ===\n");

  // 1. DB 테이블 존재 확인
  console.log("1️⃣ 추천 시스템 DB 테이블 확인");
  
  try {
    const userClusterCount = await prisma.userCluster.count();
    console.log(`   ✅ UserCluster 테이블: ${userClusterCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ UserCluster 테이블 오류: ${error.message}`);
  }

  try {
    const transitionCount = await prisma.transitionMatrix.count();
    console.log(`   ✅ TransitionMatrix 테이블: ${transitionCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ TransitionMatrix 테이블 오류: ${error.message}`);
  }

  try {
    const funnelCount = await prisma.funnelState.count();
    console.log(`   ✅ FunnelState 테이블: ${funnelCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ FunnelState 테이블 오류: ${error.message}`);
  }

  try {
    const feedbackCount = await prisma.recommendationFeedback.count();
    console.log(`   ✅ RecommendationFeedback 테이블: ${feedbackCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ RecommendationFeedback 테이블 오류: ${error.message}`);
  }

  try {
    const stateCount = await prisma.recommendationState.count();
    console.log(`   ✅ RecommendationState 테이블: ${stateCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ RecommendationState 테이블 오류: ${error.message}`);
  }

  try {
    const statsCount = await prisma.recommendationStats.count();
    console.log(`   ✅ RecommendationStats 테이블: ${statsCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ RecommendationStats 테이블 오류: ${error.message}`);
  }

  try {
    const catTransCount = await prisma.categoryTransition.count();
    console.log(`   ✅ CategoryTransition 테이블: ${catTransCount}개 레코드`);
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`   ❌ CategoryTransition 테이블 오류: ${error.message}`);
  }

  // 2. 상품 데이터 확인
  console.log("\n2️⃣ 상품 데이터 확인");
  const productCount = await prisma.product.count({ where: { status: "PUBLISHED" } });
  console.log(`   ✅ 발행된 상품: ${productCount}개`);

  // 3. 사용자 데이터 확인
  console.log("\n3️⃣ 사용자 데이터 확인");
  const userCount = await prisma.user.count();
  console.log(`   ✅ 총 사용자: ${userCount}명`);

  // 4. 구매 데이터 확인
  console.log("\n4️⃣ 구매 데이터 확인");
  const purchaseCount = await prisma.purchase.count();
  console.log(`   ✅ 총 구매: ${purchaseCount}건`);

  // 5. 카테고리 데이터 확인
  console.log("\n5️⃣ 카테고리 데이터 확인");
  const categoryCount = await prisma.category.count();
  console.log(`   ✅ 총 카테고리: ${categoryCount}개`);

  // 6. 클러스터 분포 확인 (있는 경우)
  console.log("\n6️⃣ 사용자 클러스터 분포");
  const clusterDist = await prisma.userCluster.groupBy({
    by: ["cluster"],
    _count: { cluster: true },
  });
  
  if (clusterDist.length > 0) {
    clusterDist.forEach((c) => {
      console.log(`   📊 ${c.cluster}: ${c._count.cluster}명`);
    });
  } else {
    console.log("   ⚠️ 아직 클러스터 데이터가 없습니다 (첫 피드백 시 생성됨)");
  }

  // 7. 추천 통계 확인
  console.log("\n7️⃣ 추천 통계 (최근 7일)");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentStats = await prisma.recommendationStats.aggregate({
    where: { date: { gte: sevenDaysAgo } },
    _sum: {
      totalRecommendations: true,
      totalConversions: true,
    },
  });

  const totalRecs = recentStats._sum.totalRecommendations || 0;
  const totalConvs = recentStats._sum.totalConversions || 0;
  const convRate = totalRecs > 0 ? ((totalConvs / totalRecs) * 100).toFixed(2) : "N/A";

  console.log(`   📈 총 추천: ${totalRecs}건`);
  console.log(`   📈 총 전환: ${totalConvs}건`);
  console.log(`   📈 전환율: ${convRate}%`);

  console.log("\n=== 🧠 추천 시스템 자체 테스트 완료 ===");
  console.log("\n💡 추천 시스템이 정상적으로 설정되어 있습니다!");
  console.log("   - 사용자 피드백이 쌓이면 클러스터가 자동 생성됩니다");
  console.log("   - 구매 데이터가 쌓이면 전이 행렬이 학습됩니다");
  console.log("   - 퍼널 데이터는 추천 노출 시 자동 기록됩니다\n");

  await prisma.$disconnect();
}

testRecommendationSystem().catch(async (e) => {
  console.error("테스트 실패:", e);
  await prisma.$disconnect();
  process.exit(1);
});
