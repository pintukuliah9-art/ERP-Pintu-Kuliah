
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tool, User, DivisionType, DivisionData, Announcement, AttendanceRecord, UserRole, ToolCategory } from '../types';
import { DIVISIONS } from '../constants';
import { Icon } from './Icon';
import { ToolCard } from './ToolCard';
import { CollaborationPanel } from './CollaborationPanel';
import { translations, LanguageCode } from '../translations';
import { StorageService } from '../services/storageService';

interface DashboardProps {
  tools: Tool[];
  user: User;
  handleToolClick: (tool: Tool) => void;
  onContextMenu: (e: any, tool: Tool) => void;
  onSelect: (tool: Tool) => void;
  onAddTool: (tool: any) => void;
  onUpdateTool: (tool: Partial<Tool>) => void;
  onDeleteTool: (toolId: string) => void;
  setNotification: (msg: string) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  setSmartAddContext: (ctx: string | null) => void;
  onOpenAttendance: () => void;
  onOpenProfile: () => void;
  
  lang: LanguageCode;
  todayAttendance?: AttendanceRecord;
  unreadAnnouncements: number;
  
  announcements: Announcement[];
  messages: any[];
  onSendMessage: (msg: string) => void;
  
  activeChannel: string;
  onChangeChannel: (id: string) => void;
  
  // Passed from App
  dashboardDivisions: DivisionData[];
  groups: any[]; // Chat groups
}

// --- HELPER COMPONENTS ---
const ActionZoneCard: React.FC<{ 
    label: string; 
    subLabel?: string; 
    icon: string; 
    color: string; 
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isActive?: boolean;
    isDisabled?: boolean;
}> = ({ label, subLabel, icon, color, onClick, onContextMenu, isActive, isDisabled }) => {
    const colorClasses: Record<string, string> = {
        emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20',
        violet: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/20',
        amber: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20',
        blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/20',
        slate: 'from-white/5 to-white/5 text-gray-400 border-white/10'
    };

    const iconColors: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-400',
        violet: 'bg-violet-500/20 text-violet-400',
        amber: 'bg-amber-500/20 text-amber-400',
        blue: 'bg-blue-500/20 text-blue-400',
        slate: 'bg-white/10 text-gray-400'
    };

    return (
        <button 
            onClick={isDisabled ? undefined : onClick}
            onContextMenu={onContextMenu}
            className={`group relative overflow-hidden p-4 md:p-6 rounded-3xl border transition-all duration-200 active:scale-95 flex flex-col items-start text-left bg-gradient-to-br ${colorClasses[color] || colorClasses.slate} hover:border-white/30 shadow-xl w-full h-full
                ${isDisabled ? 'opacity-40 grayscale-[0.8] cursor-not-allowed' : ''}
            `}
        >
            <div className={`p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 ${iconColors[color] || iconColors.slate}`}>
                <Icon name={icon} size={24} />
            </div>
            
            <div className="space-y-1">
                <h3 className="font-black text-sm md:text-base tracking-tight text-white uppercase">{label}</h3>
                {isDisabled ? (
                    <p className="text-[10px] md:text-xs font-black text-red-500 uppercase tracking-tighter">Disabled</p>
                ) : subLabel ? (
                    <p className="text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-widest">{subLabel}</p>
                ) : (
                    <p className="text-[10px] md:text-xs font-medium opacity-40 uppercase tracking-widest">Akses Cepat</p>
                )}
            </div>

            {isActive && !isDisabled && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Active</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
            )}
            
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
        </button>
    );
};

const SummaryBar: React.FC<{ toolCount: number, labelOverview: string, labelTools: string, labelOnline: string }> = ({ toolCount, labelOverview, labelTools, labelOnline }) => (
    <div className="flex items-center justify-between px-6 py-2 glass-card rounded-xl mb-6 border border-white/5">
        <span className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-widest">{labelOverview}</span>
        <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">{labelTools}: <span className="text-white text-sm font-mono">{toolCount}</span></span>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span><span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{labelOnline}</span></div>
        </div>
    </div>
);

const DivisionAccordion: React.FC<any> = ({ division, tools, onViewAll }) => ( 
    <div className="mb-3 rounded-2xl overflow-hidden glass-card border border-white/5">
        <button onClick={onViewAll} className="w-full flex items-center justify-between p-4 bg-white/5 active:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-300 shadow-inner border border-white/10"><Icon name={division.icon} size={16} /></div>
                <span className="font-semibold text-gray-200 text-sm">{division.name}</span>
            </div>
            <div className="flex items-center gap-3"><span className="text-[10px] text-gray-500 bg-black/30 px-2 py-0.5 rounded-full">{tools.length} Tools</span><Icon name="ChevronRight" size={16} className={`text-gray-500 transition-transform duration-300`} /></div>
        </button>
    </div>
);

