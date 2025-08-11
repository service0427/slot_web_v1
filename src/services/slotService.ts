import { slotsAPI } from './api';
import type {
  Slot,
  SlotStats,
  SlotFilter,
  SlotListResponse,
  CreateSlotParams,
  UpdateSlotParams,
  PurchaseSlotParams,
  ManageSlotWorkerParams,
  SlotTransaction,
  SlotWorker,
  SlotFile,
} from '@/types/slot.types';

/**
 * 슬롯 관련 서비스
 */
export class SlotService {
  /**
   * 슬롯 목록 조회
   */
  static async getSlots(filter?: SlotFilter): Promise<SlotListResponse> {
    try {
      const response = await slotsAPI.getSlots(filter);
      return {
        data: response.slots || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: filter?.limit || 10,
        has_more: response.totalPages ? response.page < response.totalPages : false,
      };
    } catch (error: any) {
      console.error('슬롯 목록 조회 실패:', error);
      // 오류 시 더미 데이터 반환
      return this.getDummySlots(filter);
    }
  }

  /**
   * 슬롯 상세 조회
   */
  static async getSlotById(slotId: string): Promise<Slot> {
    try {
      const response = await slotsAPI.getSlot(slotId);
      return response;
    } catch (error: any) {
      console.error('슬롯 상세 조회 실패:', error);
      // 오류 시 더미 데이터 반환
      return this.getDummySlotDetail(slotId);
    }
  }

  /**
   * 슬롯 생성
   */
  static async createSlot(params: CreateSlotParams): Promise<Slot> {
    try {
      const response = await slotsAPI.createSlot(params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '슬롯 생성 실패');
    }
  }

  /**
   * 슬롯 수정
   */
  static async updateSlot(slotId: string, params: UpdateSlotParams): Promise<Slot> {
    try {
      const response = await slotsAPI.updateSlot(slotId, params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '슬롯 수정 실패');
    }
  }

