// 사용자 관련 타입 정의

// 사용자 역할
export type UserRole = 'user' | 'admin' | 'distributor' | 'agency';

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

// 사용자 기본 정보
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  level?: number;
  parent_id?: string;
  cash_balance?: number;
  free_cash_balance?: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  // 관계 데이터
  profile?: UserProfile;
  settings?: UserSettings;
}

// 사용자 프로필
export interface UserProfile {
  user_id: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  location?: string;
  skills?: string[];
  languages?: string[];
  timezone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
}

// 사용자 설정
export interface UserSettings {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  two_factor_enabled: boolean;
}

// 인증 관련 타입
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  terms_accepted?: boolean;
  marketing_agreed?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refresh_token?: string;
  error?: string;
  expires_in?: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  terms_accepted: boolean;
  marketing_agreed?: boolean;
}

export interface ResetPasswordParams {
  email: string;
  code: string;
  new_password: string;
}

// 사용자 통계
export interface UserStats {
  total_purchases: number;
  total_sales: number;
  total_spent: number;
  total_earned: number;
  active_slots: number;
  completed_slots: number;
  average_rating?: number;
  total_reviews?: number;
}

// API 요청 타입
export interface UpdateUserParams {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateProfileParams {
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  location?: string;
  skills?: string[];
  languages?: string[];
  timezone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface UpdateSettingsParams {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  marketing_emails?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
}

// 사용자 검색 필터
export interface UserFilter {
  role?: UserRole | UserRole[];
  status?: UserStatus | UserStatus[];
  search?: string;
  created_after?: string;
  created_before?: string;
  sort_by?: 'created_at' | 'name' | 'email' | 'last_login';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}