import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { inquiryService } from '@/services/inquiryService';
import { InquiryChatModal } from './InquiryChatModal';
import type { Inquiry } from '@/types/inquiry.types';
import { MessageCircle, Calendar, User, AlertCircle, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface InquiryListPageProps {
  currentUser?: { id: string; email: string; full_name?: string; role?: string };
}

export const InquiryListPage: React.FC<InquiryListPageProps> = ({ currentUser }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all');

  // 문의 목록 조회
  const fetchInquiries = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const filterParams: any = {};
      
      // 관리자가 아니면 자신의 문의만 조회
      if (currentUser.role !== 'admin') {
        filterParams.user_id = currentUser.id;
      }

      // 상태 필터
      if (filter !== 'all') {
        filterParams.status = filter;
      }

      const { data, error } = await inquiryService.getInquiries(filterParams);
      
      if (error) throw error;
      
      setInquiries(data || []);
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentUser?.id, filter]);

  // 상태별 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 상태별 텍스트 반환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '열림';
      case 'in_progress':
        return '진행중';
      case 'resolved':
        return '해결됨';
      case 'closed':
        return '종료됨';
      default:
        return status;
    }
  };

  // 우선순위별 아이콘 반환
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">1:1 문의 목록</CardTitle>
                <p className="text-sm text-gray-600 mt-1">고객님의 문의사항을 확인하고 관리할 수 있습니다</p>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">총 {inquiries.length}건</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white">
          {/* 필터 버튼 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-0' : ''}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              전체
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('open')}
              className={filter === 'open' ? 'bg-blue-500 border-0' : ''}
            >
              <Clock className="w-4 h-4 mr-1" />
              열림
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('resolved')}
              className={filter === 'resolved' ? 'bg-green-500 border-0' : ''}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              해결됨
            </Button>
            <Button
              variant={filter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('closed')}
              className={filter === 'closed' ? 'bg-gray-500 border-0' : ''}
            >
              <XCircle className="w-4 h-4 mr-1" />
              종료됨
            </Button>
          </div>

          {/* 문의 목록 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="text-gray-600">문의 목록을 불러오는 중...</span>
              </div>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">문의가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">새로운 문의사항이 있으시면 문의하기 버튼을 클릭해주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry, index) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all duration-200 hover:border-purple-300"
                  onClick={() => setSelectedInquiry(inquiry.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-800 text-lg">{inquiry.title}</h3>
                        {getPriorityIcon(inquiry.priority)}
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(inquiry.status)}`}>
                          {getStatusText(inquiry.status)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="p-1 bg-purple-100 rounded">
                            <User className="w-3 h-3 text-purple-600" />
                          </div>
                          <span>{inquiry.users?.full_name || inquiry.users?.email || '알 수 없음'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="p-1 bg-blue-100 rounded">
                            <Calendar className="w-3 h-3 text-blue-600" />
                          </div>
                          <span>{format(new Date(inquiry.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                        </div>
                        {inquiry.category && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="p-1 bg-green-100 rounded">
                              <MessageCircle className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="font-medium">{inquiry.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">답변 상태</p>
                        <p className="text-sm font-medium text-purple-600">
                          {inquiry.status === 'open' ? '답변 대기' : 
                           inquiry.status === 'resolved' ? '답변 완료' : 
                           inquiry.status === 'closed' ? '종료' : '진행중'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>

      {/* 문의 상세 모달 */}
      {selectedInquiry && (
        <InquiryChatModal
          open={!!selectedInquiry}
          onClose={() => {
            setSelectedInquiry(null);
            fetchInquiries(); // 목록 새로고침
          }}
          inquiryId={selectedInquiry}
          currentUser={currentUser}
          onStatusChange={() => fetchInquiries()}
        />
      )}
    </div>
  );
};