const GlassDivisionCard: React.FC<{ 
    division: DivisionData; tools: Tool[]; onViewAll: () => void; onToolClick: (tool: Tool) => void; onContextMenu: (e: any, tool: Tool) => void; onSelect: (tool: Tool) => void; onSmartAdd: () => void; onMirrorDrop: (toolId: string, targetDivisionId: string) => void; isSelectionMode: boolean; selectedIds: Set<string>; viewLabel: string; canAdd: boolean;
}> = ({ division, tools, onViewAll, onToolClick, onContextMenu, onSelect, onSmartAdd, onMirrorDrop, isSelectionMode, selectedIds, viewLabel, canAdd }) => { 
    const [isDragOver, setIsDragOver] = useState(false); 
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if(canAdd) setIsDragOver(true); }; 
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); if(!canAdd) return; const toolId = e.dataTransfer.getData("text/plain"); const sourceDiv = e.dataTransfer.getData("application/source-division"); if (sourceDiv !== division.id && toolId) onMirrorDrop(toolId, division.id); }; 
    return (
        <div 
            onDragOver={handleDragOver} 
            onDragLeave={() => setIsDragOver(false)} 
            onDrop={handleDrop} 
            className={`glass-card rounded-2xl flex flex-col h-full min-h-[300px] transition-all duration-300 group relative overflow-hidden border border-white/5 ${isDragOver ? 'ring-2 ring-brand-400 bg-brand-500/10 scale-[1.02]' : 'hover:bg-white/10'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 relative z-10 shrink-0">
                <div onClick={onViewAll} className="flex items-center gap-3 cursor-pointer">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-gray-400 group-hover:text-brand-400 group-hover:border-brand-500/30 transition-colors duration-300 shadow-lg">
                        <Icon name={division.icon} size={20} />
                    </div>
                    <h3 className="font-bold text-gray-200 text-sm tracking-wide">{division.name}</h3>
                </div>
                {canAdd && (
                    <button onClick={(e) => {e.stopPropagation(); onSmartAdd();}} className="text-gray-600 hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 bg-white/5 p-1.5 rounded-lg">
                        <Icon name="Plus" size={16} />
                    </button>
                )}
            </div>

            {/* Content List - VERTICAL LIST */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-2">
                {tools.length === 0 && <p className="text-center text-xs text-gray-600 italic py-10">No tools added.</p>}
                {tools.map(tool => (
                    <div key={tool.id} draggable={!tool.isLocked} onDragStart={(e) => { if(tool.isLocked) return; e.dataTransfer.setData("text/plain", tool.id); e.dataTransfer.setData("application/source-division", division.id); }}>
                        <button
                            onClick={() => onToolClick(tool)}
                            onContextMenu={(e) => onContextMenu(e, tool)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group/btn shadow-sm relative overflow-hidden
                                ${selectedIds.has(tool.id) 
                                    ? 'bg-brand-500/20 ring-1 ring-brand-500' 
                                    : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 hover:scale-[1.02] active:scale-95'
                                }
                                ${tool.isDisabled ? 'opacity-40 grayscale-[0.8] cursor-not-allowed' : ''}
                            `}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Color Coded Icon Box */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.color || 'bg-gray-700'} text-white shadow-sm shrink-0 shadow-black/20`}>
                                    <Icon name={tool.icon || 'Link'} size={16} />
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className={`text-sm font-semibold truncate ${selectedIds.has(tool.id) ? 'text-brand-300' : 'text-gray-300 group-hover/btn:text-white'}`}>
                                        {tool.name}
                                    </span>
                                    {tool.isDisabled && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Disabled</span>}
                                </div>
                            </div>
                            
                            {/* Selection Check or Chevron */}
                            {isSelectionMode ? (
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.has(tool.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-500'}`}>
                                    {selectedIds.has(tool.id) && <Icon name="Check" size={12} className="text-white"/>}
                                </div>
                            ) : (
                                <Icon name="ChevronRight" size={14} className="text-gray-600 group-hover/btn:text-white transition-colors opacity-0 group-hover/btn:opacity-100" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none z-20 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onViewAll} className="pointer-events-auto px-4 py-1.5 rounded-full bg-white/10 hover:bg-brand-600 text-[10px] text-white font-bold uppercase tracking-widest backdrop-blur-md transition-colors shadow-lg border border-white/10 flex items-center gap-2">
                    {viewLabel} <Icon name="ArrowRight" size={10} />
                </button>
            </div>
        </div>
    ); 
};

// --- MAIN DASHBOARD COMPONENT ---

