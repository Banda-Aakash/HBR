import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMode = 'owner' | 'tenant';

interface RoleContextType {
  mode: UserMode;
  isOwner: boolean;
  isTenant: boolean;
  toggleMode: () => void;
  setMode: (mode: UserMode) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = '@realapp_user_mode';

export const RoleProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [mode, setModeState] = useState<UserMode>('owner');

  // Load persisted mode on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'owner' || stored === 'tenant') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'owner' ? 'tenant' : 'owner';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <RoleContext.Provider
      value={{
        mode,
        isOwner: mode === 'owner',
        isTenant: mode === 'tenant',
        toggleMode,
        setMode,
      }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
