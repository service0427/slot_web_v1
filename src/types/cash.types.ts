// 캐시 관련 타입 정의

// 충전 요청 상태
export type ChargeRequestStatus = 'pending' | 'approved' | 'rejected';

// 캐시 충전 요청
export interface CashChargeRequest {
  id: string;
  user_id: string;
  amount: number;
  status: ChargeRequestStatus;
  requested_at: string;
  processed_at?: string;
  processor_id?: string;
  rejection_reason?: string;
  free_cash_percentage: number;
  account_holder?: string;
}

// 사용자 잔액
export interface UserBalance {
  user_id: string;
  paid_balance: number;
  free_balance: number;
  total_balance: number;
  updated_at: string;
}

// 캐시 사용 내역
export interface CashHistory {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  transaction_at: string;
  reference_id?: string;
  balance_type?: 'paid' | 'free' | 'mixed';
}

// 거래 유형
export type TransactionType = 
  | 'charge'      // 충전
  | 'purchase'    // 구매
  | 'refund'      // 환불
  | 'withdrawal'  // 출금
  | 'free'        // 무료 지급
  | 'work'        // 작업 비용
  | 'buy';        // 구매

// 캐시 설정
export interface CashSetting {
  min_request_amount: number;    // 최소 충전 금액
  free_cash_percentage: number;  // 무료 캐시 비율
  expiry_months: number;         // 유효 기간 (개월)
  min_usage_amount: number;      // 최소 사용 금액
  min_usage_percentage: number;  // 최소 사용 비율
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

// 충전 요청 파라미터
export interface CreateChargeRequestParams {
  amount: number;
  depositorName?: string;
}

// 캐시 내역 조회 필터
export interface CashHistoryFilter {
  page?: number;
  limit?: number;
  filterType?: 'all' | 'charge' | 'use' | 'refund';
  startDate?: string;
  endDate?: string;
}