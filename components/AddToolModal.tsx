import React, { useState, useEffect } from 'react';
import { Tool, ToolCategory, DivisionType } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'motion/react';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Partial<Tool>) => void;
  preselectedDivision?: DivisionType;
  initialData?: Tool; // For editing
  initialCategory?: ToolCategory; // New prop for defaults
}

export const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onSave, preselectedDivision, initialData, initialCategory }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<ToolCategory>(ToolCategory.DAILY);
  const [iconName, setIconName] = useState('Link');
  const [color, setColor] = useState('bg-blue-500');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setUrl(initialData.url);
        setCategory(initialData.category);
        setIconName(initialData.icon || 'Link');
        setColor(initialData.color || 'bg-blue-500');
      } else {
        // Reset defaults
        setName('');
        setUrl('');
        setCategory(initialCategory || ToolCategory.DAILY);
        setIconName('Link');
        setColor('bg-blue-500');
      }
    }
  }, [isOpen, initialData, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id, // Pass ID if editing
      name,
      url,
      category,
      icon: iconName,
      color,
      divisionId: preselectedDivision || initialData?.divisionId,
      isPersonal: !preselectedDivision && !initialData?.divisionId
    });
    onClose();
  };

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500', 'bg-slate-500'
  ];

  const commonIcons = ['Link', 'FileText', 'FileSpreadsheet', 'Folder', 'Globe', 'Database', 'Mail', 'MessageCircle', 'Calendar', 'CheckSquare', 'Trash2', 'Settings'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10 relative z-10"
          >
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-black text-white tracking-tight">
                {initialData ? 'Edit Link' : 'Tambah Link Baru'}
              </h2>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nama Link</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white focus:border-brand-500 outline-none transition-all"
                    value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Laporan Bulanan"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">URL / Alamat Link</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white focus:border-brand-500 outline-none transition-all font-mono text-sm"
                    value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... atau #"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Kategori</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white outline-none focus:border-brand-500 transition-all appearance-none"
                      value={category} onChange={e => setCategory(e.target.value as ToolCategory)}
                    >
                      {Object.values(ToolCategory).map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Warna Aksen</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {colors.slice(0, 7).map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-7 h-7 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : 'opacity-60 hover:opacity-100'} transition-all`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Pilih Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {commonIcons.map(ico => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setIconName(ico)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-center ${iconName === ico ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/5 bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10'}`}
                      >
                        <Icon name={ico} size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-2">
                  <Icon name={initialData ? "Save" : "Plus"} size={18} />
                  {initialData ? 'Simpan Perubahan' : 'Tambah Link'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};