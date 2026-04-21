// Canonical TOOLBOX schedule seed — idempotent.
// Wipes legacy auto-id docs (from earlier seed runs) and upserts all events
// with deterministic IDs so this script can be re-run safely.
//
// Usage (from Toolbox/):  node scripts/seed-schedule.mjs

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCKYsAXZIafVNisxiKzJ-rOKBC9__K8EjE',
  authDomain: 'toolbox-b3d01.firebaseapp.com',
  projectId: 'toolbox-b3d01',
  storageBucket: 'toolbox-b3d01.firebasestorage.app',
  messagingSenderId: '1024069993163',
  appId: '1:1024069993163:web:da227c3191cea66046114e',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// One-time cleanup: docs created by earlier auto-id seed scripts.
// Safe to keep in list — deleteDoc is a no-op for already-deleted docs.
const LEGACY_IDS = [
  // reseed-schedule.mjs (2025-10 run)
  'au2ayiFBwJxYVMQqLARS', 'wBHPFipKO0xhlLKNXigt', 'u8LPa4ubBe9R1vYdIrOF',
  '6CPRHWM1gqDWrwFZeltS', 'c3V69LWr1dEzY2UauwNR', 'eGAMFBOd7ixqaF6cAg28',
  '4lwfC8akkkwAf4YGs24j', 'SYJyEVaKNGDVeKaM6j2z', 'HB7DIQuzrkBT8lA5TD8R',
  'PtHa0z16Umr3BNCeiPc6', 'VSz1JFlQiY4Iy2W2kJim', 'vF8Dk6NN7Lgj40gOwYit',
  'c1UKA2RPqs5x1SpQucUH', 'ipViCC5C7e6TTo65bsJQ', 'CULvakf1d8oFFe4dQxgH',
  'KDJe4Oyd7vMZhrHuilTs', 'JafIGPakt8vQrGfMnE2E', 'uKk5gHYOcwJWCHpLyYwR',
  'ZHcSWmxNOxENadxGv2so', 'HY5LALFGoM9EtgBIG7zl', 'jfPm3KcPr6GXat7YlR9W',
  // seed-winter-study.mjs
  'cCZcgFYhI3ZD0RWE9RT1', 'BPfYnHzFFaBEgj6oCScS', 'tJnWoonMJRfwh9BgHl5g',
  'xYxz4RgdJeC7eVkeS5qJ', 'Um04g7GKpaiKR119aXoE', 'Cwg3fHjVHbbFSJODz23N',
  'fDAtaraqAdwVTHLAkqqj',
  // individual break days collapsed into ranges (this revision)
  '2025-09-30-break', '2025-10-03-break', '2025-10-07-break',
  '2025-10-10-break', '2025-10-14-break', '2025-10-17-break',
  '2025-10-21-break',
  '2026-04-06-break', '2026-04-13-break', '2026-04-20-break',
  '2026-04-27-break',
  // superseded final-break id (was 2026-04-06)
  '2026-04-06-final-break',
];

const MON = '19:00–21:00';
const TUE = '19:00–21:00';
const FRI = '15:00–17:00';
const MEET = 'Google Meet';
const D208 = 'D208';
const D301 = 'D301';
const D341 = 'D341';

