import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Reply,
  Archive,
  Star,
  Tag,
  Paperclip,
  Send,
  MoreVertical,
  Eye,
  Loader
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { inquiriesAPI } from '@/services/api';
import type { Inquiry, InquiryMessage, InquiryStatus, InquiryPriority } from '@/types/inquiry.types';

export default function InquiryManagementPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('open');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 문의 목록 조회
  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['inquiries', selectedTab, currentPage, searchTerm, filterPriority, filterCategory],
    queryFn: () => inquiriesAPI.getInquiries({
      status: selectedTab !== 'all' ? selectedTab : undefined,
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined
    })
  });

  // 문의 상세 조회
  const { data: inquiryDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['inquiry', selectedInquiry?.id],
    queryFn: () => inquiriesAPI.getInquiry(selectedInquiry?.id || ''),
    enabled: !!selectedInquiry?.id && showDetailModal
  });

  // 문의 상태 변경
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      inquiriesAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setShowDetailModal(false);
    }
  });

  // 메시지 전송
  const sendMessageMutation = useMutation({
    mutationFn: ({ inquiryId, message }: { inquiryId: string; message: string }) =>
      inquiriesAPI.sendMessage(inquiryId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry'] });
      setReplyMessage('');
    }
  });

  const inquiries = inquiriesData?.inquiries || [];
  const totalPages = inquiriesData?.totalPages || 1;

  const getStatusIcon = (status: InquiryStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <Archive className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: InquiryStatus) => {
    switch (status) {
      case 'open': return '대기';
      case 'in_progress': return '처리 중';
      case 'resolved': return '해결됨';
      case 'closed': return '종료';
      default: return status;
    }
  };

  const getPriorityText = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'normal': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const handleInquiryClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailModal(true);
  };

  const handleStatusChange = (status: InquiryStatus) => {
    if (selectedInquiry) {
      updateStatusMutation.mutate({ id: selectedInquiry.id, status });
    }
  };

  const handleSendReply = () => {
    if (selectedInquiry && replyMessage.trim()) {
      sendMessageMutation.mutate({
        inquiryId: selectedInquiry.id,
        message: replyMessage
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">문의 관리</h1>
          <p className="text-gray-500 mt-2">고객 문의를 관리하고 응답할 수 있습니다</p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="문의 제목이나 사용자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="우선순위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 우선순위</SelectItem>
                <SelectItem value="urgent">긴급</SelectItem>
                <SelectItem value="high">높음</SelectItem>
                <SelectItem value="normal">보통</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="technical">기술지원</SelectItem>
                <SelectItem value="billing">결제</SelectItem>
                <SelectItem value="refund">환불</SelectItem>
                <SelectItem value="service">서비스</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 탭과 문의 목록 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="open">대기</TabsTrigger>
          <TabsTrigger value="in_progress">처리 중</TabsTrigger>
          <TabsTrigger value="resolved">해결됨</TabsTrigger>
          <TabsTrigger value="closed">종료</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {inquiries.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">문의가 없습니다</h3>
              <p className="text-gray-500">현재 조건에 맞는 문의가 없습니다.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleInquiryClick(inquiry)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(inquiry.priority)}`}></div>
                        <h3 className="font-medium text-lg">{inquiry.title}</h3>
                        <Badge className={getStatusColor(inquiry.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(inquiry.status)}
                            {getStatusText(inquiry.status)}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {inquiry.user_name} ({inquiry.user_email})
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {inquiry.category || '일반'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTimeAgo(inquiry.created_at)}
                        </div>
                      </div>

                      {inquiry.last_message && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <p className="truncate">{inquiry.last_message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {inquiry.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white">
                          {inquiry.unread_count}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 문의 상세 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedInquiry?.priority || 'normal')}`}></div>
              {selectedInquiry?.title}
              <Badge className={getStatusColor(selectedInquiry?.status || 'open')}>
                {getStatusText(selectedInquiry?.status || 'open')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 문의 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-500">문의자</Label>
                  <p className="font-medium">{inquiryDetail?.inquiry?.user_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">카테고리</Label>
                  <p className="font-medium">{inquiryDetail?.inquiry?.category || '일반'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">우선순위</Label>
                  <p className="font-medium">{getPriorityText(inquiryDetail?.inquiry?.priority || 'normal')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">등록일</Label>
                  <p className="font-medium">{new Date(inquiryDetail?.inquiry?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>

              {/* 메시지 목록 */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {inquiryDetail?.messages?.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.sender_type === 'admin' ? 'justify-end' : ''}`}>
                    <div className={`max-w-[70%] ${
                      message.sender_type === 'admin' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200'
                    } p-4 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {message.sender_name || (message.sender_type === 'admin' ? '관리자' : '사용자')}
                        </span>
                        <span className={`text-xs ${
                          message.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimeAgo(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 답변 작성 */}
              <div className="space-y-4">
                <Textarea
                  placeholder="답변을 입력하세요..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Select
                      value={selectedInquiry?.status || 'open'}
                      onValueChange={(value) => handleStatusChange(value as InquiryStatus)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">대기</SelectItem>
                        <SelectItem value="in_progress">처리 중</SelectItem>
                        <SelectItem value="resolved">해결됨</SelectItem>
                        <SelectItem value="closed">종료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleSendReply} 
                    disabled={!replyMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMessageMutation.isPending ? '전송 중...' : '답변 전송'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}