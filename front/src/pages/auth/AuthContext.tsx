// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { JwtUserData } from '../../utils/types/auth';
import { toast } from 'react-toastify';
import { User } from '../../utils/types/types';
import Api from '../../utils/Api';

export interface AuthContextProps {
  user: User | null;
  admin: JwtUserData | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAdmin: (admin: JwtUserData | null) => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<JwtUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, admin] = await Promise.all([
        Api.fetchMe(),
        Api.checkAuthStatusForPath('admin'),
      ]).catch((error) => {
        console.error('Error checking authentication status:', error);
        toast.error('Failed to check authentication status. Please log in again.');
        return [null, null];
      });
      setUser(user);
      setAdmin(admin);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      toast.error('Failed to check authentication status. Please log in again.');
      setUser(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextProps = {
    user,
    admin,
    setUser,
    setAdmin,
    isLoading,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
