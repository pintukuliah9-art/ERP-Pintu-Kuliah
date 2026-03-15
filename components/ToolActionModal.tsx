
import React, { useState } from 'react';
import { DIVISIONS } from '../constants';
import { DivisionType, ToolCategory } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { translations, LanguageCode } from '../translations';

interface ToolActionModalProps {
  isOpen: boolean;
  mode: 'move' | 'mirror';
  onClose: () => void;
  onConfirm: (divisionId: DivisionType, category: ToolCategory) => void;
  currentDivision?: DivisionType;
}

export const ToolActionModal: React.FC<ToolActionModalProps> = ({ isOpen, mode, onClose, onConfirm, currentDivision }) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionType>(currentDivision || DivisionType.MARKETING);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>(ToolCategory.DAILY);
  
  const prefs = StorageService.getPreferences();
  const t = translations[prefs.language as LanguageCode] || translations.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
            {mode === 'move' ? t.actions.moveTitle : t.actions.mirrorTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon name="X" size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.actions.destination}</label>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {DIVISIONS.map(div => (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivision(div.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${selectedDivision === div.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  <Icon name={div.icon} size={16} />
                  <span className="text-sm font-medium">{div.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.actions.category}</label>
             <select 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value as ToolCategory)}
              >
                {Object.values(ToolCategory).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
          </div>

          <button 
            onClick={() => onConfirm(selectedDivision, selectedCategory)}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
             <Icon name={mode === 'move' ? "Move" : "Copy"} size={18} />
             {mode === 'move' ? t.actions.confirmMove : t.actions.confirmMirror}
          </button>
        </div>
      </div>
    </div>
  );
};
