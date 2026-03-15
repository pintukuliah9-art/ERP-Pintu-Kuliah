
import React, { useState, useEffect } from 'react';
import { User, ActivityLog, UserPreferences, Announcement } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { translations, LanguageCode } from '../translations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (u: User) => void;
  announcements: Announcement[];
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser, announcements, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'activity' | 'notifications'>('overview');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const [editNote, setEditNote] = useState(user.stickyNote);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Get translations
  const t = translations[preferences.language as LanguageCode] || translations.en;

  useEffect(() => {
    if (isOpen) {
      setActivityLogs(StorageService.getActivityLogs());
      setPreferences(StorageService.getPreferences());
      // Reset password fields
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (preferences.theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    StorageService.savePreferences(preferences);
  }, [preferences.theme]);

  const handleSaveNote = () => {
      const updated = { ...user, stickyNote: editNote };
      onUpdateUser(updated);
      setIsEditingNote(false);
      StorageService.logActivity('Updated Profile', 'Changed sticky note');
  };

  const handleTogglePref = (key: keyof UserPreferences) => {
      setPreferences(prev => {
          const updated = { ...prev, [key]: !prev[key] };
          if (key === 'theme') {
              updated.theme = prev.theme === 'dark' ? 'light' : 'dark';
          }
          StorageService.savePreferences(updated);
          return updated;
      });
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword) return;
      
      if (newPassword !== confirmPassword) {
          alert(t.settings.passwordMismatch);
          return;
      }

      onUpdateUser({
          ...user,
          password: newPassword
      });
      
      setNewPassword('');
      setConfirmPassword('');
      alert(t.settings.passwordUpdated);
      StorageService.logActivity('Security', 'Password changed');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-[scaleIn_0.1s_ease-out] border border-white/10">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 p-4 flex flex-col gap-1 shrink-0">
            <div className="flex flex-col items-center mb-6 pt-4">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/10 mb-3">
                    {user.name.charAt(0)}
                 </div>
                 <h2 className="text-lg font-bold text-gray-800 dark:text-white">{user.name}</h2>
                 <p className="text-xs text-gray-500">{user.role}</p>
                 <span className="mt-2 px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase rounded-full tracking-wider border border-brand-500/20">
                    {user.division}
                 </span>
            </div>
            
            <nav className="space-y-1">
                <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5'}`}>
                    <Icon name="User" size={18} /> {t.profileModal.overview}
                </button>
                <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'activity' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5'}`}>
                    <Icon name="History" size={18} /> {t.profileModal.activity}
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5'}`}>
                    <Icon name="Bell" size={18} /> {t.profileModal.notifications}
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5'}`}>
                    <Icon name="Settings" size={18} /> {t.profileModal.preferences}
                </button>
                <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5'}`}>
                    <Icon name="Lock" size={18} /> {t.profileModal.security}
                </button>
            </nav>

            <div className="mt-auto pt-4 space-y-2">
                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-500/20">
                    <Icon name="LogOut" size={18} /> {t.profileModal.logout}
                </button>
                 <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors justify-center">
                    {t.profileModal.close}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-dark-card relative">
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white md:hidden">
                <Icon name="X" size={24} />
            </button>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar h-full">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t.profileModal.overview}</h3>
                    
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.profileModal.stickyNote}</label>
                             {!isEditingNote ? (
                                 <button onClick={() => setIsEditingNote(true)} className="text-xs text-brand-500 hover:underline">{t.profileModal.editNote}</button>
                             ) : (
                                 <button onClick={handleSaveNote} className="text-xs text-green-500 hover:underline font-bold">{t.profileModal.saveNote}</button>
                             )}
                        </div>
                        {isEditingNote ? (
                            <textarea 
                                className="w-full p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 text-gray-800 dark:text-yellow-100 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                                rows={3}
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                            />
                        ) : (
                            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30">
                                <p className="text-sm text-gray-800 dark:text-yellow-100 italic">"{user.stickyNote}"</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500">{t.profileModal.lastLogin}</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">Just Now</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500">{t.profileModal.accountStatus}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{t.profileModal.active}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <div className="p-0 h-full flex flex-col">
                    <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 shrink-0">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.profileModal.activity}</h3>
                        <p className="text-sm text-gray-500">Recent actions performed on your account.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
                        {activityLogs.map((log, index) => (
                            <div key={log.id} className="flex gap-4 relative">
                                {index !== activityLogs.length - 1 && (
                                    <div className="absolute left-[9px] top-8 bottom-[-24px] w-[2px] bg-gray-100 dark:bg-white/5"></div>
                                )}
                                <div className="mt-1 w-5 h-5 rounded-full bg-brand-500/20 border-2 border-brand-500 shrink-0 z-10"></div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{log.action}</p>
                                    <p className="text-xs text-gray-500">{log.details}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
             {activeTab === 'notifications' && (
                <div className="p-0 h-full flex flex-col">
                    <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 shrink-0">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.profileModal.notifications}</h3>
                        <p className="text-sm text-gray-500">History of system announcements.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-3">
                         {announcements.map(ann => (
                            <div key={ann.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ann.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{ann.priority}</span>
                                    <span className="text-xs text-gray-400">{ann.date}</span>
                                </div>
                                <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{ann.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{ann.content}</p>
                            </div>
                         ))}
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar h-full">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t.profileModal.preferences}</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Icon name="Moon" size={20} /></div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Dark Mode</p>
                                    <p className="text-xs text-gray-500">Toggle application theme</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleTogglePref('theme')}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.theme === 'dark' ? 'bg-brand-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Icon name="Mail" size={20} /></div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Email Notifications</p>
                                    <p className="text-xs text-gray-500">Receive weekly summaries</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleTogglePref('emailNotifications')}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.emailNotifications ? 'bg-brand-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.emailNotifications ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                         <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Icon name="Volume2" size={20} /></div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Sound Effects</p>
                                    <p className="text-xs text-gray-500">Play sounds on interactions</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleTogglePref('soundEnabled')}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.soundEnabled ? 'bg-brand-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${preferences.soundEnabled ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                        <p className="text-xs text-gray-500 mb-4">Version 1.2.0 • Build 2023.10.25</p>
                    </div>
                </div>
            )}
            
            {/* Security Tab */}
             {activeTab === 'security' && (
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar h-full animate-[fadeIn_0.3s]">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t.settings.security}</h3>
                    
                     <div className="glass-card p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="Lock" size={20} className="text-brand-500" />
                            <h4 className="font-bold text-gray-800 dark:text-white">{t.settings.changePassword}</h4>
                        </div>
                        
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.newPassword}</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none pr-10"
                                        placeholder="********"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.confirmPassword}</label>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="********"
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={!newPassword || newPassword !== confirmPassword}
                                    className="w-full px-6 py-2 bg-gray-800 hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t.settings.changePassword}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
             )}

        </div>
      </div>
    </div>
  );
};
