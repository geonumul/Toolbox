// One-shot: deletes the 11 schedule docs seeded by seed-schedule.mjs,
// then inserts the corrected 2025-2 TOOLBOX schedule.
// Run from the Toolbox/ directory: `node scripts/reseed-schedule.mjs`

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
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

const OLD_IDS = [
  '0dkb2gSYcadvpWSxVVpO',
  'WwS0hc5YiRk2OwEmhPye',
  'WUU6D7RxxZojHRNNkXZ4',
  'WpbjqSiwQqCeJBhAwWdL',
  'qfbGJpeV751MxWIP24u2',
  '4wzN6iHwOSkLSYmEqtIx',
  'RdbD8rcduwXSepfrv8tB',
  'Rzf6ijkJqOcYr6Wm0Z7v',
  'IMagXo9qa5RGm5IHwOKj',
  'DiZoN3a8Dypr0GVqB7FI',
  'J8DUm5JN82QkmK3DMxsl',
];

const TUE = '19:00–21:00';
const FRI = '15:00–17:00';

const events = [
  // 인디자인 세션
  { date: '2025-09-16', title: '인디자인 OT', description: 'TOOLBOX OT. 정기모임: 화 19–21시 / 금 15–17시. Johnny Park 강의로 인디자인 입문.', time: TUE },
  { date: '2025-09-19', title: '인디자인 1회차', description: 'Johnny Park 강의 4-8 실습, Character Style 탐구, D5 학생 인증.', time: FRI },
  { date: '2025-09-23', title: '인디자인 2회차', description: '포폴에 대한 선배들 의견 공유, 1회차 과제 복습.', time: TUE },
  { date: '2025-09-26', title: '인디자인 3회차', description: '유명 CG 회사 소개, 개인 이미지·프로젝트로 패널 레이아웃 구성.', time: FRI },

  // 시험기간 휴식
  { date: '2025-09-30', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-03', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-07', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-10', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-14', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-17', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },
  { date: '2025-10-21', title: '시험기간 휴식', description: '중간고사 휴식 주간.', time: '' },

  // 인디자인 재개
  { date: '2025-10-24', title: '인디자인 4회차', description: '인디자인 세션 재개.', time: FRI },

  // D5 세션
  { date: '2025-10-28', title: 'D5 1회차', description: '과제영상 복습 (바르셀로나 파빌리온 렌더링).', time: TUE },
  { date: '2025-10-30', title: 'D5 2회차', description: '아파트 실내투시도 렌더링 (모델링: 박경준).', time: '' },
  { date: '2025-11-04', title: 'D5 3회차', description: '과제영상 복습, 야외투시도 렌더링.', time: TUE },
  { date: '2025-11-06', title: 'D5 4회차', description: '강환국 선배 제공 모델링 렌더링 (1차). 상호 피드백.', time: '' },
  { date: '2025-11-11', title: 'D5 5회차', description: '강환국 선배 제공 모델링 렌더링 (2차).', time: TUE },
  { date: '2025-11-13', title: 'D5 6회차', description: '강환국 선배 제공 모델링 렌더링 (3차, 마무리).', time: '' },

  // 회식
  { date: '2025-11-17', title: '회식 — 맛닭꼬', description: 'TOOLBOX 회식 @ 맛닭꼬.', time: '' },

  // 인디자인 마무리
  { date: '2025-11-20', title: '인디자인 5회차', description: '본인 D5 결과물 이용한 인디자인 레이아웃 작업.', time: FRI },

  // 방학
  { date: '2025-11-21', title: '시험기간 + 방학', description: '2025-11-21 ~ 2026-01-05 휴식 기간.', time: '' },
];

async function run() {
  console.log(`Deleting ${OLD_IDS.length} previously seeded docs...`);
  for (const id of OLD_IDS) {
    try {
      await deleteDoc(doc(db, 'schedules', id));
      console.log(`  ✗ deleted ${id}`);
    } catch (err) {
      console.warn(`  ! could not delete ${id}:`, err.message);
    }
  }

  console.log(`\nAdding ${events.length} corrected events...`);
  for (const ev of events) {
    const ref = await addDoc(collection(db, 'schedules'), {
      ...ev,
      location: '',
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ ${ev.date}  ${ev.title}  (${ref.id})`);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
