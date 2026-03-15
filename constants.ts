import { DivisionType, ToolCategory, DivisionData, UserRole, User, Announcement } from './types';

export const INITIAL_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  username: 'alex',
  role: UserRole.MANAGER,
  division: DivisionType.MARKETING,
  stickyNote: 'Remember to check Q3 reports by Friday.'
};

export const MOCK_USERS: User[] = [
    // --- SUPER ADMIN (IT SUPPORT) ---
    {
        id: 'admin_master',
        name: 'Super Admin',
        username: 'admin',
        role: UserRole.ADMIN,
        division: DivisionType.IT_SUPPORT,
        stickyNote: 'System Master Access',
        password: '123'
    }
];

export const EMPLOYEE_DATA = [
    {"no":1, "divisi":"Direksi", "role":"Direktur", "nama":"Roni Laksono", "email":"ronilaksono22@gmail.com", "wa":"6281353439034"},
    {"no":2, "divisi":"Direksi", "role":"GM", "nama":"Muhammad Zidane", "email":"muhammadzidane.3107@gmail.com", "wa":"6285664930321"},
    {"no":3, "divisi":"Direksi", "role":"BM", "nama":"Muhammad Afandi", "email":"muhammadafandi031297@gmail.com", "wa":"6385185210894"},
    {"no":4, "divisi":"Marketing", "role":"SPV", "nama":"Nur Kholis", "email":"nurkholis03052000@gmail.com", "wa":"6281374910467"},
    {"no":5, "divisi":"Marketing", "role":"Staff", "nama":"Nurul Fitri Kosasih", "email":"nurulftriko@gmail.com", "wa":"6285609499232"},
    {"no":6, "divisi":"Marketing", "role":"Staff", "nama":"Yuyun Dwi Fatma", "email":"yuyunmobile234@gmail.com", "wa":"6285147385068"},
    {"no":7, "divisi":"Marketing", "role":"Staff", "nama":"Ngafwan", "email":"ngafwank@gmail.com", "wa":"6285789129978"},
    {"no":8, "divisi":"Marketing", "role":"Staff", "nama":"Wenda", "email":"wendamaylani@gmail.com", "wa":"6285768262104"},
    {"no":9, "divisi":"Administrasi", "role":"SPV", "nama":"Asmalia Safitri", "email":"asmaliasafitri@gmail.com", "wa":"6285138607522"},
    {"no":10, "divisi":"Administrasi", "role":"Staff", "nama":"Endang Kurniasih", "email":"endangkurniaendang99@gmail.com", "wa":"6282376860409"},
    {"no":11, "divisi":"Administrasi", "role":"Staff", "nama":"Siti Aulia", "email":"sofiaaulia40@gmail.com", "wa":"6282160962023"},
    {"no":12, "divisi":"Administrasi", "role":"Staff", "nama":"Putri", "email":"putrimaratus53@gmail.com", "wa":"6285764245524"},
    {"no":13, "divisi":"Keuangan", "role":"SPV", "nama":"Ismawati", "email":"Isma.agt18@gmail.com", "wa":"6285147410838"},
    {"no":14, "divisi":"Keuangan", "role":"Staff", "nama":"Delisa Aprilia", "email":"delisaaprilia65@gmail.com", "wa":"6285959816204"},
    {"no":15, "divisi":"Keuangan", "role":"Staff", "nama":"Falahtun Fitriani", "email":"falahtunfitriyani9@gmail.com", "wa":"6285839329610"},
    {"no":16, "divisi":"IT Support", "role":"SPV", "nama":"Rizki", "email":"rizkynaufal87@gmail.com", "wa":"6285185210893"},
    {"no":17, "divisi":"IT Support", "role":"Staff", "nama":"Ragil", "email":"ragilfitriandini06@gmail.com", "wa":"6285185210892"},
    {"no":18, "divisi":"IT Support", "role":"Staff", "nama":"Muthi Amrillah", "email":"muthi.amrillah988@gmail.com", "wa":"6282280028934"},
    {"no":19, "divisi":"IT Support", "role":"Staff", "nama":"Aditya Yoga Prasasta", "email":"sheetizen@gmail.com", "wa":"628998138103"},
    {"no":20, "divisi":"Kebersihan & Keamanan", "role":"SPV", "nama":"Eddy Kosasih", "email":"-", "wa":"-"},
    {"no":21, "divisi":"Kebersihan & Keamanan", "role":"Staff", "nama":"Muhamad Arifin", "email":"-", "wa":"-"}
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Maintenance Server',
    content: 'Akan dilakukan maintenance server pada hari Minggu jam 02:00 WIB. Mohon simpan pekerjaan Anda.',
    date: '2023-10-25',
    priority: 'high'
  },
  {
    id: 'a2',
    title: 'Libur Nasional',
    content: 'Tanggal merah hari Jumat, kantor libur. Tim shift harap menyesuaikan jadwal.',
    date: '2023-10-24',
    priority: 'medium'
  },
  {
    id: 'a3',
    title: 'Update SOP Keuangan',
    content: 'Terdapat perubahan alur pengajuan reimbursement. Cek folder SOP terbaru.',
    date: '2023-10-20',
    priority: 'low'
  }
];

