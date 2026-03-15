
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DivisionData, ChatMessage, Announcement, User, ChatGroup, Tool } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { LinkHub } from './LinkHub';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  divisions: DivisionData[];
  announcements: Announcement[];
  messages: any[];
  onSendMessage: (msg: string) => void;
  activeChannel: string;
  onChangeChannel: (id: string) => void;
  groups: any[];
  tools: Tool[];
  onUpdateTool: (tool: Partial<Tool>) => void;
  onDeleteTool: (toolId: string) => void;
  onAddTool: (tool: any) => void;
  initialTab?: 'chat' | 'announcements' | 'links';
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
    isOpen, onClose, user, divisions = [],
    announcements = [],
    messages = [], onSendMessage, activeChannel = 'GENERAL', onChangeChannel, groups = [],
    tools = [], onUpdateTool, onDeleteTool, onAddTool,
    initialTab = 'chat'
}) => {
    // --- STATE MANAGEMENT ---
    const [activeMainTab, setActiveMainTab] = useState<'chat' | 'announcements' | 'links'>(initialTab);
    const [isExpanded, setIsExpanded] = useState(false);
    const [chatInput, setChatInput] = useState('');

    // --- REFS ---
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveMainTab(initialTab);
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = () => {
        if (!chatInput.trim()) return;
        onSendMessage(chatInput);
        setChatInput('');
    };

    return (
        <div className={`fixed transition-all duration-500 ease-in-out bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl z-[90] flex flex-col ${isExpanded ? 'inset-0 w-full' : `inset-y-0 right-0 w-[420px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} ${!isOpen && !isExpanded ? 'translate-x-full' : ''}`}>
            {/* HEADER TABS */}
            <div className="flex h-16 border-b border-white/10 shrink-0 bg-[#0f172a] relative items-center px-4">
                <div className="flex-1 flex gap-2">
                    <button 
                        onClick={() => setActiveMainTab('chat')} 
                        className={`px-4 py-2 flex items-center gap-2 font-bold text-[10px] tracking-[0.1em] transition-all rounded-xl border ${activeMainTab === 'chat' ? 'bg-brand-500/10 border-brand-500 text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Icon name="MessageSquare" size={14} /> OBROLAN
                    </button>
                    <button 
                        onClick={() => setActiveMainTab('announcements')} 
                        className={`px-4 py-2 flex items-center gap-2 font-bold text-[10px] tracking-[0.1em] transition-all rounded-xl border ${activeMainTab === 'announcements' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Icon name="Megaphone" size={14} /> INFO
                    </button>
                    <button 
                        onClick={() => setActiveMainTab('links')} 
                        className={`px-4 py-2 flex items-center gap-2 font-bold text-[10px] tracking-[0.1em] transition-all rounded-xl border ${activeMainTab === 'links' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Icon name="ExternalLink" size={14} /> LINK HUB
                    </button>
                </div>
                <div className="flex items-center gap-2 ml-4 border-l border-white/10 pl-4">
                    <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors ${isExpanded ? 'bg-white/10 text-white' : ''}`}>
                        <Icon name={isExpanded ? "Minimize2" : "Maximize2"} size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                        <Icon name="X" size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-gradient-to-br from-gray-900 to-[#0b1120]">
                {activeMainTab === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            {msg.senderName}
                                            {StorageService.getTodayAttendance(msg.senderId) && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" title="Online / Clocked In"></span>
                                            )}
                                        </span>
                                        <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.senderId === user.id ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                        {msg.content || msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40">
                            <div className="flex gap-2">
                                <input 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ketik pesan..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand-500 transition-all"
                                />
                                <button 
                                    onClick={handleSend}
                                    className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20"
                                >
                                    <Icon name="Send" size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeMainTab === 'announcements' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {announcements.length === 0 ? (
                            <div className="text-center py-20 text-gray-600 italic">Belum ada pengumuman.</div>
                        ) : (
                            announcements.map((ann, idx) => (
                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{ann.type}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{ann.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeMainTab === 'links' && (
                    <div className="flex-1 overflow-hidden">
                        <LinkHub 
                            tools={tools} 
                            user={user} 
                            onUpdateTool={onUpdateTool} 
                            onDeleteTool={onDeleteTool} 
                            onAddTool={onAddTool} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
