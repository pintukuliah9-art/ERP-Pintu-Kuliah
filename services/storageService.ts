
import { Tool, User, Announcement, ChatMessage, DivisionType, ActivityLog, UserPreferences, AttendanceRecord, AttendanceConfig, Holiday, SystemBackup, UserRole, ChatGroup } from '../types';
import { INITIAL_USER, MOCK_ANNOUNCEMENTS, SEED_TOOLS, MOCK_USERS, EMPLOYEE_DATA } from '../constants';

const KEYS = {
  TOOLS: 'ogws_tools',
  USER: 'ogws_user', // Current logged in user
  USERS_LIST: 'ogws_users_list', // Database of all users
  ANNOUNCEMENTS: 'ogws_announcements',
  THEME: 'ogws_theme',
  MESSAGES: 'ogws_chat_messages',
  GROUPS: 'ogws_chat_groups', // Key for groups
  ACTIVITY: 'ogws_activity_log',
  PREFERENCES: 'ogws_preferences',
  ATTENDANCE: 'ogws_attendance',
  ATTENDANCE_CONFIG: 'ogws_attendance_config',
  HOLIDAYS: 'ogws_holidays',
  MANAGED_DIVISIONS: 'ogws_managed_divisions',
  MANAGED_ROLES: 'ogws_managed_roles',
  MANAGED_EMPLOYEES: 'ogws_managed_employees'
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const SEED_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'u2', senderName: 'Sarah Connor', channelId: 'GENERAL', content: 'Has everyone reviewed the new SOP?', timestamp: Date.now() - 10000000 },
  { id: 'm2', senderId: 'u1', senderName: 'Alex Johnson', channelId: 'GENERAL', content: 'Yes, looking good. Thanks Sarah.', timestamp: Date.now() - 9000000 },
  { id: 'm3', senderId: 'u3', senderName: 'Mike Ross', channelId: DivisionType.MARKETING, content: 'Ads spend is up 20% this week.', timestamp: Date.now() - 5000000 },
  { id: 'm4', senderId: 'u1', senderName: 'Alex Johnson', channelId: DivisionType.MARKETING, content: 'Great! Keep pushing the creative set B.', timestamp: Date.now() - 4000000 },
  { id: 'm5', senderId: 'u4', senderName: 'Jessica P', channelId: DivisionType.FINANCE, content: 'Invoice #402 is pending approval.', timestamp: Date.now() - 200000 },
];

const SEED_ACTIVITY: ActivityLog[] = [
    { id: 'log1', action: 'System Login', details: 'Accessed dashboard', timestamp: Date.now() - 10000000 },
    { id: 'log2', action: 'Opened Tool', details: 'Google Drive Company', timestamp: Date.now() - 5000000 },
    { id: 'log3', action: 'Chat', details: 'Sent message in Marketing', timestamp: Date.now() - 4000000 },
];

