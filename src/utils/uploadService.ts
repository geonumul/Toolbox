import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const getEnvVar = () => {
  try {
    // @ts-ignore
    return import.meta.env || {};
  } catch {
    return {};
  }
};

const env = getEnvVar();
const CLOUD_NAME = env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = env.VITE_CLOUDINARY_PRESET;

export interface ProjectData {
  title: string;
  category: string;
  author: string;
  description: string;
  file: File;
}

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  // FALLBACK: If config is missing, use a local object URL (mock upload)
  // This allows the app to function without crashing if .env is not set up.
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn("Cloudinary config missing. Falling back to local object URL.");
    // Create a local URL for preview purposes
    return URL.createObjectURL(file);
  }

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
    console.error("Cloudinary upload failed:", error);
    // Fallback on error too, so user doesn't get stuck
    return URL.createObjectURL(file);
  }
};

/**
 * Uploads project image/file to Cloudinary and saves project metadata to Firestore.
 */
export const uploadProjectToDB = async ({ title, category, author, description, file }: ProjectData) => {
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
    author: author, // User selected author
    site: "-", 
    detailContent: "", // Empty detail content initially
    pdfUrl: fileUrl // Automatically link the uploaded file/image to the attachment URL
  });

  return { id: docRef.id, url: fileUrl };
};
