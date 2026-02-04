import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Check, Loader2, FileText, XCircle } from 'lucide-react';
import { uploadProjectToDB } from '../../utils/uploadService';

// Simple notification type
type NotificationStatus = {
  type: 'success' | 'error';
  message: string;
} | null;

export const AdminPage = () => {
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Projects');
  const [description, setDescription] = useState('');
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationStatus>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setNotification(null); // Clear previous errors if any
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setPreview(null);
    setCategory('Projects');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    
    // Basic Validation
    if (!file) {
      setNotification({ type: 'error', message: "Please select a file to upload." });
      return;
    }
    
    if (!title.trim() || !description.trim()) {
      setNotification({ type: 'error', message: "Please fill in all required fields." });
      return;
    }

    setLoading(true);

    try {
      await uploadProjectToDB({
        title,
        category,
        description,
        file
      });
      
      setNotification({ type: 'success', message: "Project successfully published." });
      resetForm();

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setNotification(null), 3000);

    } catch (error: any) {
       console.error(error);
       setNotification({ 
         type: 'error', 
         message: error.message || "An unexpected error occurred." 
       });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 px-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      >
        <div className="bg-black text-white p-8">
          <h1 className="text-3xl font-light tracking-tight">Admin Upload</h1>
          <p className="text-gray-400 text-sm mt-2 uppercase tracking-widest">
            Add new content to portfolio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Notification Banner */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium ${
                  notification.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {notification.type === 'success' ? <Check size={18} /> : <XCircle size={18} />}
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Project Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              placeholder="Enter project title..."
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="Projects">Projects</option>
                <option value="Activities">Activities</option>
                <option value="Archive">Archive</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none resize-none transition-all"
              placeholder="Project description..."
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Project File / Image</label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <input 
                type="file" 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                {preview ? (
                  <div className="relative w-full max-h-60 overflow-hidden rounded-lg shadow-sm">
                    {file && file.type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 bg-gray-100 w-full">
                            <FileText size={48} className="text-gray-400 mb-2" />
                            <span className="text-sm font-bold text-gray-600">{file?.name}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-white px-4 py-2 rounded-full text-xs font-bold uppercase shadow-lg">Change File</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                      <Upload size={24} />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Click to upload file</div>
                    <div className="text-xs text-gray-400">Any file format supported</div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={20} />
                Publish Project
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
