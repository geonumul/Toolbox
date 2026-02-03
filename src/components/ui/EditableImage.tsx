import React from 'react';
import { Image, Upload } from 'lucide-react';

interface EditableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onSave?: (url: string) => void;
  isEditing: boolean;
  containerClassName?: string;
}

export const EditableImage = ({
  src,
  alt,
  onSave,
  isEditing,
  containerClassName = '',
  className = '',
  ...props
}: EditableImageProps) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newUrl = window.prompt("Enter new image URL:", src);
    if (newUrl && newUrl !== src && onSave) {
      onSave(newUrl);
    }
  };

  return (
    <div className={`relative group ${containerClassName}`}>
      <img src={src} alt={alt} className={className} {...props} />
      
      {isEditing && (
        <button
          onClick={handleEdit}
          className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10"
        >
          <div className="bg-white/90 backdrop-blur text-black px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg transform scale-90 hover:scale-100 transition-transform">
            <Upload size={14} />
            Change Image
          </div>
        </button>
      )}
    </div>
  );
};