export const StorageService = {
  // Tools
  getTools: (): Tool[] => {
    const stored = localStorage.getItem(KEYS.TOOLS);
    return stored ? JSON.parse(stored) : SEED_TOOLS;
  },
  saveTools: (tools: Tool[]) => {
    localStorage.setItem(KEYS.TOOLS, JSON.stringify(tools));
  },

  // Hierarchy & Employees
  getManagedDivisions: (): { name: string, status: 'Aktif' | 'Nonaktif' }[] => {
    const stored = localStorage.getItem(KEYS.MANAGED_DIVISIONS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return parsed.map(name => ({ name, status: 'Aktif' }));
      }
      return parsed;
    }
    return Object.values(DivisionType).map(name => ({ name, status: 'Aktif' }));
  },
  saveManagedDivisions: (data: any[]) => {
    localStorage.setItem(KEYS.MANAGED_DIVISIONS, JSON.stringify(data));
  },
  getManagedRoles: (): Record<string, { name: string, status: 'Aktif' | 'Nonaktif' }[]> => {
    const stored = localStorage.getItem(KEYS.MANAGED_ROLES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        if (keys.length > 0 && Array.isArray(parsed[keys[0]]) && typeof parsed[keys[0]][0] === 'string') {
          const migrated: Record<string, any[]> = {};
          Object.entries(parsed).forEach(([div, roles]) => {
            migrated[div] = (roles as string[]).map(name => ({ name, status: 'Aktif' }));
          });
          return migrated;
        }
      }
      return parsed;
    }
    const defaults: Record<string, any[]> = {};
    Object.values(DivisionType).forEach(div => {
      const roles = Array.from(new Set(EMPLOYEE_DATA.filter(e => e.divisi === div).map(e => e.role)));
      defaults[div] = roles.length > 0 
        ? roles.map(name => ({ name, status: 'Aktif' })) 
        : [{ name: 'Staff', status: 'Aktif' }];
    });
    return defaults;
  },
  saveManagedRoles: (data: Record<string, any[]>) => {
    localStorage.setItem(KEYS.MANAGED_ROLES, JSON.stringify(data));
  },
  getManagedEmployees: (): any[] => {
    const stored = localStorage.getItem(KEYS.MANAGED_EMPLOYEES);
    return stored ? JSON.parse(stored) : EMPLOYEE_DATA;
  },
  saveManagedEmployees: (data: any[]) => {
    localStorage.setItem(KEYS.MANAGED_EMPLOYEES, JSON.stringify(data));
  },

  // Users
  getUsers: (): User[] => {
    const employees = StorageService.getManagedEmployees();
    
    const employeeUsers: User[] = employees.map(emp => {
        let role = UserRole.STAFF;
        const r = emp.role.toLowerCase();
        if (r.includes('spv') || r.includes('direktur') || r.includes('gm') || r.includes('manager')) {
            role = UserRole.MANAGER;
        }

        return {
            id: `emp_${emp.no}`,
            name: emp.nama,
            username: emp.nama.toLowerCase().replace(/\s/g, ''),
            role: role,
            division: emp.divisi as DivisionType,
            stickyNote: 'Welcome to Pintu Kuliah System!',
            status: emp.status || 'Aktif'
        };
    });

    const allUsers = [...MOCK_USERS, ...employeeUsers];
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(allUsers));
    return allUsers;
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
  },
  
  // Auth
  getUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },
  saveUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem(KEYS.USER);
  },
  
  // UPDATED LOGIN LOGIC
  login: (identifier: string, credential?: string): User | null => {
      const allUsers = StorageService.getUsers();

      // 1. Check Admin / Mock Users (Username + Password)
      // Only for users defined in MOCK_USERS (like 'admin')
      const mockUser = MOCK_USERS.find(u => u.username === identifier && u.password === credential);
      if (mockUser) return mockUser;

      // 2. Check Employee Data (Username matching)
      // For employees, we rely on the selection from the UI.
      // 'identifier' here is expected to be the 'username' (lowercase name without spaces)
      const employeeUser = allUsers.find(u => u.username === identifier);

      if (employeeUser && !MOCK_USERS.find(m => m.id === employeeUser.id)) {
          // It's a regular employee. 
          // If a credential (password) is provided, verify it (optional future proofing).
          // For now, allow access if the user exists in the employee list.
          // The "Security" is the Division -> Name flow in a trusted environment.
          return employeeUser;
      }
      
      return null;
  },

  // Announcements
  getAnnouncements: (): Announcement[] => {
    const stored = localStorage.getItem(KEYS.ANNOUNCEMENTS);
    return stored ? JSON.parse(stored) : MOCK_ANNOUNCEMENTS;
  },
  saveAnnouncements: (data: Announcement[]) => {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(data));
  },

  // Chat
  getMessages: (): ChatMessage[] => {
    const stored = localStorage.getItem(KEYS.MESSAGES);
    return stored ? JSON.parse(stored) : SEED_MESSAGES;
  },
  saveMessages: (msgs: ChatMessage[]) => {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(msgs));
  },
  getChatGroups: (): ChatGroup[] => {
      const stored = localStorage.getItem(KEYS.GROUPS);
      return stored ? JSON.parse(stored) : [];
  },
  createChatGroup: (group: ChatGroup) => {
      const groups = StorageService.getChatGroups();
      groups.push(group);
      localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  },

  // Activity Log
  getActivityLogs: (): ActivityLog[] => {
    const stored = localStorage.getItem(KEYS.ACTIVITY);
    return stored ? JSON.parse(stored) : SEED_ACTIVITY;
  },
  logActivity: (action: string, details: string) => {
      const logs = StorageService.getActivityLogs();
      const newLog: ActivityLog = {
          id: `log_${Date.now()}`,
          action,
          details,
          timestamp: Date.now()
      };
      const updated = [newLog, ...logs].slice(0, 50); // Keep last 50
      localStorage.setItem(KEYS.ACTIVITY, JSON.stringify(updated));
  },

  // Preferences
  getPreferences: (): UserPreferences => {
      const stored = localStorage.getItem(KEYS.PREFERENCES);
      if (stored) return JSON.parse(stored);
      
      const defaultPref: UserPreferences = {
          theme: 'light', // Default to light mode
          emailNotifications: true,
          soundEnabled: true,
          language: 'id'
      };
      return defaultPref;
  },
  savePreferences: (prefs: UserPreferences) => {
      localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  // Record Usage
  recordAccess: (toolId: string) => {
    const tools = StorageService.getTools();
    const updated = tools.map(t => t.id === toolId ? { ...t, lastAccessed: Date.now() } : t);
    StorageService.saveTools(updated);
  },

  // Attendance
  getAttendanceConfig: (): AttendanceConfig => {
      const stored = localStorage.getItem(KEYS.ATTENDANCE_CONFIG);
      if (stored) return JSON.parse(stored);
      return {
          workStartTime: '08:00',
          workEndTime: '17:00',
          gracePeriodMinutes: 15,
          workDays: [1,2,3,4,5], // Mon-Fri
          annualLeaveQuota: 12,
          officeLat: -6.200000, 
          officeLng: 106.816666,
          allowedRadiusMeters: 100
      };
  },
  saveAttendanceConfig: (config: AttendanceConfig) => {
      localStorage.setItem(KEYS.ATTENDANCE_CONFIG, JSON.stringify(config));
  },

  getHolidays: (): Holiday[] => {
      const stored = localStorage.getItem(KEYS.HOLIDAYS);
      return stored ? JSON.parse(stored) : [
          { id: 'h1', date: '2023-12-25', name: 'Christmas Day' },
          { id: 'h2', date: '2024-01-01', name: 'New Year' }
      ];
  },
  saveHolidays: (holidays: Holiday[]) => {
      localStorage.setItem(KEYS.HOLIDAYS, JSON.stringify(holidays));
  },

  getAttendanceHistory: (): AttendanceRecord[] => {
      const stored = localStorage.getItem(KEYS.ATTENDANCE);
      return stored ? JSON.parse(stored) : [];
  },
  getTodayAttendance: (userId: string): AttendanceRecord | undefined => {
      const history = StorageService.getAttendanceHistory();
      const today = new Date().toISOString().split('T')[0];
      return history.find(r => r.userId === userId && r.date === today);
  },
  clockIn: (userId: string, location: 'WFO' | 'WFH', notes?: string, coords?: {lat: number, lng: number}, mood?: string): AttendanceRecord => {
      const history = StorageService.getAttendanceHistory();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if already clocked in
      const existing = history.find(r => r.userId === userId && r.date === today);
      if (existing) return existing;

      const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}`,
          userId,
          date: today,
          checkInTime: now.getTime(),
          location,
          notes,
          latitude: coords?.lat,
          longitude: coords?.lng,
          mood: mood || '🙂'
      };

      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([...history, newRecord]));
      return newRecord;
  },
  clockOut: (recordId: string) => {
      const history = StorageService.getAttendanceHistory();
      const updated = history.map(r => r.id === recordId ? { ...r, checkOutTime: Date.now() } : r);
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(updated));
  },

  // Backup System
  createBackup: (): SystemBackup => {
      return {
          version: '1.1',
          timestamp: Date.now(),
          tools: StorageService.getTools(),
          announcements: StorageService.getAnnouncements(),
          attendanceConfig: StorageService.getAttendanceConfig(),
          holidays: StorageService.getHolidays(),
          users: StorageService.getUsers(),
          messages: StorageService.getMessages(),
          groups: StorageService.getChatGroups()
      };
  },
  restoreBackup: (backup: any) => {
      if (backup.tools) StorageService.saveTools(backup.tools);
      if (backup.announcements) StorageService.saveAnnouncements(backup.announcements);
      if (backup.attendanceConfig) StorageService.saveAttendanceConfig(backup.attendanceConfig);
      if (backup.holidays) StorageService.saveHolidays(backup.holidays);
      if (backup.users) StorageService.saveUsers(backup.users);
      if (backup.messages) StorageService.saveMessages(backup.messages);
      if (backup.groups) localStorage.setItem(KEYS.GROUPS, JSON.stringify(backup.groups));
      
      // Force reload to apply
      window.location.reload();
  },
  
  exportToJSON: () => {
    const data = {
      ...StorageService.createBackup(),
      localStorage: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ogws_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
