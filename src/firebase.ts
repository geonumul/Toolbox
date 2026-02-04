import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKYsAXZIafVNisxiKzJ-rOKBC9__K8EjE",
  authDomain: "toolbox-b3d01.firebaseapp.com",
  projectId: "toolbox-b3d01",
  storageBucket: "toolbox-b3d01.firebasestorage.app",
  messagingSenderId: "1024069993163",
  appId: "1:1024069993163:web:da227c3191cea66046114e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
