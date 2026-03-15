
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { DIVISIONS } from '../constants';
import { Icon } from './Icon';
import { translations, LanguageCode } from '../translations';

interface SidebarProps {
  user: User;
  lang: LanguageCode;
  onLogout: () => void;
  onOpenProfile: () => void;
  divisions: any[];
}

const SidebarItem: React.FC<{ to: string; icon: string; label: string; active?: boolean; isSubItem?: boolean }> = ({ to, icon, label, active, isSubItem }) => (
    <Link to={to} className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${active ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'} ${isSubItem ? 'xl:py-2 xl:px-3' : ''}`}>
        <div className="relative"><Icon name={icon} size={isSubItem ? 18 : 20} className={active ? "text-brand-400" : ""} />{active && !isSubItem && <div className="absolute inset-0 bg-brand-400 blur-lg opacity-40"></div>}</div>
        <span className={`hidden xl:block text-sm font-medium ${isSubItem ? 'text-xs' : ''}`}>{label}</span>
        <div className="xl:hidden absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-xl">{label}</div>
    </Link>
);

export const ResponsiveSidebar: React.FC<SidebarProps> = ({ user, lang, onLogout, onOpenProfile, divisions }) => {
  const location = useLocation(); 
  const isActive = (path: string) => location.pathname === path;
  const [isDivisionsExpanded, setIsDivisionsExpanded] = useState(false);
  const t = translations[lang] || translations.en;
  
  useEffect(() => { 
      if (location.pathname.includes('/division/')) setIsDivisionsExpanded(true); 
  }, [location.pathname]);
  
  const visibleDivisions = useMemo(() => { 
      const activeDivs = divisions.filter(d => d.status === 'Aktif');
      if (user.role === UserRole.ADMIN) return activeDivs; 
      return activeDivs.filter(d => d.id === user.division); 
  }, [user, divisions]);

  return (
    <aside className="hidden md:flex flex-col h-full bg-[#0b1120]/40 backdrop-blur-xl border-r border-white/5 transition-all duration-300 md:w-20 xl:w-64 z-50">
      <div className="h-20 flex items-center justify-center xl:justify-start xl:px-6 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
            <Icon name="GraduationCap" size={24} />
          </div>
          <span className="hidden xl:block ml-3 font-bold text-lg text-white tracking-tight">Pintu Kuliah</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3 custom-scrollbar">
          <SidebarItem to="/" icon="LayoutGrid" label={t.sidebar.dashboard} active={isActive('/')} />
          
          <div className="h-px bg-white/5 my-2 mx-2"></div>
          
          {/* Menu Pesan - Di bawah Dashboard */}
          <SidebarItem to="/messages" icon="MessageSquare" label="Pesan" active={isActive('/messages')} />

          <div className="h-px bg-white/5 my-2 mx-2"></div>
          
          <div>
              <button onClick={() => setIsDivisionsExpanded(!isDivisionsExpanded)} className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-200 select-none ${isDivisionsExpanded ? 'text-white bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                      <div className="relative"><Icon name="Layers" size={20} className={isDivisionsExpanded ? "text-brand-400" : ""} />{isDivisionsExpanded && <div className="absolute inset-0 bg-brand-400 blur-lg opacity-20"></div>}</div>
                      <span className="hidden xl:block text-sm font-medium">{t.sidebar.divisions}</span>
                  </div>
                  <Icon name="ChevronDown" size={16} className={`hidden xl:block transition-transform duration-300 ${isDivisionsExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDivisionsExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col gap-1 xl:pl-4">
                      {visibleDivisions.map(div => (<SidebarItem key={div.id} to={`/division/${div.id}`} icon={div.icon} label={div.name} active={isActive(`/division/${div.id}`)} isSubItem={true}/>))}
                  </div>
              </div>
          </div>
          
          <div className="h-px bg-white/5 my-2 mx-2"></div>
          
          <SidebarItem to="/settings" icon="Settings" label={t.sidebar.settings} active={isActive('/settings')} />
      </nav>
      <div className="p-4 border-t border-white/5 shrink-0">
          <div onClick={onOpenProfile} className="flex items-center justify-between gap-2 xl:bg-white/5 xl:p-3 xl:rounded-xl xl:border xl:border-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md shrink-0 group-hover:ring-2 group-hover:ring-brand-500/50 transition-all">{user.name.charAt(0)}</div>
                  <div className="hidden xl:block min-w-0"><p className="text-sm font-medium text-white truncate group-hover:text-brand-400 transition-colors">{user.name}</p><p className="text-xs text-gray-400 truncate">{user.role}</p></div>
              </div>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogout(); }} className="hidden xl:block text-gray-500 hover:text-red-400 transition-colors" title="Logout"><Icon name="LogOut" size={16} /></button>
          </div>
      </div>
    </aside>
  );
};
