import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { EditableField } from './ui/EditableField';

interface RecruitmentProps {
  data?: any; // Recruitment data object
  updateData?: (key: string, value: any) => void; // Function to update main data
  isEditing?: boolean;
}

export const Recruitment = ({ data, updateData, isEditing = false }: RecruitmentProps) => {
  const scrollToFooter = () => {
    if (isEditing) return; // Disable scroll action when editing
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleUpdate = (field: string, value: string) => {
    if (updateData && data) {
      updateData('recruitment', { ...data, [field]: value });
    }
  };

  // Fallback if no data provided
  const title1 = data?.title1 || "WE ARE LOOKING FOR";
  const title2 = data?.title2 || "VISIONARIES";
  const roles = data?.roles || "Spatial Designer • Researcher • Creative Coder";
  const status = data?.status || "Open Positions Available";
  const cta = data?.cta || "Apply Below";

  return (
    <section 
      onClick={scrollToFooter}
      className={`bg-white text-black py-20 md:py-32 group border-t border-black/5 hover:bg-gray-50 transition-colors ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-6 md:gap-8">
          {/* Status Indicator */}
          <div className="inline-flex items-center gap-3 border border-black/10 rounded-full px-4 py-1.5 bg-white">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 group-hover:text-black transition-colors">
                  <EditableField
                      value={status}
                      onSave={(val) => handleUpdate('status', val)}
                      isEditing={isEditing}
                      className="min-w-[100px] text-center"
                  />
              </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="text-4xl md:text-7xl font-medium tracking-tight">
                <EditableField
                    value={title1}
                    onSave={(val) => handleUpdate('title1', val)}
                    isEditing={isEditing}
                    tagName="span"
                />
            </div>
            <div className="text-4xl md:text-7xl font-black tracking-tight text-gray-300 group-hover:text-black transition-colors duration-500">
                <EditableField
                    value={title2}
                    onSave={(val) => handleUpdate('title2', val)}
                    isEditing={isEditing}
                    tagName="span"
                />
            </div>
          </div>
          
          {/* Subtle Role List */}
          <div className="font-mono text-xs text-gray-400 uppercase tracking-widest mt-4">
               <EditableField
                    value={roles}
                    onSave={(val) => handleUpdate('roles', val)}
                    isEditing={isEditing}
                    className="min-w-[200px] text-center"
                />
          </div>

          {/* Directional Cue */}
          <motion.div 
            animate={isEditing ? {} : { y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="mt-12 flex flex-col items-center gap-2 text-gray-300 group-hover:text-black transition-colors"
          >
             <div className="text-[10px] font-bold uppercase tracking-widest">
                 <EditableField
                    value={cta}
                    onSave={(val) => handleUpdate('cta', val)}
                    isEditing={isEditing}
                />
             </div>
             <ArrowDown size={20} />
          </motion.div>
      </div>
    </section>
  );
};
