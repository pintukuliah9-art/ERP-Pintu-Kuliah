
import { StorageService } from './storageService';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ChatMessage, ChatGroup } from '../types';

// Helper to safely stringify errors
const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown Error';
    
    // Handle Supabase PostgrestError specifically
    if (typeof error === 'object' && error !== null) {
        // If it has a 'message' property
        if (error.message) {
            // Append details or hint if available
            let msg = error.message;
            if (error.details) msg += ` (${error.details})`;
            if (error.hint) msg += ` Hint: ${error.hint}`;
            return msg;
        }
        // If it has error_description (Auth errors)
        if (error.error_description) return error.error_description;
    }

    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;

    try {
        return JSON.stringify(error);
    } catch (e) {
        return 'Non-serializable error object';
    }
};

export const UnifiedDataService = {
    
    // --- CHAT MESSAGES ---

    getMessages: async (): Promise<ChatMessage[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase!
                    .from('chat_messages')
                    .select('*')
                    .order('timestamp', { ascending: true })
                    .limit(500); 
                
                if (error) {
                    console.warn("Supabase Error (getMessages):", getErrorMessage(error));
                    return StorageService.getMessages();
                }

                if (data) {
                    return data.map((d: any) => ({
                        id: d.id,
                        content: d.content,
                        senderId: d.sender_id,
                        senderName: d.sender_name,
                        channelId: d.channel_id,
                        timestamp: d.timestamp
                    }));
                }
            } catch (err) {
                console.warn("Supabase Exception (getMessages):", err);
                return StorageService.getMessages();
            }
        }
        return StorageService.getMessages();
    },

    sendMessage: async (msg: ChatMessage) => {
        // Local Save
        const current = StorageService.getMessages();
        StorageService.saveMessages([...current, msg]);

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase!.from('chat_messages').insert([{
                    id: msg.id,
                    content: msg.content,
                    sender_id: msg.senderId,
                    sender_name: msg.senderName,
                    channel_id: msg.channelId,
                    timestamp: msg.timestamp
                }]);
                if (error) console.warn("DB Message Error:", getErrorMessage(error));
            } catch (err) {
                console.warn("DB Message Exception:", getErrorMessage(err));
            }
        }
    },

    // --- CHAT GROUPS ---

    getChatGroups: async (): Promise<ChatGroup[]> => {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase!
                    .from('chat_groups')
                    .select('*');
                
                if (error) {
                    console.warn("Supabase Error (getChatGroups):", getErrorMessage(error));
                    return StorageService.getChatGroups();
                }

                if (data) {
                    return data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        memberIds: d.member_ids,
                        createdBy: d.created_by,
                        createdAt: d.created_at
                    }));
                }
            } catch (err) {
                console.warn("Supabase Exception (getChatGroups):", err);
                return StorageService.getChatGroups();
            }
        }
        return StorageService.getChatGroups();
    },

    createChatGroup: async (group: ChatGroup) => {
        // Local Save
        StorageService.createChatGroup(group);

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase!.from('chat_groups').insert([{
                    id: group.id,
                    name: group.name,
                    member_ids: group.memberIds,
                    created_by: group.createdBy,
                    created_at: group.createdAt
                }]);
                if (error) console.warn("DB Group Error:", getErrorMessage(error));
            } catch (err) {
                console.warn("DB Group Exception:", getErrorMessage(err));
            }
        }
    },

    // --- REALTIME SUBSCRIPTIONS ---
    
    subscribeToUpdates: (
        onMessageInsert: (newMsg: ChatMessage) => void,
        onGroupChange: () => void
    ) => {
        if (!isSupabaseConfigured()) return null;

        try {
            const channel = supabase!.channel('db-realtime')
                // Listen for Chat Messages
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    (payload) => {
                        const d = payload.new;
                        onMessageInsert({
                            id: d.id,
                            content: d.content,
                            senderId: d.sender_id,
                            senderName: d.sender_name,
                            channelId: d.channel_id,
                            timestamp: d.timestamp
                        });
                    }
                )
                // Listen for Groups
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'chat_groups' },
                    () => onGroupChange()
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // console.log('Connected to realtime');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.warn('Supabase Realtime Error: Connection failed');
                    }
                });

            return channel;
        } catch (err) {
            console.warn("Realtime Subscription Exception:", err);
            return null;
        }
    },

    // --- DATA MIGRATION / SYNC ---
    syncLocalToCloud: async (messages: ChatMessage[], groups: ChatGroup[]) => {
        if (!isSupabaseConfigured()) return { success: false, message: 'Supabase client not initialized' };
        
        try {
            // 1. Sync Messages
            if (messages.length > 0) {
                const { error } = await supabase!.from('chat_messages').upsert(
                    messages.map(m => ({
                        id: m.id,
                        content: m.content,
                        sender_id: m.senderId,
                        sender_name: m.senderName,
                        channel_id: m.channelId,
                        timestamp: m.timestamp
                    })),
                    { onConflict: 'id' }
                );
                
                if (error) {
                    const msg = getErrorMessage(error);
                    console.error("Sync Messages Error:", msg);
                    if (msg.includes('relation "public.chat_messages" does not exist') || msg.includes('42P01')) {
                        return { success: false, message: "Tabel 'chat_messages' belum ada. Jalankan script SQL." };
                    }
                    return { success: false, message: `Messages Sync Failed: ${msg}` };
                }
            }

            // 2. Sync Groups
            if (groups.length > 0) {
                const { error } = await supabase!.from('chat_groups').upsert(
                    groups.map(g => ({
                        id: g.id,
                        name: g.name,
                        member_ids: g.memberIds,
                        created_by: g.createdBy,
                        created_at: g.createdAt
                    })),
                    { onConflict: 'id' }
                );
                
                if (error) {
                    const msg = getErrorMessage(error);
                    console.error("Sync Groups Error:", msg);
                    if (msg.includes('relation "public.chat_groups" does not exist') || msg.includes('42P01')) {
                        return { success: false, message: "Tabel 'chat_groups' belum ada. Jalankan script SQL." };
                    }
                    return { success: false, message: `Groups Sync Failed: ${msg}` };
                }
            }

            return { success: true };
        } catch (e) {
            console.error("Sync Unexpected Error:", e);
            return { success: false, message: getErrorMessage(e) };
        }
    }
};
    