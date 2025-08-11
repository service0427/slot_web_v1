import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { inquiryService, inquiryMessageService } from '@/services/inquiryService';
import type {
  Inquiry,
  InquiryMessage,
  InquiryAttachment,
  InquirySenderRole
} from '@/types/inquiry.types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, Send, Paperclip, X, Check, XCircle } from 'lucide-react';

interface InquiryChatModalProps {
  open: boolean;
  onClose: () => void;
  inquiryId?: string;
  slotId?: string;
  initialTitle?: string;
  currentUser?: { id: string; email: string; full_name?: string; role?: string };
  onStatusChange?: (status: string) => void;
}

export const InquiryChatModal: React.FC<InquiryChatModalProps> = ({
  open,
  onClose,
  inquiryId,
  slotId,
  initialTitle = '1:1 문의',
  currentUser,
  onStatusChange
}) => {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<InquiryAttachment[]>([]);
  const [uploadingFiles] = useState(false);

  // 새 문의 생성 관련
  const [isNewInquiry, setIsNewInquiry] = useState(!inquiryId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 사용자의 역할 결정
  const currentUserRole: InquirySenderRole = currentUser?.role === 'admin' ? 'admin' : 'user';

  // 문의 정보 가져오기
  const fetchInquiry = useCallback(async () => {
    if (!inquiryId) return;

    try {
      setLoading(true);
      const { data, error } = await inquiryService.getInquiry(inquiryId);

      if (error) throw error;

      setInquiry(data);
    } catch (error) {
      console.error('문의 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  // 메시지 목록 가져오기
  const fetchMessages = useCallback(async (idToFetch?: string, isInitialLoad = false) => {
    const id = idToFetch || inquiryId || inquiry?.id;
    if (!id) return;

    try {
      if (isInitialLoad) {
        setLoadingMessages(true);
      }

      const { data, error } = await inquiryMessageService.getMessages(id);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('메시지 조회 실패:', error);
    } finally {
      if (isInitialLoad) {
        setLoadingMessages(false);
      }
    }
  }, [inquiryId, inquiry]);

  // 기존 문의 확인
  const checkExistingInquiry = useCallback(async () => {
    if (!slotId) return;

    try {
      const { data: existingInquiries } = await inquiryService.getInquiries({
        slot_id: slotId
      });

      if (existingInquiries && existingInquiries.length > 0) {
        // 기존 문의가 있으면 해당 문의 사용
        const existingInquiry = existingInquiries[0];
        setIsNewInquiry(false);
        setInquiry(existingInquiry);
        fetchMessages(existingInquiry.id, true);
      } else {
        // 기존 문의가 없으면 새 문의 모드
        setIsNewInquiry(true);
        setInquiry(null);
        setMessages([]);
      }
    } catch (error) {
      // 오류 시 새 문의 모드
      setIsNewInquiry(true);
      setInquiry(null);
      setMessages([]);
    }
  }, [slotId, fetchMessages]);

  useEffect(() => {
    if (open && (inquiryId || slotId)) {
      if (inquiryId) {
        fetchInquiry();
        fetchMessages(inquiryId, true);
      } else {
        // 기존 문의가 있는지 확인
        checkExistingInquiry();
      }
    }
  }, [open, inquiryId, slotId]);

  // 스크롤 자동 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 새 문의 생성
  const handleCreateInquiry = async () => {
    if (!inputValue.trim() && attachments.length === 0) {
      return;
    }

    if (!currentUser?.id) {
      console.error('로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);

      const inquiryData: any = {
        title: initialTitle,
        category: '일반문의',
        priority: 'normal' as const,
        status: 'open' as const
      };

      if (slotId) {
        inquiryData.slot_id = slotId;
      }

      const { data: newInquiry, error: inquiryError } = await inquiryService.createInquiry(
        inquiryData, 
        currentUser.id
      );

      if (inquiryError) throw inquiryError;

      // 첫 메시지 전송
      const messageData = {
        inquiry_id: newInquiry?.id || '',
        content: inputValue.trim() || '',
        sender_role: currentUserRole,
        attachments
      };

      const { error: messageError } = await inquiryMessageService.sendMessage(
        messageData, 
        currentUser.id, 
        currentUserRole
      );

      if (messageError) throw messageError;

      setIsNewInquiry(false);
      setInquiry(newInquiry);
      setInputValue('');
      setAttachments([]);

      // 메시지 다시 가져오기
      if (newInquiry) {
        await fetchMessages(newInquiry.id, false);
      }
    } catch (error) {
      console.error('문의 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const currentInquiryId = inquiryId || inquiry?.id;
    if (!currentInquiryId || !currentUser?.id) return;

    // 먼저 입력 필드 초기화
    const messageContent = inputValue.trim();
    const messageAttachments = attachments;
    setInputValue('');
    setAttachments([]);

    // Optimistic UI: 메시지를 먼저 화면에 추가
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: InquiryMessage = {
      id: tempId,
      inquiry_id: currentInquiryId,
      sender_id: currentUser.id,
      sender_role: currentUserRole,
      message: messageContent,
      attachments: messageAttachments,
      is_read: true,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name || ''
      },
      senderName: currentUser.full_name || currentUser.email || '알 수 없음',
      senderEmail: currentUser.email
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        inquiry_id: currentInquiryId,
        content: messageContent || '',
        sender_role: currentUserRole,
        attachments: messageAttachments
      };

      const { data: sentMessage, error } = await inquiryMessageService.sendMessage(
        messageData, 
        currentUser.id, 
        currentUserRole
      );

      if (error) throw error;

      // 성공 시 임시 메시지를 실제 메시지로 교체
      if (sentMessage) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { 
            ...sentMessage, 
            sender: optimisticMessage.sender, 
            senderName: optimisticMessage.senderName, 
            senderEmail: optimisticMessage.senderEmail 
          } : msg
        ));
      }
    } catch (error) {
      // 실패 시 임시 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      console.error('메시지 전송 실패:', error);
    }
  };

  // 파일 업로드 (간단한 구현)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 실제 구현에서는 파일을 서버에 업로드하고 URL을 받아야 함
    console.log('파일 업로드 기능은 아직 구현되지 않았습니다.');
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 상태 변경
  const handleStatusChange = async (status: string) => {
    if (!inquiryId || !currentUser?.id) return;

    try {
      const { error } = await inquiryService.updateInquiryStatus({
        inquiry_id: inquiryId,
        status: status as any,
        resolved_by: currentUser.id
      });

      if (error) throw error;

      fetchInquiry();
      onStatusChange?.(status);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 메시지 렌더링
  const renderMessage = (message: InquiryMessage, index: number) => {
    const isMyMessage = message.sender_id === currentUser?.id;
    const isAdmin = message.sender_role === 'admin';
    
    // 이전 메시지와 같은 발신자인지 확인
    const isSameSenderAsPrevious = index > 0 && messages[index - 1]?.sender_id === message.sender_id;
    
    // 다음 메시지와 같은 시간대인지 확인 (1분 이내)
    const nextMessage = messages[index + 1];
    const currentTime = format(new Date(message.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    const nextTime = nextMessage ? format(new Date(nextMessage.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : null;
    const isSameTimeAsNext = nextMessage && 
      nextMessage.sender_id === message.sender_id && 
      currentTime === nextTime;

    return (
      <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} ${isSameSenderAsPrevious ? 'mb-2' : 'mb-4'}`}>
        <div className={`max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isSameSenderAsPrevious && (
            <div className={`text-xs text-gray-500 mb-1 px-2 ${isMyMessage ? 'text-right' : ''}`}>
              {message.senderName || message.sender?.full_name || message.sender?.email || '알 수 없음'}
              {isAdmin && (
                <span className="ml-1 text-purple-600 font-medium">(관리자)</span>
              )}
            </div>
          )}

          <div className={`relative group`}>
            <div className={`
              relative rounded-2xl px-4 py-3 shadow-sm
              ${isMyMessage 
                ? isAdmin 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : isAdmin
                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                  : 'bg-white text-gray-800 border border-gray-200'
              }
              ${isMyMessage ? 'rounded-br-sm' : 'rounded-bl-sm'}
            `}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.message || (message.attachments && message.attachments.length > 0 ? '📎 파일이 첨부되었습니다' : '메시지 없음')}
              </p>
              
              {/* 말풍선 꼬리 - 같은 발신자의 첫 메시지에만 표시 */}
              {!isSameSenderAsPrevious && (
                <div className={`
                  absolute bottom-0 w-0 h-0
                  ${isMyMessage 
                    ? 'right-0 translate-x-1/2 border-l-8 border-l-transparent border-t-8 ' + 
                      (isAdmin ? 'border-t-purple-600' : 'border-t-blue-600')
                    : 'left-0 -translate-x-1/2 border-r-8 border-r-transparent border-t-8 ' +
                      (isAdmin ? 'border-t-gray-200' : 'border-t-white')
                  }
                `} />
              )}
            </div>

            {/* 첨부파일 표시 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`mt-2 ${isMyMessage ? 'text-right' : ''}`}>
                {message.attachments.map((attachment, idx) => (
                  <div key={idx} className={`inline-flex items-center gap-1 text-xs ${
                    isMyMessage ? 'text-blue-300' : 'text-gray-500'
                  }`}>
                    <Paperclip className="w-3 h-3" />
                    <span>{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 시간 표시 - 같은 시간대의 마지막 메시지에만 표시 */}
          {!isSameTimeAsNext && (
            <div className={`text-xs text-gray-400 mt-1 px-2 ${isMyMessage ? 'text-right' : ''}`}>
              {currentTime}
              {!message.is_read && !isMyMessage && (
                <span className="ml-2 text-blue-500 font-medium">• 읽지 않음</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            1:1 문의
            {inquiry?.status && (
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                inquiry.status === 'open' ? 'bg-blue-100 text-blue-700' :
                inquiry.status === 'resolved' ? 'bg-green-100 text-green-700' :
                inquiry.status === 'closed' ? 'bg-gray-100 text-gray-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {inquiry.status === 'open' ? '열림' :
                  inquiry.status === 'resolved' ? '해결됨' :
                  inquiry.status === 'closed' ? '종료됨' : '진행중'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* 메시지 영역 */}
        <ScrollArea className="flex-1 p-4 bg-gray-50">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">메시지를 불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-12 h-12 mb-2 text-gray-300" />
              <div>1:1 문의를 시작해주세요.</div>
              <div className="text-sm">문의사항을 입력해주세요.</div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} />
            </>
          )}
        </ScrollArea>

        {/* 입력 영역 */}
        <div className="flex-shrink-0 border-t pt-4 space-y-3">
          {/* 첨부 파일 미리보기 */}
          {attachments.length > 0 && (
            <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">첨부 파일</h4>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{attachment.name}</span>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 메시지 입력 */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isNewInquiry ? "문의 내용을 입력하세요..." : "메시지를 입력하세요..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isNewInquiry) {
                    handleCreateInquiry();
                  } else {
                    handleSendMessage();
                  }
                }
              }}
              disabled={loading || (!isNewInquiry && inquiry?.status === 'closed')}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingFiles}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="파일 첨부"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={isNewInquiry ? handleCreateInquiry : handleSendMessage}
              disabled={loading || (!inputValue.trim() && attachments.length === 0) || (!isNewInquiry && inquiry?.status === 'closed')}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {!isNewInquiry && inquiry && currentUserRole === 'admin' &&
                inquiry.status !== 'closed' && inquiry.status !== 'resolved' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('resolved')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    해결됨으로 표시
                  </Button>
                )}

              {!isNewInquiry && inquiry && inquiry.status === 'resolved' && 
                currentUser?.id === inquiry.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('closed')}
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    문의 종료
                  </Button>
                )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};