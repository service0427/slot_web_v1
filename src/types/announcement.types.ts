// 공지사항 시스템 타입 정의

// 공지사항 타입
export type AnnouncementType = 'info' | 'warning' | 'success' | 'error' | 'general';

// 우선순위
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

// 대상 관중
export type TargetAudience = 'all' | 'users' | 'distributors' | 'admins';

// 작성자 정보
export interface AnnouncementAuthor {
  id: string;
  name: string;
  role: string;
}

// 공지사항
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_visible: boolean;
  target_audience: TargetAudience;
  author: AnnouncementAuthor;
  view_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// API 요청/응답 타입
export interface CreateAnnouncementParams {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  target_audience: TargetAudience;
  is_pinned: boolean;
  expires_at?: string;
}

export interface UpdateAnnouncementParams {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  target_audience?: TargetAudience;
  is_pinned?: boolean;
  is_visible?: boolean;
  expires_at?: string;
}

// 목록 조회 필터
export interface AnnouncementFilter {
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  target_audience?: TargetAudience;
  is_pinned?: boolean;
  is_visible?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// 통계 타입
export interface AnnouncementStats {
  total_announcements: number;
  visible_announcements: number;
  pinned_announcements: number;
  urgent_announcements: number;
  by_type: Record<AnnouncementType, number>;
  by_priority: Record<AnnouncementPriority, number>;
  by_audience: Record<TargetAudience, number>;
}