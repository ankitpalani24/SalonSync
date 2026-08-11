import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/apiServices';
import { secureStorage } from '../services/secureStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  role: UserRole | null;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (data: { ownerName: string; email: string; phone: string; password?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from SecureStore on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await secureStorage.getToken();
        const storedUser = await secureStorage.getUserData();
        if (storedToken && storedUser) {
          if (storedUser.role === 'CLIENT' || storedUser.role === 'STAFF') {
            setUser(storedUser);
          } else {
            await secureStorage.removeToken();
            await secureStorage.removeUserData();
          }
        }
      } catch (e) {
        console.error('Session restore failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (identifier: string, password?: string) => {
    try {
      const res = await authService.login(identifier, password);
      if (res.success && res.user) {
        const loggedUser: User = res.user;

        // Verify supported mobile roles ONLY: CLIENT or STAFF
        if (loggedUser.role !== 'CLIENT' && loggedUser.role !== 'STAFF') {
          return {
            success: false,
            message: 'Please use the SalonSync web dashboard for this account.'
          };
        }

        await secureStorage.saveToken(res.token);
        await secureStorage.saveUserData(loggedUser);
        setUser(loggedUser);
        return { success: true };
      }
      return { success: false, message: res.message || 'Authentication failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to connect to SalonSync backend server';
      return { success: false, message: msg };
    }
  };

  const signup = async (data: { ownerName: string; email: string; phone: string; password?: string }) => {
    try {
      const res = await authService.signup({ ...data, role: 'CLIENT' });
      if (res.success && res.user) {
        const newClient: User = res.user;
        await secureStorage.saveToken(res.token);
        await secureStorage.saveUserData(newClient);
        setUser(newClient);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration error';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    await secureStorage.removeToken();
    await secureStorage.removeUserData();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, role: user?.role || null, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
