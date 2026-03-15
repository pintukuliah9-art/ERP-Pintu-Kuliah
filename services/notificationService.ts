
import { User, UserPreferences } from '../types';

// Simple beep sound (Base64 MP3)
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTSSEAAAAAAAABAAAB//5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwAXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcX//5QAAAAAABAAAABAAAAEQAAAf//lAAAAAAAIAAAAEAAAAIAAAH//lAAAAAAAEAAAAQAAAAgAAAB//5QAAAAAAAQAAAAQAAAAwAAAf//lAAAAAAACAAAAEAAAAMAAAH//lAAAAAAAEAAAAQAAAAwAAAf//lAAAAAAACAAAAEAAAAQAAAH';

export const NotificationService = {
  
  // 1. Request Permission
  requestPermission: async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  // 2. Play Sound
  playSound: () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND);
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  },

  // 3. Show Browser Notification
  showBrowserNotification: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233497.png' // Generic Bell Icon
      });
      NotificationService.playSound();
    }
  },

  // 4. Send to WhatsApp (Open Link)
  sendToWhatsApp: (title: string, url: string, targetNumber: string) => {
    const text = `
*LINK BARU: ${title}*
---------------------------
🔗 URL: ${url}

Mohon segera dicek. Terima kasih.
    `.trim();

    const encodedText = encodeURIComponent(text);
    const waUrl = targetNumber 
      ? `https://wa.me/${targetNumber}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');
  },

  // 5. Webhook Trigger (Automation)
  triggerWebhook: async (data: any, action: string, webhookUrl: string) => {
    if (!webhookUrl) return;

    try {
      const payload = {
        event: action,
        data: data,
        timestamp: new Date().toISOString()
      };

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
          console.error("Webhook failed", err);
      });
      
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  },

  // 6. Direct Fonnte API Integration
  sendViaFonnte: async (data: any, token: string, targetNumber: string): Promise<{success: boolean, detail: string}> => {
    if (!token || !targetNumber) {
        return { success: false, detail: "Token Fonnte atau Nomor Tujuan kosong." };
    }

    let message = "";

    if (typeof data === 'string') {
        message = data;
    } else {
        message = `
*NOTIFIKASI SISTEM PINTU KULIAH*
---------------------------
🔔 Update: ${data.title || 'Informasi Baru'}
📝 Detail: ${data.content || data.description || '-'}

_Pesan otomatis dari Sistem Satu Pintu_
`.trim();
    }

    try {
        const formData = new FormData();
        formData.append('target', targetNumber);
        formData.append('message', message);
        
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                Authorization: token,
            },
            body: formData,
        });
        
        const result = await response.json();

        if (result.status) {
            return { success: true, detail: `Berhasil dikirim! ID: ${result.id || 'OK'}` };
        } else {
            return { success: false, detail: `Gagal: ${result.reason || 'Unknown Fonnte Error'}` };
        }

    } catch (error: any) {
        console.error('Fonnte API Error:', error);
        return { success: false, detail: error.message || "Error Koneksi" };
    }
  },

  // 7. Check Fonnte Token Validity / Device Status
  validateFonnteToken: async (token: string): Promise<any> => {
      try {
          const response = await fetch('https://api.fonnte.com/device', {
              method: 'POST',
              headers: {
                  Authorization: token,
              },
          });
          
          if (!response.ok) {
              return { status: false, reason: `HTTP Error: ${response.status}` };
          }

          const data = await response.json();
          // API Fonnte returns { status: true, ... } or { status: false, reason: "..." }
          
          if (data.status) {
              return {
                  status: true,
                  name: data.name || "Fonnte Device",
                  device: data.device || "Unknown ID",
                  expired: data.expired || "Unknown",
                  quota: data.quota || "Unknown"
              };
          } else {
              return { status: false, reason: data.reason || "Token valid tapi device disconnected/error." };
          }

      } catch (e: any) {
          console.error("Fonnte Validation Error:", e);
          return { status: false, reason: "Gagal menghubungi server Fonnte (Network/CORS Error)" };
      }
  }
};
