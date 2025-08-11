// Supabase import removed - using dummy data for now
import type { 
  Inquiry, 
  InquiryMessage, 
  InquiryCategory,
  CreateInquiryParams,
  CreateInquiryMessageParams,
  UpdateInquiryStatusParams,
  InquiryFilter,
  InquirySenderRole
} from '@/types/inquiry.types';

// 더미 데이터
const dummyInquiries: Inquiry[] = [
  {
    id: '1',
    user_id: 'user1',
    title: '슬롯 구매 관련 문의',
    category: '일반문의',
    priority: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: '2',
    user_id: 'user1',
    title: '환불 요청드립니다',
    category: '환불문의',
    priority: 'normal',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: '3',
    user_id: 'user1',
    title: '기술적 오류 신고',
    category: '오류신고',
    priority: 'urgent',
    status: 'resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
  }
];

const dummyMessages: InquiryMessage[] = [
  {
    id: '1',
    inquiry_id: '1',
    sender_id: 'user1',
    sender_role: 'user',
    message: '안녕하세요. 슬롯 구매를 하려고 하는데 어떻게 진행하면 될까요?',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    senderName: '홍길동',
    senderEmail: 'user@example.com'
  },
  {
    id: '2',
    inquiry_id: '1',
    sender_id: 'admin1',
    sender_role: 'admin',
    message: '안녕하세요! 슬롯 구매는 캐시 충전 후 슬롯 관리 페이지에서 진행하실 수 있습니다.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    senderName: '관리자',
    senderEmail: 'admin@example.com'
  }
];

const dummyCategories: InquiryCategory[] = [
  { id: 1, name: '일반문의', description: '일반적인 문의사항', is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: '환불문의', description: '환불 관련 문의', is_active: true, created_at: new Date().toISOString() },
  { id: 3, name: '오류신고', description: '시스템 오류 신고', is_active: true, created_at: new Date().toISOString() },
  { id: 4, name: '기능요청', description: '새로운 기능 요청', is_active: true, created_at: new Date().toISOString() }
];

/**
 * 1:1 문의 서비스
 */
export const inquiryService = {
  /**
   * 문의 생성
   */
  async createInquiry(params: CreateInquiryParams, userId: string) {
    try {
      const newInquiry: Inquiry = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: userId,
        title: params.title,
        category: params.category || '일반문의',
        priority: params.priority || 'normal',
        status: params.status || 'open',
        slot_id: params.slot_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      dummyInquiries.push(newInquiry);

      return { data: newInquiry, error: null };
    } catch (error) {
      console.error('문의 생성 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 목록 조회
   */
  async getInquiries(filter: InquiryFilter = {}) {
    try {
      let filteredInquiries = [...dummyInquiries];

      // 필터 적용
      if (filter.user_id) {
        filteredInquiries = filteredInquiries.filter(i => i.user_id === filter.user_id);
      }
      if (filter.status) {
        filteredInquiries = filteredInquiries.filter(i => i.status === filter.status);
      }
      if (filter.category) {
        filteredInquiries = filteredInquiries.filter(i => i.category === filter.category);
      }
      if (filter.priority) {
        filteredInquiries = filteredInquiries.filter(i => i.priority === filter.priority);
      }
      if (filter.slot_id) {
        filteredInquiries = filteredInquiries.filter(i => i.slot_id === filter.slot_id);
      }

      // 최신순 정렬
      filteredInquiries.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { data: filteredInquiries, error: null };
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 상세 조회
   */
  async getInquiry(inquiryId: string) {
    try {
      const inquiry = dummyInquiries.find(i => i.id === inquiryId);
      
      if (!inquiry) {
        throw new Error('문의를 찾을 수 없습니다.');
      }

      return { data: inquiry, error: null };
    } catch (error) {
      console.error('문의 조회 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 상태 업데이트
   */
  async updateInquiryStatus({ inquiry_id, status, resolved_by }: UpdateInquiryStatusParams) {
    try {
      const inquiry = dummyInquiries.find(i => i.id === inquiry_id);
      
      if (!inquiry) {
        throw new Error('문의를 찾을 수 없습니다.');
      }

      inquiry.status = status;
      inquiry.updated_at = new Date().toISOString();
      
      if (status === 'resolved' && resolved_by) {
        inquiry.resolved_by = resolved_by;
        inquiry.resolved_at = new Date().toISOString();
      }

      return { data: inquiry, error: null };
    } catch (error) {
      console.error('문의 상태 업데이트 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 카테고리 목록 조회
   */
  async getCategories() {
    try {
      return { data: dummyCategories, error: null };
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      return { data: null, error };
    }
  }
};

/**
 * 문의 메시지 서비스
 */
export const inquiryMessageService = {
  /**
   * 메시지 목록 조회
   */
  async getMessages(inquiryId: string) {
    try {
      const messages = dummyMessages.filter(m => m.inquiry_id === inquiryId);
      
      // 시간순 정렬
      messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return { data: messages, error: null };
    } catch (error: any) {
      console.error('메시지 목록 조회 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 메시지 전송
   */
  async sendMessage(params: CreateInquiryMessageParams, senderId: string, senderRole: InquirySenderRole) {
    try {
      const newMessage: InquiryMessage = {
        id: Math.random().toString(36).substr(2, 9),
        inquiry_id: params.inquiry_id,
        sender_id: senderId,
        sender_role: senderRole,
        message: params.content,
        attachments: params.attachments,
        is_read: false,
        created_at: new Date().toISOString(),
        senderName: senderRole === 'admin' ? '관리자' : '사용자',
        senderEmail: senderRole === 'admin' ? 'admin@example.com' : 'user@example.com'
      };

      dummyMessages.push(newMessage);

      // 문의 상태를 'in_progress'로 업데이트
      const inquiry = dummyInquiries.find(i => i.id === params.inquiry_id);
      if (inquiry && inquiry.status === 'open') {
        inquiry.status = 'in_progress';
        inquiry.updated_at = new Date().toISOString();
      }

      return { data: newMessage, error: null };
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 메시지 읽음 처리
   */
  async markAsRead(inquiryId: string, userId: string) {
    try {
      const messages = dummyMessages.filter(
        m => m.inquiry_id === inquiryId && 
        m.sender_id !== userId && 
        !m.is_read
      );

      messages.forEach(m => {
        m.is_read = true;
        m.read_at = new Date().toISOString();
      });

      return { error: null };
    } catch (error) {
      console.error('읽음 처리 실패:', error);
      return { error };
    }
  },

  /**
   * 읽지 않은 메시지 수 조회
   */
  async getUnreadCount(userId: string) {
    try {
      const userInquiries = dummyInquiries.filter(i => i.user_id === userId);
      const inquiryIds = userInquiries.map(i => i.id);

      const unreadCount = dummyMessages.filter(
        m => inquiryIds.includes(m.inquiry_id) && 
        m.sender_id !== userId && 
        !m.is_read
      ).length;

      return { data: unreadCount, error: null };
    } catch (error) {
      console.error('읽지 않은 메시지 수 조회 실패:', error);
      return { data: 0, error };
    }
  },

  /**
   * 실시간 구독 설정 (더미 구현)
   */
  subscribeToMessages(_inquiryId: string, _callback: (payload: any) => void) {
    // 더미 구현 - 실제로는 아무것도 하지 않음
    return {
      unsubscribe: () => {}
    };
  }
};