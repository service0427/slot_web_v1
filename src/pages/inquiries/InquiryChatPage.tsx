import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  File,
  X,
  Star,
  MessageCircle,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin' | 'system';
  sender_name: string;
  sender_avatar?: string;
  message: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface Inquiry {
  id: string;
  inquiry_code: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  slot_id?: string;
  slot_name?: string;
  messages: Message[];
  assigned_admin?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

// 더미 데이터
const mockInquiry: Inquiry = {
  id: 'INQ001',
  inquiry_code: 'INQ-2024-001',
  title: '슬롯 작업 진행 관련 문의',
  category: '슬롯문의',
  status: 'in_progress',
  slot_id: 'SL001',
  slot_name: '겨울 패딩 마케팅',
  assigned_admin: {
    id: 'admin1',
    full_name: '김관리자',
    avatar_url: '/api/placeholder/40/40'
  },
  messages: [
    {
      id: 'msg1',
      inquiry_id: 'INQ001',
      sender_id: 'user1',
      sender_type: 'user',
      sender_name: '이사용자',
      message: '안녕하세요. 슬롯 작업 진행 상황이 궁금합니다.',
      is_read: true,
      read_at: '2024-12-10T10:35:00Z',
      created_at: '2024-12-10T10:30:00Z'
    },
    {
      id: 'msg2',
      inquiry_id: 'INQ001',
      sender_id: 'admin1',
      sender_type: 'admin',
      sender_name: '김관리자',
      sender_avatar: '/api/placeholder/40/40',
      message: '안녕하세요! 현재 키워드 분석 작업이 진행 중입니다. 전체 진행률은 65% 정도입니다.',
      is_read: true,
      read_at: '2024-12-10T10:40:00Z',
      created_at: '2024-12-10T10:35:00Z'
    },
    {
      id: 'msg3',
      inquiry_id: 'INQ001',
      sender_id: 'user1',
      sender_type: 'user',
      sender_name: '이사용자',
      message: '감사합니다. 예상 완료일은 언제쯤일까요?',
      is_read: true,
      read_at: '2024-12-10T10:45:00Z',
      created_at: '2024-12-10T10:42:00Z'
    },
    {
      id: 'msg4',
      inquiry_id: 'INQ001',
      sender_id: 'admin1',
      sender_type: 'admin',
      sender_name: '김관리자',
      sender_avatar: '/api/placeholder/40/40',
      message: '현재 진행 속도로 보면 12월 15일경 완료 예정입니다. 작업이 완료되면 즉시 알려드리겠습니다.',
      attachments: [
        {
          name: '진행상황_보고서.pdf',
          url: '/files/report.pdf',
          type: 'application/pdf',
          size: 245000
        }
      ],
      is_read: false,
      created_at: '2024-12-10T10:45:00Z'
    }
  ],
  created_at: '2024-12-10T10:30:00Z',
  updated_at: '2024-12-10T10:45:00Z'
};

export default function InquiryChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inquiry] = useState<Inquiry>(mockInquiry);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || 'user1';

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [inquiry.messages]);

  // 메시지 전송
  const handleSendMessage = () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    // 실제로는 API 호출
    toast({
      title: "메시지 전송됨",
      description: "메시지가 성공적으로 전송되었습니다.",
    });

    setNewMessage('');
    setAttachments([]);
    
    // 관리자 타이핑 시뮬레이션
    if (!isAdmin) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }, 1000);
    }
  };

  // 파일 첨부
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // 첨부파일 제거
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태 배지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '열림';
      case 'in_progress': return '진행중';
      case 'resolved': return '해결됨';
      case 'closed': return '종료';
      default: return status;
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* 헤더 */}
      <Card className="rounded-b-none border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/inquiries')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{inquiry.title}</h2>
                <Badge className={getStatusColor(inquiry.status)}>
                  {getStatusText(inquiry.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">#{inquiry.inquiry_code}</span>
                {inquiry.slot_name && (
                  <span className="text-sm text-gray-500">슬롯: {inquiry.slot_name}</span>
                )}
                {inquiry.assigned_admin && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span>담당:</span>
                    <span className="font-medium">{inquiry.assigned_admin.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {inquiry.status === 'resolved' && (
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              평가하기
            </Button>
          )}
        </div>
      </Card>

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 bg-gray-50">
        <div className="p-4 space-y-4">
          {/* 날짜 구분선 */}
          <div className="flex items-center justify-center">
            <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
              2024년 12월 10일
            </div>
          </div>

          {/* 메시지 목록 */}
          <AnimatePresence>
            {inquiry.messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const isSystemMessage = message.sender_type === 'system';

              if (isSystemMessage) {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center"
                  >
                    <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      {message.message}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: isOwnMessage ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {/* 아바타 */}
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender_avatar} />
                        <AvatarFallback>{message.sender_name[0]}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* 발신자 이름 */}
                      {!isOwnMessage && (
                        <span className="text-xs text-gray-500 px-1">
                          {message.sender_name}
                          {message.sender_type === 'admin' && (
                            <Badge variant="outline" className="ml-1 text-xs py-0 px-1">
                              관리자
                            </Badge>
                          )}
                        </span>
                      )}

                      {/* 메시지 버블 */}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        
                        {/* 첨부파일 */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((file, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  isOwnMessage ? 'bg-purple-700' : 'bg-gray-50'
                                }`}
                              >
                                <File className="w-4 h-4" />
                                <span className="text-xs flex-1">{file.name}</span>
                                <span className="text-xs opacity-70">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 시간 & 읽음 표시 */}
                      <div className={`flex items-center gap-1 px-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.created_at)}
                        </span>
                        {isOwnMessage && (
                          message.is_read ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={inquiry.assigned_admin?.avatar_url} />
                <AvatarFallback>{inquiry.assigned_admin?.full_name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      <Card className="rounded-t-none border-t">
        {/* 첨부파일 미리보기 */}
        {attachments.length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <File className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm text-gray-700 max-w-[150px] truncate">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 p-0"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="mb-1"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <Textarea
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && attachments.length === 0}
              className="mb-1 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Enter로 전송, Shift+Enter로 줄바꿈
          </div>
        </div>
      </Card>
    </div>
  );
}