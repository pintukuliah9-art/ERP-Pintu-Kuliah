
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI DATABASE ---
// URL Project Supabase (Must be exact)
const SUPABASE_URL = 'https://utxlthrfsdjgulzvmrpd.supabase.co'; 

// Anon / Public Key (Must be exact)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0eGx0aHJmc2RqZ3VsenZtcnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYxOTMsImV4cCI6MjA4MDQ1MjE5M30.z5-t3jdMNkH5_J4qnO6CT_8OEPvL9JMOyhHgdzreH0s'; 

// Basic check to ensure key exists and isn't a placeholder
const isKeyValid = (key: string) => {
    if (!key) return false;
    if (key.includes('sb_secret') || key.length < 20) return false; 
    return true;
};

// Initialize Supabase Client
export const supabase = (SUPABASE_URL && isKeyValid(SUPABASE_ANON_KEY)) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Helper to check status
export const isSupabaseConfigured = () => {
    return !!supabase;
};
