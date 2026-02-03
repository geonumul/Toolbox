import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  data: any;
  updateData: (section: string, data: any) => void;
  updateConfig: (key: string, value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel = ({ data, updateData, updateConfig, isOpen, onClose }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [liveLink, setLiveLink] = useState(data.config.liveStudioLink);

  const tabs = ['gallery', 'schedule', 'study', 'team', 'archive'];

  const handleSaveConfig = () => {
    updateConfig('liveStudioLink', liveLink);
    alert('Settings Saved');
  };

  // Generic Item Updater
  const updateItem = (section: string, index: number, field: string, value: string) => {
    const newData = [...data[section]];
    newData[index] = { ...newData[index], [field]: value };
    updateData(section, newData);
  };

  const addItem = (section: string) => {
    const newData = [...data[section]];
    const id = Math.max(...newData.map((i: any) => i.id || 0), 0) + 1;
    
    let newItem = { id };
    if (section === 'gallery') newItem = { ...newItem, title: 'New Project', type: 'Projects', image: '', description: '' };
    if (section === 'schedule') newItem = { ...newItem, date: '2026-01-01', title: 'New Event', description: '' };
    if (section === 'study') newItem = { ...newItem, date: '2026-01-01', title: 'New Study Log', content: '', tags: [] };
    if (section === 'team') newItem = { ...newItem, name: 'New Member', role: 'Role', bio: '', image: '' };
    if (section === 'archive') newItem = { ...newItem, year: '2026', title: 'New Entry', type: 'Award', issuer: '' };

    newData.push(newItem);
    updateData(section, newData);
  };

  const deleteItem = (section: string, index: number) => {
    if(!confirm("Are you sure?")) return;
    const newData = [...data[section]];
    newData.splice(index, 1);
    updateData(section, newData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl p-8 overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold tracking-tight">SYSTEM ADMIN // TOOLBOX</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X />
            </button>
          </div>

          <div className="flex gap-8 flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 flex flex-col gap-2">
              <div className="font-mono text-xs text-gray-400 mb-2 uppercase">Databases</div>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors ${
                    activeTab === tab ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="mt-8 font-mono text-xs text-gray-400 mb-2 uppercase">Settings</div>
               <div className="p-4 bg-gray-50 rounded text-xs">
                  <label className="block mb-2 font-bold">Live Studio Link</label>
                  <input 
                      type="text" 
                      value={liveLink}
                      onChange={(e) => setLiveLink(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded mb-2"
                  />
                  <button onClick={handleSaveConfig} className="w-full bg-black text-white py-1 rounded flex justify-center items-center gap-2">
                      <Save size={12} /> Save
                  </button>
               </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold uppercase">{activeTab} Database</h3>
                  <button 
                      onClick={() => addItem(activeTab)}
                      className="px-4 py-2 bg-black text-white text-xs rounded-full flex items-center gap-2 hover:bg-gray-800"
                  >
                      <Plus size={14} /> Add New Entry
                  </button>
              </div>

              <div className="space-y-4">
                  {data[activeTab].map((item: any, idx: number) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors bg-white shadow-sm relative group">
                           <button 
                              onClick={() => deleteItem(activeTab, idx)}
                              className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Trash2 size={16} />
                           </button>
                           <div className="grid grid-cols-2 gap-4 pr-8">
                              {Object.keys(item).map(key => {
                                  if(key === 'id') return null;
                                  return (
                                      <div key={key}>
                                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">{key}</label>
                                          {key === 'description' || key === 'content' || key === 'bio' ? (
                                              <textarea
                                                  value={item[key]}
                                                  onChange={(e) => updateItem(activeTab, idx, key, e.target.value)}
                                                  className="w-full p-2 border border-gray-100 rounded text-sm bg-gray-50 focus:bg-white focus:border-black outline-none transition-all h-20"
                                              />
                                          ) : (
                                              <input 
                                                  type="text" 
                                                  value={Array.isArray(item[key]) ? item[key].join(', ') : item[key]}
                                                  onChange={(e) => updateItem(activeTab, idx, key, key === 'tags' ? e.target.value.split(',') : e.target.value)}
                                                  className="w-full p-2 border border-gray-100 rounded text-sm bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
                                              />
                                          )}
                                      </div>
                                  )
                              })}
                           </div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
