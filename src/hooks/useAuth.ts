import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { LoginCredentials, RegisterData } from '@/types/user.types';
import { AuthService } from '@/services/authService';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, login: setUser, logout: clearUser, isLoading } = context;

  const login = async (credentials: LoginCredentials) => {
    const response = await AuthService.login(credentials);
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const register = async (data: RegisterData) => {
    const response = await AuthService.register(data);
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await AuthService.logout();
    clearUser();
  };

  const checkAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      clearUser();
    }
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };
}