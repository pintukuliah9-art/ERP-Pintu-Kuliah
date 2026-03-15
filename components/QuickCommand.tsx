
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Tool, User, DivisionData } from '../types';

interface QuickCommandProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
  users: User[];
  divisions: DivisionData[];
}

export const QuickCommand: React.FC<QuickCommandProps> = ({ isOpen, onClose, tools, users, divisions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter Logic
  const filteredItems = React.useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    const resultTools = tools.filter(t => t.name.toLowerCase().includes(lowerQuery)).map(t => ({ type: 'TOOL', data: t }));
    const resultUsers = users.filter(u => u.name.toLowerCase().includes(lowerQuery)).map(u => ({ type: 'USER', data: u }));
    const resultDivs = divisions.filter(d => d.name.toLowerCase().includes(lowerQuery)).map(d => ({ type: 'DIVISION', data: d }));
    
    // Commands
    const commands = [
        { label: 'Go to Dashboard', action: () => navigate('/') },
        { label: 'Go to Messages', action: () => navigate('/messages') },
        { label: 'Go to Settings', action: () => navigate('/settings') },
    ].filter(c => c.label.toLowerCase().includes(lowerQuery)).map(c => ({ type: 'COMMAND', data: c }));

    return [...commands, ...resultDivs, ...resultTools, ...resultUsers].slice(0, 8);
  }, [query, tools, users, divisions, navigate]);

  const handleSelect = (item: any) => {
    if (!item) return;
    if (item.type === 'COMMAND') {
        item.data.action();
    } else if (item.type === 'DIVISION') {
        navigate(`/division/${item.data.id}`);
    } else if (item.type === 'TOOL') {
        if(item.data.url && item.data.url !== '#') window.open(item.data.url, '_blank');
    } else if (item.type === 'USER') {
        // In real app, maybe open profile modal or chat
        navigate('/messages'); 
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 md:pt-[15vh] bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.1s_ease-out] mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
          <Icon name="Search" className="text-gray-400" size={20} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm font-medium"
            placeholder="Ketik untuk mencari alat, tim, atau menu..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            {filteredItems.length === 0 && query && (
                <div className="p-4 text-center text-gray-500 text-sm">Tidak ada hasil ditemukan.</div>
            )}
            {filteredItems.length === 0 && !query && (
                <div className="p-4 text-center text-gray-500 text-xs">
                    <p className="mb-2">Coba ketik:</p>
                    <div className="flex justify-center gap-2">
                        <span className="bg-white/5 px-2 py-1 rounded">Marketing</span>
                        <span className="bg-white/5 px-2 py-1 rounded">Absen</span>
                        <span className="bg-white/5 px-2 py-1 rounded">Settings</span>
                    </div>
                </div>
            )}
            
            {filteredItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${idx === selectedIndex ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                >
                    <div className={`p-1.5 rounded-md ${idx === selectedIndex ? 'bg-white/20' : 'bg-white/5'}`}>
                        <Icon 
                            name={
                                item.type === 'COMMAND' ? 'Zap' : 
                                item.type === 'DIVISION' ? 'Briefcase' :
                                item.type === 'USER' ? 'User' : 
                                (item.data as Tool).icon || 'Link'
                            } 
                            size={16} 
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {item.type === 'COMMAND' ? (item.data as any).label : (item.data as any).name}
                        </p>
                        <p className={`text-[10px] truncate ${idx === selectedIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                            {item.type} {item.type === 'TOOL' && `• ${(item.data as Tool).category}`} {item.type === 'USER' && `• ${(item.data as User).role}`}
                        </p>
                    </div>
                    {idx === selectedIndex && <Icon name="CornerDownLeft" size={14} className="opacity-50" />}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
