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

const compressImage = async (file: File, maxWidth = 1200, quality = 0.82): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
};

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 */
export const uploadFileToCloudinary = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  const fileToUpload = await compressImage(file);

  // FALLBACK: If config is missing, convert to base64 data URL so it can persist in Firestore
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn("Cloudinary config missing. Falling back to base64 data URL.");
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileToUpload);
    });
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      formData,
      {
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        }
      }
    );
    return res.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileToUpload);
    });
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
