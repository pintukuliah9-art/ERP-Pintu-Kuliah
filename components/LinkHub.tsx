
import React, { useState, useMemo } from 'react';
import { Tool, DivisionType, ToolCategory, User, UserRole } from '../types';
import { Icon } from './Icon';
import { DIVISIONS } from '../constants';

interface LinkHubProps {
    tools: Tool[];
    user: User;
    onUpdateTool: (tool: Partial<Tool>) => void;
    onDeleteTool: (toolId: string) => void;
    onAddTool: (tool: any) => void;
}

export const LinkHub: React.FC<LinkHubProps> = ({ tools, user, onUpdateTool, onDeleteTool, onAddTool }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivision, setFilterDivision] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'accessed' | 'division'>('name');

    const filteredTools = useMemo(() => {
        return tools
            .filter(t => !t.deletedAt)
            .filter(t => {
                const searchStr = `${t.name} ${t.description || ''} ${t.url} ${t.category}`.toLowerCase();
                const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
                const matchesDivision = filterDivision === 'ALL' || t.divisionId === filterDivision;
                return matchesSearch && matchesDivision;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'accessed') return (b.lastAccessed || 0) - (a.lastAccessed || 0);
                if (sortBy === 'division') return (a.divisionId || '').localeCompare(b.divisionId || '');
                return 0;
            });
    }, [tools, searchTerm, filterDivision, sortBy]);

    const topLinks = useMemo(() => {
        return [...tools]
            .filter(t => !t.deletedAt && t.lastAccessed)
            .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
            .slice(0, 3);
    }, [tools]);

    const canManage = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

    return (
        <div className="flex flex-col h-full bg-[#020617] text-white">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Icon name="Link2" className="text-brand-400" size={24} />
                            Link Hub
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Kelola semua tautan dan tombol akses cepat di seluruh divisi.</p>
                    </div>
                    {canManage && (
                        <button 
                            onClick={() => onAddTool({ divisionId: 'GENERAL', category: ToolCategory.DAILY })}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand-900/20"
                        >
                            <Icon name="Plus" size={18} />
                            Tambah Link Baru
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari nama, deskripsi, kategori, atau URL..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm outline-none focus:border-brand-500 transition-all"
                        />
                    </div>
                    
                    <select 
                        value={filterDivision}
                        onChange={(e) => setFilterDivision(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
                    >
                        <option value="ALL">Semua Divisi</option>
                        {DIVISIONS.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                        <button 
                            onClick={() => setSortBy('name')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all ${sortBy === 'name' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Nama
                        </button>
                        <button 
                            onClick={() => setSortBy('accessed')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all ${sortBy === 'accessed' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Terakhir
                        </button>
                        <button 
                            onClick={() => setSortBy('division')}
                            className={`px-3 py-1 text-xs rounded-lg transition-all ${sortBy === 'division' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Divisi
                        </button>
                    </div>
                </div>
            </div>

            {/* Link List */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Top Links Section */}
                {!searchTerm && filterDivision === 'ALL' && topLinks.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-brand-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Icon name="Zap" size={14} /> Sering Diakses
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topLinks.map(tool => (
                                <button 
                                    key={`top-${tool.id}`}
                                    onClick={() => window.open(tool.url, '_blank')}
                                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-brand-500/30 transition-all text-left group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color || 'from-brand-500 to-brand-700'} shadow-lg shrink-0`}>
                                        <Icon name={tool.icon || 'Link'} size={20} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate group-hover:text-brand-400 transition-colors">{tool.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                            {DIVISIONS.find(d => d.id === tool.divisionId)?.name || tool.divisionId}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Semua Link</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTools.map(tool => (
                        <div key={tool.id} className="group glass-card rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color || 'from-brand-500 to-brand-700'} shadow-lg`}>
                                        <Icon name={tool.icon || 'Link'} size={20} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate pr-2">{tool.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                                {DIVISIONS.find(d => d.id === tool.divisionId)?.name || tool.divisionId}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                            <span className="text-[10px] text-gray-500">{tool.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => window.open(tool.url, '_blank')}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-brand-400 transition-colors"
                                        title="Buka Link"
                                    >
                                        <Icon name="ExternalLink" size={14} />
                                    </button>
                                    {canManage && (
                                        <>
                                            <button 
                                                onClick={() => onUpdateTool(tool)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                                                title="Edit"
                                            >
                                                <Icon name="Edit2" size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteTool(tool.id)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                title="Hapus"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {tool.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                    {tool.description}
                                </p>
                            )}

                            <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                    <Icon name="Clock" size={10} />
                                    <span>{tool.lastAccessed ? `Terakhir: ${new Date(tool.lastAccessed).toLocaleDateString()}` : 'Belum pernah dibuka'}</span>
                                </div>
                                <button 
                                    onClick={() => onUpdateTool({ ...tool, isLocked: !tool.isLocked })}
                                    className={`p-1 rounded-md transition-colors ${tool.isLocked ? 'text-amber-500 bg-amber-500/10' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    <Icon name={tool.isLocked ? 'Lock' : 'Unlock'} size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTools.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Icon name="SearchX" size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-400">Tidak ada link ditemukan</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-2">Coba ubah kata kunci pencarian atau filter divisi Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
