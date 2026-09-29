// lib/pushNotificationService.ts
// Push Notification helper integrating Service Worker for Gold Payments Bank

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;

  public async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.registration = reg;
      this.isRegistered = true;
      return true;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return false;
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  }

  public getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.init();
      }
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  public async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      // 1. Try sending through the registered Service Worker
      if ('serviceWorker' in navigator) {
        const swReady = await navigator.serviceWorker.ready;
        if (swReady && swReady.showNotification) {
          await swReady.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.tag || 'gpb-tx-' + Date.now(),
            vibrate: [200, 100, 200],
            data: {
              url: payload.url || '/',
              timestamp: Date.now(),
              ...payload.data,
            },
          });
          return true;
        }
      }

      // 2. Fallback to standard window Notification if ServiceWorker not fully ready
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        tag: payload.tag,
      });
      return true;
    } catch (err) {
      console.warn('Could not display push notification:', err);
      return false;
    }
  }
}

export const pushService = new PushNotificationManager();
