import { useEffect, useState, useCallback } from 'react';

// Declarations for Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
          query_id?: string;
        };
        themeParams?: Record<string, string>;
        colorScheme?: 'light' | 'dark';
        isExpanded?: boolean;
        viewportHeight?: number;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [user, setUser] = useState<{ id?: number; firstName?: string; username?: string }>({});

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      setIsTelegram(true);
      tg.ready();
      tg.expand();
      document.body.classList.add('telegram-theme');

      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          firstName: tg.initDataUnsafe.user.first_name,
          username: tg.initDataUnsafe.user.username,
        });
      }
    }
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    const haptic = window.Telegram?.WebApp?.HapticFeedback;
    if (!haptic) return;

    if (type === 'success' || type === 'warning' || type === 'error') {
      haptic.notificationOccurred(type);
    } else {
      haptic.impactOccurred(type);
    }
  }, []);

  return {
    tg: window.Telegram?.WebApp,
    isTelegram,
    user,
    triggerHaptic,
  };
}
