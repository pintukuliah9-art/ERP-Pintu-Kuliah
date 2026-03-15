
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Tool, Announcement, UserRole, AttendanceConfig, Holiday, UserPreferences, SystemBackup, DivisionType, ToolCategory } from '../types';
import { Icon } from './Icon';
import { StorageService } from '../services/storageService';
import { translations, LanguageCode } from '../translations';
import { NotificationService } from '../services/notificationService';
import { EMPLOYEE_DATA } from '../constants';
import { UnifiedDataService } from '../services/UnifiedDataService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { AddToolModal } from './AddToolModal';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  tools: Tool[];
  onUpdateTools: (tools: Tool[]) => void;
  announcements: Announcement[];
  onUpdateAnnouncements: (announcements: Announcement[]) => void;
  attendanceConfig: AttendanceConfig;
  onUpdateAttendanceConfig: (config: AttendanceConfig) => void;
  holidays: Holiday[];
  onUpdateHolidays: (holidays: Holiday[]) => void;
  managedDivisions: any[];
  onUpdateManagedDivisions: (updated: any[]) => void;
  managedRoles: Record<string, any[]>;
  onUpdateManagedRoles: (updated: Record<string, any[]>) => void;
  managedEmployees: any[];
  onUpdateManagedEmployees: (updated: any[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, onUpdateUser, tools, onUpdateTools, announcements, onUpdateAnnouncements,
  attendanceConfig, onUpdateAttendanceConfig, holidays, onUpdateHolidays,
  managedDivisions, onUpdateManagedDivisions, managedRoles, onUpdateManagedRoles,
  managedEmployees, onUpdateManagedEmployees
}) => {
  // Permission Logic: Only Admin or IT Support can view restricted settings
  const isSystemAdmin = user.role === UserRole.ADMIN || user.division === DivisionType.IT_SUPPORT;

  // Default to 'profile'
  const [activeTab, setActiveTab] = useState<'team' | 'profile' | 'system' | 'notifications' | 'links' | 'hierarchy'>('profile');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('Semua');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingFonnte, setIsTestingFonnte] = useState(false);
  
  // Employee Management State
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [openEmployeeMenuId, setOpenEmployeeMenuId] = useState<number | null>(null);

  // Status check states
  const [isCheckingFonnteStatus, setIsCheckingFonnteStatus] = useState(false);
  const [fonnteDeviceStatus, setFonnteDeviceStatus] = useState<any>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Tool Action Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  
  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const t = translations[preferences.language as LanguageCode] || translations.en;

  // Profile State
  const [editName, setEditName] = useState(user.name);
  const [editNote, setEditNote] = useState(user.stickyNote);
  const [editRole, setEditRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // System Sub-tabs State
  const [systemSubTab, setSystemSubTab] = useState<'announcements' | 'attendance' | 'holidays' | 'backup'>('announcements');

  // Announcement State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [openAnnMenuId, setOpenAnnMenuId] = useState<string | null>(null);

  // Holiday State
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [openHolidayMenuId, setOpenHolidayMenuId] = useState<string | null>(null);
  const [editWorkStart, setEditWorkStart] = useState(attendanceConfig.workStartTime);
  const [editWorkEnd, setEditWorkEnd] = useState(attendanceConfig.workEndTime);
  const [editGrace, setEditGrace] = useState(attendanceConfig.gracePeriodMinutes);
  const [editQuota, setEditQuota] = useState(attendanceConfig.annualLeaveQuota);

  // Notification State - AUTO-FILL IMPLEMENTATION
  const [waNumber, setWaNumber] = useState(preferences.whatsappNumber || '');
  // Auto-fill Webhook if empty
  const [webhookUrl, setWebhookUrl] = useState(preferences.webhookUrl || 'https://hooks.zapier.com/hooks/catch/123456/sample');
  // Auto-fill Fonnte Token if empty
  const [fonnteToken, setFonnteToken] = useState(preferences.fonnteToken || '');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newDivName, setNewDivName] = useState('');
  const [selectedDivForRole, setSelectedDivForRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingDiv, setEditingDiv] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ div: string, role: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivName.trim()) return;
    if (managedDivisions.some((d: any) => d.name === newDivName.trim())) {
      showToast('Divisi sudah ada', 'error');
      return;
    }
    const updatedDivs = [...managedDivisions, { name: newDivName.trim(), status: 'Aktif' }];
    const updatedRoles = { ...managedRoles, [newDivName.trim()]: [{ name: 'Staff', status: 'Aktif' }] };
    
    onUpdateManagedDivisions(updatedDivs);
    onUpdateManagedRoles(updatedRoles);
    
    setNewDivName('');
    showToast('Divisi berhasil ditambahkan');
  };

  const handleDeleteDivision = (divName: string) => {
    requestConfirm(
      'Hapus Divisi',
      `Apakah Anda yakin ingin menghapus divisi ${divName}? Semua jabatan di dalamnya juga akan terhapus.`,
      () => {
        const updatedDivs = managedDivisions.filter((d: any) => d.name !== divName);
        const updatedRoles = { ...managedRoles };
        delete updatedRoles[divName];
        
        // Update managedEmployees: set division to empty for affected employees
        const updatedEmployees = managedEmployees.map((emp: any) => 
          emp.divisi === divName ? { ...emp, divisi: '', role: '' } : emp
        );
        onUpdateManagedEmployees(updatedEmployees);

        onUpdateManagedDivisions(updatedDivs);
        onUpdateManagedRoles(updatedRoles);
        
        if (selectedDivForRole === divName) setSelectedDivForRole(null);
        showToast('Divisi berhasil dihapus');
      }
    );
  };

  const handleToggleDivisionStatus = (divName: string) => {
    const updatedDivs = managedDivisions.map((d: any) => 
      d.name === divName ? { ...d, status: d.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : d
    );
    onUpdateManagedDivisions(updatedDivs);
    showToast(`Status divisi ${divName} diperbarui`);
  };

  const handleEditDivisionName = (oldName: string) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingDiv(null);
      return;
    }
    if (managedDivisions.some((d: any) => d.name === editValue.trim() && d.name !== oldName)) {
      showToast('Nama divisi sudah digunakan', 'error');
      return;
    }

    const updatedDivs = managedDivisions.map((d: any) => 
      d.name === oldName ? { ...d, name: editValue.trim() } : d
    );

    // Update managedEmployees who belong to this division
    const updatedEmployees = managedEmployees.map((emp: any) => 
      emp.divisi === oldName ? { ...emp, divisi: editValue.trim() } : emp
    );
    onUpdateManagedEmployees(updatedEmployees);

    // Update managedRoles key
    const updatedRoles = { ...managedRoles };
    if (updatedRoles[oldName]) {
      updatedRoles[editValue.trim()] = updatedRoles[oldName];
      delete updatedRoles[oldName];
      onUpdateManagedRoles(updatedRoles);
    }

    onUpdateManagedDivisions(updatedDivs);

    if (selectedDivForRole === oldName) setSelectedDivForRole(editValue.trim());
    setEditingDiv(null);
    setEditValue('');
    showToast('Nama divisi berhasil diubah');
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivForRole || !newRoleName.trim()) return;
    const currentRoles = managedRoles[selectedDivForRole] || [];
    if (currentRoles.some((r: any) => r.name === newRoleName.trim())) {
      showToast('Jabatan sudah ada di divisi ini', 'error');
      return;
    }
    const updatedRoles = {
      ...managedRoles,
      [selectedDivForRole]: [...currentRoles, { name: newRoleName.trim(), status: 'Aktif' }]
    };
    onUpdateManagedRoles(updatedRoles);
    setNewRoleName('');
    showToast('Jabatan berhasil ditambahkan');
  };

  const handleDeleteRole = (divName: string, roleName: string) => {
    requestConfirm(
      'Hapus Jabatan',
      `Apakah Anda yakin ingin menghapus jabatan ${roleName} dari divisi ${divName}?`,
      () => {
        const updatedRoles = {
          ...managedRoles,
          [divName]: managedRoles[divName].filter((r: any) => r.name !== roleName)
        };

        // Update managedEmployees: set role to empty for affected employees
        const updatedEmployees = managedEmployees.map((emp: any) => 
          (emp.divisi === divName && emp.role === roleName) ? { ...emp, role: '' } : emp
        );
        onUpdateManagedEmployees(updatedEmployees);

        onUpdateManagedRoles(updatedRoles);
        showToast('Jabatan berhasil dihapus');
      }
    );
  };

  const handleToggleRoleStatus = (divName: string, roleName: string) => {
    const updatedRoles = {
      ...managedRoles,
      [divName]: managedRoles[divName].map((r: any) => 
        r.name === roleName ? { ...r, status: r.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : r
      )
    };
    onUpdateManagedRoles(updatedRoles);
    showToast(`Status jabatan ${roleName} diperbarui`);
  };

  const handleEditRoleName = (divName: string, oldRoleName: string) => {
    if (!editValue.trim() || editValue.trim() === oldRoleName) {
      setEditingRole(null);
      return;
    }
    const currentRoles = managedRoles[divName] || [];
    if (currentRoles.some((r: any) => r.name === editValue.trim() && r.name !== oldRoleName)) {
      showToast('Nama jabatan sudah digunakan di divisi ini', 'error');
      return;
    }

    const updatedRoles = {
      ...managedRoles,
      [divName]: currentRoles.map((r: any) => 
        r.name === oldRoleName ? { ...r, name: editValue.trim() } : r
      )
    };

    // Update managedEmployees who have this role in this division
    const updatedEmployees = managedEmployees.map((emp: any) => 
      (emp.divisi === divName && emp.role === oldRoleName) 
        ? { ...emp, role: editValue.trim() } 
        : emp
    );
    onUpdateManagedEmployees(updatedEmployees);

    onUpdateManagedRoles(updatedRoles);
    setEditingRole(null);
    setEditValue('');
    showToast('Nama jabatan berhasil diubah');
  };

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, cancelText });
  };

  // Check connection on mount
  useEffect(() => {
      setConnectionStatus(isSupabaseConfigured() ? 'connected' : 'disconnected');
  }, []);

  // --- HANDLERS ---

  const handleSaveProfile = () => {
    onUpdateUser({ ...user, name: editName, stickyNote: editNote, role: editRole });
    showToast(t.common.save);
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword || newPassword !== confirmPassword) {
          showToast(t.settings.passwordMismatch, 'error');
          return;
      }
      onUpdateUser({ ...user, password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      showToast(t.settings.passwordUpdated);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      title: newAnnTitle,
      content: newAnnContent,
      priority: newAnnPriority,
      date: new Date().toISOString().split('T')[0]
    };
    onUpdateAnnouncements([newAnn, ...announcements]);
    setNewAnnTitle('');
    setNewAnnContent('');
  };

  const handleDeleteAnnouncement = (id: string) => {
    onUpdateAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleSaveAttendanceConfig = () => {
      onUpdateAttendanceConfig({
          ...attendanceConfig,
          workStartTime: editWorkStart,
          workEndTime: editWorkEnd,
          gracePeriodMinutes: editGrace,
          annualLeaveQuota: editQuota
      });
      showToast("Aturan Absensi Berhasil Disimpan");
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;
    
    const newHoliday: Holiday = {
      id: Date.now().toString(),
      name: newHolidayName,
      date: newHolidayDate
    };
    
    onUpdateHolidays([...holidays, newHoliday]);
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleDeleteHoliday = (id: string) => {
    requestConfirm(
      'Hapus Hari Libur',
      'Apakah Anda yakin ingin menghapus jadwal hari libur ini?',
      () => onUpdateHolidays(holidays.filter(h => h.id !== id))
    );
  };

  const handleExportConfig = () => {
      StorageService.exportToJSON();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              requestConfirm(
                'Pulihkan Data',
                'Apakah Anda yakin ingin memulihkan data? Data saat ini akan digantikan sepenuhnya oleh data dari file backup.',
                () => {
                  StorageService.restoreBackup(data);
                  window.location.reload();
                }
              );
          } catch (err) {
              showToast('File backup tidak valid atau rusak!', 'error');
          }
      };
      reader.readAsText(file);
  };

  const handleLogout = () => {
      StorageService.logout();
      window.location.reload();
  };

  const handleCloudSync = async () => {
      requestConfirm(
        'Sinkronisasi Cloud',
        'Upload data lokal (Chat) ke Cloud Database? Peringatan: ID yang sama di database akan ditimpa.',
        async () => {
          setIsSyncing(true);
          try {
              const msgs = StorageService.getMessages();
              const groups = StorageService.getChatGroups();
              const result = await UnifiedDataService.syncLocalToCloud(msgs, groups);
              
              if (result.success) {
                  showToast("✅ Sinkronisasi Berhasil! Data lokal telah tersimpan di cloud.");
              } else {
                  showToast("❌ Gagal: " + result.message, 'error');
              }
          } catch (e) {
              console.error(e);
              showToast("❌ Terjadi kesalahan saat sinkronisasi", 'error');
          } finally {
              setIsSyncing(false);
          }
        }
      );
  };

  // --- EMPLOYEE HANDLERS ---
  const handleSaveEmployee = (emp: any) => {
    let updatedEmployees;
    if (editingEmployee) {
      updatedEmployees = managedEmployees.map(e => e.no === emp.no ? emp : e);
    } else {
      const newNo = managedEmployees.length > 0 ? Math.max(...managedEmployees.map(e => e.no)) + 1 : 1;
      updatedEmployees = [...managedEmployees, { ...emp, no: newNo, status: 'Aktif' }];
    }
    onUpdateManagedEmployees(updatedEmployees);
    setEditingEmployee(null);
    setIsAddEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (no: number) => {
    requestConfirm(
      'Hapus Karyawan',
      'Apakah Anda yakin ingin menghapus data karyawan ini secara permanen?',
      () => {
        const updatedEmployees = managedEmployees.filter(e => e.no !== no);
        onUpdateManagedEmployees(updatedEmployees);
        showToast('Data karyawan berhasil dihapus');
      }
    );
  };

  const handleToggleEmployeeStatus = (no: number) => {
    const updatedEmployees = managedEmployees.map(e => 
      e.no === no ? { ...e, status: e.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : e
    );
    onUpdateManagedEmployees(updatedEmployees);
  };

  const handleSaveEdit = (updatedTool: Partial<Tool>) => {
    if (!editingTool) return;
    const updated = tools.map(t => t.id === editingTool.id ? { ...t, ...updatedTool } : t);
    onUpdateTools(updated);
    setEditingTool(null);
  };

  const handleSaveNotifications = () => {
    const updated = {
        ...preferences,
        whatsappNumber: waNumber,
        webhookUrl: webhookUrl,
        fonnteToken: fonnteToken
    };
    setPreferences(updated);
    StorageService.savePreferences(updated);
    showToast("Pengaturan Notifikasi Berhasil Disimpan");
  };

  const handleTestWebhook = () => {
      if (!webhookUrl) {
          showToast("Masukkan URL Webhook terlebih dahulu.", 'error');
          return;
      }
      // Test with a generic notification
      const dummyData = { id: 'test', title: 'Test Webhook Notification', type: 'system' };
      NotificationService.triggerWebhook(dummyData as any, 'test', webhookUrl);
      showToast("Data tes dikirim ke Webhook. Cek logs di Zapier/Make Anda.", 'info');
  };

  // NEW: Check Device Status Handler
  const handleCheckFonnteStatus = async () => {
      if (!fonnteToken) {
          showToast("Masukkan Token Fonnte terlebih dahulu.", 'error');
          return;
      }
      setIsCheckingFonnteStatus(true);
      setFonnteDeviceStatus(null);
      try {
          const result = await NotificationService.validateFonnteToken(fonnteToken);
          setFonnteDeviceStatus(result);
          showToast("Status perangkat berhasil diperbarui", 'info');
      } catch (e) {
          showToast("Gagal memeriksa status Fonnte", 'error');
      } finally {
          setIsCheckingFonnteStatus(false);
      }
  };

  const handleTestFonnte = async () => {
      if (!fonnteToken || !waNumber) {
          showToast("Mohon isi Token Fonnte dan Nomor WhatsApp (628...) terlebih dahulu.", 'error');
          return;
      }
      
      setIsTestingFonnte(true);
      
      const dummyData = { 
          id: 'test_fonnte', 
          title: 'Tes Koneksi WhatsApp (Fonnte)', 
          type: 'system',
          targetDivisionId: 'IT Support' 
      } as any;
      
      try {
          const result = await NotificationService.sendViaFonnte(dummyData, fonnteToken, waNumber);
          if (result.success) {
              showToast(`✅ Pesan terkirim ke ${waNumber}`);
          } else {
              showToast(`❌ Gagal: ${result.detail}`, 'error');
          }
      } catch (e) {
          showToast("Terjadi kesalahan saat mengirim pesan tes.", 'error');
      } finally {
          setIsTestingFonnte(false);
      }
  };

  // --- HELPER FOR UI ---
  const getBadgeColor = (division: string) => {
      switch(division) {
          case 'Direksi': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
          case 'Marketing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
          case 'Administrasi': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
          case 'Keuangan': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          case 'IT Support': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
          default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      }
  };

  const filteredEmployees = managedEmployees.filter(emp => {
      const matchesSearch = emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivisionFilter === 'Semua' || emp.divisi === selectedDivisionFilter;
      return matchesSearch && matchesDivision;
  });

  return (
    <div className="flex flex-col md:flex-row h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#020617] via-[#0f172a] to-[#172554] overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - Responsive */}
      <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/10 p-2 md:p-6 flex flex-row md:flex-col gap-1 md:gap-2 shrink-0 backdrop-blur-xl overflow-x-auto md:overflow-y-auto custom-scrollbar sticky top-0 md:relative z-30 no-scrollbar">
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30 shadow-lg shadow-brand-500/10">
                <Icon name="Settings" className="text-brand-400" size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white leading-tight">Pengaturan</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">System Config</p>
            </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-1 md:gap-2 w-full">
            {/* Mobile Back Button */}
            <button 
              onClick={() => window.location.hash = '#'}
              className="md:hidden whitespace-nowrap shrink-0 px-4 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-all"
            >
              <Icon name="ArrowLeft" size={18} /> 
              <span className="text-[10px] font-bold">Kembali</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'profile' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon name="User" size={18} /> 
              <span className="text-[10px] md:text-sm font-bold md:font-semibold">Profil</span>
            </button>

            {isSystemAdmin && (
                <button 
                  onClick={() => setActiveTab('team')}
                  className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'team' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name="Users" size={18} /> 
                  <span className="text-[10px] md:text-sm font-bold md:font-semibold">Tim</span>
                </button>
            )}

            {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                <button 
                  onClick={() => setActiveTab('links')}
                  className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'links' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name="Link" size={18} /> 
                  <span className="text-[10px] md:text-sm font-bold md:font-semibold">Links</span>
                </button>
            )}

            {isSystemAdmin && (
                <button 
                  onClick={() => setActiveTab('hierarchy')}
                  className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'hierarchy' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name="GitBranch" size={18} /> 
                  <span className="text-[10px] md:text-sm font-bold md:font-semibold">Hirarki</span>
                </button>
            )}

            {isSystemAdmin && (
                <button 
                  onClick={() => setActiveTab('system')}
                  className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'system' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name="Server" size={18} /> 
                  <span className="text-[10px] md:text-sm font-bold md:font-semibold">Sistem</span>
                </button>
            )}

            {isSystemAdmin && (
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`whitespace-nowrap shrink-0 md:shrink text-center md:text-left px-4 md:px-4 py-2.5 md:py-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 ${activeTab === 'notifications' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name="Bell" size={18} /> 
                  <span className="text-[10px] md:text-sm font-bold md:font-semibold">Notif</span>
                </button>
            )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-10 pb-24 md:pb-10">
        <AnimatePresence mode="wait">
            {/* === LINK MANAGEMENT (ADMIN/MANAGER) === */}
            {activeTab === 'links' && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                <motion.div 
                    key="links"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-5xl mx-auto space-y-6"
                >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Manajemen Link</h2>
                        <p className="text-gray-400 text-xs md:text-sm">
                            {user.role === UserRole.ADMIN ? 'Kelola semua link sistem.' : `Kelola link divisi ${user.division}.`}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input 
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-brand-500 outline-none"
                                placeholder="Cari link..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                        </div>
                        <button 
                            onClick={() => setEditingTool({ id: `t_${Date.now()}`, name: '', url: '', category: ToolCategory.DAILY, icon: 'Link', color: 'bg-brand-500' } as Tool)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20"
                        >
                            <Icon name="Plus" size={18} />
                            Tambah Link
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-4">Nama Link</th>
                                    <th className="p-4">Divisi</th>
                                    <th className="p-4">Kategori</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {tools
                                    .filter(t => !t.deletedAt)
                                    .filter(t => user.role === UserRole.ADMIN || t.divisionId === user.division)
                                    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((tool) => (
                                    <tr key={tool.id} className={`hover:bg-white/5 transition-colors group ${tool.isDisabled ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${tool.color || 'bg-brand-500'}`}>
                                                    <Icon name={tool.icon || 'Link'} size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{tool.name}</span>
                                                    <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{tool.url}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getBadgeColor(tool.divisionId || 'Global')}`}>
                                                {tool.divisionId || 'Global'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs">
                                            {tool.category}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${tool.isDisabled ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${tool.isDisabled ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                {tool.isDisabled ? 'Nonaktif' : 'Aktif'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative flex justify-end">
                                                <button 
                                                    onClick={() => setOpenMenuId(openMenuId === tool.id ? null : tool.id)}
                                                    className={`p-2 rounded-xl transition-all ${openMenuId === tool.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                >
                                                    <Icon name="MoreHorizontal" size={18} />
                                                </button>

                                                {openMenuId === tool.id && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-10" 
                                                            onClick={() => setOpenMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-[scaleIn_0.1s_ease-out]">
                                                            <div className="p-1.5 space-y-1">
                                                                <button 
                                                                    onClick={() => {
                                                                        window.open(tool.url, '_blank');
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                                >
                                                                    <Icon name="ExternalLink" size={14} />
                                                                    Buka Link
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingTool(tool);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                                >
                                                                    <Icon name="Edit" size={14} />
                                                                    Edit Link
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const updated = tools.map(t => t.id === tool.id ? { ...t, isLocked: !t.isLocked } : t);
                                                                        onUpdateTools(updated);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all ${tool.isLocked ? 'text-amber-400 bg-amber-400/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                                                                >
                                                                    <Icon name={tool.isLocked ? "Lock" : "Unlock"} size={14} />
                                                                    {tool.isLocked ? "Buka Kunci" : "Kunci Link"}
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const updated = tools.map(t => t.id === tool.id ? { ...t, isDisabled: !t.isDisabled } : t);
                                                                        onUpdateTools(updated);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all ${tool.isDisabled ? 'text-orange-400 bg-orange-400/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                                                                >
                                                                    <Icon name={tool.isDisabled ? "Eye" : "EyeOff"} size={14} />
                                                                    {tool.isDisabled ? "Aktifkan" : "Nonaktifkan"}
                                                                </button>
                                                                <div className="h-px bg-white/5 my-1" />
                                                                <button 
                                                                    onClick={() => {
                                                                        requestConfirm(
                                                                            'Hapus Link',
                                                                            'Apakah Anda yakin ingin menghapus link ini?',
                                                                            () => {
                                                                                const updated = tools.map(t => t.id === tool.id ? { ...t, deletedAt: Date.now() } : t);
                                                                                onUpdateTools(updated);
                                                                                showToast('Link berhasil dihapus');
                                                                            }
                                                                        );
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all"
                                                                >
                                                                    <Icon name="Trash2" size={14} />
                                                                    Hapus Link
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View for Links */}
                    <div className="lg:hidden p-4 space-y-4">
                        {tools
                            .filter(t => !t.deletedAt)
                            .filter(t => user.role === UserRole.ADMIN || t.divisionId === user.division)
                            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((tool) => (
                            <div key={tool.id} className={`bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 transition-all ${tool.isDisabled ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${tool.color || 'bg-brand-500'}`}>
                                            <Icon name={tool.icon || 'Link'} size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-sm">{tool.name}</span>
                                            <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{tool.url}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === tool.id ? null : tool.id)}
                                            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl transition-all"
                                        >
                                            <Icon name="MoreHorizontal" size={18} />
                                        </button>
                                        
                                        {openMenuId === tool.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                                    <div className="p-1.5 space-y-1">
                                                        <button onClick={() => { window.open(tool.url, '_blank'); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 rounded-xl hover:bg-white/5 transition-all">
                                                            <Icon name="ExternalLink" size={14} /> Buka Link
                                                        </button>
                                                        <button onClick={() => { setEditingTool(tool); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 rounded-xl hover:bg-white/5 transition-all">
                                                            <Icon name="Edit" size={14} /> Edit Link
                                                        </button>
                                                        <button onClick={() => { onUpdateTools(tools.map(t => t.id === tool.id ? { ...t, isLocked: !t.isLocked } : t)); setOpenMenuId(null); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all ${tool.isLocked ? 'text-amber-400 bg-amber-400/10' : 'text-gray-300'}`}>
                                                            <Icon name={tool.isLocked ? "Lock" : "Unlock"} size={14} /> {tool.isLocked ? "Buka Kunci" : "Kunci Link"}
                                                        </button>
                                                        <button onClick={() => { onUpdateTools(tools.map(t => t.id === tool.id ? { ...t, isDisabled: !t.isDisabled } : t)); setOpenMenuId(null); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all ${tool.isDisabled ? 'text-orange-400 bg-orange-400/10' : 'text-gray-300'}`}>
                                                            <Icon name={tool.isDisabled ? "Eye" : "EyeOff"} size={14} /> {tool.isDisabled ? "Aktifkan" : "Nonaktifkan"}
                                                        </button>
                                                        <div className="h-px bg-white/5 my-1" />
                                                        <button onClick={() => { 
                                                            requestConfirm(
                                                                'Hapus Link',
                                                                'Apakah Anda yakin ingin menghapus link ini?',
                                                                () => {
                                                                    onUpdateTools(tools.map(t => t.id === tool.id ? { ...t, deletedAt: Date.now() } : t));
                                                                    showToast('Link berhasil dihapus');
                                                                }
                                                            );
                                                            setOpenMenuId(null); 
                                                        }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 rounded-xl hover:bg-red-400/10 transition-all">
                                                            <Icon name="Trash2" size={14} /> Hapus Link
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex gap-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getBadgeColor(tool.divisionId || 'Global')}`}>
                                            {tool.divisionId || 'Global'}
                                        </span>
                                        <span className="text-[9px] px-2 py-0.5 rounded border border-white/10 text-gray-400 uppercase font-bold tracking-wider">
                                            {tool.category}
                                        </span>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${tool.isDisabled ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${tool.isDisabled ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                        {tool.isDisabled ? 'Nonaktif' : 'Aktif'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}

        {/* === TEAM MANAGEMENT (RESTRICTED) === */}
        {activeTab === 'team' && isSystemAdmin && (
            <motion.div 
                key="team"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-6"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Data Karyawan</h2>
                        <p className="text-gray-400 text-xs md:text-sm">Total {managedEmployees.length} personel terdaftar.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-48">
                            <select 
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 outline-none appearance-none"
                                value={selectedDivisionFilter}
                                onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                            >
                                <option value="Semua" className="bg-slate-900">Semua Divisi</option>
                                {managedDivisions.map(div => (
                                    <option key={div.name} value={div.name} className="bg-slate-900">{div.name}</option>
                                ))}
                            </select>
                            <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <input 
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-brand-500 outline-none"
                                placeholder="Cari nama, divisi atau jabatan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                        </div>
                        <button 
                            onClick={() => setIsAddEmployeeModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20"
                        >
                            <Icon name="Plus" size={18} />
                            Tambah Karyawan
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-4 w-16 text-center">No</th>
                                    <th className="p-4">Nama Lengkap</th>
                                    <th className="p-4">Divisi & Jabatan</th>
                                    <th className="p-4">Kontak (Email/WA)</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.no} className={`hover:bg-white/5 transition-colors group ${emp.status === 'Nonaktif' ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="p-4 text-center text-gray-500">{emp.no}</td>
                                        <td className="p-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                                {emp.nama.charAt(0)}
                                            </div>
                                            {emp.nama}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getBadgeColor(emp.divisi)}`}>
                                                    {emp.divisi}
                                                </span>
                                                <span className="text-gray-400 text-xs">{emp.role}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 font-mono text-xs">
                                            <div>{emp.email}</div>
                                            <div className="text-gray-500">{emp.wa}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${emp.status === 'Aktif' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></span> {emp.status}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative flex justify-end">
                                                <button 
                                                    onClick={() => setOpenEmployeeMenuId(openEmployeeMenuId === emp.no ? null : emp.no)}
                                                    className={`p-2 rounded-xl transition-all ${openEmployeeMenuId === emp.no ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                >
                                                    <Icon name="MoreVertical" size={18} />
                                                </button>
                                                
                                                {openEmployeeMenuId === emp.no && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setOpenEmployeeMenuId(null)} />
                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-[scaleIn_0.1s_ease-out]">
                                                            <div className="p-1.5 space-y-1">
                                                                <button onClick={() => { setEditingEmployee(emp); setOpenEmployeeMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-left">
                                                                    <Icon name="Edit" size={14} /> Edit Profil
                                                                </button>
                                                                <button onClick={() => { handleToggleEmployeeStatus(emp.no); setOpenEmployeeMenuId(null); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all text-left ${emp.status === 'Nonaktif' ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                                                                    <Icon name={emp.status === 'Nonaktif' ? "CheckCircle" : "Slash"} size={14} /> {emp.status === 'Nonaktif' ? "Aktifkan" : "Nonaktifkan"}
                                                                </button>
                                                                <div className="h-px bg-white/5 my-1" />
                                                                <button onClick={() => { handleDeleteEmployee(emp.no); setOpenEmployeeMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 rounded-xl hover:bg-red-400/10 transition-all text-left">
                                                                    <Icon name="Trash2" size={14} /> Hapus Karyawan
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden p-4 space-y-4">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.no} className={`bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 transition-all ${emp.status === 'Nonaktif' ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-lg font-bold text-white shadow-inner border-2 border-white/10">
                                            {emp.nama.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-sm font-bold text-white">{emp.nama}</h4>
                                            <span className="text-[10px] text-gray-400">{emp.role}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenEmployeeMenuId(openEmployeeMenuId === emp.no ? null : emp.no)}
                                            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl transition-all"
                                        >
                                            <Icon name="MoreHorizontal" size={18} />
                                        </button>
                                        
                                        {openEmployeeMenuId === emp.no && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenEmployeeMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                                    <div className="p-1.5 space-y-1">
                                                        <button onClick={() => { setEditingEmployee(emp); setOpenEmployeeMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-left">
                                                            <Icon name="Edit" size={14} /> Edit Profil
                                                        </button>
                                                        <button onClick={() => { handleToggleEmployeeStatus(emp.no); setOpenEmployeeMenuId(null); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all text-left ${emp.status === 'Nonaktif' ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                                                            <Icon name={emp.status === 'Nonaktif' ? "CheckCircle" : "Slash"} size={14} /> {emp.status === 'Nonaktif' ? "Aktifkan" : "Nonaktifkan"}
                                                        </button>
                                                        <div className="h-px bg-white/5 my-1" />
                                                        <button onClick={() => { handleDeleteEmployee(emp.no); setOpenEmployeeMenuId(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 rounded-xl hover:bg-red-400/10 transition-all text-left">
                                                            <Icon name="Trash2" size={14} /> Hapus Karyawan
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <span className="text-gray-500 block mb-1 uppercase tracking-wider">Email</span>
                                        <span className="text-gray-300 truncate block">{emp.email}</span>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <span className="text-gray-500 block mb-1 uppercase tracking-wider">WhatsApp</span>
                                        <span className="text-gray-300 truncate block">{emp.wa}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getBadgeColor(emp.divisi)}`}>
                                        {emp.divisi}
                                    </span>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-bold uppercase ${emp.status === 'Aktif' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></span> {emp.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="SearchX" size={32} className="text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">Data tidak ditemukan.</p>
                        <p className="text-xs text-gray-500 mt-1">Coba gunakan kata kunci pencarian lain.</p>
                    </div>
                )}
            </motion.div>
        )}

        {/* === PROFILE SETTINGS (PUBLIC) === */}
        {activeTab === 'profile' && (
            <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0"
            >
                
                {/* ID Card */}
                <div className="bg-gradient-to-br from-brand-900/40 via-indigo-950/40 to-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-2xl relative overflow-hidden text-center md:text-left group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-brand-500/20 transition-all duration-700"></div>
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-3xl md:text-5xl font-black shadow-2xl ring-8 ring-white/5 relative z-10 shrink-0 transform group-hover:scale-105 transition-transform duration-500">
                        {user.name.charAt(0)}
                    </div>
                    <div className="relative z-10 flex flex-col items-center md:items-start flex-1 w-full">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-2 md:gap-4 w-full">
                            <h2 className="text-xl md:text-3xl font-black text-white tracking-tight">{user.name}</h2>
                            <span className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-[9px] md:text-[10px] font-black uppercase border border-brand-500/30 tracking-widest">
                                {user.role}
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                <Icon name="Briefcase" size={12} className="text-gray-400"/>
                                <span className="text-[10px] md:text-xs font-bold text-gray-300">{user.division}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                <Icon name="Fingerprint" size={12} className="text-gray-400"/>
                                <span className="text-[10px] md:text-xs font-mono text-gray-400">ID: {user.id}</span>
                            </div>
                        </div>
                        
                        <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                <Icon name="LogOut" size={14} className="group-hover/btn:-translate-x-1 transition-transform"/> 
                                Keluar Sesi
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-6">
                    <h3 className="text-base md:text-lg font-bold text-white border-b border-white/5 pb-4">Edit Profil</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                            <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500" value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Sticky Note Dashboard</label>
                            <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500" value={editNote} onChange={e => setEditNote(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSaveProfile} className="w-full md:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-brand-500/20">Simpan Perubahan</button>
                    </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 md:p-6 space-y-6">
                    <h3 className="text-base md:text-lg font-bold text-red-400 border-b border-red-500/20 pb-4 flex items-center gap-2"><Icon name="Lock" size={18}/> Keamanan</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Password Baru</label>
                                <input type="password" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Konfirmasi Password</label>
                                <input type="password" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={!newPassword} className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20">Update Password</button>
                        </div>
                    </form>
                </div>
            </motion.div>
        )}

        {/* === NOTIFICATIONS (RESTRICTED) === */}
        {activeTab === 'notifications' && isSystemAdmin && (
            <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0"
            >
                
                {/* 1. WhatsApp Number */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white">Nomor Admin (WhatsApp)</h3>
                            <p className="text-[10px] md:text-xs text-gray-400">Nomor ini akan menerima notifikasi Urgent/Laporan.</p>
                        </div>
                        <Icon name="Phone" size={20} className="text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nomor WhatsApp (628...)</label>
                        <input 
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500" 
                            value={waNumber} 
                            onChange={e => setWaNumber(e.target.value)}
                            placeholder="628123456789"
                        />
                    </div>
                </div>

                {/* 2. Fonnte Integration (With Status Check) */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white">Integrasi Fonnte (WA Gateway)</h3>
                            <p className="text-[10px] md:text-xs text-gray-400">Kirim notifikasi WhatsApp otomatis tanpa pihak ketiga.</p>
                        </div>
                        <Icon name="MessageCircle" size={20} className="text-green-500" />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Fonnte API Token</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500 font-mono" 
                                    value={fonnteToken} 
                                    onChange={e => setFonnteToken(e.target.value)}
                                    placeholder="Masukkan Token Fonnte..."
                                    type="password"
                                />
                                <button 
                                    onClick={handleCheckFonnteStatus}
                                    disabled={isCheckingFonnteStatus}
                                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    {isCheckingFonnteStatus ? <Icon name="Loader2" className="animate-spin" size={14}/> : <Icon name="Activity" size={14}/>}
                                    Cek Status
                                </button>
                            </div>
                        </div>

                        {/* Status Result Panel */}
                        {fonnteDeviceStatus && (
                            <div className={`p-4 rounded-xl border ${fonnteDeviceStatus.status ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} animate-[fadeIn_0.2s]`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name={fonnteDeviceStatus.status ? "Wifi" : "WifiOff"} size={18} className={fonnteDeviceStatus.status ? "text-green-400" : "text-red-400"} />
                                    <span className={`font-bold ${fonnteDeviceStatus.status ? "text-green-400" : "text-red-400"}`}>
                                        {fonnteDeviceStatus.status ? "Device Connected" : "Disconnected / Invalid Token"}
                                    </span>
                                </div>
                                
                                {fonnteDeviceStatus.status ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-[10px] md:text-xs text-gray-300 mt-3 border-t border-white/5 pt-2">
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Device Name</span>
                                            <span className="font-mono font-bold text-white">{fonnteDeviceStatus.name || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Device ID</span>
                                            <span className="font-mono text-white">{fonnteDeviceStatus.device || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Expired</span>
                                            <span className="font-mono text-white">{fonnteDeviceStatus.expired || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-0.5">Quota</span>
                                            <span className="font-mono text-white">{fonnteDeviceStatus.quota || '-'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] md:text-xs text-red-300 mt-1">{fonnteDeviceStatus.reason || "Tidak dapat menghubungi server Fonnte. Periksa token dan koneksi internet."}</p>
                                )}
                            </div>
                        )}

                        <div className="pt-2">
                            <button 
                                onClick={handleTestFonnte}
                                disabled={isTestingFonnte || !fonnteToken}
                                className="w-full py-2 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isTestingFonnte ? <Icon name="Loader2" className="animate-spin" size={14}/> : <Icon name="Send" size={14}/>}
                                Kirim Pesan Tes ke Admin
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Automation Webhook */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white">Automation Webhook</h3>
                            <p className="text-[10px] md:text-xs text-gray-400">Integrasi ke Zapier/Make untuk workflow lanjutan.</p>
                        </div>
                        <Icon name="Zap" size={20} className="text-yellow-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Webhook URL (POST)</label>
                            <input 
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500 font-mono" 
                                value={webhookUrl} 
                                onChange={e => setWebhookUrl(e.target.value)}
                                placeholder="https://hooks.zapier.com/..."
                            />
                        </div>
                        <button 
                            onClick={handleTestWebhook}
                            className="w-full py-2 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                        >
                            <Icon name="Activity" size={14}/> Trigger Test Event
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveNotifications} className="w-full md:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
                        <Icon name="Save" size={18} /> Simpan Konfigurasi
                    </button>
                </div>
            </motion.div>
        )}

        {/* === HIERARCHY MANAGEMENT (RESTRICTED) === */}
        {activeTab === 'hierarchy' && isSystemAdmin && (
            <motion.div 
                key="hierarchy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Manajemen Hirarki</h2>
                        <p className="text-xs text-gray-400 mt-1">Atur divisi dan jabatan yang tersedia di sistem.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Division List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Icon name="Briefcase" size={16} className="text-brand-400" />
                                Daftar Divisi
                            </h3>
                            
                            <form onSubmit={handleAddDivision} className="mb-4 flex gap-2">
                                <input 
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand-500" 
                                    placeholder="Nama Divisi Baru..."
                                    value={newDivName}
                                    onChange={e => setNewDivName(e.target.value)}
                                />
                                <button type="submit" className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">
                                    <Icon name="Plus" size={16} />
                                </button>
                            </form>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {managedDivisions.map(div => (
                                    <div 
                                        key={div.name}
                                        onClick={() => setSelectedDivForRole(div.name)}
                                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedDivForRole === div.name ? 'bg-brand-500/10 border-brand-500/30 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'} ${div.status === 'Nonaktif' ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        {editingDiv === div.name ? (
                                            <input 
                                                autoFocus
                                                className="flex-1 bg-black/40 border border-brand-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onBlur={() => handleEditDivisionName(div.name)}
                                                onKeyDown={e => e.key === 'Enter' && handleEditDivisionName(div.name)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold truncate">{div.name}</span>
                                        )}
                                        
                                        <div className="flex items-center gap-1 ml-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingDiv(div.name); setEditValue(div.name); }}
                                                className="p-1 hover:text-brand-400 transition-colors"
                                            >
                                                <Icon name="Edit" size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleDivisionStatus(div.name); }}
                                                className={`p-1 transition-colors ${div.status === 'Aktif' ? 'hover:text-orange-400' : 'hover:text-green-400'}`}
                                                title={div.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                <Icon name={div.status === 'Aktif' ? "Slash" : "CheckCircle"} size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteDivision(div.name); }}
                                                className="p-1 hover:text-red-400 transition-colors"
                                            >
                                                <Icon name="Trash2" size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Role List for Selected Division */}
                    <div className="lg:col-span-2 space-y-4">
                        {selectedDivForRole ? (
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Icon name="UserCheck" size={16} className="text-brand-400" />
                                        Jabatan di Divisi: <span className="text-brand-400">{selectedDivForRole}</span>
                                    </h3>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                        {managedRoles[selectedDivForRole]?.length || 0} Jabatan
                                    </span>
                                </div>

                                <form onSubmit={handleAddRole} className="mb-6 flex gap-2">
                                    <input 
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-500" 
                                        placeholder="Nama Jabatan Baru (Contoh: Manager, SPV, Staff)..."
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                    />
                                    <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                        <Icon name="Plus" size={14} /> Tambah
                                    </button>
                                </form>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {managedRoles[selectedDivForRole]?.map(role => (
                                        <div 
                                            key={role.name}
                                            className={`flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl group hover:border-white/20 transition-all ${role.status === 'Nonaktif' ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                                                    <Icon name="User" size={14} />
                                                </div>
                                                {editingRole?.div === selectedDivForRole && editingRole?.role === role.name ? (
                                                    <input 
                                                        autoFocus
                                                        className="flex-1 bg-black/40 border border-brand-500/50 rounded px-2 py-1 text-sm text-white outline-none"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={() => handleEditRoleName(selectedDivForRole, role.name)}
                                                        onKeyDown={e => e.key === 'Enter' && handleEditRoleName(selectedDivForRole, role.name)}
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-200 truncate">{role.name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <button 
                                                    onClick={() => { setEditingRole({ div: selectedDivForRole, role: role.name }); setEditValue(role.name); }}
                                                    className="p-2 text-gray-500 hover:text-brand-400 transition-colors"
                                                >
                                                    <Icon name="Edit" size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleRoleStatus(selectedDivForRole, role.name)}
                                                    className={`p-2 transition-colors ${role.status === 'Aktif' ? 'text-gray-500 hover:text-orange-400' : 'text-gray-500 hover:text-green-400'}`}
                                                    title={role.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    <Icon name={role.status === 'Aktif' ? "Slash" : "CheckCircle"} size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRole(selectedDivForRole, role.name)}
                                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Icon name="Trash2" size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {(!managedRoles[selectedDivForRole] || managedRoles[selectedDivForRole].length === 0) && (
                                        <div className="col-span-full p-12 text-center border border-dashed border-white/10 rounded-2xl">
                                            <p className="text-gray-500 text-sm italic">Belum ada jabatan di divisi ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Icon name="ArrowLeft" size={32} className="text-gray-600" />
                                </div>
                                <h3 className="text-white font-bold mb-1">Pilih Divisi</h3>
                                <p className="text-gray-500 text-xs max-w-[200px]">Silakan pilih divisi di sebelah kiri untuk mengatur jabatan yang tersedia.</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}

        {/* === SYSTEM ADMIN (RESTRICTED) === */}
        {activeTab === 'system' && isSystemAdmin && (
            <motion.div 
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
            >
                
                {/* Sub-Navigation */}
                <div className="flex flex-wrap gap-2 mb-6 md:mb-8 bg-black/30 p-1 rounded-xl w-full md:w-fit">
                    <button onClick={() => setSystemSubTab('announcements')} className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${systemSubTab === 'announcements' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Pengumuman</button>
                    <button onClick={() => setSystemSubTab('attendance')} className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${systemSubTab === 'attendance' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Absensi</button>
                    <button onClick={() => setSystemSubTab('holidays')} className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${systemSubTab === 'holidays' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Hari Libur</button>
                    <button onClick={() => setSystemSubTab('backup')} className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${systemSubTab === 'backup' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Backup</button>
                </div>

                <AnimatePresence mode="wait">
                    {systemSubTab === 'announcements' && (
                        <motion.div 
                            key="announcements"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-6"
                        >
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Buat Pengumuman Baru</h3>
                            <form onSubmit={handleAddAnnouncement} className="space-y-4">
                                <input className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-500" placeholder="Judul Pengumuman" value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)} required />
                                <textarea className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-500 h-24" placeholder="Isi pesan..." value={newAnnContent} onChange={e => setNewAnnContent(e.target.value)} required />
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <select className="w-full sm:w-auto bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none" value={newAnnPriority} onChange={e => setNewAnnPriority(e.target.value as any)}>
                                        <option value="low">Info Biasa (Low)</option>
                                        <option value="medium">Penting (Medium)</option>
                                        <option value="high">Urgent (High)</option>
                                    </select>
                                    <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-colors">Posting</button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-black/20">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Riwayat Pengumuman</h4>
                            </div>
                            
                            {/* Desktop View */}
                            <div className="hidden lg:block">
                                <table className="w-full text-left">
                                    <thead className="bg-black/10 text-[10px] uppercase text-gray-500 font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Tanggal</th>
                                            <th className="px-4 py-3">Judul</th>
                                            <th className="px-4 py-3">Prioritas</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {announcements.map(ann => (
                                            <tr key={ann.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-400">{ann.date}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-white">{ann.title}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                                                        ann.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        ann.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                        {ann.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                                        <Icon name="Trash2" size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="lg:hidden divide-y divide-white/5">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${
                                                    ann.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    ann.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                    {ann.priority}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-mono">{ann.date}</span>
                                            </div>
                                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 text-gray-500 hover:text-red-500 bg-white/5 rounded-lg">
                                                <Icon name="Trash2" size={14}/>
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-1">{ann.title}</p>
                                            <p className="text-xs text-gray-400 line-clamp-2">{ann.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {announcements.length === 0 && (
                                <div className="p-8 text-center text-gray-500 italic">Belum ada pengumuman.</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {systemSubTab === 'holidays' && (
                    <motion.div 
                        key="holidays"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Tambah Hari Libur</h3>
                            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <input className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-500" placeholder="Nama Hari Libur (Contoh: Idul Fitri)" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} required />
                                </div>
                                <div className="flex gap-2">
                                    <input type="date" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-brand-500" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required />
                                    <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-colors">Tambah</button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-black/20">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Hari Libur</h4>
                            </div>
                            
                            {/* Desktop View */}
                            <div className="hidden lg:block">
                                <table className="w-full text-left">
                                    <thead className="bg-black/10 text-[10px] uppercase text-gray-500 font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Tanggal</th>
                                            <th className="px-4 py-3">Keterangan</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                                            <tr key={h.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-sm font-mono text-brand-400">{h.date}</td>
                                                <td className="px-4 py-3 text-sm text-white font-medium">{h.name}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleDeleteHoliday(h.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                                        <Icon name="Trash2" size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="lg:hidden divide-y divide-white/5">
                                {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                                    <div key={h.id} className="p-4 flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex flex-col items-center justify-center border border-brand-500/20">
                                                <span className="text-[8px] font-bold text-brand-400 uppercase">{h.date.split('-')[1]}</span>
                                                <span className="text-xs font-black text-white leading-none">{h.date.split('-')[2]}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{h.name}</p>
                                                <p className="text-[10px] font-mono text-gray-500">{h.date}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteHoliday(h.id)} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 rounded-lg">
                                            <Icon name="Trash2" size={14}/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {holidays.length === 0 && (
                                <div className="p-8 text-center text-gray-500 italic">Belum ada hari libur yang diatur.</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {systemSubTab === 'attendance' && (
                    <motion.div 
                        key="attendance"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Jam Masuk (WIB)</label>
                                <input type="time" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" value={editWorkStart} onChange={e => setEditWorkStart(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Jam Pulang (WIB)</label>
                                <input type="time" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" value={editWorkEnd} onChange={e => setEditWorkEnd(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Toleransi Keterlambatan (Menit)</label>
                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" value={editGrace} onChange={e => setEditGrace(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Jatah Cuti Tahunan</label>
                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" value={editQuota} onChange={e => setEditQuota(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveAttendanceConfig} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors">Simpan Aturan</button>
                        </div>
                    </motion.div>
                )}

                {systemSubTab === 'backup' && (
                    <motion.div 
                        key="backup"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                    >
                        {/* Cloud Sync Section */}
                        <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-indigo-500/30 rounded-2xl p-4 md:p-6">
                            <div className="flex flex-col md:flex-row items-start gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0"><Icon name="Cloud" size={24} /></div>
                                <div className="flex-1 w-full">
                                    <h3 className="text-lg font-bold text-white">Cloud Database Sync</h3>
                                    <p className="text-sm text-gray-400 mt-1 mb-4">
                                        Unggah data lokal saat ini (Chat) ke Supabase Cloud untuk inisialisasi awal.
                                        Gunakan ini jika database masih kosong.
                                    </p>
                                    
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className="text-xs font-mono text-gray-300">
                                            Status: {connectionStatus === 'connected' ? 'Connected to Supabase' : 'Disconnected / Invalid Keys'}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={handleCloudSync} 
                                        disabled={isSyncing || connectionStatus !== 'connected'}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                    >
                                        {isSyncing ? <Icon name="Loader2" className="animate-spin" size={18}/> : <Icon name="UploadCloud" size={18}/>}
                                        {isSyncing ? 'Syncing...' : 'Sync Local Data to Cloud'}
                                    </button>
                                    {connectionStatus !== 'connected' && (
                                        <p className="text-xs text-red-400 mt-2">
                                            * Periksa konfigurasi di <code>services/supabaseClient.ts</code>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Local Backup Section */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Local Backup & Restore</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={handleExportConfig} className="p-4 bg-black/20 hover:bg-black/40 border border-white/10 rounded-xl text-left transition-colors group">
                                    <Icon name="Download" size={24} className="text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-bold text-white text-sm">Export Data</h4>
                                    <p className="text-xs text-gray-500 mt-1">Download JSON file</p>
                                </button>
                                <div className="relative p-4 bg-black/20 hover:bg-black/40 border border-white/10 rounded-xl text-left transition-colors group cursor-pointer">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportConfig} accept=".json" ref={fileInputRef} />
                                    <Icon name="Upload" size={24} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-bold text-white text-sm">Import Data</h4>
                                    <p className="text-xs text-gray-500 mt-1">Restore from JSON</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AddToolModal 
        isOpen={!!editingTool} 
        onClose={() => setEditingTool(null)} 
        onSave={handleSaveEdit} 
        initialData={editingTool || undefined} 
      />

      {(isAddEmployeeModalOpen || editingEmployee) && (
          <EditEmployeeModal 
              isOpen={true}
              onClose={() => {
                  setIsAddEmployeeModalOpen(false);
                  setEditingEmployee(null);
              }}
              onSave={handleSaveEmployee}
              employee={editingEmployee}
              availableDivisions={managedDivisions}
              availableRoles={managedRoles}
          />
      )}

      {/* CUSTOM TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md min-w-[300px]"
            style={{
              backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : toast.type === 'info' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(16, 185, 129, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <Icon name={toast.type === 'error' ? 'AlertCircle' : toast.type === 'info' ? 'Info' : 'CheckCircle'} size={20} className="text-white" />
            <span className="text-sm font-bold text-white">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
                  <Icon name="AlertTriangle" size={32} className="text-brand-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{confirmModal.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex border-t border-white/5">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-4 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
                >
                  {confirmModal.cancelText}
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 px-6 py-4 text-sm font-bold text-brand-400 hover:bg-brand-500/10 transition-colors border-l border-white/5"
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: any) => void;
    employee?: any;
    availableDivisions: { name: string, status: string }[];
    availableRoles: Record<string, { name: string, status: string }[]>;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onSave, employee, availableDivisions, availableRoles }) => {
    const activeDivisions = availableDivisions.filter(d => d.status === 'Aktif');
    
    const [formData, setFormData] = useState({
        no: employee?.no || 0,
        nama: employee?.nama || '',
        divisi: employee?.divisi || (activeDivisions[0]?.name || ''),
        role: employee?.role || '',
        email: employee?.email || '',
        wa: employee?.wa || '',
        status: employee?.status || 'Aktif'
    });

    // Update role if division changes and current role is not in new division or is inactive
    useEffect(() => {
        if (formData.divisi && availableRoles[formData.divisi]) {
            const rolesInDiv = availableRoles[formData.divisi].filter(r => r.status === 'Aktif');
            if (rolesInDiv.length > 0 && !rolesInDiv.some(r => r.name === formData.role)) {
                setFormData(prev => ({ ...prev, role: rolesInDiv[0].name }));
            }
        }
    }, [formData.divisi, availableRoles]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">{employee ? 'Edit Profil Karyawan' : 'Tambah Karyawan Baru'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <Icon name="X" size={20} />
                    </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                        <input 
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            placeholder="Masukkan nama lengkap..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Divisi</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all appearance-none"
                                    value={formData.divisi}
                                    onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                                >
                                    {activeDivisions.map(div => (
                                        <option key={div.name} value={div.name} className="bg-slate-900">{div.name}</option>
                                    ))}
                                </select>
                                <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jabatan</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all appearance-none disabled:opacity-50"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    disabled={!availableRoles[formData.divisi] || availableRoles[formData.divisi].filter(r => r.status === 'Aktif').length === 0}
                                >
                                    {availableRoles[formData.divisi] && availableRoles[formData.divisi].filter(r => r.status === 'Aktif').length > 0 ? (
                                        availableRoles[formData.divisi].filter(r => r.status === 'Aktif').map(role => (
                                            <option key={role.name} value={role.name} className="bg-slate-900">{role.name}</option>
                                        ))
                                    ) : (
                                        <option value="" className="bg-slate-900">Belum ada jabatan</option>
                                    )}
                                </select>
                                <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Kantor</label>
                        <input 
                            type="email"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="nama@stitbu.ac.id"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</label>
                        <input 
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
                            value={formData.wa}
                            onChange={(e) => setFormData({ ...formData, wa: e.target.value })}
                            placeholder="6281234567890"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
