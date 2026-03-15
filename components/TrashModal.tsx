
import React from 'react';
import { Tool } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { translations, LanguageCode } from '../translations';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedTools: Tool[];
  onRestore: (toolId: string) => void;
  onPermanentDelete: (toolId: string) => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({ 
  isOpen, onClose, deletedTools, onRestore, onPermanentDelete 
}) => {
  if (!isOpen) return null;

  const prefs = StorageService.getPreferences();
  const t = translations[prefs.language as LanguageCode] || translations.en;

  const getDaysRemaining = (deletedAt?: number) => {
    if (!deletedAt) return 30;
    const diff = Date.now() - deletedAt;
    const days = 30 - Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-[scaleIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Icon name="Trash2" size={24} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.trash.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon name="X" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0">
          {deletedTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Icon name="Trash" size={48} className="mb-4 opacity-20" />
              <p>{t.trash.empty}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t.trash.headerName}</th>
                  <th className="px-6 py-3 font-semibold">{t.trash.headerDays}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t.trash.headerActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {deletedTools.map(tool => (
                  <tr key={tool.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs ${tool.color || 'bg-gray-500'}`}>
                          <Icon name={tool.icon || 'Link'} size={14} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{tool.name}</div>
                          <div className="text-xs text-gray-400">{tool.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">
                        {getDaysRemaining(tool.deletedAt)} {t.trash.days}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onRestore(tool.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:border-green-800 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 text-xs font-medium transition-colors"
                        >
                          <Icon name="RotateCcw" size={14} /> {t.trash.restore}
                        </button>
                        <button 
                          onClick={() => onPermanentDelete(tool.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors"
                        >
                          <Icon name="Trash2" size={14} /> {t.trash.deletePerm}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-white/5 p-4 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
          {t.trash.autoDelete}
        </div>
      </div>
    </div>
  );
};
