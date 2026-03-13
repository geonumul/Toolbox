# TOOLBOX

가톨릭대학교 공간디자인 소모임 **TOOLBOX** 공식 홈페이지 — React, Firebase, Vite 기반.

## 주요 기능

- **갤러리** — Cloudinary 연동 이미지/PDF 프로젝트 쇼케이스
- **일정** — 예정 및 지난 행사 관리
- **스터디** — 주간 스터디 로그 아카이브
- **팀** — 멤버 디렉토리
- **아카이브** — 수상 내역 및 출판물 기록
- **관리자** — 인증 기반 콘텐츠 관리 패널

## 기술 스택

- [React 18](https://react.dev/) + TypeScript
- [Vite](https://vitejs.dev/)
- [Firebase](https://firebase.google.com/) (Firestore)
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vercel](https://vercel.com/) 배포

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 빌드

```bash
npm run build
```

빌드 결과물은 `build/` 디렉토리에 생성됩니다.

## 환경 변수

Firebase 설정을 위해 `.env.local` 파일을 생성하세요:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
