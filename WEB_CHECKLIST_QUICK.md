# Vibe Olympics Quick Checklist

> Version: 1.0.0
> Updated: 2025-12-26
> Purpose: 작업 완료 후 빠른 검증 (5-10분)

---

## 0. Pre-Check (작업 전 확인)

- [ ] 요구사항이 명확하게 정의됨
- [ ] 수정 대상 파일/범위가 특정됨
- [ ] 기존 유사 패턴 존재 여부 확인됨

불명확한 경우: 작업 전 질문으로 명확화 필수

---

## 1. Build Verification (빌드 검증)

```bash
npm run build
npx tsc --noEmit
```

- [ ] 빌드 성공 (에러 0개)
- [ ] 타입 체크 통과
- [ ] Prisma 클라이언트 생성 완료

### Failure Protocol

```
1차 실패: 에러 메시지 확인 -> 해당 라인 수정
2차 실패: import/의존성 확인 -> 경로/버전 수정
3차 실패: 중단 -> 사용자에게 보고
```

---

## 2. Code Conflict Check (코드 충돌)

- [ ] 새 코드가 기존 기능 파괴하지 않음
- [ ] import 경로 정확 (@/ alias 사용)
- [ ] 함수/변수명 중복 없음
- [ ] 순환 참조 없음

---

## 3. Next.js App Router Rules

- [ ] 'use client' 또는 'use server' 지시문 적절
- [ ] 컴포넌트 최상위에서만 Hook 호출
- [ ] 조건문/반복문 내 Hook 호출 없음
- [ ] useEffect 의존성 배열 정확
- [ ] useEffect cleanup 구현

```typescript
// Correct Pattern
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // cleanup
}, [dependency]);
```

---

## 4. Style & Layout (스타일)

- [ ] 레이아웃 정상 렌더링
- [ ] 반응형 동작 확인 (mobile/desktop)
- [ ] z-index 충돌 없음
- [ ] Tailwind 클래스 정상 적용

---

## 5. API & Network (통신)

- [ ] API 엔드포인트 정확 (/api/...)
- [ ] HTTP 메서드 적절 (GET/POST/PUT/DELETE)
- [ ] Zod 스키마 검증 적용
- [ ] 에러 핸들링 구현
- [ ] 로딩 상태 표시

### Security Check

- [ ] 외부 CORS 프록시 사용 안 함
- [ ] API 키 클라이언트 노출 안 함
- [ ] 민감 정보 로깅 안 함

---

## 6. Database (Prisma)

- [ ] Prisma 쿼리 정상 동작
- [ ] 필요한 include/select 적용
- [ ] 트랜잭션 필요 시 적용
- [ ] 인덱스 활용 확인

```typescript
// Correct: include 명시
const product = await prisma.product.findUnique({
  where: { id },
  include: { seller: true, reviews: true },
});
```

---

## 7. Security Minimum (보안 최소)

- [ ] API 키/토큰 하드코딩 없음
- [ ] console.log에 민감 정보 없음
- [ ] 사용자 입력 Zod 검증
- [ ] XSS 취약 코드 없음

```typescript
// Bad: XSS 취약
element.innerHTML = userInput;

// Good: 안전한 방법
element.textContent = userInput;
```

---

## 8. React Query (상태 관리)

- [ ] queryKey 고유하게 설정
- [ ] staleTime 적절히 설정
- [ ] 뮤테이션 후 invalidateQueries 호출
- [ ] 에러 상태 처리

```typescript
// Correct Pattern
const { mutate } = useCreateProduct();
mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

---

## 9. Final Verification (최종 확인)

```bash
npm run dev
```

- [ ] 개발 서버 정상 실행
- [ ] 새 기능 정상 작동
- [ ] 기존 기능 영향 없음
- [ ] 브라우저 콘솔 에러 없음

---

## 10. Commit Ready (커밋 준비)

- [ ] 미사용 import 제거
- [ ] 미사용 변수/함수 제거
- [ ] console.log 제거 (디버그용)
- [ ] 주석 처리된 코드 정리
- [ ] TODO 주석 검토

---

## Troubleshooting Quick Reference

| 증상 | 1차 확인 | 2차 확인 |
|------|---------|---------|
| 흰 화면 | 콘솔 에러 | import 경로 |
| 스타일 깨짐 | Tailwind 클래스 | CSS 로드 |
| API 실패 | Network 탭 | 인증 상태 |
| DB 에러 | Prisma 로그 | 스키마 동기화 |
| 무한 렌더링 | 의존성 배열 | 상태 업데이트 |
| 빌드 실패 | 타입 에러 | Prisma generate |

---

## Retry Protocol

```
1차 실패 -> 에러 분석 -> 수정
2차 실패 -> 접근 방식 변경
3차 실패 -> 중단 + 보고

보고 형식:
[QUICK-BLOCKED] {항목명}
- 증상: {발생 현상}
- 시도: {시도한 방법}
- 필요: {사용자 판단 요청}
```

---

## Completion Checklist

```
[ ] npm run build 성공
[ ] npx tsc --noEmit 통과
[ ] npm run lint 에러 없음
[ ] 새 기능 작동
[ ] 기존 기능 정상
[ ] 콘솔 에러 없음
[ ] 보안 항목 통과

모두 통과 -> 커밋 가능
하나라도 실패 -> 수정 후 재검증
3회 실패 -> 중단 + 보고
```

---

**Full Review Required?** -> WEB_DEVELOPMENT_CHECKLIST.md 참조
