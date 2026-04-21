// One-shot script: seeds the TOOLBOX schedule into Firestore.
// Run from the Toolbox/ directory: `node scripts/seed-schedule.mjs`
// Safe to re-run — adds new docs each time (does not dedupe). Delete duplicates via the admin panel.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

const events = [
  // Series 1
  {
    date: '2025-09-16',
    title: 'OT',
    description: '공간디자인학과 TOOLBOX OT. 정기모임 화 19–21시 / 금 15–17시.',
    time: '19:00',
    location: '강의실 추후 공지',
  },
  {
    date: '2025-09-19',
    title: '1회차',
    description: 'Johnny Park 강의 4-8 실습 및 D5 학생 인증.',
    time: '15:00–17:00',
    location: '',
  },
  {
    date: '2025-09-23',
    title: '2회차',
    description: '포폴에 대한 선배들 의견 공유, 1회차 과제 복습.',
    time: '19:00–21:00',
    location: '',
  },
  {
    date: '2025-09-25',
    title: '3회차',
    description: '유명 CG 회사 소개, 개인 이미지·프로젝트로 패널 레이아웃 구성.',
    time: '15:00–17:00',
    location: '',
  },
  {
    date: '2025-10-19',
    title: '4회차',
    description: '대관람차 렌더링으로 패널 레이아웃 구성. 방학에 쓸 툴 투표.',
    time: '',
    location: '',
  },

  // Series 2 (D5 렌더 집중)
  {
    date: '2025-10-28',
    title: '1회차',
    description: '과제영상 복습 (바르셀로나 파빌리온 렌더링).',
    time: '19:00–21:00',
    location: '',
  },
  {
    date: '2025-10-30',
    title: '2회차',
    description: '아파트 실내투시도 렌더링 (모델링: 박경준).',
    time: '',
    location: '',
  },
  {
    date: '2025-11-03',
    title: '3회차',
    description: '과제영상 복습, 야외투시도 렌더링.',
    time: '',
    location: '',
  },
  {
    date: '2025-11-06',
    title: '4회차',
    description: '강환국 선배 제공 모델링 렌더링 (1차). 개인 작업하며 상호 피드백.',
    time: '',
    location: '',
  },
  {
    date: '2025-11-11',
    title: '5회차',
    description: '강환국 선배 제공 모델링 렌더링 (2차).',
    time: '19:00–21:00',
    location: '',
  },
  {
    date: '2025-11-13',
    title: '6회차',
    description: '강환국 선배 제공 모델링 렌더링 (3차, 마무리).',
    time: '',
    location: '',
  },
];

async function run() {
  console.log(`Seeding ${events.length} events to Firestore 'schedules' collection...`);
  for (const ev of events) {
    const ref = await addDoc(collection(db, 'schedules'), {
      ...ev,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ ${ev.date}  ${ev.title}  (${ref.id})`);
  }
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
