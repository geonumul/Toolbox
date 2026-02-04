import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Previously provided keys
const CLOUD_NAME = "dv0lchvg7";
const UPLOAD_PRESET = "TOOLBOX";

export interface ProjectData {
  title: string;
  category: string;
  description: string;
  file: File;
}

export const uploadProjectToDB = async ({ title, category, description, file }: ProjectData) => {
  try {
    // 1단계: 확인용 알림
    console.log("🚀 업로드 시작...");

    // Cloudinary 업로드
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    const imageUrl = res.data.secure_url;
    console.log("📸 이미지 주소 획득:", imageUrl);

    // Firebase 저장
    console.log("💾 DB 저장 시도 중...");
    
    await addDoc(collection(db, "projects"), {
      title,
      category,
      description,
      img: imageUrl, // 필드명 img로 통일
      createdAt: new Date()
    });

    // 성공 시
    alert("🎉 성공! 이제 파이어베이스 새로고침 해보세요!");
    return { success: true, url: imageUrl };

  } catch (error: any) {
    // 실패 시 에러 내용을 화면에 띄움
    console.error("🚨 에러 발생:", error);
    alert("🚨 실패! 원인: " + (error.message || error));
    throw error;
  }
};