export const DIVISIONS: DivisionData[] = [
  {
    id: DivisionType.DIRECTORS,
    name: 'Direksi',
    description: 'Executive dashboard and strategic tools.',
    icon: 'Briefcase',
    workflow: [],
  },
  {
    id: DivisionType.MARKETING,
    name: 'Marketing',
    description: 'Campaigns, social media, and lead generation.',
    icon: 'Megaphone',
    workflow: [
      { id: 'm1', label: 'Lead Generation', description: 'Inbound capture via Ads', relatedToolIds: ['t_fbads', 't_gads'] },
      { id: 'm2', label: 'Follow Up', description: 'Contacting leads via WA/Email', relatedToolIds: ['t_wa'] },
      { id: 'm3', label: 'Closing', description: 'Finalizing deal & invoicing request', relatedToolIds: ['t_crm'] },
      { id: 'm4', label: 'Handover', description: 'Pass to Admin for processing', relatedToolIds: ['t_slack'] }
    ],
  },
  {
    id: DivisionType.ADMIN,
    name: 'Administrasi',
    description: 'Data entry, verification, and filing.',
    icon: 'FileText',
    workflow: [
      { id: 'ad1', label: 'Input Data', description: 'Entry from marketing handover', relatedToolIds: [] },
      { id: 'ad2', label: 'Verification', description: 'Check completeness', relatedToolIds: [] },
      { id: 'ad3', label: 'Validation', description: 'Manager approval', relatedToolIds: [] }
    ],
  },
  {
    id: DivisionType.FINANCE,
    name: 'Keuangan',
    description: 'Invoicing, payroll, and financial reports.',
    icon: 'DollarSign',
    workflow: [
      { id: 'f1', label: 'Invoicing', description: 'Create tagihan', relatedToolIds: [] },
      { id: 'f2', label: 'Payment Check', description: 'Verify bank mutation', relatedToolIds: [] },
      { id: 'f3', label: 'Reporting', description: 'Monthly closing', relatedToolIds: [] }
    ],
  },
  {
    id: DivisionType.IT_SUPPORT,
    name: 'IT Support',
    description: 'Tech infrastructure and helpdesk.',
    icon: 'Cpu',
    workflow: [],
  },
  {
    id: DivisionType.GA_SECURITY,
    name: 'Kebersihan & Keamanan',
    description: 'General affairs and facility management.',
    icon: 'Shield',
    workflow: [],
  },
  {
    id: DivisionType.PARTNERS,
    name: 'Mitra Kampus',
    description: 'Partnership management and events.',
    icon: 'Users',
    workflow: [],
  }
];

