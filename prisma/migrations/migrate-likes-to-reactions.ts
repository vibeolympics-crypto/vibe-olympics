/**
 * 마이그레이션 스크립트: PostLike, TutorialLike → Reaction
 * 
 * 기존 좋아요 데이터를 통합 반응 시스템으로 마이그레이션합니다.
 * 
 * 실행 방법:
 * npx tsx prisma/migrations/migrate-likes-to-reactions.ts
 * 
 * 주의사항:
 * - 실행 전 데이터베이스 백업 권장
 * - 마이그레이션 후 기존 테이블 삭제는 별도로 진행
 */

import { PrismaClient, TargetType, ReactionType } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  postLikes: {
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
  };
  tutorialLikes: {
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
  };
}

async function migratePostLikes(stats: MigrationStats) {
  console.log('\n📝 PostLike 마이그레이션 시작...');
  
  // 기존 PostLike 데이터 조회
  const postLikes = await prisma.postLike.findMany({
    select: {
      id: true,
      userId: true,
      postId: true,
      createdAt: true,
    },
  });
  
  stats.postLikes.total = postLikes.length;
  console.log(`  총 ${postLikes.length}개의 PostLike 발견`);
  
  for (const like of postLikes) {
    try {
      // 이미 마이그레이션된 데이터 확인
      const existing = await prisma.reaction.findFirst({
        where: {
          userId: like.userId,
          targetType: TargetType.POST,
          targetId: like.postId,
          type: ReactionType.LIKE,
        },
      });
      
      if (existing) {
        stats.postLikes.skipped++;
        continue;
      }
      
      // Reaction으로 마이그레이션
      await prisma.reaction.create({
        data: {
          userId: like.userId,
          targetType: TargetType.POST,
          targetId: like.postId,
          type: ReactionType.LIKE,
          createdAt: like.createdAt,
        },
      });
      
      stats.postLikes.migrated++;
    } catch (error) {
      console.error(`  ❌ PostLike 마이그레이션 실패 (ID: ${like.id}):`, error);
      stats.postLikes.errors++;
    }
  }
  
  console.log(`  ✅ 마이그레이션: ${stats.postLikes.migrated}개`);
  console.log(`  ⏭️ 스킵 (이미 존재): ${stats.postLikes.skipped}개`);
  console.log(`  ❌ 에러: ${stats.postLikes.errors}개`);
}

async function migrateTutorialLikes(stats: MigrationStats) {
  console.log('\n📚 TutorialLike 마이그레이션 시작...');
  
  // 기존 TutorialLike 데이터 조회
  const tutorialLikes = await prisma.tutorialLike.findMany({
    select: {
      id: true,
      userId: true,
      tutorialId: true,
      createdAt: true,
    },
  });
  
  stats.tutorialLikes.total = tutorialLikes.length;
  console.log(`  총 ${tutorialLikes.length}개의 TutorialLike 발견`);
  
  for (const like of tutorialLikes) {
    try {
      // 이미 마이그레이션된 데이터 확인
      const existing = await prisma.reaction.findFirst({
        where: {
          userId: like.userId,
          targetType: TargetType.TUTORIAL,
          targetId: like.tutorialId,
          type: ReactionType.LIKE,
        },
      });
      
      if (existing) {
        stats.tutorialLikes.skipped++;
        continue;
      }
      
      // Reaction으로 마이그레이션
      await prisma.reaction.create({
        data: {
          userId: like.userId,
          targetType: TargetType.TUTORIAL,
          targetId: like.tutorialId,
          type: ReactionType.LIKE,
          createdAt: like.createdAt,
        },
      });
      
      stats.tutorialLikes.migrated++;
    } catch (error) {
      console.error(`  ❌ TutorialLike 마이그레이션 실패 (ID: ${like.id}):`, error);
      stats.tutorialLikes.errors++;
    }
  }
  
  console.log(`  ✅ 마이그레이션: ${stats.tutorialLikes.migrated}개`);
  console.log(`  ⏭️ 스킵 (이미 존재): ${stats.tutorialLikes.skipped}개`);
  console.log(`  ❌ 에러: ${stats.tutorialLikes.errors}개`);
}

async function verifyMigration() {
  console.log('\n🔍 마이그레이션 검증 중...');
  
  const postReactions = await prisma.reaction.count({
    where: { targetType: TargetType.POST, type: ReactionType.LIKE },
  });
  
  const tutorialReactions = await prisma.reaction.count({
    where: { targetType: TargetType.TUTORIAL, type: ReactionType.LIKE },
  });
  
  const originalPostLikes = await prisma.postLike.count();
  const originalTutorialLikes = await prisma.tutorialLike.count();
  
  console.log(`  📝 PostLike: ${originalPostLikes}개 → Reaction: ${postReactions}개`);
  console.log(`  📚 TutorialLike: ${originalTutorialLikes}개 → Reaction: ${tutorialReactions}개`);
  
  const postMatch = postReactions >= originalPostLikes;
  const tutorialMatch = tutorialReactions >= originalTutorialLikes;
  
  if (postMatch && tutorialMatch) {
    console.log('\n✅ 마이그레이션 검증 완료!');
  } else {
    console.log('\n⚠️ 일부 데이터가 마이그레이션되지 않았을 수 있습니다.');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Like → Reaction 마이그레이션 스크립트');
  console.log('  PostLike, TutorialLike → 통합 Reaction 모델');
  console.log('═══════════════════════════════════════════════════════════');
  
  const stats: MigrationStats = {
    postLikes: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    tutorialLikes: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  };
  
  try {
    // PostLike 마이그레이션
    await migratePostLikes(stats);
    
    // TutorialLike 마이그레이션
    await migrateTutorialLikes(stats);
    
    // 검증
    await verifyMigration();
    
    // 최종 결과 출력
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  마이그레이션 최종 결과');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  📝 PostLike: ${stats.postLikes.migrated}/${stats.postLikes.total} 마이그레이션 완료`);
    console.log(`  📚 TutorialLike: ${stats.tutorialLikes.migrated}/${stats.tutorialLikes.total} 마이그레이션 완료`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 다음 단계 안내
    console.log('📋 다음 단계:');
    console.log('  1. 마이그레이션 결과 확인');
    console.log('  2. 애플리케이션 테스트');
    console.log('  3. 문제가 없다면 기존 테이블 삭제:');
    console.log('     - PostLike 모델 제거');
    console.log('     - TutorialLike 모델 제거');
    console.log('  4. prisma migrate 실행\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
