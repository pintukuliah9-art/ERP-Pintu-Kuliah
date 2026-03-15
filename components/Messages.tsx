import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ChatMessage, ChatGroup } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { DIVISIONS } from '../constants';

interface MessagesProps {
  user: User;
  messages: ChatMessage[];
  onSendMessage: (content: string, channelId: string) => void;
  groups: ChatGroup[];
  onCreateGroup: (name: string, members: string[]) => void;
}

export const Messages: React.FC<MessagesProps> = ({ user, messages, onSendMessage, groups, onCreateGroup }) => {
  const [activeChannelId, setActiveChannelId] = useState<string>('GENERAL');
  const [msgInput, setMsgInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  
  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Get All Users
  const allUsers = StorageService.getUsers();

  // --- HELPER: GENERATE DM ID ---
  // Sorts IDs to ensure User A -> User B and User B -> User A share the same channel string
  const getDmChannelId = (uid1: string, uid2: string) => {
      return [uid1, uid2].sort().join('_');
  };

  // --- DERIVED STATE: ACTIVE DMs ---
  // Scan messages to find who we have talked to, plus manually started chats
  const [manualDMs, setManualDMs] = useState<string[]>([]); // Store IDs of users we clicked "New Chat" with but maybe haven't messaged yet

  const activeDMUsers = useMemo(() => {
      // 1. Collect all users involved in DMs with current user from messages history
      const interactors = new Set<string>(manualDMs);
      
      messages.forEach(msg => {
          // If message is a DM (contains underscore and not a group)
          if (msg.channelId.includes('_') && !msg.channelId.startsWith('grp_')) {
              const parts = msg.channelId.split('_');
              // If current user is part of this DM
              if (parts.includes(user.id)) {
                  // The other person is the ID that is not mine
                  const otherId = parts.find(id => id !== user.id) || user.id; // fallback to self if self-chat
                  interactors.add(otherId);
              }
          }
      });

      // 2. Map IDs to User objects
      const users = Array.from(interactors).map(uid => allUsers.find(u => u.id === uid)).filter(Boolean) as User[];

      // 3. Sort by last message timestamp (Most recent first)
      return users.sort((a, b) => {
          const chanA = getDmChannelId(user.id, a.id);
          const chanB = getDmChannelId(user.id, b.id);
          
          // Find last msg for A
          const msgsA = messages.filter(m => m.channelId === chanA);
          const lastTimeA = msgsA.length > 0 ? msgsA[msgsA.length - 1].timestamp : 0;

          // Find last msg for B
          const msgsB = messages.filter(m => m.channelId === chanB);
          const lastTimeB = msgsB.length > 0 ? msgsB[msgsB.length - 1].timestamp : 0;

          return lastTimeB - lastTimeA; // Descending order
      });

  }, [messages, user.id, manualDMs, allUsers]);

  const [showMobileList, setShowMobileList] = useState(true);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());

  // Filter messages for current channel
  const currentMessages = useMemo(() => {
      let filtered = messages.filter(m => m.channelId === activeChannelId);
      if (chatSearchTerm) {
          filtered = filtered.filter(m => m.content.toLowerCase().includes(chatSearchTerm.toLowerCase()));
      }
      return filtered;
  }, [messages, activeChannelId, chatSearchTerm]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!chatSearchTerm) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, activeChannelId, chatSearchTerm]);

  // Handle channel change on mobile
  const handleChannelSelect = (id: string) => {
    setActiveChannelId(id);
    setShowMobileList(false);
    setChatSearchTerm('');
    setIsSearchOpen(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    onSendMessage(msgInput, activeChannelId);
    setMsgInput('');
  };

  const togglePin = (msgId: string) => {
      const newPins = new Set(pinnedMessages);
      if (newPins.has(msgId)) newPins.delete(msgId);
      else newPins.add(msgId);
      setPinnedMessages(newPins);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedMembers.size === 0) {
        alert("Mohon isi nama grup dan pilih minimal satu anggota.");
        return;
    }
    // Auto-add creator
    const members = Array.from(selectedMembers);
    if (!members.includes(user.id)) members.push(user.id);

    onCreateGroup(newGroupName, members);
    setIsCreateModalOpen(false);
    setNewGroupName('');
    setSelectedMembers(new Set());
    setShowMobileList(false); // Switch to the new group
  };

  const toggleMemberSelection = (userId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedMembers(newSet);
  };

  // --- START DIRECT MESSAGE ---
  const handleStartDM = (targetUser: User) => {
      const dmChannelId = getDmChannelId(user.id, targetUser.id);
      
      // Add to manual list so it appears in sidebar immediately even if empty
      if (!manualDMs.includes(targetUser.id)) {
          setManualDMs(prev => [targetUser.id, ...prev]);
      }
      
      setActiveChannelId(dmChannelId);
      setIsNewChatModalOpen(false);
      setSearchTerm('');
      setShowMobileList(false);
  };

  const getChannelName = (id: string) => {
      if (id === 'GENERAL') return '📢 PENGUMUMAN ALL TEAM';
      
      const division = DIVISIONS.find(d => d.id === id);
      if (division) return `🔒 Divisi ${division.name}`;

      const group = groups.find(g => g.id === id);
      if (group) return `# ${group.name}`;
      
      // Check if it's a DM Channel ID (contains underscore, not starting with grp)
      if (id.includes('_') && !id.startsWith('grp_')) {
          const parts = id.split('_');
          const otherUserId = parts.find(p => p !== user.id);
          const otherUser = allUsers.find(u => u.id === otherUserId);
          return otherUser ? `👤 ${otherUser.name}` : 'Private Message';
      }

      return id;
  };

  const getChannelMembers = (channelId: string) => {
      // Group
      const group = groups.find(g => g.id === channelId);
      if (group) return allUsers.filter(u => group.memberIds.includes(u.id));
      
      // Division
      const division = DIVISIONS.find(d => d.id === channelId);
      if (division) return allUsers.filter(u => u.division === channelId);
      
      // DM Channel (e.g. u1_u2)
      if (channelId.includes('_') && !channelId.startsWith('grp_')) {
          const parts = channelId.split('_');
          return allUsers.filter(u => parts.includes(u.id));
      }

      return [];
  };

  // Determine visible channels
  const myGroups = groups.filter(g => g.memberIds.includes(user.id) || g.createdBy === user.id);
  
  // Filter users for selection (exclude self)
  const selectableUsers = allUsers.filter(u => u.id !== user.id && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.division.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const activeMembers = getChannelMembers(activeChannelId);

  const getLastMessage = (channelId: string) => {
      const channelMsgs = messages.filter(m => m.channelId === channelId);
      if (channelMsgs.length === 0) return { text: 'Belum ada pesan', time: '' };
      const last = channelMsgs[channelMsgs.length - 1];
      return { 
          text: last.content, 
          time: new Date(last.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
      };
  };

  return (
    <div className="flex h-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554] pb-16 md:pb-0">
      
      {/* KIRI: DAFTAR GRUP (30%) */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-white/5 flex-col bg-black/20 backdrop-blur-md`}>
        <div className="p-4 border-b border-white/5 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="MessageSquare" className="text-brand-400" /> Komunikasi Tim
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                    <Icon name="PenSquare" size={16} /> Pesan Baru
                </button>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
                >
                    <Icon name="Users" size={16} /> Buat Grup
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {/* 1. Grup Default (All Team) */}
            <button 
                onClick={() => handleChannelSelect('GENERAL')}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChannelId === 'GENERAL' ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0"><Icon name="Megaphone" size={20} /></div>
                <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200 truncate">PENGUMUMAN ALL TEAM</p>
                    <p className="text-[10px] text-gray-500 truncate">Saluran resmi kantor.</p>
                </div>
            </button>

            {/* 2. Channel Divisi */}
            <button 
                onClick={() => handleChannelSelect(user.division)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChannelId === user.division ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
                 <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                     <Icon name="Briefcase" size={18} />
                 </div>
                 <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200 truncate">{user.division}</p>
                    <p className="text-[10px] text-gray-500">Official Workspace</p>
                </div>
             </button>

            {/* 3. Grup Saya (Custom) */}
            <div className="pt-4 pb-2 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>Grup Saya</span>
                {myGroups.length > 0 && <span className="bg-white/10 px-1.5 rounded text-[9px]">{myGroups.length}</span>}
            </div>
            
            {myGroups.map(g => (
                 <button 
                    key={g.id}
                    onClick={() => handleChannelSelect(g.id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChannelId === g.id ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 font-bold text-xs shrink-0 ring-1 ring-white/10">
                        {g.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-200 truncate">{g.name}</p>
                        <p className="text-[10px] text-gray-500">{g.memberIds.length} anggota</p>
                    </div>
                </button>
            ))}
             {myGroups.length === 0 && <p className="text-xs text-gray-500 px-2 italic">Belum ada grup.</p>}

             {/* 4. Pesan Pribadi (Dynamic List based on History) */}
             <div className="pt-4 pb-2 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Pesan Pribadi</div>
             {activeDMUsers.map(dmUser => {
                 const dmChannelId = getDmChannelId(user.id, dmUser.id);
                 const lastInfo = getLastMessage(dmChannelId);
                 const isActive = activeChannelId === dmChannelId;

                 return (
                     <button
                        key={dmUser.id}
                        onClick={() => handleChannelSelect(dmChannelId)}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${isActive ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                     >
                         <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm relative">
                             {dmUser.name.charAt(0)}
                         </div>
                         <div className="text-left flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                <p className="text-sm font-bold text-gray-200 truncate">{dmUser.name}</p>
                                <span className="text-[9px] text-gray-500">{lastInfo.time}</span>
                             </div>
                             <p className={`text-[10px] truncate ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{lastInfo.text}</p>
                         </div>
                     </button>
                 );
             })}
             {activeDMUsers.length === 0 && <p className="text-xs text-gray-500 px-2 italic">Klik "Pesan Baru" untuk chat personal.</p>}

        </div>
      </div>

      {/* KANAN: AREA CHAT (70%) */}
      <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex flex-col bg-black/10 relative`}>
        
        {/* Chat Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-white/5 backdrop-blur-md shadow-sm z-10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button 
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                >
                    <Icon name="ChevronLeft" size={24} />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {activeChannelId === 'GENERAL' ? '#' : (activeChannelId.includes('_') ? '@' : activeChannelId.substring(0,2).toUpperCase())}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm md:text-lg font-bold text-white tracking-tight truncate">{getChannelName(activeChannelId)}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {isSearchOpen ? (
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 animate-[slideIn_0.2s]">
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Cari pesan..." 
                            className="bg-transparent border-none outline-none text-xs text-white w-24 md:w-48"
                            value={chatSearchTerm}
                            onChange={e => setChatSearchTerm(e.target.value)}
                        />
                        <button onClick={() => { setIsSearchOpen(false); setChatSearchTerm(''); }} className="text-gray-500 hover:text-white"><Icon name="X" size={14}/></button>
                    </div>
                ) : (
                    <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Icon name="Search" size={20} />
                    </button>
                )}
                
                <div className="hidden sm:flex -space-x-2 ml-2">
                    {activeMembers.length > 0 && (
                        <>
                            {activeMembers.slice(0, 3).map(u => (
                                <div key={u.id} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-[#0f172a] flex items-center justify-center text-[10px] md:text-xs text-gray-200 font-bold" title={u.name}>
                                    {u.name.charAt(0)}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Pinned Messages Bar (if any) */}
        {pinnedMessages.size > 0 && (
            <div className="bg-brand-500/10 border-b border-brand-500/20 px-4 py-2 flex items-center justify-between animate-[slideDown_0.3s]">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon name="Pin" size={14} className="text-brand-400 shrink-0" />
                    <p className="text-[10px] text-brand-300 font-bold uppercase tracking-wider truncate">
                        {pinnedMessages.size} Pesan Disematkan
                    </p>
                </div>
                <button onClick={() => setPinnedMessages(new Set())} className="text-[10px] text-gray-500 hover:text-white">Bersihkan</button>
            </div>
        )}

        {/* Messages Bubble Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-gradient-to-b from-transparent to-black/20">
             
             {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                    <div className="p-4 bg-white/5 rounded-full mb-3"><Icon name="MessageCircle" size={48} /></div>
                    <p className="text-sm">{chatSearchTerm ? 'Tidak ada pesan ditemukan' : 'Belum ada pesan. Sapa tim Anda!'}</p>
                </div>
             ) : (
                 currentMessages.map(msg => {
                     const isMe = msg.senderId === user.id;
                     const isPinned = pinnedMessages.has(msg.id);
                     return (
                         <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_0.2s] group`}>
                             <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed relative ${isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-gray-200 rounded-tl-sm border border-white/10'} ${isPinned ? 'ring-2 ring-brand-400/50' : ''}`}>
                                 {!isMe && <p className="text-[10px] font-bold text-brand-400 mb-1">{msg.senderName}</p>}
                                 <p className="whitespace-pre-wrap">{msg.content}</p>
                                 
                                 {/* Message Actions (Hover) */}
                                 <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10`}>
                                     <button onClick={() => togglePin(msg.id)} className={`p-1.5 rounded hover:bg-white/10 ${isPinned ? 'text-brand-400' : 'text-gray-400'}`} title="Sematkan">
                                         <Icon name="Pin" size={14} />
                                     </button>
                                     <button className="p-1.5 rounded hover:bg-white/10 text-gray-400" title="Balas">
                                         <Icon name="Reply" size={14} />
                                     </button>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2 mt-1 px-1">
                                 {isPinned && <Icon name="Pin" size={10} className="text-brand-400" />}
                                 <span className="text-[10px] text-gray-500 opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             </div>
                         </div>
                     );
                 })
             )}
             <div ref={chatEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-black/20 shrink-0">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto">
                <div className="relative flex items-end gap-2 bg-[#1e293b] border border-white/10 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-brand-500/50 transition-all">
                    <div className="flex items-center gap-1 pb-1">
                        <button type="button" className="p-2 text-gray-400 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5">
                            <Icon name="Plus" size={20} />
                        </button>
                        <button type="button" className="p-2 text-gray-400 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5">
                            <Icon name="Image" size={20} />
                        </button>
                    </div>
                    
                    <textarea 
                        rows={1}
                        placeholder={`Pesan ke ${getChannelName(activeChannelId)}...`}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2 px-1 resize-none custom-scrollbar max-h-32"
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e as any);
                            }
                        }}
                    />

                    <div className="flex items-center gap-1 pb-1">
                        <button type="button" className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-xl hover:bg-white/5">
                            <Icon name="Smile" size={20} />
                        </button>
                        {msgInput.trim() ? (
                            <button 
                                type="submit"
                                className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                            >
                                <Icon name="Send" size={20} />
                            </button>
                        ) : (
                            <button type="button" className="p-2 text-gray-400 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5">
                                <Icon name="Mic" size={20} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center opacity-50">
                    Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
                </p>
            </form>
        </div>
      </div>

      {/* MODAL: BUAT GRUP BARU */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
              <div className="bg-[#1e1e2e] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Icon name="Users" className="text-brand-400"/> Buat Grup Baru
                      </h3>
                      <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><Icon name="X" size={24}/></button>
                  </div>
                  <form onSubmit={handleCreateGroupSubmit} className="flex flex-col flex-1 overflow-hidden">
                      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Grup</label>
                              <div className="relative">
                                  <input 
                                      autoFocus
                                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-brand-500 transition-all placeholder-gray-600"
                                      placeholder="Contoh: Panitia Event 17an"
                                      value={newGroupName}
                                      onChange={e => setNewGroupName(e.target.value)}
                                  />
                                  <Icon name="Type" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                              </div>
                          </div>
                          <div className="flex-1 min-h-0 flex flex-col">
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                                  <span>Pilih Anggota Tim</span>
                                  <span className="text-brand-400">{selectedMembers.size} dipilih</span>
                              </label>
                              <div className="relative mb-3">
                                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                                  <input 
                                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-white/20"
                                      placeholder="Cari nama..."
                                      value={searchTerm}
                                      onChange={e => setSearchTerm(e.target.value)}
                                  />
                              </div>
                              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl p-2 bg-black/20">
                                  {selectableUsers.map(u => (
                                      <div key={u.id} onClick={() => toggleMemberSelection(u.id)} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${selectedMembers.has(u.id) ? 'bg-brand-500/20 border-brand-500/30' : 'hover:bg-white/5 border-transparent'}`}>
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.has(u.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-600 bg-black/40'}`}>
                                              {selectedMembers.has(u.id) && <Icon name="Check" size={12} className="text-white"/>}
                                          </div>
                                          <div className="flex-1"><p className={`text-sm font-medium ${selectedMembers.has(u.id) ? 'text-white' : 'text-gray-300'}`}>{u.name}</p><p className="text-[10px] text-gray-500">{u.division} • {u.role}</p></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                      <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                          <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Batal</button>
                          <button type="submit" disabled={!newGroupName || selectedMembers.size === 0} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"><Icon name="Check" size={16} /> Buat Grup</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL: START NEW CHAT (DM) */}
      {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
              <div className="bg-[#1e1e2e] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Icon name="MessageSquarePlus" className="text-brand-400"/> Pesan Baru
                      </h3>
                      <button onClick={() => setIsNewChatModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><Icon name="X" size={24}/></button>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col min-h-0">
                      <div className="relative mb-4 shrink-0">
                          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                          <input 
                              autoFocus
                              className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-brand-500 placeholder-gray-600"
                              placeholder="Cari anggota tim..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider px-2 mb-2">Anggota Tim</p>
                          {selectableUsers.length === 0 && <p className="text-center text-sm text-gray-500 py-8">Tidak ada user ditemukan.</p>}
                          {selectableUsers.map(u => (
                              <button 
                                key={u.id}
                                onClick={() => handleStartDM(u)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 text-left group"
                              >
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:ring-2 ring-brand-500/50 transition-all">
                                      {u.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-200 group-hover:text-white truncate">{u.name}</p>
                                      <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">{u.division} • {u.role}</p>
                                  </div>
                                  <Icon name="ChevronRight" size={16} className="text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};