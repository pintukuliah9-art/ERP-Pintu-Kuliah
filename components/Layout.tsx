
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Announcement, ChatMessage, DivisionType, DivisionData, UserRole } from '../types';
import { Icon } from './Icon';
import { ResponsiveSidebar } from './Sidebar';
import { translations, LanguageCode } from '../translations';
import { DIVISIONS } from '../constants';

export const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => { 
        const timer = setTimeout(onClose, 3000); 
        return () => clearTimeout(timer); 
    }, [onClose]);

    return (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out]">
            <Icon name="CheckCircle" className="text-brand-400" size={20} />
            <span className="font-medium text-sm">{message}</span>
        </div>
    );
};

export const MobileBottomNav: React.FC<{ onOpenQuickAction?: () => void }> = ({ onOpenQuickAction }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0f172a]/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around z-50 px-4 pb-4 pt-2">
             <Link to="/" className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive('/') ? 'text-brand-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
                <div className={`p-1 rounded-lg ${isActive('/') ? 'bg-brand-500/10' : ''}`}>
                    <Icon name="LayoutGrid" size={22} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Home</span>
            </Link>
             <Link to="/messages" className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive('/messages') ? 'text-brand-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
                <div className={`p-1 rounded-lg ${isActive('/messages') ? 'bg-brand-500/10' : ''}`}>
                    <Icon name="MessageSquare" size={22} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Pesan</span>
            </Link>
            
            {/* Center Quick Action Button */}
            <button 
                onClick={onOpenQuickAction}
                className="flex flex-col items-center -translate-y-6 transition-transform active:scale-90"
            >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/40 border-4 border-[#0f172a]">
                    <Icon name="Plus" size={28} />
                </div>
            </button>

             <Link to="/settings" className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${isActive('/settings') ? 'text-brand-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
                <div className={`p-1 rounded-lg ${isActive('/settings') ? 'bg-brand-500/10' : ''}`}>
                    <Icon name="Settings" size={22} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Settings</span>
            </Link>
             <button onClick={() => window.dispatchEvent(new CustomEvent('open-profile'))} className={`flex flex-col items-center gap-1.5 p-2 transition-all text-gray-500 hover:text-gray-300`}>
                <div className="p-1">
                    <Icon name="User" size={22} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Profil</span>
            </button>
        </div>
    );
};

