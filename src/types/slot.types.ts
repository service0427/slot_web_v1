// 슬롯 시스템 타입 정의

// 슬롯 상태
export type SlotStatus = 
  | 'available'      // 구매 가능
  | 'pending'        // 대기중
  | 'active'         // 활성
  | 'completed'      // 완료
  | 'cancelled'      // 취소됨
  | 'expired';       // 만료됨

// 슬롯 카테고리
export type SlotCategory = 
  | 'basic'          // 기본
  | 'premium'        // 프리미엄
  | 'vip'            // VIP
  | 'special';       // 특별

// 작업 타입
export type WorkType = 
  | 'translation'    // 번역
  | 'design'         // 디자인
  | 'development'    // 개발
  | 'content'        // 콘텐츠
  | 'marketing'      // 마케팅
  | 'other';         // 기타

// 슬롯 기본 정보
export interface Slot {
  id: string;
  slot_name: string;
  description?: string;
  keyword: string;              // 키워드 추가
  url: string;                  // URL 추가
  thumbnail?: string;           // 썸네일 추가
  rank: number;                 // 현재 순위
  previous_rank?: number;       // 이전 순위 (순위 변동 계산용)
  rank_change?: 'up' | 'down' | 'same' | 'new';  // 순위 변동
  category: SlotCategory;
  work_type: WorkType;
  status: SlotStatus;
  price: number;
  duration_days: number;        // 작업 기간 (일)
  max_workers: number;          // 최대 작업자 수
  start_date: string;           // 시작일
  end_date: string;             // 종료일
  remaining_days: number;       // 남은 일수
  created_at: string;
  updated_at: string;
  expires_at?: string;
  // 관계 데이터
  creator?: User;
  workers?: SlotWorker[];
  files?: SlotFile[];
}

// 슬롯 작업자
export interface SlotWorker {
  id: string;
  slot_id: string;
  user_id: string;
  role: 'owner' | 'worker' | 'viewer';
  joined_at: string;
  status: 'active' | 'inactive' | 'completed';
  // 관계 데이터
  user?: User;
  slot?: Slot;
}

// 슬롯 파일
export interface SlotFile {
  id: string;
  slot_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description?: string;
  uploaded_at: string;
  // 관계 데이터
  uploader?: User;
  slot?: Slot;
}

// 슬롯 거래 내역
export interface SlotTransaction {
  id: string;
  slot_id: string;
  buyer_id: string;
  seller_id?: string;
  transaction_type: 'purchase' | 'sale' | 'refund';
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_at: string;
  completed_at?: string;
  // 관계 데이터
  slot?: Slot;
  buyer?: User;
  seller?: User;
}

// 슬롯 통계
export interface SlotStats {
  total_slots: number;
  active_slots: number;
  completed_slots: number;
  cancelled_slots?: number;
  pending_slots?: number;
  total_revenue: number;
  average_price?: number;
  average_duration?: number;
  total_workers: number;
  average_workers_per_slot?: number;
  avg_completion_time?: number;
  by_category?: Record<SlotCategory, number>;
  by_work_type?: Record<WorkType, number>;
}

// 사용자 (다른 타입에서 참조용)
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'worker';
  created_at: string;
}

// API 요청/응답 타입
export interface CreateSlotParams {
  slot_name: string;
  description?: string;
  category: SlotCategory;
  work_type: WorkType;
  price: number;
  duration_days: number;
  max_workers: number;
}

export interface UpdateSlotParams {
  slot_name?: string;
  description?: string;
  category?: SlotCategory;
  work_type?: WorkType;
  price?: number;
  duration_days?: number;
  max_workers?: number;
  status?: SlotStatus;
}

export interface SlotFilter {
  status?: SlotStatus | SlotStatus[];
  category?: SlotCategory | SlotCategory[];
  work_type?: WorkType | WorkType[];
  min_price?: number;
  max_price?: number;
  creator_id?: string;
  worker_id?: string;
  search?: string;
  sort_by?: 'created_at' | 'price' | 'expires_at' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SlotListResponse {
  data: Slot[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// 슬롯 구매 파라미터
export interface PurchaseSlotParams {
  slot_id: string;
  payment_method?: 'cash' | 'card' | 'transfer';
}

// 슬롯 작업자 추가/제거
export interface ManageSlotWorkerParams {
  slot_id: string;
  user_id: string;
  action: 'add' | 'remove';
  role?: 'worker' | 'viewer';
}