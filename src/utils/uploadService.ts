import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const CLOUD_NAME = "dv0lchvg7";
const UPLOAD_PRESET = "TOOLBOX";

export interface ProjectData {
  title: string;
  category: string;
  description: string;
  file: File;
}

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      formData
    );
    return res.data.secure_url;
  } catch (error) {
    throw new Error("Failed to upload file to Cloudinary.");
  }
};

/**
 * Uploads project image/file to Cloudinary and saves project metadata to Firestore.
 */
export const uploadProjectToDB = async ({ title, category, description, file }: ProjectData) => {
  // 1. Upload file to Cloudinary
  const fileUrl = await uploadFileToCloudinary(file);

  // 2. Save metadata to Firestore
  // We include default fields to match the existing schema
  const docRef = await addDoc(collection(db, "projects"), {
    title,
    type: category, // Map category to 'type' field
    description,
    image: fileUrl, // Use 'image' key for consistency with GalleryPage
    createdAt: new Date(),
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'), // Format: YYYY.MM.DD
    author: "Admin", // Default author
    site: "-", 
    detailContent: "" // Empty detail content initially
  });

  return { id: docRef.id, url: fileUrl };
};
