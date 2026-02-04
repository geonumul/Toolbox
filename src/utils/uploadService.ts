import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CLOUD_NAME = "dv0lchvg7";
const UPLOAD_PRESET = "TOOLBOX";

export const uploadImageToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Image upload failed");
  }
};

export const saveProjectToFirestore = async (data: {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...data,
      createdAt: serverTimestamp(),
      type: data.category // Mapping category to type as used in GalleryPage
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore Error:", error);
    throw new Error("Failed to save project data");
  }
};
