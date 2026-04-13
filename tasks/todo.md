# QA Dashboard - 강의 Q&A 칸반보드

## Step 1: 프로젝트 초기화
- [ ] Next.js 15 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [ ] Git remote 연결
- [ ] shadcn/ui 초기화
- [ ] 패키지 설치 (drizzle-orm, @neondatabase/serverless, @anthropic-ai/sdk, bcryptjs)

## Step 2: DB 스키마 + 연결
- [ ] src/db/schema.ts — Drizzle 스키마 4테이블
- [ ] src/db/index.ts — Neon serverless 연결
- [ ] drizzle.config.ts 설정
- [ ] .env.local 환경변수 설정

## Step 3: AI 통합
- [ ] src/lib/ai.ts — Claude API 래퍼
- [ ] 자동답변 + 인사이트 추출 함수
- [ ] 한국어 시스템 프롬프트

## Step 4: Server Actions
- [ ] questions.ts — 질문 CRUD + AI 답변 트리거
- [ ] lectures.ts — 강의 생성, 녹취록 등록
- [ ] insights.ts — 인사이트 생성

## Step 5: 폴링 API
- [ ] /api/questions/route.ts — timestamp 기반 diff
- [ ] usePolling.ts — 5초 폴링 훅

## Step 6: UI 컴포넌트
- [ ] shadcn 컴포넌트 추가
- [ ] KanbanBoard, KanbanColumn, QuestionCard
- [ ] QuestionForm, InstructorAnswerForm
- [ ] InsightsPanel, TranscriptUpload
- [ ] PasswordDialog, InstructorToolbar
- [ ] Pretendard 폰트 + 반응형

## Step 7: 페이지 조합
- [ ] 강의 목록 페이지 (/)
- [ ] 칸반보드 메인 (/board/[lectureId])
- [ ] 강사 도구바

## Step 8: 배포
- [ ] Vercel 프로젝트 연결
- [ ] Neon Postgres 추가
- [ ] 환경변수 설정
- [ ] 배포 + URL 공유

## 검증
- [ ] 질문 등록 → AI 자동답변 테스트
- [ ] 칸반 컬럼 이동 테스트
- [ ] 강사 답변 + 비밀번호 인증 테스트
- [ ] 폴링 실시간 업데이트 테스트
- [ ] 녹취록 컨텍스트 반영 테스트
- [ ] 인사이트 추출 테스트
- [ ] 모바일 반응형 테스트
- [ ] Playwright E2E 테스트

## Review
_(완료 후 작성)_