export const SEED_TOOLS = [
  // --- 1. GLOBAL / SHARED (All Divisions) ---
  { id: 't_absensi', name: 'Presensi Online', url: 'https://docs.google.com/forms/d/e/1FAIpQLSca123456789/viewform', category: ToolCategory.DAILY, icon: 'Fingerprint', color: 'bg-emerald-600' },
  { id: 't_tasks_ext', name: 'Daftar Kerja', url: 'https://trello.com/b/your-board', category: ToolCategory.DAILY, icon: 'CheckSquare', color: 'bg-brand-600' },
  { id: 't_email', name: 'Webmail Kantor', url: 'https://gmail.com', category: ToolCategory.DAILY, icon: 'Mail', color: 'bg-red-500' },
  { id: 't_drive_comp', name: 'Drive Perusahaan', url: 'https://drive.google.com', category: ToolCategory.SHARED, icon: 'HardDrive', color: 'bg-blue-600' },
  { id: 't_meet', name: 'Ruang Meeting (GMeet)', url: 'https://meet.google.com', category: ToolCategory.SHARED, icon: 'Video', color: 'bg-amber-500' },
  { id: 't_sop', name: 'Portal SOP & Aturan', url: '#', category: ToolCategory.SHARED, icon: 'BookOpen', color: 'bg-indigo-600' },

  // --- 2. DIREKSI (Executives) ---
  { id: 't_dir_kpi', name: 'Dashboard KPI', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.DIRECTORS, icon: 'BarChart2', color: 'bg-purple-600' },
  { id: 't_dir_report', name: 'Laporan Konsolidasi', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.DIRECTORS, icon: 'FileText', color: 'bg-slate-600' },
  { id: 't_dir_approve', name: 'Sistem Approval', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.DIRECTORS, icon: 'CheckCircle', color: 'bg-green-600' },
  { id: 't_dir_plan', name: 'Rencana Bisnis 2024', url: '#', category: ToolCategory.PROJECT, divisionId: DivisionType.DIRECTORS, icon: 'Map', color: 'bg-orange-500' },

  // --- 3. MARKETING ---
  { id: 't_mkt_fb', name: 'Meta Ads Manager', url: 'https://business.facebook.com', category: ToolCategory.PROJECT, divisionId: DivisionType.MARKETING, icon: 'Activity', color: 'bg-blue-600' },
  { id: 't_mkt_wa', name: 'Fonnte WA Blast', url: 'https://fonnte.com', category: ToolCategory.DAILY, divisionId: DivisionType.MARKETING, icon: 'MessageCircle', color: 'bg-green-500' },
  { id: 't_mkt_canva', name: 'Canva Pro', url: 'https://www.canva.com', category: ToolCategory.PROJECT, divisionId: DivisionType.MARKETING, icon: 'Palette', color: 'bg-cyan-500' },
  { id: 't_mkt_ig', name: 'Instagram Creator', url: 'https://instagram.com', category: ToolCategory.PROJECT, divisionId: DivisionType.MARKETING, icon: 'Camera', color: 'bg-pink-600' },
  { id: 't_mkt_crm', name: 'Database Leads', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.MARKETING, icon: 'Database', color: 'bg-indigo-500' },
  { id: 't_mkt_tiktok', name: 'TikTok Seller', url: '#', category: ToolCategory.PROJECT, divisionId: DivisionType.MARKETING, icon: 'Music', color: 'bg-black' },

  // --- 4. ADMINISTRASI (Admin) ---
  { id: 't_adm_surat', name: 'Template Surat', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.ADMIN, icon: 'File', color: 'bg-blue-500' },
  { id: 't_adm_arsip', name: 'E-Arsip Digital', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.ADMIN, icon: 'Archive', color: 'bg-amber-600' },
  { id: 't_adm_inv', name: 'Inventaris Kantor', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.ADMIN, icon: 'Package', color: 'bg-orange-500' },
  { id: 't_adm_data', name: 'Database Mahasiswa', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.ADMIN, icon: 'Users', color: 'bg-teal-600' },

  // --- 5. KEUANGAN (Finance) ---
  { id: 't_fin_bca', name: 'KlikBCA Bisnis', url: 'https://vpn.klikbca.com', category: ToolCategory.DAILY, divisionId: DivisionType.FINANCE, icon: 'CreditCard', color: 'bg-blue-800' },
  { id: 't_fin_tax', name: 'DJP Online (Pajak)', url: 'https://djponline.pajak.go.id', category: ToolCategory.SHARED, divisionId: DivisionType.FINANCE, icon: 'FileCheck', color: 'bg-yellow-500' },
  { id: 't_fin_payroll', name: 'Sistem Penggajian', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.FINANCE, icon: 'DollarSign', color: 'bg-green-700' },
  { id: 't_fin_cash', name: 'Petty Cash Log', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.FINANCE, icon: 'FileSpreadsheet', color: 'bg-emerald-500' },
  { id: 't_fin_inv', name: 'Invoicing App', url: '#', category: ToolCategory.PROJECT, divisionId: DivisionType.FINANCE, icon: 'Printer', color: 'bg-indigo-600' },

  // --- 6. IT SUPPORT ---
  { id: 't_it_panel', name: 'cPanel Hosting', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.IT_SUPPORT, icon: 'Server', color: 'bg-orange-600' },
  { id: 't_it_ticket', name: 'Helpdesk Tiket', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.IT_SUPPORT, icon: 'LifeBuoy', color: 'bg-blue-500' },
  { id: 't_it_mikrotik', name: 'Mikrotik Monitor', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.IT_SUPPORT, icon: 'Wifi', color: 'bg-slate-700' },
  { id: 't_it_git', name: 'GitHub Repo', url: 'https://github.com', category: ToolCategory.PROJECT, divisionId: DivisionType.IT_SUPPORT, icon: 'Github', color: 'bg-gray-900' },
  { id: 't_it_domain', name: 'Domain Manager', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.IT_SUPPORT, icon: 'Globe', color: 'bg-cyan-600' },

  // --- 7. KEBERSIHAN & KEAMANAN (GA/Security) ---
  { id: 't_ga_sched', name: 'Jadwal Piket', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.GA_SECURITY, icon: 'Calendar', color: 'bg-green-500' },
  { id: 't_ga_cctv', name: 'Monitor CCTV', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.GA_SECURITY, icon: 'Eye', color: 'bg-red-600' },
  { id: 't_ga_guest', name: 'Buku Tamu Digital', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.GA_SECURITY, icon: 'Clipboard', color: 'bg-blue-500' },
  { id: 't_ga_stock', name: 'Stok Kebersihan', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.GA_SECURITY, icon: 'ShoppingCart', color: 'bg-amber-500' },

  // --- 8. MITRA KAMPUS (Partnership) ---
  { id: 't_prt_db', name: 'Database Mitra', url: '#', category: ToolCategory.DAILY, divisionId: DivisionType.PARTNERS, icon: 'Database', color: 'bg-indigo-600' },
  { id: 't_prt_mou', name: 'Arsip MoU', url: '#', category: ToolCategory.SHARED, divisionId: DivisionType.PARTNERS, icon: 'FileText', color: 'bg-teal-500' },
  { id: 't_prt_event', name: 'Kalender Event', url: '#', category: ToolCategory.PROJECT, divisionId: DivisionType.PARTNERS, icon: 'CalendarDays', color: 'bg-pink-500' },
  { id: 't_prt_prop', name: 'Draft Proposal', url: '#', category: ToolCategory.PROJECT, divisionId: DivisionType.PARTNERS, icon: 'PenTool', color: 'bg-blue-400' },
];