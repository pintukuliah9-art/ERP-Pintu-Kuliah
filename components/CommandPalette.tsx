
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { DivisionData, User } from '../types';
import { DIVISIONS } from '../constants';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string, payload?: any) => void;
    user: User;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction, user }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: { id: string; title: string; icon: string; category: string; payload?: any }[] = [
        { id: 'attendance', title: 'Absensi / Daftar Hadir', icon: 'Fingerprint', category: 'Sistem' },
        { id: 'tasks', title: 'Daftar Kerja / Tugas', icon: 'CheckSquare', category: 'Sistem' },
        { id: 'chat', title: 'Obrolan / Chat', icon: 'MessageSquare', category: 'Sistem' },
        { id: 'settings', title: 'Pengaturan', icon: 'Settings', category: 'Sistem' },
        ...DIVISIONS.map(d => ({ id: `div-${d.id}`, title: `Buka Divisi ${d.name}`, icon: 'LayoutGrid', category: 'Divisi', payload: d.id }))
    ].filter(cmd => cmd.title.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (isOpen) onClose();
                else onAction('OPEN_PALETTE');
            }
            if (!isOpen) return;

            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % commands.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = commands[selectedIndex];
                if (cmd) {
                    onAction(cmd.id, cmd.payload);
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, commands, selectedIndex, onClose, onAction]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center px-4 py-3 border-b border-white/5">
                    <Icon name="Search" className="text-gray-500 mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ketik perintah atau cari fitur... (Esc untuk batal)"
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-gray-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="flex items-center gap-1 ml-2">
                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-mono">⌘</kbd>
                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-mono">K</kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {commands.length > 0 ? (
                        <div className="space-y-1">
                            {commands.map((cmd, idx) => (
                                <button
                                    key={cmd.id}
                                    onClick={() => { onAction(cmd.id, cmd.payload); onClose(); }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${idx === selectedIndex ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-white/20' : 'bg-white/5'}`}>
                                        <Icon name={cmd.icon} size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{cmd.title}</p>
                                        <p className={`text-[10px] ${idx === selectedIndex ? 'text-white/70' : 'text-gray-500'}`}>{cmd.category}</p>
                                    </div>
                                    {idx === selectedIndex && <Icon name="CornerDownLeft" size={14} className="opacity-50" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon name="SearchX" size={40} className="mx-auto text-gray-700 mb-3" />
                            <p className="text-gray-500 text-sm">Tidak ditemukan hasil untuk "{search}"</p>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 rounded border border-white/10">↑↓</kbd> Navigasi</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 rounded border border-white/10">Enter</kbd> Pilih</span>
                    </div>
                    <span>Command Palette</span>
                </div>
            </div>
        </div>
    );
};