export const Dashboard = React.memo<DashboardProps>(({ 
    tools = [], user, handleToolClick, onContextMenu, onSelect, onAddTool, onUpdateTool, onDeleteTool, setNotification, isSelectionMode, selectedIds, 
    setSmartAddContext, onOpenAttendance, onOpenProfile, lang, todayAttendance, unreadAnnouncements = 0, 
    announcements = [], messages = [], onSendMessage, activeChannel = 'GENERAL', onChangeChannel,
    dashboardDivisions = [], groups = []
}) => {
    const navigate = useNavigate(); 
    const t = translations[lang] || translations.en; 
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- STATE UI ---
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState<'chat' | 'announcements' | 'links'>('chat');

    const hasEditPermission = (divId: DivisionType) => 
        user.role === UserRole.ADMIN || (user.role === UserRole.MANAGER && user.division === divId);

    const openPanel = (tab: 'chat' | 'announcements' | 'links') => {
        setPanelTab(tab);
        setIsPanelOpen(true);
    };

    // --- ACCESS CONTROL: DISPLAYED DIVISIONS ---
    const displayedDivisions = useMemo(() => {
        if (user.role === UserRole.ADMIN) {
            return dashboardDivisions;
        } else {
            // Non-Admin sees ONLY their own division
            return dashboardDivisions.filter(d => d.id === user.division);
        }
    }, [user, dashboardDivisions]);

    // --- ACCESS CONTROL: FILTERED TOOLS ---
    const filteredTools = useMemo(() => { 
        // 1. Strict Permission Filter First
        let allowedTools = tools.filter(t => !t.deletedAt);
        if (user.role !== UserRole.ADMIN) {
            // Allow tools explicitly belonging to user's division OR Global/Shared tools (null/undefined divisionId)
            allowedTools = allowedTools.filter(t => t.divisionId === user.division || !t.divisionId);
        }

        // 2. Search Filter Second
        if (!searchTerm) return allowedTools;
        const lowerTerm = searchTerm.toLowerCase();
        
        return allowedTools.filter((t: Tool) => 
            t.name.toLowerCase().includes(lowerTerm) || 
            t.category.toLowerCase().includes(lowerTerm) ||
            (t.description && t.description.toLowerCase().includes(lowerTerm))
        ); 
    }, [tools, searchTerm, user]);

    const handleMirrorTool = (toolId: string, targetDivisionId: string) => { 
        const originalTool = tools.find((t: Tool) => t.id === toolId); 
        if (!originalTool) return; 
        if (originalTool.divisionId === targetDivisionId) { setNotification("Already in this division"); return; } 
        onAddTool({ ...originalTool, id: `t_${Date.now()}_mirror`, divisionId: targetDivisionId as DivisionType, lastAccessed: 0, isLocked: false }); 
        setNotification(`Mirrored to ${targetDivisionId}`); 
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554]">
            
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-6 shrink-0 z-20">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="md:hidden flex flex-col">
                        <h1 className="text-xl font-black text-white tracking-tighter leading-none">STIS-DU</h1>
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest leading-none mt-1">Satu Pintu</span>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="hidden md:block relative group w-64 xl:w-96">
                        <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input type="text" placeholder={t.dashboard.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 shadow-lg backdrop-blur-sm transition-all focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => setIsPanelOpen(true)} className="p-2.5 bg-white/5 rounded-full relative hover:bg-white/10 transition-all active:scale-95">
                        <Icon name="Bell" size={20} className="text-gray-400"/>
                        {unreadAnnouncements > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></div>}
                    </button>
                    <button 
                        onClick={onOpenProfile} 
                        className="flex items-center gap-3 md:pl-4 md:border-l md:border-white/10 hover:bg-white/5 p-1 md:p-1 rounded-xl transition-all group active:scale-95"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">{user.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user.role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/20 ring-2 ring-white/10 group-hover:ring-brand-500/50 transition-all">
                            {user.name.charAt(0)}
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 px-4 md:px-8 pb-32 md:pb-8 overflow-y-auto md:overflow-hidden relative custom-scrollbar">
                <div className="flex-1 flex flex-col md:min-h-0 max-w-7xl mx-auto w-full">
                    
                    {/* Mobile Search Bar */}
                    <div className="md:hidden relative w-full mb-6 shrink-0 px-2">
                        <div className="relative">
                            <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                placeholder={t.dashboard.searchPlaceholder} 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 shadow-lg backdrop-blur-md transition-all focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 shrink-0 px-2 md:px-0">
                        {(() => {
                            const t = tools.find(t => t.id === 'sys_attendance');
                            if (!t || t.deletedAt) return null;
                            return (
                                <ActionZoneCard 
                                    label={t.name} 
                                    subLabel={todayAttendance ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined} 
                                    icon={todayAttendance ? "Clock" : (t.icon as any || "Fingerprint")} 
                                    color={todayAttendance ? "emerald" : (t.color?.replace('bg-', '').replace('-500', '') as any || "slate")} 
                                    isActive={!!todayAttendance} 
                                    isDisabled={t.isDisabled}
                                    onClick={onOpenAttendance} 
                                    onContextMenu={(e) => onContextMenu(e, t)}
                                />
                            );
                        })()}
                        {(() => {
                            const t = tools.find(t => t.id === 'sys_chat');
                            if (!t || t.deletedAt) return null;
                            return (
                                <ActionZoneCard 
                                    label={t.name} 
                                    icon={t.icon as any || "MessageSquare"} 
                                    color={t.color?.replace('bg-', '').replace('-500', '') as any || "violet"} 
                                    isDisabled={t.isDisabled}
                                    onClick={() => openPanel('chat')} 
                                    onContextMenu={(e) => onContextMenu(e, t)}
                                />
                            );
                        })()}
                        {(() => {
                            const t = tools.find(t => t.id === 'sys_tasks');
                            if (!t || t.deletedAt) return null;
                            return (
                                <ActionZoneCard 
                                    label={t.name} 
                                    subLabel="Kelola Link"
                                    icon={t.icon as any || "Link2"} 
                                    color={t.color?.replace('bg-', '').replace('-500', '') as any || "amber"} 
                                    isDisabled={t.isDisabled}
                                    onClick={() => openPanel('links')}
                                    onContextMenu={(e) => onContextMenu(e, t)}
                                />
                            );
                        })()}
                        {(() => {
                            const t = tools.find(t => t.id === 'sys_profile');
                            if (!t || t.deletedAt) return null;
                            return (
                                <ActionZoneCard 
                                    label={t.name} 
                                    icon={t.icon as any || "User"} 
                                    color={t.color?.replace('bg-', '').replace('-500', '') as any || "blue"} 
                                    isDisabled={t.isDisabled}
                                    onClick={onOpenProfile} 
                                    onContextMenu={(e) => onContextMenu(e, t)}
                                />
                            );
                        })()}
                    </div>
                    
                    <SummaryBar toolCount={tools.length} labelOverview={user.role === UserRole.ADMIN ? t.dashboard.systemOverview : `${DIVISIONS.find(d => d.id === user.division)?.name || 'My'} Workspace`} labelTools={t.dashboard.tools} labelOnline={t.dashboard.online} />
                    
                    <div className="flex-1 md:min-h-0 flex flex-col">
                        <div className="flex-1 md:overflow-y-auto custom-scrollbar md:pr-2 pb-10">
                            <div className="md:hidden flex flex-col gap-2">
                                {displayedDivisions.map((div: DivisionData) => {
                                    const divTools = filteredTools.filter((t: Tool) => t.divisionId === div.id);
                                    if (searchTerm && divTools.length === 0) return null;
                                    return <DivisionAccordion key={div.id} division={div} tools={divTools} onViewAll={() => navigate(`/division/${div.id}`)} />;
                                })}
                            </div>
                            <div className={`hidden md:grid gap-6 ${displayedDivisions.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                                {displayedDivisions.map((div: DivisionData) => (
                                    <div key={div.id} className={`h-full transition-all duration-500 ${div.id === user.division ? 'ring-2 ring-brand-500/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)]' : ''}`}>
                                        <GlassDivisionCard 
                                            division={div} 
                                            tools={filteredTools.filter((t: Tool) => t.divisionId === div.id)} 
                                            onViewAll={() => navigate(`/division/${div.id}`)} 
                                            onToolClick={handleToolClick} 
                                            onContextMenu={onContextMenu} 
                                            onSelect={onSelect} 
                                            onSmartAdd={() => setSmartAddContext(div.id)} 
                                            onMirrorDrop={handleMirrorTool} 
                                            isSelectionMode={isSelectionMode} 
                                            selectedIds={selectedIds} 
                                            viewLabel={t.dashboard.viewDivision} 
                                            canAdd={hasEditPermission(div.id)} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CollaborationPanel 
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                user={user}
                divisions={dashboardDivisions} 
                announcements={announcements}
                messages={messages}
                onSendMessage={onSendMessage}
                activeChannel={activeChannel}
                onChangeChannel={onChangeChannel}
                groups={groups}
                tools={tools}
                onUpdateTool={onUpdateTool}
                onDeleteTool={onDeleteTool}
                onAddTool={onAddTool}
                initialTab={panelTab}
            />

            <div className="h-10"></div>
        </div>
    );
});
