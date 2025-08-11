import { authAPI } from './api';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/user.types';

export class AuthService {
  /**
   * 로그인
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authAPI.login(credentials.email, credentials.password);
      
      return {
        success: true,
        user: {
          id: response.user.id,
          email: response.user.email,
          full_name: response.user.full_name,
          role: response.user.user_role,
          status: response.user.status,
          level: response.user.level,
          parent_id: response.user.parent_id,
          created_at: response.user.created_at,
          updated_at: response.user.updated_at,
        },
        token: response.token,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '로그인 실패');
    }
  }

  /**
   * 회원가입
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await authAPI.register(data);
      
      return {
        success: true,
        user: {
          id: response.user.id,
          email: response.user.email,
          full_name: response.user.full_name,
          role: response.user.user_role,
          status: response.user.status,
          level: response.user.level,
          parent_id: response.user.parent_id,
          created_at: response.user.created_at,
          updated_at: response.user.updated_at,
        },
        token: response.token,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '회원가입 실패');
    }
  }

  /**
   * 로그아웃
   */
  static async logout(): Promise<void> {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await authAPI.getMe();
      
      return {
        id: response.id,
        email: response.email,
        full_name: response.full_name,
        role: response.user_role,
        status: response.status,
        level: response.level,
        parent_id: response.parent_id,
        created_at: response.created_at,
        updated_at: response.updated_at,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '사용자 정보 조회 실패');
    }
  }

  /**
   * 토큰 갱신
   */
  static async refreshToken(): Promise<string> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token not found');
    }

    return token; // JWT는 서버에서 자동 갱신됨
  }

  /**
   * 비밀번호 변경
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const { usersAPI } = await import('./api');
      await usersAPI.changePassword(userId, {
        current_password: currentPassword,
        new_password: newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '비밀번호 변경 실패');
    }
  }
}