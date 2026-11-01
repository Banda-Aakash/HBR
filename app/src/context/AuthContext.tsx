import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const STORAGE_KEY_TOKEN = '@realapp_token';

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Please try again.';

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setUser(null);
    setAuth(null, null);
    await AsyncStorage.multiRemove([STORAGE_KEY_USER, STORAGE_KEY_TOKEN]);
  }, []);

  // Restore session on mount
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY_USER, STORAGE_KEY_TOKEN]).then(result => {
      const storedUser = result[0][1];
      const storedToken = result[1][1];
      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser) as ApiUser;
        setUser(parsed);
        setAuth(parsed.id, storedToken);
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
      await AsyncStorage.multiSet([
        [STORAGE_KEY_USER, JSON.stringify(res.user)],
        [STORAGE_KEY_TOKEN, res.token],
      ]);
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
        await AsyncStorage.multiSet([
          [STORAGE_KEY_USER, JSON.stringify(res.user)],
          [STORAGE_KEY_TOKEN, res.token],
        ]);
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
