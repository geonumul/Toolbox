import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Plus, Trash2, Edit3, Check, Instagram, Linkedin, Link as LinkIcon, Upload } from "lucide-react";
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useLang } from '../../contexts/LangContext';

interface TeamPageProps {
  data: any[];
  updateData: (key: string, value: any) => void;
  isEditing: boolean;
}

export const TeamPage = ({
  data,
  updateData,
  isEditing,
}: TeamPageProps) => {
  const { t } = useLang();
  const [selectedMemberId, setSelectedMemberId] = useState<string | number | null>(null);

  // ESC key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMemberId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedMember = selectedMemberId
    ? data.find((m) => m.id === selectedMemberId)
    : null;

  // Firestore update
  const handleUpdateMember = async (id: string | number, updatedMember: any) => {
    if (typeof id === 'string') {
        try {
            const memberRef = doc(db, "team", id);
            // Extract only serializable fields (no id)
            const { id: _, ...dataToSave } = updatedMember;
            await updateDoc(memberRef, dataToSave);
        } catch (error) {
            console.error("Error updating team member: ", error);
            alert("Failed to save member: " + error);
        }
    } else {
        const updatedTeam = data.map((m) =>
          m.id === id ? updatedMember : m
        );
        updateData("team", updatedTeam);
    }
  };

  // Firestore add
  const handleAddMember = async () => {
    try {
        await addDoc(collection(db, "team"), {
          name: "New Member",
          role: "Designer",
          image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
          bio: "Introduction...",
          major: "Spatial Design",
          email: "email@example.com",
          instagram: "",
          linkedin: "",
          customLinks: [],
          interests: "Urban Regeneration, Data Visualization",
          software: "Rhino, Grasshopper, Unreal Engine",
          createdAt: new Date()
        });
    } catch (error) {
        console.error("Error adding team member: ", error);
        alert("Failed to add member: " + error);
    }
  };

  // Firestore delete
  const handleDeleteMember = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this member?")) {
      if (typeof id === 'string') {
          try {
              await deleteDoc(doc(db, "team", id));
          } catch (error) {
              console.error("Error deleting team member: ", error);
              alert("Failed to delete member: " + error);
          }
      } else {
          const updatedTeam = data.filter((m) => m.id !== id);
          updateData("team", updatedTeam);
      }
      if (selectedMemberId === id) setSelectedMemberId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-40 px-6 pb-24 bg-white text-black"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-gray-200">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-3">
              {t.team.title}
            </h1>
            <p className="text-gray-400 font-medium text-[10px] md:text-[11px] uppercase tracking-[0.2em]">
              {t.team.collective(data.length)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 font-bold text-[10px] md:text-[11px] tracking-widest uppercase text-gray-900">
            {t.team.designers(String(data.length).padStart(2, "0"))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {data.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className="group cursor-pointer flex flex-col relative"
            >
              {isEditing && (
                <button
                  onClick={(e) => handleDeleteMember(e, member.id)}
                  className="absolute top-2 right-2 z-20 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-5 grayscale group-hover:grayscale-0 transition-all duration-700 ease-out relative">
                 <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
              </div>

              <div className="space-y-1">
                 <h3 className="text-base font-bold uppercase tracking-tight text-black block">{member.name}</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">{member.role}</p>
              </div>
            </div>
          ))}

          {(isEditing || data.length === 0) && (
            <div
              onClick={handleAddMember}
              className="aspect-[4/3] border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors cursor-pointer group"
            >
              <div className="p-4 rounded-full border border-transparent group-hover:border-black transition-all mb-4">
                <Plus size={24} strokeWidth={1} />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                {t.team.addMember}
              </span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedMember && (
          <MemberDetailModal 
            member={selectedMember} 
            onClose={() => setSelectedMemberId(null)} 
            isAdmin={isEditing}
            onSave={(updated) => handleUpdateMember(selectedMember.id, updated)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { uploadFileToCloudinary } from '../../utils/uploadService';

// Internal Component for Modal Logic
const MemberDetailModal = ({ member, onClose, isAdmin, onSave }: { member: any, onClose: () => void, isAdmin: boolean, onSave: (data: any) => void }) => {
    const { t } = useLang();
    const [isLocalEditing, setIsLocalEditing] = useState(false);
    const [formData, setFormData] = useState(member);
    const [isUploading, setIsUploading] = useState(false);

    // Reset form data when member changes
    useEffect(() => {
        setFormData(member);
    }, [member]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                // Upload to Cloudinary
                const url = await uploadFileToCloudinary(file);
                handleChange('image', url);
            } catch (error) {
                console.error("Upload failed", error);
                alert("Image upload failed. Please try again.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSave = () => {
        onSave(formData);
        setIsLocalEditing(false);
    };

    const handleCancel = () => {
        setFormData(member);
        setIsLocalEditing(false);
    };

    // Body Scroll Lock logic
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Custom Link Helpers
    const addCustomLink = (title: string, url: string) => {
        const currentLinks = formData.customLinks || [];
        handleChange('customLinks', [...currentLinks, { title, url }]);
    };

    const removeCustomLink = (index: number) => {
        const currentLinks = formData.customLinks || [];
        handleChange('customLinks', currentLinks.filter((_: any, i: number) => i !== index));
    };

    // Split tags
    const interestsList = (formData.interests || "").split(',').map((s: string) => s.trim()).filter(Boolean);
    const softwareList = (formData.software || "").split(',').map((s: string) => s.trim()).filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full h-full md:h-[550px] md:max-w-[950px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button (Top Right) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-30 p-2 bg-white/10 md:bg-transparent rounded-full text-white md:text-gray-400 hover:text-black hover:bg-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left Column: Image (Square/Portrait) */}
                <div className="w-full h-[40%] md:w-[40%] md:h-full relative bg-gray-900 group">
                    <img
                        src={formData.image}
                        alt={formData.name}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Overlay Content (View Mode) */}
                    {!isLocalEditing && (
                        <div className="absolute bottom-0 left-0 w-full p-8 text-white z-10">
                            <h2 className="text-2xl font-bold mb-1">{formData.name}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-4">{formData.role}</p>
                            <div className="flex gap-3 text-white/70">
                                {formData.email && (
                                    <a href={`mailto:${formData.email}`} className="hover:text-white transition-colors">
                                        <Mail size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Edit Mode Overlay */}
                    {isLocalEditing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-20">
                            <div className="bg-white p-1 rounded shadow-lg flex items-center gap-2">
                                    <input 
                                    type="text" 
                                    value={formData.image} 
                                    onChange={(e) => handleChange('image', e.target.value)}
                                    className="text-[10px] w-32 outline-none px-2 py-1"
                                    placeholder="Image URL..."
                                    />
                                    <label className={`cursor-pointer ${isUploading ? 'text-gray-400 cursor-not-allowed' : 'hover:text-blue-500'} transition-colors`}>
                                        <Upload size={14} />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                            </div>
                            {isUploading && <span className="text-[10px] text-white font-bold animate-pulse">Uploading...</span>}
                            <div className="w-full px-8 space-y-2 mt-4">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 p-2 text-xs rounded focus:border-white outline-none text-white placeholder-white/50"
                                    placeholder="Name"
                                />
                                <input 
                                    type="text" 
                                    value={formData.role}
                                    onChange={(e) => handleChange('role', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 p-2 text-xs rounded focus:border-white outline-none text-white placeholder-white/50"
                                    placeholder="Role"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Details */}
                <div className="w-full h-[60%] md:w-[60%] md:h-full bg-white flex flex-col p-6 md:p-10 relative">
                    {/* Header Action */}
                    <div className="absolute top-6 right-6 md:top-8 md:right-12">
                         {isLocalEditing ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancel} className="text-xs font-bold text-gray-400 hover:text-black">{t.team.cancel}</button>
                                <button onClick={handleSave} className="text-xs font-bold text-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors">{t.team.save}</button>
                            </div>
                        ) : (
                            isAdmin && (
                                <button
                                    onClick={() => setIsLocalEditing(true)}
                                    className="border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:border-black hover:bg-black hover:text-white transition-all rounded-sm"
                                >
                                    <Edit3 size={10} /> {t.team.editProfile}
                                </button>
                            )
                        )}
                    </div>

                    {/* Content */}
                    <div className="mt-8 flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 md:space-y-8 pb-10">
                        
                        {/* Introduction */}
                        <div>
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{t.team.intro}</h4>
                            {isLocalEditing ? (
                                <textarea 
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    className="w-full border border-gray-200 p-2 text-xs rounded focus:border-black outline-none h-20 resize-none leading-relaxed"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 leading-relaxed font-light">{formData.bio}</p>
                            )}
                        </div>

                        {/* 2 Col Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{t.team.major}</h4>
                                {isLocalEditing ? (
                                    <input 
                                        type="text" 
                                        value={formData.major || ""}
                                        onChange={(e) => handleChange('major', e.target.value)}
                                        className="w-full border border-gray-200 p-1 text-xs rounded focus:border-black outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-900">{formData.major || "-"}</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{t.team.email}</h4>
                                {isLocalEditing ? (
                                    <input 
                                        type="text" 
                                        value={formData.email || ""}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full border border-gray-200 p-1 text-xs rounded focus:border-black outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-900">{formData.email || "-"}</p>
                                )}
                            </div>
                        </div>

                        {/* Custom Links */}
                        <div>
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{t.team.links}</h4>
                            <div className="space-y-1">
                                {(formData.customLinks || []).map((link: any, idx: number) => (
                                    <div key={idx} className={`flex items-center gap-2 ${isLocalEditing ? 'bg-gray-50 p-1 rounded' : ''}`}>
                                        {isLocalEditing ? (
                                            <>
                                                <input value={link.title} className="text-xs border p-1 w-20" onChange={(e) => {
                                                     const newLinks = [...formData.customLinks];
                                                     newLinks[idx].title = e.target.value;
                                                     handleChange('customLinks', newLinks);
                                                }} />
                                                <input value={link.url} className="text-xs border p-1 flex-1" onChange={(e) => {
                                                     const newLinks = [...formData.customLinks];
                                                     newLinks[idx].url = e.target.value;
                                                     handleChange('customLinks', newLinks);
                                                }} />
                                                <button onClick={() => removeCustomLink(idx)}><X size={12} /></button>
                                            </>
                                        ) : (
                                            <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-black hover:underline block">
                                                {link.title}
                                            </a>
                                        )}
                                    </div>
                                ))}
                                {(!formData.customLinks || formData.customLinks.length === 0) && !isLocalEditing && (
                                    <p className="text-xs text-gray-300 italic">{t.team.noLinks}</p>
                                )}
                                {isLocalEditing && (
                                    <button onClick={() => addCustomLink("Portfolio", "https://")} className="text-[10px] text-blue-500 hover:underline mt-1">{t.team.addLink}</button>
                                )}
                            </div>
                        </div>

                        {/* Interests & Software */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{t.team.interests}</h4>
                                {isLocalEditing ? (
                                    <input 
                                        type="text"
                                        value={formData.interests || ""}
                                        onChange={(e) => handleChange('interests', e.target.value)}
                                        className="w-full border border-gray-200 p-1 text-xs rounded focus:border-black outline-none"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {interestsList.map((tag: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{t.team.software}</h4>
                                {isLocalEditing ? (
                                    <input 
                                        type="text"
                                        value={formData.software || ""}
                                        onChange={(e) => handleChange('software', e.target.value)}
                                        className="w-full border border-gray-200 p-1 text-xs rounded focus:border-black outline-none"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {softwareList.map((tag: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 border border-gray-200 text-gray-500 text-[10px] font-medium rounded-sm uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
