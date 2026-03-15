
import React, { useState, useEffect } from 'react';
import { DIVISIONS } from '../constants';
import { DivisionType, User } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { translations, LanguageCode } from '../translations';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loginMode, setLoginMode] = useState<'DIVISION' | 'ADMIN' | null>(null);
  
  const [selectedDivision, setSelectedDivision] = useState<DivisionType | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Search State
  const [userSearch, setUserSearch] = useState('');

  // Admin Login Inputs
  const [adminUsername, setAdminUsername] = useState('');
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Preferences for Language
  const prefs = StorageService.getPreferences();
  const t = translations[prefs.language as LanguageCode] || translations.en;

  useEffect(() => {
    setUsers(StorageService.getUsers());
  }, []);

  const handleDivisionClick = (divId: DivisionType) => {
    setLoginMode('DIVISION');
    setSelectedDivision(divId);
    setStep(2);
    setError('');
    setUserSearch(''); // Reset search
  };

  const handleAdminModeClick = () => {
      setLoginMode('ADMIN');
      setStep(3); // Jump to credentials directly
      setAdminUsername('');
      setPassword('');
      setError('');
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setStep(3);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginMode === 'ADMIN') {
        const loggedIn = StorageService.login(adminUsername, password);
        if (loggedIn) {
            onLogin(loggedIn);
        } else {
            setError('Invalid Admin credentials.');
        }
    } else {
        // Division Mode (Employee)
        // Login Logic: Passwordless for employees to speed up operations.
        if (selectedUser) {
            const loggedIn = StorageService.login(selectedUser.username);
            if (loggedIn) {
                onLogin(loggedIn);
            } else {
                setError('Login failed. Please contact IT.');
            }
        }
    }
  };

  // Filter users based on Division AND Search Term
  const filteredUsers = selectedDivision 
    ? users.filter(u => 
        u && 
        u.division === selectedDivision && 
        u.name.toLowerCase().includes(userSearch.toLowerCase())
      ) 
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554] flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Branding */}
      <div className="mb-10 text-center animate-[fadeIn_0.5s_ease-out] z-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-brand-500/40 mb-4 ring-1 ring-white/20">
            <span className="text-3xl font-bold">PK</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PINTU KULIAH</h1>
        <p className="text-gray-400 mt-2 text-sm">Sistem Terpadu Informasi Sekolah & Dunia Usaha</p>
      </div>

      <div className="w-full max-w-5xl animate-[slideUp_0.5s_ease-out] z-10">
        
        {/* STEP 1: PORTAL SELECTION */}
        {step === 1 && (
            <div className="flex flex-col gap-8">
                {/* Admin / Command Center Button */}
                <div className="flex justify-center">
                    <button 
                        onClick={handleAdminModeClick}
                        className="group flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/50 rounded-2xl transition-all duration-300 backdrop-blur-md hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.3)]"
                    >
                        <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-brand-600 transition-colors text-white shadow-inner">
                            <Icon name="ShieldAlert" size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{t.login.adminAccess}</h3>
                            <p className="text-xs text-gray-500 group-hover:text-gray-300">Super Admin & IT Support Only</p>
                        </div>
                        <Icon name="ChevronRight" className="ml-2 text-gray-600 group-hover:text-white" />
                    </button>
                </div>

                <div className="h-[1px] w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div>
                    <h2 className="text-xl font-semibold text-center mb-8 text-gray-300">{t.login.selectDept}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {DIVISIONS.map(div => (
                            <button 
                                key={div.id}
                                onClick={() => handleDivisionClick(div.id)}
                                className="glass-card p-6 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group border border-white/5 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-300 group-hover:text-brand-400 group-hover:shadow-brand-500/20 shadow-inner ring-1 ring-white/10 group-hover:ring-brand-500/30 transition-all">
                                    <Icon name={div.icon} size={28} />
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white relative z-10">{div.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* STEP 2: SELECT USER (Division Mode Only) */}
        {step === 2 && selectedDivision && loginMode === 'DIVISION' && (
            <div className="max-w-md mx-auto">
                 <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <Icon name="ArrowLeft" size={16} /> {t.login.backToDept}
                 </button>

                 {/* Division Header */}
                 <div className="text-center mb-6">
                     <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-brand-400 shadow-xl border border-white/10 mb-4">
                        <Icon name={DIVISIONS.find(d => d.id === selectedDivision)?.icon || 'Grid'} size={32} />
                     </div>
                     <h2 className="text-2xl font-bold text-white">{DIVISIONS.find(d => d.id === selectedDivision)?.name}</h2>
                     <p className="text-sm text-gray-400 mt-1">{t.login.whoAreYou}</p>
                 </div>

                 {/* Search Box */}
                 <div className="relative mb-4">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Cari nama Anda..." 
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-brand-500 transition-colors"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                    />
                 </div>

                 <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                            <Icon name="UserX" size={32} className="mx-auto text-gray-500 mb-2"/>
                            <p className="text-gray-400">
                                {userSearch ? "Tidak ditemukan." : t.login.noUsers}
                            </p>
                        </div>
                    )}
                    {filteredUsers.map(user => (
                        <button 
                            key={user.id}
                            onClick={() => handleUserClick(user)}
                            className="w-full glass-card p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-all border border-white/5 group"
                        >
                             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/5 group-hover:ring-brand-500/50 transition-all">
                                {user.name?.charAt(0)}
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-gray-200 group-hover:text-white">{user.name}</div>
                                <div className="text-xs text-gray-500 group-hover:text-gray-400 flex items-center gap-2">
                                    <span>{user.role}</span>
                                </div>
                            </div>
                            <Icon name="ChevronRight" className="ml-auto text-gray-600 group-hover:text-brand-400 transition-colors" size={16} />
                        </button>
                    ))}
                 </div>
            </div>
        )}

        {/* STEP 3: CONFIRM / PASSWORD */}
        {step === 3 && (
            <div className="max-w-xs mx-auto text-center">
                 <button 
                    onClick={() => {
                        if (loginMode === 'ADMIN') {
                            setStep(1); 
                            setLoginMode(null);
                        } else {
                            setStep(2);
                        }
                    }} 
                    className="mb-6 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors mx-auto"
                 >
                    <Icon name="ArrowLeft" size={16} /> {loginMode === 'ADMIN' ? 'Back to Portal' : t.login.backToUsers}
                 </button>
                 
                 {loginMode === 'DIVISION' && selectedUser ? (
                    <>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-4xl shadow-2xl ring-4 ring-white/10 mx-auto mb-4 animate-[bounce_1s]">
                            {selectedUser.name?.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold mb-1">Halo, {selectedUser.name}</h2>
                        <p className="text-xs text-gray-500 mb-8">{selectedUser.role} • {selectedUser.division}</p>
                    </>
                 ) : (
                    <>
                        <div className="w-24 h-24 rounded-2xl bg-gray-800 flex items-center justify-center text-red-500 font-bold shadow-2xl ring-4 ring-red-500/20 mx-auto mb-4">
                            <Icon name="ShieldAlert" size={48} />
                        </div>
                        <h2 className="text-xl font-bold mb-1 text-red-500">{t.login.adminLogin}</h2>
                        <p className="text-xs text-gray-500 mb-8">Restricted Access Area</p>
                    </>
                 )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Admin needs Username Input */}
                    {loginMode === 'ADMIN' && (
                         <div className="relative">
                            <input 
                                type="text"
                                autoFocus
                                placeholder={t.login.usernamePlaceholder}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-center text-white focus:ring-2 focus:ring-brand-500 outline-none placeholder-gray-600 transition-all"
                                value={adminUsername}
                                onChange={e => setAdminUsername(e.target.value)}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                                <Icon name="User" size={16} />
                            </div>
                        </div>
                    )}

                    {/* Password Field - ONLY FOR ADMIN */}
                    {loginMode === 'ADMIN' && (
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder={t.login.passwordPlaceholder}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-center text-white focus:ring-2 focus:ring-brand-500 outline-none placeholder-gray-600 transition-all pl-10 pr-10"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                                 <Icon name="Lock" size={16} />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                            </button>
                        </div>
                    )}

                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs animate-pulse flex items-center justify-center gap-2"><Icon name="AlertCircle" size={14}/> {error}</div>}
                    
                    <button 
                        type="submit"
                        className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${loginMode === 'ADMIN' ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-900/50' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20'}`}
                    >
                        {loginMode === 'ADMIN' ? t.login.loginBtn : 'Masuk Aplikasi'} <Icon name="LogIn" size={18} />
                    </button>
                </form>
                
                {loginMode === 'ADMIN' && (
                    <div className="mt-8 text-xs text-gray-600 space-y-2">
                        <p>{t.login.demoPass}</p>
                        <button onClick={() => alert("Please contact IT Support.")} className="text-gray-500 hover:text-brand-400 hover:underline transition-colors">
                            {t.login.forgotPass}
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="fixed bottom-6 text-xs text-gray-600 flex gap-4">
        <span>&copy; 2023 PINTU KULIAH</span>
        <span>•</span>
        <span>Secure Gateway v1.4</span>
      </div>
    </div>
  );
};