export const CommunicationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'announcements' | 'chat';
  setActiveTab: (t: 'announcements' | 'chat') => void;
  announcements: Announcement[];
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  activeChannel: string;
  onChangeChannel: (id: string) => void;
  currentUser: User;
}> = ({ isOpen, onClose, activeTab, setActiveTab, announcements, messages, onSendMessage, activeChannel, onChangeChannel, currentUser }) => { 
    const [msgInput, setMsgInput] = useState(''); 
    const chatEndRef = useRef<HTMLDivElement>(null); 
    const filteredMessages = messages.filter((m: ChatMessage) => m.channelId === activeChannel); 
    
    useEffect(() => { 
        if (isOpen && activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
        }
    }, [isOpen, activeTab, filteredMessages]); 
    
    const handleSend = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!msgInput.trim()) return; 
        onSendMessage(msgInput); 
        setMsgInput(''); 
    }; 
    
    const getChannelName = (id: string) => { 
        if (id === 'GENERAL') return 'General / All Company'; 
        return DIVISIONS.find(d => d.id === id)?.name || id; 
    }; 
    
    const availableChannels = currentUser.role === UserRole.ADMIN ? DIVISIONS : DIVISIONS.filter((d: DivisionData) => d.id === currentUser.division); 
    
    return (
        <div className={`fixed top-0 right-0 h-full w-80 md:w-96 glass-panel border-l border-white/10 z-[70] transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0"><h3 className="text-lg font-bold text-white tracking-tight">Communication</h3><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Icon name="X" size={20} /></button></div>
            <div className="flex p-4 gap-2 shrink-0"><button onClick={() => setActiveTab('announcements')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Announcements</button><button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Chat</button></div>
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === 'announcements' ? (
                    <div className="p-4 overflow-y-auto h-full custom-scrollbar space-y-4">{announcements.map((ann: Announcement) => (<div key={ann.id} className="glass-card p-4 rounded-xl border-l-4 border-l-brand-500 relative hover:bg-white/5 transition-colors"><div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ann.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>{ann.priority}</span><span className="text-[10px] text-gray-500">{ann.date}</span></div><h5 className="font-semibold text-gray-200 text-sm mb-1">{ann.title}</h5><p className="text-xs text-gray-400 leading-relaxed">{ann.content}</p></div>))}{announcements.length === 0 && <p className="text-center text-xs text-gray-500 mt-10">No active announcements</p>}</div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="px-4 pb-2 shrink-0"><div className="relative"><select className="w-full bg-black/30 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-brand-500 appearance-none" value={activeChannel} onChange={(e) => onChangeChannel(e.target.value)}><option value="GENERAL">General / All Company</option><optgroup label="Divisions">{availableChannels.map((d: DivisionData) => (<option key={d.id} value={d.id}>{d.name}</option>))}</optgroup></select><Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" /></div></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/10">{filteredMessages.length === 0 ? (<div className="text-center text-xs text-gray-500 mt-10">Start the conversation in {getChannelName(activeChannel)}</div>) : (filteredMessages.map((msg: ChatMessage) => { const isMe = msg.senderId === currentUser.id; return (<div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}>{!isMe && <p className="text-[10px] font-bold text-brand-300 mb-0.5">{msg.senderName}</p>}<p>{msg.content}</p></div><span className="text-[9px] text-gray-500 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>); }))}<div ref={chatEndRef} /></div>
                        <div className="p-4 bg-white/5 border-t border-white/5 shrink-0"><form onSubmit={handleSend} className="flex items-center gap-2"><input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder={`Message ${activeChannel === 'GENERAL' ? 'everyone' : getChannelName(activeChannel)}...`} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none placeholder-gray-600" /><button type="submit" className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={!msgInput.trim()}><Icon name="Send" size={18} /></button></form></div>
                    </div>
                )}
            </div>
        </div>
    ); 
};

export const AppLayout: React.FC<{ 
    children: React.ReactNode; 
    user: User; 
    selectedCount: number;
    onBulkAction: (action: string) => void;
    onCancelSelection: () => void;
    lang: LanguageCode;
    onLogout: () => void;
    onOpenProfile: () => void;
    onOpenQuickAction?: () => void;
    divisions: any[];
}> = ({ children, user, selectedCount, onBulkAction, onCancelSelection, lang, onLogout, onOpenProfile, onOpenQuickAction, divisions }) => {
    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden relative selection-mode-provider">
             <div className={`fixed top-0 left-0 right-0 h-16 bg-brand-600 z-[60] flex items-center justify-between px-6 transition-transform duration-300 ${selectedCount > 0 ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onCancelSelection} className="p-2 hover:bg-white/20 rounded-full text-white"><Icon name="X" size={20} /></button>
                    <span className="font-bold text-white">{selectedCount} Selected</span>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => onBulkAction('MOVE')} className="p-2 hover:bg-white/20 rounded-lg text-white flex flex-col items-center gap-1" title="Move"><Icon name="Move" size={18} /></button>
                     <button onClick={() => onBulkAction('ARCHIVE')} className="p-2 hover:bg-white/20 rounded-lg text-white flex flex-col items-center gap-1" title="Archive"><Icon name="Archive" size={18} /></button>
                     <button onClick={() => onBulkAction('DELETE')} className="p-2 hover:bg-white/20 rounded-lg text-white flex flex-col items-center gap-1" title="Delete"><Icon name="Trash2" size={18} /></button>
                </div>
             </div>
 
            <ResponsiveSidebar user={user} lang={lang} onLogout={onLogout} onOpenProfile={onOpenProfile} divisions={divisions} />
            
            <main className="flex-1 flex flex-col min-w-0 relative h-full">
                {children}
            </main>
 
            <MobileBottomNav onOpenQuickAction={onOpenQuickAction} />
        </div>
    );
};
