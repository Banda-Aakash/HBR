import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authApi, ApiUser, setAuth} from '../api/client';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = '@realapp_user';
const STORAGE_KEY_TOKEN = '@realapp_token';

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      setAuth(res.user.id, res.token);
      await AsyncStorage.multiSet([
        [STORAGE_KEY_USER, JSON.stringify(res.user)],
        [STORAGE_KEY_TOKEN, res.token],
      ]);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await authApi.register(name, email, password);
        setUser(res.user);
        setAuth(res.user.id, res.token);
        await AsyncStorage.multiSet([
          [STORAGE_KEY_USER, JSON.stringify(res.user)],
          [STORAGE_KEY_TOKEN, res.token],
        ]);
        return true;
      } catch {
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    setAuth(null, null);
    await AsyncStorage.multiRemove([STORAGE_KEY_USER, STORAGE_KEY_TOKEN]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
