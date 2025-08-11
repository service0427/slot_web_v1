import type {
  CashChargeRequest,
  UserBalance,
  CashHistory,
  CashSetting,
  ApiResponse,
  CreateChargeRequestParams,
  CashHistoryFilter,
} from '@/types/cash.types';
import { cashAPI } from './api';

/**
 * 캐시 관련 서비스
 */
export class CashService {
  /**
   * 캐시 충전 요청 생성
   */
  static async createChargeRequest(
    userId: string,
    params: CreateChargeRequestParams
  ): Promise<ApiResponse<CashChargeRequest>> {
    try {
      const { amount, depositorName } = params;

      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!amount || amount <= 0) {
        throw new Error('충전할 금액을 입력해주세요.');
      }

      const result = await cashAPI.createRequest({
        amount,
        account_holder: depositorName || '본인'
      });

      return {
        success: true,
        message: `${amount.toLocaleString()}원 충전이 요청되었습니다.`,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || error.message || '충전 요청 중 오류가 발생했습니다.',
        error
      };
    }
  }

  /**
   * 충전 요청 내역 조회
   */
  static async getChargeRequestHistory(
    userId: string,
    limit: number = 5
  ): Promise<ApiResponse<CashChargeRequest[]>> {
    try {
      const result = await cashAPI.getRequests({ limit });
      
      return {
        success: true,
        message: '충전 요청 내역 조회 성공',
        data: result.requests || []
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || '충전 요청 내역 조회 실패',
        error,
        data: []
      };
    }
  }

  /**
   * 사용자 잔액 조회
   */
  static async getUserBalance(userId: string): Promise<ApiResponse<UserBalance>> {
    try {
      // API에서 실시간 사용자 정보 가져오기
      const result = await cashAPI.getBalance();
      
      if (result && result.user) {
        const user = result.user;
        
        // localStorage의 user 정보도 업데이트
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          success: true,
          message: '잔액 조회 성공',
          data: {
            user_id: userId,
            paid_balance: Math.floor(user.cash_balance || 0),
            free_balance: Math.floor(user.free_cash_balance || 0),
            total_balance: Math.floor((user.cash_balance || 0) + (user.free_cash_balance || 0)),
            updated_at: new Date().toISOString()
          }
        };
      }
      
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다',
        data: {
          user_id: userId,
          paid_balance: 0,
          free_balance: 0,
          total_balance: 0,
          updated_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Balance fetch error:', error);
      return {
        success: false,
        message: error.response?.data?.error || '잔액 조회 실패',
        error,
        data: {
          user_id: userId,
          paid_balance: 0,
          free_balance: 0,
          total_balance: 0,
          updated_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 캐시 사용 내역 조회
   */
  static async getCashHistory(
    userId: string,
    filter: CashHistoryFilter = {}
  ): Promise<ApiResponse<{ data: CashHistory[]; totalItems: number }>> {
    try {
      const result = await cashAPI.getTransactions({
        user_id: userId,
        type: filter.filterType !== 'all' ? filter.filterType : undefined,
        page: filter.page || 1,
        limit: filter.limit || 10
      });

      return {
        success: true,
        message: '캐시 내역 조회 성공',
        data: {
          data: result.transactions || [],
          totalItems: result.total || 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || '캐시 내역 조회 실패',
        error,
        data: {
          data: [],
          totalItems: 0
        }
      };
    }
  }

  /**
   * 캐시 설정 조회 (보너스 없음)
   */
  static async getCashSetting(_userId: string): Promise<ApiResponse<CashSetting>> {
    return {
      success: true,
      message: '기본 캐시 설정',
      data: {
        min_request_amount: 10000,
        free_cash_percentage: 0, // 보너스 없음
        expiry_months: 0,
        min_usage_amount: 0,
        min_usage_percentage: 0
      }
    };
  }
}