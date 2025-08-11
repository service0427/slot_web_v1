import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Image,
  ExternalLink,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlotService } from '@/services/slotService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Slot } from '@/types/slot.types';

export default function SlotListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ id: string; field: 'keyword' | 'url' } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const itemsPerPage = 10;
  const isAdmin = user?.role === 'admin';

  // 슬롯 목록 조회
  const { data: slotList, isLoading } = useQuery({
    queryKey: ['slots', currentPage],
    queryFn: () => SlotService.getSlots({ page: currentPage, limit: itemsPerPage }),
  });

  // 슬롯 업데이트 뮤테이션
  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Slot> }) => 
      SlotService.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({
        title: "성공",
        description: "슬롯이 업데이트되었습니다.",
      });
      setEditingField(null);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 슬롯 삭제 뮤테이션
  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => SlotService.deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({
        title: "성공",
        description: "슬롯이 삭제되었습니다.",
      });
    },
  });

  // 더미 데이터 변환 및 순위 변동 계산
  const slots: Slot[] = slotList?.data?.map((slot: any, index: number) => {
    const previousRank = slot.previous_rank || Math.floor(Math.random() * 20) + 1;
    const currentRank = Math.floor(Math.random() * 20) + 1;
    let rankChange: 'up' | 'down' | 'same' | 'new' = 'same';
    
    if (!slot.previous_rank) {
      rankChange = 'new';
    } else if (currentRank < previousRank) {
      rankChange = 'up';
    } else if (currentRank > previousRank) {
      rankChange = 'down';
    }

    const startDate = new Date(slot.created_at);
    const endDate = new Date(startDate.getTime() + (slot.duration_days || 30) * 24 * 60 * 60 * 1000);
    const today = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      ...slot,
      keyword: slot.keyword || `키워드${index + 1}`,
      url: slot.url || `https://example.com/product/${slot.id}`,
      thumbnail: slot.thumbnail || '/api/placeholder/80/80',
      rank: currentRank,
      previous_rank: previousRank,
      rank_change: rankChange,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      remaining_days: remainingDays,
    };
  }) || [];

  // 통계 계산
  const stats = {
    total: slots.length,
    active: slots.filter(s => s.status === 'active').length,
    available: slots.filter(s => s.status === 'available').length,
    completed: slots.filter(s => s.status === 'completed').length,
  };

  // 필터링된 슬롯
  const filteredSlots = slots.filter(slot => {
    const matchesSearch = 
      slot.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.slot_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || slot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredSlots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSlots = filteredSlots.slice(startIndex, startIndex + itemsPerPage);

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlots(new Set(paginatedSlots.map(slot => slot.id)));
    } else {
      setSelectedSlots(new Set());
    }
  };

  // 개별 선택
  const handleSelectSlot = (slotId: string, checked: boolean) => {
    const newSelected = new Set(selectedSlots);
    if (checked) {
      newSelected.add(slotId);
    } else {
      newSelected.delete(slotId);
    }
    setSelectedSlots(newSelected);
  };

  // 인라인 편집 시작
  const startEdit = (slotId: string, field: 'keyword' | 'url', currentValue: string) => {
    setEditingField({ id: slotId, field });
    setEditValue(currentValue);
  };

  // 인라인 편집 저장
  const saveEdit = () => {
    if (editingField) {
      updateSlotMutation.mutate({
        id: editingField.id,
        data: { [editingField.field]: editValue }
      });
    }
  };

  // 인라인 편집 취소
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // 순위 표시 컴포넌트
  const RankDisplay = ({ slot }: { slot: Slot }) => {
    const rankDiff = slot.previous_rank ? slot.previous_rank - slot.rank : 0;
    
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold">{slot.rank}</span>
          {slot.rank_change === 'up' && (
            <div className="flex items-center text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">{Math.abs(rankDiff)}</span>
            </div>
          )}
          {slot.rank_change === 'down' && (
            <div className="flex items-center text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">{Math.abs(rankDiff)}</span>
            </div>
          )}
          {slot.rank_change === 'same' && (
            <Minus className="w-4 h-4 text-gray-400" />
          )}
          {slot.rank_change === 'new' && (
            <Sparkles className="w-4 h-4 text-yellow-500" />
          )}
        </div>
        {slot.previous_rank && slot.rank_change !== 'same' && (
          <span className="text-xs text-gray-500">이전: {slot.previous_rank}위</span>
        )}
      </div>
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  };

  // 일괄 삭제
  const handleBulkDelete = () => {
    if (selectedSlots.size === 0) {
      toast({
        title: "알림",
        description: "삭제할 슬롯을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`선택한 ${selectedSlots.size}개의 슬롯을 삭제하시겠습니까?`)) {
      selectedSlots.forEach(slotId => {
        deleteSlotMutation.mutate(slotId);
      });
      setSelectedSlots(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">슬롯 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? '전체 슬롯을 관리합니다' : '내 슬롯을 관리합니다'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSlots.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              선택 삭제 ({selectedSlots.size})
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => navigate('/slots/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            새 슬롯 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">전체 슬롯</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">모집중</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">진행중</p>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">완료</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* 필터 및 검색 영역 */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="슬롯명, 키워드, URL로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="available">모집중</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 슬롯 테이블 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3">
                  <Checkbox
                    checked={selectedSlots.size === paginatedSlots.length && paginatedSlots.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">번호</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">사용자ID</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">키워드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">썸네일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">순위</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">남은일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">시작일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">종료일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                      <span>데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedSlots.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-12 h-12 text-gray-300 mb-2" />
                      <span>슬롯이 없습니다</span>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate('/slots/create')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        첫 슬롯 만들기
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSlots.map((slot, index) => (
                  <motion.tr
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* 체크박스 */}
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedSlots.has(slot.id)}
                        onCheckedChange={(checked) => handleSelectSlot(slot.id, checked as boolean)}
                      />
                    </td>

                    {/* 번호 */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-900">{startIndex + index + 1}</span>
                    </td>

                    {/* 사용자 ID (관리자만) */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {slot.creator?.email?.split('@')[0] || 'user' + slot.id.slice(0, 4)}
                          </span>
                          <span className="text-xs text-gray-500">{slot.creator?.full_name}</span>
                        </div>
                      </td>
                    )}

                    {/* 키워드 (편집 가능) */}
                    <td className="px-4 py-3">
                      {editingField?.id === slot.id && editingField.field === 'keyword' ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className="text-sm font-medium text-gray-900">{slot.keyword}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEdit(slot.id, 'keyword', slot.keyword)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>

                    {/* URL (편집 가능) */}
                    <td className="px-4 py-3">
                      {editingField?.id === slot.id && editingField.field === 'url' ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <a 
                            href={slot.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                            title={slot.url}
                          >
                            {slot.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEdit(slot.id, 'url', slot.url)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>

                    {/* 썸네일 */}
                    <td className="px-4 py-3 text-center">
                      {slot.thumbnail ? (
                        <img 
                          src={slot.thumbnail} 
                          alt={slot.keyword}
                          className="w-12 h-12 rounded-lg object-cover mx-auto"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>

                    {/* 순위 */}
                    <td className="px-4 py-3">
                      <RankDisplay slot={slot} />
                    </td>

                    {/* 남은일 */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        slot.remaining_days <= 3 ? 'text-red-600' : 
                        slot.remaining_days <= 7 ? 'text-yellow-600' : 
                        'text-gray-900'
                      }`}>
                        {slot.remaining_days}일
                      </span>
                    </td>

                    {/* 시작일 */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-green-600">
                        {formatDate(slot.start_date)}
                      </span>
                    </td>

                    {/* 종료일 */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-red-600">
                        {formatDate(slot.end_date)}
                      </span>
                    </td>

                    {/* 관리 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/slots/${slot.id}`)}
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                          title="삭제"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {filteredSlots.length}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSlots.length)}개 표시
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </Button>
              
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {i + 1}
                </Button>
              )).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}