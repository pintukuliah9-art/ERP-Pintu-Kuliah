
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum DivisionType {
  DIRECTORS = 'Direksi',
  MARKETING = 'Marketing',
  ADMIN = 'Administrasi',
  FINANCE = 'Keuangan',
  IT_SUPPORT = 'IT Support',
  GA_SECURITY = 'Kebersihan & Keamanan',
  PARTNERS = 'Mitra Kampus'
}

export enum ToolCategory {
  DAILY = 'Daily Tools',
  SHARED = 'Shared Tools',
  PROJECT = 'Project & Drafts'
}

export type LanguageCode = 'id' | 'en';

export interface Tool {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category: ToolCategory;
  divisionId?: DivisionType;
  isPersonal?: boolean;
  isArchived?: boolean;
  deletedAt?: number;
  isLocked?: boolean;
  isDisabled?: boolean;
  color?: string;
  lastAccessed?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  relatedToolIds: string[];
}

export interface DivisionData {
  id: DivisionType;
  name: string;
  description: string;
  icon: string;
  workflow: WorkflowStep[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  division: DivisionType;
  stickyNote: string;
  password?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channelId: string;
  content: string;
  timestamp: number;
}

export interface ChatGroup {
  id: string;
  name: string;
  memberIds: string[]; // ID user yang tergabung
  createdBy: string;
  createdAt: number;
  isPublic?: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  emailNotifications: boolean;
  soundEnabled: boolean;
  language: LanguageCode;
  // New Fields
  whatsappNumber?: string; // Default target for WA Broadcast
  autoSendWa?: boolean;
  webhookUrl?: string; // URL for automation (Zapier/Make)
  fonnteToken?: string; // Token for Direct Fonnte API
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: number;
  checkOutTime?: number;
  location: 'WFO' | 'WFH';
  notes?: string;
  latitude?: number;
  longitude?: number;
  mood?: string;
}

export interface AttendanceConfig {
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  workDays: number[];
  annualLeaveQuota: number;
  officeLat?: number;
  officeLng?: number;
  allowedRadiusMeters?: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface SystemBackup {
  version: string;
  timestamp: number;
  tools: Tool[];
  announcements: Announcement[];
  attendanceConfig: AttendanceConfig;
  holidays: Holiday[];
  users?: User[];
  messages?: ChatMessage[];
  groups?: ChatGroup[];
}