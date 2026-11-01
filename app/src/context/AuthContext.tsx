import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {authApi, ApiUser, setAuth, setSessionExpiredHandler} from '../api/client';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Resolves to an error message, or null on success */
  login: (email: string, password: string) => Promise<string | null>;
  /** Resolves to an error message, or null on success */
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  /** Resolves to an error message, or null on success */
  deleteAccount: (password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = '@realapp_user';
// The login token lives in the device's secure storage, not in AsyncStorage
const TOKEN_SERVICE = 'realapp.auth';

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Please try again.';

/** A failure here only means the user signs in again next time the app opens */
const storeSession = async (user: ApiUser, token: string) => {
  try {
    await Keychain.setGenericPassword(user.id, token, {
      service: TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.warn('Could not save the session:', e);
  }
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setUser(null);
    setAuth(null, null);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
    await Keychain.resetGenericPassword({service: TOKEN_SERVICE});
  }, []);

  // Restore session on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_USER),
      Keychain.getGenericPassword({service: TOKEN_SERVICE}),
    ]).then(([storedUser, credentials]) => {
      if (storedUser && credentials) {
        const parsed = JSON.parse(storedUser) as ApiUser;
        setUser(parsed);
        setAuth(parsed.id, credentials.password);
      }
    }).catch(() => logout());
  }, [logout]);

  useEffect(() => {
    setSessionExpiredHandler(logout);
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      setAuth(res.user.id, res.token);
      await storeSession(res.user, res.token);
      return null;
    } catch (e) {
      return errorMessage(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const res = await authApi.register(name, email, password);
        setUser(res.user);
        setAuth(res.user.id, res.token);
        await storeSession(res.user, res.token);
        return null;
      } catch (e) {
        return errorMessage(e);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteAccount = useCallback(async (password: string): Promise<string | null> => {
    try {
      await authApi.deleteAccount(password);
      await logout();
      return null;
    } catch (e) {
      return errorMessage(e);
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        deleteAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
