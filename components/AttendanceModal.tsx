
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { User, AttendanceRecord } from '../types';
import { translations, LanguageCode } from '../translations';
import { StorageService } from '../services/storageService';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  lang: LanguageCode;
  onStatusChange?: () => void; 
}

const MOODS = [
    { icon: '🔥', label: 'Semangat' },
    { icon: '🙂', label: 'Baik' },
    { icon: '😐', label: 'Biasa Saja' },
    { icon: '🤕', label: 'Kurang Fit' }
];

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, user, lang, onStatusChange }) => {
  const t = translations[lang] || translations.en;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | undefined>(undefined);
  const [location, setLocation] = useState<'WFO' | 'WFH'>('WFO');
  const [duration, setDuration] = useState<string>('00:00:00');
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  
  // New State for Notes, GPS, Mood
  const [focusNote, setFocusNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('🙂');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Timer for Clock and Work Duration
  useEffect(() => {
    if (!isOpen) return;

    const tick = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (activeRecord) {
        const diff = now.getTime() - activeRecord.checkInTime;
        const hrs = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setDuration(`${hrs}:${mins}:${secs}`);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [isOpen, activeRecord]);

  // Load Data on Open
  useEffect(() => {
    if (isOpen) {
      const current = StorageService.getTodayAttendance(user.id);
      setActiveRecord(current);
      if (current) {
          setLocation(current.location);
      } else {
          setFocusNote(''); // Reset note if starting fresh
          setSelectedMood('🙂'); // Reset mood
          setLocationError(null);
      }
      
      // Get last 3 records for history
      const allHistory = StorageService.getAttendanceHistory();
      setHistory(allHistory.filter(h => h.userId === user.id).slice(0, 3));
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  const handleClockIn = () => {
    setIsLocating(true);
    setLocationError(null);

    // Simple function to finalize clock in (used in success and error callbacks)
    const finalizeClockIn = (coords?: {lat: number, lng: number}) => {
        const record = StorageService.clockIn(user.id, location, focusNote, coords, selectedMood);
        setActiveRecord(record);
        setIsLocating(false);
        if (onStatusChange) onStatusChange(); // Notify Parent
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                finalizeClockIn({ lat: latitude, lng: longitude });
            },
            (error) => {
                console.warn("Geolocation error:", error);
                // Allow clock in even if geo fails, but warn user
                setLocationError("Location not found, proceeding anyway.");
                setTimeout(() => finalizeClockIn(), 1000);
            },
            { timeout: 5000 }
        );
    } else {
        setLocationError("Geolocation not supported.");
        setTimeout(() => finalizeClockIn(), 1000);
    }
  };

  const handleClockOut = () => {
    if (activeRecord) {
      StorageService.clockOut(activeRecord.id);
      setActiveRecord(undefined);
      setDuration('00:00:00');
      setFocusNote('');
      // Refresh history
      const allHistory = StorageService.getAttendanceHistory();
      setHistory(allHistory.filter(h => h.userId === user.id).slice(0, 3));
      if (onStatusChange) onStatusChange(); // Notify Parent
    }
  };

  const getGreeting = () => {
    const hrs = currentTime.getHours();
    if (lang === 'id') {
        if (hrs < 11) return 'Selamat Pagi';
        if (hrs < 15) return 'Selamat Siang';
        if (hrs < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    }
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-brand-600 to-indigo-600 opacity-20 blur-3xl"></div>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full">
          <Icon name="X" size={20} />
        </button>

        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center relative z-10 shrink-0">
          <h2 className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-1">{getGreeting()}, {user.name.split(' ')[0]}</h2>
          <div className="text-5xl font-mono font-bold text-gray-800 dark:text-white tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            <span className="text-2xl text-gray-500 dark:text-gray-400 ml-1">
                {currentTime.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{formatDate(currentTime)}</p>
        </div>

        {/* Main Action Area */}
        <div className="flex-1 px-8 pb-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* Status Card */}
          <div className={`p-4 rounded-2xl border ${activeRecord ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'} transition-all`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status Saat Ini</span>
              {activeRecord && (
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
              )}
            </div>
            {activeRecord ? (
                <div className="text-center py-2">
                    <div className="text-2xl font-bold text-emerald-500 font-mono">{duration}</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-xl" title="Mood">{activeRecord.mood}</span>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Bekerja di {activeRecord.location}</p>
                    </div>
                    {activeRecord.notes && (
                         <div className="mt-2 pt-2 border-t border-emerald-500/20 text-xs text-emerald-100 italic opacity-80">
                             "{activeRecord.notes}"
                         </div>
                    )}
                     {activeRecord.latitude && (
                        <a 
                            href={`https://www.google.com/maps?q=${activeRecord.latitude},${activeRecord.longitude}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-400 hover:text-blue-300"
                        >
                            <Icon name="MapPin" size={10} /> View Location
                        </a>
                    )}
                </div>
            ) : (
                <div className="text-center py-2">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Belum absen masuk</div>
                </div>
            )}
          </div>

          {/* Location Toggle & Focus Input (Only if not clocked in) */}
          {!activeRecord && (
             <div className="space-y-4">
                 <div className="bg-gray-100 dark:bg-black/30 p-1 rounded-xl flex">
                    <button 
                      onClick={() => setLocation('WFO')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${location === 'WFO' ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                      <Icon name="Building" size={16} /> WFO
                    </button>
                    <button 
                      onClick={() => setLocation('WFH')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${location === 'WFH' ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                      <Icon name="Home" size={16} /> WFH
                    </button>
                 </div>

                 {/* Mood Selector */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How are you feeling?</label>
                    <div className="flex justify-between gap-2">
                        {MOODS.map(m => (
                            <button
                                key={m.label}
                                onClick={() => setSelectedMood(m.icon)}
                                className={`flex-1 p-2 rounded-xl border transition-all ${selectedMood === m.icon ? 'bg-brand-500/10 border-brand-500 scale-105' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'}`}
                            >
                                <div className="text-2xl mb-1">{m.icon}</div>
                                <div className={`text-[10px] font-medium ${selectedMood === m.icon ? 'text-brand-500' : 'text-gray-500'}`}>{m.label}</div>
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fokus Hari Ini (Opsional)</label>
                     <textarea 
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                        rows={2}
                        placeholder="Apa yang akan Anda kerjakan hari ini?"
                        value={focusNote}
                        onChange={(e) => setFocusNote(e.target.value)}
                     />
                 </div>
             </div>
          )}

          {/* Big Action Button */}
          {!activeRecord ? (
             <div className="space-y-2">
                <button 
                    onClick={handleClockIn}
                    disabled={isLocating}
                    className={`w-full py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-brand-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-3 group ${isLocating ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isLocating ? (
                        <>
                            <Icon name="Loader2" className="animate-spin" size={24} />
                            <span className="font-bold">Mencari Lokasi...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
                                <Icon name="LogIn" size={24} />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-bold">Absen Masuk</div>
                                <div className="text-xs text-white/70">Mulai kerja dengan GPS & Mood</div>
                            </div>
                        </>
                    )}
                </button>
                {locationError && <p className="text-center text-xs text-red-400">{locationError}</p>}
             </div>
          ) : (
             <button 
                onClick={handleClockOut}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-2xl shadow-lg shadow-red-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-3 group"
             >
                <div className="p-2 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
                    <Icon name="LogOut" size={24} />
                </div>
                <div className="text-left">
                    <div className="text-lg font-bold">Absen Pulang</div>
                    <div className="text-xs text-white/70">Selesaikan shift & simpan laporan</div>
                </div>
             </button>
          )}

          {/* History Snippet */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Aktivitas Terakhir</h4>
            <div className="space-y-2">
                {history.length === 0 && <p className="text-xs text-gray-500 italic text-center">Belum ada riwayat.</p>}
                {history.map(rec => (
                    <div key={rec.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${rec.location === 'WFO' ? 'bg-brand-500' : 'bg-purple-500'}`}>
                                <Icon name={rec.location === 'WFO' ? 'Building' : 'Home'} size={14} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                     <p className="text-xs font-bold text-gray-800 dark:text-white">{rec.date === new Date().toISOString().split('T')[0] ? 'Hari Ini' : rec.date}</p>
                                     <span title="Mood">{rec.mood}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-500">{rec.location}</p>
                                    {rec.latitude && (
                                        <a 
                                            href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] text-blue-400 hover:underline flex items-center"
                                        >
                                            <Icon name="MapPin" size={8} className="mr-0.5" /> Map
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                {new Date(rec.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                {rec.checkOutTime ? ` - ${new Date(rec.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ' ...'}
                            </p>
                            {rec.checkOutTime && (
                                <p className="text-[10px] text-green-500 font-bold">Completed</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
