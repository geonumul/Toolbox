// One-shot: adds the 2026 겨울 BIM 스터디 (monday online sessions)
// and updates the existing "시험기간 + 방학" event so it ends before the first session.
// Run from Toolbox/ directory: `node scripts/seed-winter-study.mjs`

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
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

// id from the previous reseed run
const BREAK_DOC_ID = 'jfPm3KcPr6GXat7YlR9W';

const MEET = 'Google Meet';

const events = [
  {
    date: '2026-01-05',
    title: 'BIM 1주차',
    description: '스터디 시작. Revit 2024 + D5 for Revit 설치, 과제 설명.',
  },
  {
    date: '2026-01-12',
    title: 'BIM 2주차',
    description: '노션 페이지 설명, 개인 프로젝트 주제 공유, 1–3주차 사이트자료 제작 강의.',
  },
  {
    date: '2026-01-19',
    title: 'BIM 3주차',
    description: '수치지형도 신청/변환, 스케치업 사이트 제작 (루비 강의), 매스·단선평면 강의.',
  },
  {
    date: '2026-01-26',
    title: 'BIM 4주차',
    description: '계획 재구성. 수치지형도 다운 + 스케치업 사이트 모델링.',
  },
  {
    date: '2026-02-02',
    title: 'BIM 5주차',
    description: '신입생 모집 시기 논의, 매스스터디 강의 및 실습.',
  },
  {
    date: '2026-02-09',
    title: 'BIM 6주차',
    description: '사이트 맵핑 (도로·횡단보도), 박경준 강의 후 개인 실습.',
  },
  {
    date: '2026-02-16',
    title: 'BIM 7주차',
    description: '빨간날(설 연휴) 휴식주.',
  },
];

async function run() {
  // Shorten the 방학 event so it doesn't overlap the first session
  console.log('Updating 시험기간 + 방학 description...');
  try {
    await updateDoc(doc(db, 'schedules', BREAK_DOC_ID), {
      description: '2025-11-21 ~ 2026-01-04 휴식 기간.',
    });
    console.log(`  ✓ updated ${BREAK_DOC_ID}`);
  } catch (err) {
    console.warn(`  ! could not update ${BREAK_DOC_ID}:`, err.message);
  }

  console.log(`\nAdding ${events.length} winter study events...`);
  for (const ev of events) {
    const ref = await addDoc(collection(db, 'schedules'), {
      ...ev,
      time: '',
      location: MEET,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ ${ev.date}  ${ev.title}  (${ref.id})`);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
