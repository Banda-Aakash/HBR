import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {festiveApi} from '../api/client';
import {ARCH_THEME, AppTheme, FESTIVALS, FestivalId} from '../theme';
import {toDateString} from '../utils/format';

interface ActiveFestival {
  id: string;
  endsOn: string;
}

const STORAGE_KEY = '@realapp_festival';
const REFRESH_MS = 6 * 60 * 60 * 1000;

export const ThemeContext = createContext<AppTheme>(ARCH_THEME);

const isRunning = (active: ActiveFestival | null) =>
  !!active && active.endsOn >= toDateString(new Date());

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [active, setActive] = useState<ActiveFestival | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const refresh = async () => {
      lastRefresh.current = Date.now();
      try {
        const res = await festiveApi.current();
        const next = res.festival && res.endsOn ? {id: res.festival, endsOn: res.endsOn} : null;
        setActive(next);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Offline: a festival we already know about carries on until it ends
        setActive(prev => (isRunning(prev) ? prev : null));
      }
    };

    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        const saved = stored ? (JSON.parse(stored) as ActiveFestival | null) : null;
        if (isRunning(saved)) {setActive(saved);}
      })
      .catch(() => {})
      .finally(refresh);

    // Phones keep apps open for days, so a cold start can't be relied on
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && Date.now() - lastRefresh.current > REFRESH_MS) {
        refresh();
      }
    });
    return () => subscription.remove();
  }, []);

  // An older app can be told about a festival it has no artwork for
  const theme = (active && FESTIVALS[active.id as FestivalId]) || ARCH_THEME;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): AppTheme => useContext(ThemeContext);