const EVENTS = [
  // ──────────────── Fall 2025 (오프라인) ────────────────
  { id: '2025-09-16-indesign-ot',  date: '2025-09-16', title: 'TOOLBOX OT',      description: 'TOOLBOX 운영 계획 안내 및 정기모임 일정 공유 (화 19–21시 / 금 15–17시)', time: TUE, location: D301 },
  { id: '2025-09-19-indesign-1',   date: '2025-09-19', title: '인디자인 1회차',  description: 'Johnny Park 강의 4–8강 실습 및 Character Style 학습, D5 학생 인증 진행', time: FRI, location: D341 },
  { id: '2025-09-23-indesign-2',   date: '2025-09-23', title: '인디자인 2회차',  description: '선배들의 포트폴리오 피드백 공유 및 1회차 과제 복습', time: TUE, location: D341 },
  { id: '2025-09-26-indesign-3',   date: '2025-09-26', title: '인디자인 3회차',  description: '주요 CG 회사 소개 및 개인 이미지·프로젝트를 활용한 패널 레이아웃 구성', time: FRI, location: D341 },

  // 중간고사 기간 휴식 (9/27 ~ 10/23)
  { id: '2025-09-27-midterm-break', date: '2025-09-27', title: '중간고사 휴식', description: '2025년 9월 27일부터 10월 23일까지 중간고사 기간 휴식', time: '', location: '' },

  { id: '2025-10-24-indesign-4',   date: '2025-10-24', title: '인디자인 4회차',  description: '중간고사 이후 인디자인 세션 재개', time: FRI, location: D341 },

  // D5
  { id: '2025-10-28-d5-1',         date: '2025-10-28', title: 'D5 1회차',        description: '과제 영상 복습 (바르셀로나 파빌리온 렌더링)', time: TUE, location: D341 },
  { id: '2025-10-30-d5-2',         date: '2025-10-30', title: 'D5 2회차',        description: '아파트 실내 투시도 렌더링 (모델링 제공 박경준)', time: '', location: D341 },
  { id: '2025-11-04-d5-3',         date: '2025-11-04', title: 'D5 3회차',        description: '과제 영상 복습 및 야외 투시도 렌더링', time: TUE, location: D341 },
  { id: '2025-11-06-d5-4',         date: '2025-11-06', title: 'D5 4회차',        description: '강환국 선배 제공 모델링 렌더링 1차 및 상호 피드백', time: '', location: D208 },
  { id: '2025-11-11-d5-5',         date: '2025-11-11', title: 'D5 5회차',        description: '강환국 선배 제공 모델링 렌더링 2차', time: TUE, location: D208 },
  { id: '2025-11-13-d5-6',         date: '2025-11-13', title: 'D5 6회차',        description: '강환국 선배 제공 모델링 렌더링 3차 (마무리)', time: '', location: D208 },

  { id: '2025-11-17-dinner',       date: '2025-11-17', title: 'TOOLBOX 정기 회식', description: '한 학기 마무리 정기 회식', time: TUE, location: '맛닭꼬' },
  { id: '2025-11-20-indesign-5',   date: '2025-11-20', title: '인디자인 5회차',  description: '개인 D5 결과물을 활용한 인디자인 레이아웃 작업', time: FRI, location: D208 },
  { id: '2025-11-21-winter-break', date: '2025-11-21', title: '시험기간 + 방학', description: '2025년 11월 21일부터 2026년 1월 4일까지 휴식 기간', time: '', location: '' },

  // ──────────────── Winter–Spring 2026 (월요일 · Google Meet) ────────────────
  { id: '2026-01-05-revit-1',      date: '2026-01-05', title: 'Revit 1회차',     description: '스터디 시작, Revit 2024 및 D5 for Revit 설치, 과제 안내', time: MON, location: MEET },
  { id: '2026-01-12-revit-2',      date: '2026-01-12', title: 'Revit 2회차',     description: '노션 페이지 안내, 개인 프로젝트 주제 공유 및 사이트 자료 제작 강의', time: MON, location: MEET },
  { id: '2026-01-19-revit-3',      date: '2026-01-19', title: 'Revit 3회차',     description: '수치지형도 신청 및 변환, 스케치업 사이트 제작(루비) 강의, 매스 및 단선평면 학습', time: MON, location: MEET },
  { id: '2026-01-26-revit-4',      date: '2026-01-26', title: 'Revit 4회차',     description: '계획 재구성, 수치지형도 다운로드 및 스케치업 사이트 모델링', time: MON, location: MEET },
  { id: '2026-02-02-revit-5',      date: '2026-02-02', title: 'Revit 5회차',     description: '신입생 모집 시기 논의 및 매스스터디 강의·실습', time: MON, location: MEET },
  { id: '2026-02-09-revit-6',      date: '2026-02-09', title: 'Revit 6회차',     description: '박경준 사이트 매핑(도로·횡단보도) 강의 후 개인 실습', time: MON, location: MEET },
  { id: '2026-02-16-revit-7',      date: '2026-02-16', title: 'Revit 7회차',     description: '설 연휴 휴식', time: '', location: '' },
  { id: '2026-02-23-revit-8',      date: '2026-02-23', title: 'Revit 8회차',     description: '개별 일정 조율에 따른 자율 학습 주간', time: '', location: '' },
  { id: '2026-03-02-revit-9',      date: '2026-03-02', title: 'Revit 9회차',     description: '진행 상황 공유 및 방향성 논의 (과제 없이 자유 참여)', time: MON, location: MEET },

  { id: '2026-03-09-portfolio',    date: '2026-03-09', title: '개인 프로젝트 크리틱',        description: '피그마 메이크로 웹 포트폴리오 제작 및 소모임원 상호 개인 프로젝트 크리틱', time: MON, location: MEET },
  { id: '2026-03-16-project-pick', date: '2026-03-16', title: '프로젝트 방향 결정',         description: '프로젝트 방향 결정, 일러스트레이터 영상 학습 및 개인 크리틱', time: MON, location: MEET },
  { id: '2026-03-23-illust-lisp',  date: '2026-03-23', title: '일러스트레이터 & 캐드 리습', description: '유승민·박경준 일러스트레이터 사이트 다이어그램 강의 및 고건 캐드 리습 강의', time: MON, location: MEET },
  { id: '2026-03-30-web-portfolio',date: '2026-03-30', title: '피그마 웹 포트폴리오',        description: '피그마 토큰을 활용한 웹 포트폴리오 제작, 관리자 모드 포함 반응형 구현 목표', time: MON, location: MEET },

  // 기말고사 기간 휴식 (3/31 ~ 5/3)
  { id: '2026-03-31-final-break', date: '2026-03-31', title: '기말고사 휴식', description: '2026년 3월 31일부터 5월 3일까지 기말고사 기간 휴식', time: '', location: '' },

  { id: '2026-05-04-offline',      date: '2026-05-04', title: '대면 모임', description: '대면 모임 (세부 내용 미정)', time: MON, location: D208 },
];

async function run() {
  console.log(`Clearing ${LEGACY_IDS.length} legacy docs...`);
  for (const id of LEGACY_IDS) {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.warn(`  ! ${id}: ${err.message}`);
    }
  }

  console.log(`\nUpserting ${EVENTS.length} canonical events...`);
  for (const ev of EVENTS) {
    const { id, ...fields } = ev;
    await setDoc(doc(db, 'schedules', id), {
      ...fields,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ ${ev.date}  ${ev.title}`);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