  /**
   * 슬롯 삭제
   */
  static async deleteSlot(slotId: string): Promise<void> {
    try {
      await slotsAPI.deleteSlot(slotId);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '슬롯 삭제 실패');
    }
  }

  /**
   * 슬롯 순위 업데이트
   */
  static async updateRanking(slotId: string, rank: number): Promise<Slot> {
    try {
      const response = await slotsAPI.updateRanking(slotId, rank);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '순위 업데이트 실패');
    }
  }

  /**
   * 슬롯 구매 (나중에 구현)
   */
  static async purchaseSlot(params: PurchaseSlotParams): Promise<SlotTransaction> {
    throw new Error('슬롯 구매 기능은 추후 구현 예정입니다.');
  }

  /**
   * 슬롯 작업자 관리 (나중에 구현)
   */
  static async manageSlotWorker(params: ManageSlotWorkerParams): Promise<SlotWorker> {
    throw new Error('작업자 관리 기능은 추후 구현 예정입니다.');
  }

  /**
   * 슬롯 파일 업로드 (나중에 구현)
   */
  static async uploadSlotFile(
    slotId: string,
    file: File,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<SlotFile> {
    throw new Error('파일 업로드 기능은 추후 구현 예정입니다.');
  }

  /**
   * 슬롯 통계 조회
   */
  static async getSlotStats(userId?: string): Promise<SlotStats> {
    // 개발 중에는 더미 데이터 반환
    if (!import.meta.env.VITE_API_BASE_URL) {
      return {
        total_slots: 156,
        active_slots: 89,
        completed_slots: 45,
        cancelled_slots: 12,
        pending_slots: 10,
        total_revenue: 45850000,
        average_price: 125000,
        average_duration: 7.5,
        total_workers: 234,
        average_workers_per_slot: 2.3,
      };
    }

    const params = userId ? { user_id: userId } : undefined;
    // 개발용 더미 데이터 반환
    return {
      total_slots: 156,
      active_slots: 89,
      completed_slots: 45,
      cancelled_slots: 12,
      pending_slots: 10,
      total_revenue: 45850000,
      average_price: 125000,
      average_duration: 7.5,
      total_workers: 234,
      average_workers_per_slot: 2.3,
    };
  }

  /**
   * 내 슬롯 목록 조회
   */
  static async getMySlots(userId: string, filter?: SlotFilter): Promise<SlotListResponse> {
    return this.getSlots({ ...filter, creator_id: userId });
  }

  /**
   * 참여 중인 슬롯 목록 조회
   */
  static async getParticipatingSlots(userId: string, filter?: SlotFilter): Promise<SlotListResponse> {
    return this.getSlots({ ...filter, worker_id: userId });
  }

  // ===== 더미 데이터 생성 함수들 =====

  private static getDummySlots(filter?: SlotFilter): SlotListResponse {
    const dummySlots: Slot[] = [
      {
        id: '1',
        slot_name: '웹사이트 번역 프로젝트',
        description: '영어 웹사이트를 한국어로 번역하는 프로젝트입니다.',
        keyword: '번역',
        url: 'https://example.com/translation/1',
        rank: 1,
        previous_rank: 3,
        rank_change: 'up' as const,
        start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        remaining_days: 5,
        category: 'basic',
        work_type: 'translation',
        status: 'active',
        price: 50000,
        duration_days: 7,
        max_workers: 3,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        creator: {
          id: 'user1',
          email: 'creator1@example.com',
          full_name: '김철수',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
      },
      {
        id: '2',
        slot_name: '로고 디자인',
        description: '스타트업을 위한 로고 디자인 작업',
        keyword: '로고',
        url: 'https://example.com/logo/2',
        rank: 5,
        previous_rank: 8,
        rank_change: 'up' as const,
        start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 9).toISOString(),
        remaining_days: 9,
        category: 'premium',
        work_type: 'design',
        status: 'available',
        price: 150000,
        duration_days: 14,
        max_workers: 1,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        creator: {
          id: 'user2',
          email: 'creator2@example.com',
          full_name: '이영희',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        },
      },
      {
        id: '3',
        slot_name: '모바일 앱 개발',
        description: 'React Native를 사용한 크로스 플랫폼 앱 개발',
        keyword: '앱개발',
        url: 'https://example.com/app/3',
        rank: 12,
        previous_rank: 12,
        rank_change: 'same' as const,
        start_date: new Date(Date.now() - 86400000).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 29).toISOString(),
        remaining_days: 29,
        category: 'vip',
        work_type: 'development',
        status: 'pending',
        price: 500000,
        duration_days: 30,
        max_workers: 5,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        creator: {
          id: 'user3',
          email: 'creator3@example.com',
          full_name: '박민수',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        },
      },
      {
        id: '4',
        slot_name: '블로그 콘텐츠 작성',
        description: 'IT 기술 블로그를 위한 콘텐츠 작성',
        keyword: '콘텐츠',
        url: 'https://example.com/content/4',
        rank: 3,
        previous_rank: 5,
        rank_change: 'up' as const,
        start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        end_date: new Date(Date.now() - 86400000 * 7).toISOString(),
        remaining_days: 0,
        category: 'basic',
        work_type: 'content',
        status: 'completed',
        price: 30000,
        duration_days: 3,
        max_workers: 2,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        creator: {
          id: 'user4',
          email: 'creator4@example.com',
          full_name: '정수진',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
        },
      },
      {
        id: '5',
        slot_name: 'SNS 마케팅 캠페인',
        description: '인스타그램과 페이스북 마케팅 캠페인 기획 및 실행',
        keyword: 'SNS마케팅',
        url: 'https://example.com/marketing/5',
        rank: 8,
        previous_rank: 6,
        rank_change: 'down' as const,
        start_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 18).toISOString(),
        remaining_days: 18,
        category: 'premium',
        work_type: 'marketing',
        status: 'active',
        price: 200000,
        duration_days: 21,
        max_workers: 4,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        creator: {
          id: 'user5',
          email: 'creator5@example.com',
          full_name: '최지훈',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
        },
      },
    ];

    // 필터 적용
    let filteredSlots = [...dummySlots];

    if (filter) {
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        filteredSlots = filteredSlots.filter(slot => statuses.includes(slot.status));
      }

      if (filter.category) {
        const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
        filteredSlots = filteredSlots.filter(slot => categories.includes(slot.category));
      }

      if (filter.work_type) {
        const workTypes = Array.isArray(filter.work_type) ? filter.work_type : [filter.work_type];
        filteredSlots = filteredSlots.filter(slot => workTypes.includes(slot.work_type));
      }

      if (filter.min_price !== undefined) {
        filteredSlots = filteredSlots.filter(slot => slot.price >= filter.min_price!);
      }

      if (filter.max_price !== undefined) {
        filteredSlots = filteredSlots.filter(slot => slot.price <= filter.max_price!);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredSlots = filteredSlots.filter(
          slot =>
            slot.slot_name.toLowerCase().includes(searchLower) ||
            slot.description?.toLowerCase().includes(searchLower)
        );
      }

      // 정렬
      if (filter.sort_by) {
        filteredSlots.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (filter.sort_by) {
            case 'created_at':
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
            case 'price':
              aValue = a.price;
              bValue = b.price;
              break;
            case 'name':
              aValue = a.slot_name;
              bValue = b.slot_name;
              break;
            default:
              return 0;
          }

          if (filter.sort_order === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }
    }

    // 페이지네이션
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedSlots = filteredSlots.slice(start, start + limit);

    return {
      data: paginatedSlots,
      total: filteredSlots.length,
      page,
      limit,
      has_more: start + limit < filteredSlots.length,
    };
  }

  private static getDummySlotDetail(slotId: string): Slot {
    const baseSlot = this.getDummySlots().data.find(slot => slot.id === slotId) || this.getDummySlots().data[0];
    
    // 더미 작업자 추가
    const dummyWorkers: SlotWorker[] = [
      {
        id: 'worker1',
        slot_id: slotId,
        user_id: 'user10',
        role: 'owner',
        joined_at: baseSlot.created_at,
        status: 'active',
        user: baseSlot.creator,
      },
      {
        id: 'worker2',
        slot_id: slotId,
        user_id: 'user11',
        role: 'worker',
        joined_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'active',
        user: {
          id: 'user11',
          email: 'worker1@example.com',
          full_name: '김작업자',
          role: 'worker',
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        },
      },
    ];

    // 더미 파일 추가
    const dummyFiles: SlotFile[] = [
      {
        id: 'file1',
        slot_id: slotId,
        uploader_id: 'user10',
        file_name: '프로젝트_요구사항.pdf',
        file_path: '/uploads/slots/file1.pdf',
        file_size: 1048576,
        file_type: 'application/pdf',
        description: '프로젝트 요구사항 문서',
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'file2',
        slot_id: slotId,
        uploader_id: 'user11',
        file_name: '작업_진행상황.docx',
        file_path: '/uploads/slots/file2.docx',
        file_size: 524288,
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: '현재까지의 작업 진행 상황',
        uploaded_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    return {
      ...baseSlot,
      workers: dummyWorkers,
      files: dummyFiles,
    };
  }
}