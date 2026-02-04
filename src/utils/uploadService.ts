import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const CLOUD_NAME = "dv0lchvg7";
const UPLOAD_PRESET = "TOOLBOX";

// Helper function to upload file to Cloudinary
export const uploadFileToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    formData
  );
  
  return res.data.secure_url;
};

export interface ProjectData {
  title: string;
  category: string;
  description: string;
  file: File;
}

export const uploadProjectToDB = async ({ title, category, description, file }: ProjectData) => {
  try {
    console.log("🚀 업로드 시작...");
    
    // 1. Upload to Cloudinary
    const imageUrl = await uploadFileToCloudinary(file);
    console.log("📸 이미지 주소 획득:", imageUrl);

    // 2. Save to Firebase
    console.log("💾 DB 저장 시도 중...");
    await addDoc(collection(db, "projects"), {
      title,
      category,
      description,
      img: imageUrl, // Save the Cloudinary URL, not blob
      createdAt: new Date()
    });

    alert("🎉 성공! 이제 파이어베이스 새로고침 해보세요!");
    return { success: true, url: imageUrl };

  } catch (error: any) {
    console.error("🚨 에러 발생:", error);
    alert("🚨 실패! 원인: " + (error.message || error));
    throw error;
  }
};
