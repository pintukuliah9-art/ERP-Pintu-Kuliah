
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tool, User, DivisionType, ToolCategory, UserRole, ChatMessage } from '../types';
import { DIVISIONS } from '../constants';
import { Icon } from './Icon';
import { ToolCard } from './ToolCard';
import { WorkflowMap } from './WorkflowMap';
import { translations, LanguageCode } from '../translations';

interface DivisionViewProps {
  tools: Tool[];
  user: User;
  handleToolClick: (tool: Tool) => void;
  onContextMenu: (e: any, tool: Tool) => void;
  onSelect: (tool: Tool) => void;
  onAddTool: (divisionId: string) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onOpenChat: (divisionId: string) => void;
  lang: LanguageCode;
  messages: ChatMessage[];
  onSendMessage: (content: string, channelId: string) => void;
}

export const DivisionView: React.FC<DivisionViewProps> = ({ 
    tools = [], user, handleToolClick, onContextMenu, onSelect, onAddTool, isSelectionMode, selectedIds, 
    lang, messages = [], onSendMessage 
}) => {
    const { id } = useParams<{ id: string }>(); 
    const navigate = useNavigate(); 
    
    const [searchTerm, setSearchTerm] = useState(''); 
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const t = translations[lang] || translations.en;

    // --- 1. ACCESS CONTROL LOGIC ---
    if (user.role !== UserRole.ADMIN && user.division !== id) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554]">
                <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl shadow-2xl max-w-md animate-[scaleIn_0.3s_ease-out]">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="ShieldAlert" size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Maaf, Anda tidak memiliki izin untuk mengakses area <strong>{DIVISIONS.find(d => d.id === id)?.name || id}</strong>.
                    </p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all border border-white/5 shadow-lg flex items-center justify-center gap-2 w-full"
                    >
                        <Icon name="ArrowLeft" size={18} /> Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const division = DIVISIONS.find(d => d.id === id); 
    if (!division) return <div className="p-10 text-white text-center pt-20">{t.division.notFound}</div>;

    const canAddTool = user.role === UserRole.ADMIN || (user.role === UserRole.MANAGER && user.division === id);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // --- 2. FILTER TOOLS ---
    const filteredTools = tools.filter((t: Tool) => 
        t.divisionId === id && 
        (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const groupedTools = useMemo(() => { 
        return { 
            [ToolCategory.DAILY]: filteredTools.filter((t: Tool) => t.category === ToolCategory.DAILY), 
            [ToolCategory.SHARED]: filteredTools.filter((t: Tool) => t.category === ToolCategory.SHARED), 
            [ToolCategory.PROJECT]: filteredTools.filter((t: Tool) => t.category === ToolCategory.PROJECT), 
        }; 
    }, [filteredTools]);

    const divisionMessages = messages.filter(m => m.channelId === division.id);

    const handleChatSend = (e: React.FormEvent) => {
        e.preventDefault();
        if(!chatInput.trim()) return;
        onSendMessage(chatInput, division.id);
        setChatInput('');
    };
    
    const ToolColumn: React.FC<{ title: string; categoryTools: Tool[]; color: string }> = ({ title, categoryTools, color }) => (
        <div className="flex-1 min-w-[280px] flex flex-col glass-card rounded-2xl border border-white/5 h-full overflow-hidden">
            <div className={`p-4 border-b border-white/5 bg-white/5 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                    <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wide">{title}</h3>
                </div>
                <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{categoryTools.length}</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-2 bg-black/10">
                {categoryTools.map(tool => (
                    <div key={tool.id} draggable={!tool.isLocked}>
                        <ToolCard tool={tool} onClick={() => handleToolClick(tool)} onContextMenu={onContextMenu} onSelect={() => onSelect(tool)} variant="list" isSelectionMode={isSelectionMode} isSelected={selectedIds.has(tool.id)} />
                    </div>
                ))}
                {categoryTools.length === 0 && <div className="h-20 flex items-center justify-center text-xs text-gray-500 italic">No tools</div>}
            </div>
        </div>
    );

    const [mobileTab, setMobileTab] = useState<'tools' | 'chat'>('tools');

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554]">
            
            {/* Mobile Tab Navigation */}
            <div className="lg:hidden flex border-b border-white/5 bg-white/5 shrink-0">
                <button 
                    onClick={() => setMobileTab('tools')}
                    className={`flex-1 py-3 text-xs font-bold transition-all ${mobileTab === 'tools' ? 'text-brand-400 border-b-2 border-brand-500 bg-white/5' : 'text-gray-500'}`}
                >
                    Tools
                </button>
                <button 
                    onClick={() => setMobileTab('chat')}
                    className={`flex-1 py-3 text-xs font-bold transition-all ${mobileTab === 'chat' ? 'text-brand-400 border-b-2 border-brand-500 bg-white/5' : 'text-gray-500'}`}
                >
                    Chat
                </button>
            </div>

            {/* MAIN CONTENT (TOOLS) - FLEX 1 */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden border-r border-white/5 ${mobileTab !== 'tools' ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 md:py-6 border-b border-white/5 bg-white/5 shrink-0 gap-4">
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Icon name="ArrowLeft" size={20} /></button>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 md:gap-3 truncate">
                                <Icon name={division.icon} className="text-brand-400" size={20} />
                                {division.name}
                            </h1>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">{division.description}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative group flex-1 md:w-64">
                            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search tools..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500 transition-all" 
                            />
                        </div>

                        {canAddTool && (
                            <button onClick={() => onAddTool(division.id)} className="p-2 md:px-4 md:py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow-lg shrink-0">
                                <Icon name="Plus" size={16} />
                                <span className="hidden md:inline ml-2">{t.division.addTool}</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Tools Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                    <div className="max-w-7xl mx-auto h-full space-y-6 md:space-y-8 animate-[fadeIn_0.3s]">
                        {division.workflow.length > 0 && (
                            <div className="glass-card rounded-2xl p-4 md:p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon name="GitMerge" className="text-brand-400" size={18} />
                                    <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wide">{t.division.workflow}</h3>
                                </div>
                                <div className="overflow-x-auto pb-2">
                                    <WorkflowMap steps={division.workflow} onStepClick={() => {}} />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[600px]">
                            <ToolColumn title={t.division.daily} categoryTools={groupedTools[ToolCategory.DAILY]} color="bg-blue-500" />
                            <ToolColumn title={t.division.shared} categoryTools={groupedTools[ToolCategory.SHARED]} color="bg-purple-500" />
                            <ToolColumn title={t.division.projects} categoryTools={groupedTools[ToolCategory.PROJECT]} color="bg-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* PERSISTENT RIGHT SIDEBAR (CHAT ONLY) - FIXED WIDTH */}
            <div className={`w-full lg:w-[400px] bg-[#0b1120]/80 backdrop-blur-xl flex flex-col border-l border-white/5 shrink-0 transition-all duration-300 ${mobileTab === 'tools' ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Icon name="MessageSquare" size={16} className="text-indigo-400" />
                        Team Chat
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {division.name} Channel
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
                    {divisionMessages.length === 0 && (
                        <div className="text-center py-20 text-gray-500 opacity-50">
                            <Icon name="MessageCircle" size={32} className="mx-auto mb-2" />
                            <p className="text-xs">No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    {divisionMessages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {msg.senderId !== user.id && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{msg.senderName}</span>}
                                <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#1e293b] text-gray-200 border border-white/10 rounded-tl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-white/5 shrink-0">
                    <form onSubmit={handleChatSend} className="flex gap-2">
                        <input 
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-500 transition-all"
                            placeholder={`Message ${division.name}...`}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim()}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition-all"
                        >
                            <Icon name="Send" size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
