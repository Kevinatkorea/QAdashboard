# QA Dashboard - 강의 Q&A 칸반보드

## Step 1: 프로젝트 초기화
- [x] Next.js 16 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [x] Git remote 연결 (github.com/Kevinatkorea/QAdashboard)
- [x] shadcn/ui 초기화
- [x] 패키지 설치 (drizzle-orm, @neondatabase/serverless, @anthropic-ai/sdk, bcryptjs)

## Step 2: DB 스키마 + 연결
- [x] src/db/schema.ts — Drizzle 스키마 4테이블
- [x] src/db/index.ts — Neon serverless 연결
- [x] drizzle.config.ts 설정
- [x] .env.local 환경변수 설정 (API KEY 완료, DATABASE_URL 대기중)

## Step 3: AI 통합
- [x] src/lib/ai.ts — Claude API 래퍼
- [x] 자동답변 + 인사이트 추출 함수
- [x] 한국어 시스템 프롬프트

## Step 4: Server Actions
- [x] questions.ts — 질문 CRUD + AI 답변 트리거
- [x] lectures.ts — 강의 생성, 녹취록 등록
- [x] insights.ts — 인사이트 생성

## Step 5: 폴링 API
- [x] /api/questions/route.ts — timestamp 기반 diff
- [x] usePolling.ts — 5초 폴링 훅

## Step 6: UI 컴포넌트
- [x] shadcn 컴포넌트 추가
- [x] KanbanBoard, KanbanColumn, QuestionCard
- [x] QuestionForm, InstructorAnswerForm
- [x] InsightsPanel, TranscriptUpload
- [x] InstructorToolbar, LectureList
- [x] 한국어 UI + 반응형

## Step 7: 페이지 조합
- [x] 강의 목록 페이지 (/)
- [x] 칸반보드 메인 (/board/[lectureId])
- [x] 강사 도구바

## Step 8: 배포
- [x] Neon Postgres DB 생성 + DATABASE_URL 설정 (Vercel Marketplace)
- [x] drizzle-kit push (스키마 마이그레이션)
- [x] Vercel 프로젝트 연결 + 배포 (qa-dashboard-rho.vercel.app)
- [x] 환경변수 설정 (prod/dev — preview는 수동 필요)

## 검증
- [x] TypeScript 컴파일 (에러 없음)
- [x] 프로덕션 URL 200 응답 확인
- [ ] 질문 등록 → AI 자동답변 테스트
- [ ] 칸반 컬럼 이동 테스트
- [ ] 강사 답변 + 비밀번호 인증 테스트
- [ ] 폴링 실시간 업데이트 테스트
- [ ] 녹취록 컨텍스트 반영 테스트
- [ ] 인사이트 추출 테스트
- [ ] 모바일 반응형 테스트

## Review
_(완료 후 작성)_
