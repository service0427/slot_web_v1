import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DollarSign,
  Download,
  ChevronLeft,
  ChevronRight,
  Image,
  ExternalLink,
  Check,
  X,
  Sparkles,
  Filter,
  Users,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slotsAPI } from '@/services/api';
import { SlotService } from '@/services/slotService';
import type { Slot, SlotFilter, SlotStatus, SlotCategory, WorkType } from '@/types/slot.types';

interface AdminSlotItem extends Slot {
  current_workers?: number;
  progress?: number;
  revenue?: number;
}

export default function SlotManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWorkType, setFilterWorkType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ id: string; field: 'keyword' | 'url' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const itemsPerPage = 10;

  // 슬롯 필터 객체 생성
  const slotFilter: SlotFilter = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? (filterStatus as SlotStatus) : undefined,
    category: filterCategory !== 'all' ? (filterCategory as SlotCategory) : undefined,
    work_type: filterWorkType !== 'all' ? (filterWorkType as WorkType) : undefined,
    sort_by: sortBy as any,
    sort_order: sortOrder,
  }), [currentPage, searchTerm, filterStatus, filterCategory, filterWorkType, sortBy, sortOrder]);

  // 슬롯 목록 조회
  const { data: slotsData, isLoading, error } = useQuery({
    queryKey: ['admin-slots', slotFilter],
    queryFn: () => SlotService.getSlots(slotFilter),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  // 슬롯 통계 조회
  const { data: statsData } = useQuery({
    queryKey: ['slot-stats'],
    queryFn: () => SlotService.getSlotStats(),
    refetchInterval: 60000, // 1분마다 갱신
  });

  // 슬롯 삭제 뮤테이션
  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => SlotService.deleteSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['slot-stats'] });
      toast({
        title: "성공",
        description: "슬롯이 성공적으로 삭제되었습니다.",
      });
      setDeleteSlotId(null);
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "슬롯 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 슬롯 업데이트 뮤테이션 (인라인 편집용)
  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      SlotService.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      toast({
        title: "성공",
        description: "슬롯이 성공적으로 업데이트되었습니다.",
      });
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "슬롯 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 일괄 삭제 뮤테이션
  const bulkDeleteMutation = useMutation({
    mutationFn: async (slotIds: string[]) => {
      await Promise.all(slotIds.map(id => SlotService.deleteSlot(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['slot-stats'] });
      toast({
        title: "성공",
        description: `${selectedSlots.size}개의 슬롯이 성공적으로 삭제되었습니다.`,
      });
      setSelectedSlots(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "일괄 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 데이터 준비
  const slots = slotsData?.data || [];
  const totalSlots = slotsData?.total || 0;
  const totalPages = Math.ceil(totalSlots / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // 통계 데이터
  const stats = statsData ? {
    total: statsData.total_slots,
    active: statsData.active_slots,
    available: slots.filter(s => s.status === 'available').length,
    completed: statsData.completed_slots,
    pending: statsData.pending_slots || 0,
    cancelled: statsData.cancelled_slots || 0,
    totalRevenue: statsData.total_revenue,
    averagePrice: statsData.average_price || 0,
  } : {
    total: 0,
    active: 0,
    available: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0,
    averagePrice: 0,
  };

  // 이벤트 핸들러들
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
    queryClient.invalidateQueries({ queryKey: ['slot-stats'] });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlots(new Set(slots.map(slot => slot.id)));
    } else {
      setSelectedSlots(new Set());
    }
  };

  const handleSelectSlot = (slotId: string, checked: boolean) => {
    const newSelected = new Set(selectedSlots);
    if (checked) {
      newSelected.add(slotId);
    } else {
      newSelected.delete(slotId);
    }
    setSelectedSlots(newSelected);
  };

  const startEdit = (slotId: string, field: 'keyword' | 'url', currentValue: string) => {
    setEditingField({ id: slotId, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField && editValue.trim()) {
      updateSlotMutation.mutate({
        id: editingField.id,
        data: { [editingField.field]: editValue.trim() }
      });
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleDeleteSlot = () => {
    if (deleteSlotId) {
      deleteSlotMutation.mutate(deleteSlotId);
    }
  };

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
      bulkDeleteMutation.mutate(Array.from(selectedSlots));
    }
  };

  const handleExport = () => {
    // CSV 내보내기 구현
    const csvData = slots.map(slot => ({
      ID: slot.id,
      이름: slot.slot_name,
      키워드: slot.keyword || '',
      URL: slot.url || '',
      카테고리: getCategoryLabel(slot.category),
      작업유형: getWorkTypeLabel(slot.work_type),
      상태: getStatusLabel(slot.status),
      가격: slot.price,
      생성자: slot.creator?.full_name || '',
      생성일: formatDate(slot.created_at),
      시작일: slot.start_date ? formatDate(slot.start_date) : '',
      종료일: slot.end_date ? formatDate(slot.end_date) : '',
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `slots_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "성공",
      description: "슬롯 데이터가 CSV 파일로 내보내졌습니다.",
    });
  };

  // 유틸리티 함수들
  const getStatusLabel = (status: SlotStatus): string => {
    const statusMap = {
      available: '모집중',
      pending: '대기중',
      active: '진행중',
      completed: '완료',
      cancelled: '취소',
      expired: '만료'
    };
    return statusMap[status] || status;
  };

  const getCategoryLabel = (category: SlotCategory): string => {
    const categoryMap = {
      basic: '기본',
      premium: '프리미엄',
      vip: 'VIP',
      special: '특별'
    };
    return categoryMap[category] || category;
  };

  const getWorkTypeLabel = (workType: WorkType): string => {
    const workTypeMap = {
      translation: '번역',
      design: '디자인',
      development: '개발',
      content: '콘텐츠',
      marketing: '마케팅',
      other: '기타'
    };
    return workTypeMap[workType] || workType;
  };

  const getStatusColor = (status: SlotStatus): string => {
    const colorMap = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '-').replace('.', '');
    } catch {
      return dateString;
    }
  };

  const calculateProgress = (slot: Slot): number => {
    if (!slot.start_date || !slot.end_date) return 0;
    
    const start = new Date(slot.start_date).getTime();
    const end = new Date(slot.end_date).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const calculateRemainingDays = (slot: Slot): number => {
    if (!slot.end_date) return 0;
    
    const end = new Date(slot.end_date).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diff);
  };

  // 순위 표시 컴포넌트
  const RankDisplay = ({ slot }: { slot: AdminSlotItem }) => {
    if (!slot.rank) return <span className="text-gray-400">-</span>;
    
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 로드 실패</h3>
          <p className="text-gray-500 mb-4">슬롯 데이터를 불러오는 중 오류가 발생했습니다.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">전체 슬롯 관리</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 전체 슬롯을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          {selectedSlots.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              선택 삭제 ({selectedSlots.size})
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={slots.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => navigate('/admin/slots/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            새 슬롯 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">전체 슬롯</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
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
            <Activity className="w-8 h-8 text-blue-500" />
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
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">총 매출</p>
              <p className="text-xl font-bold">₩{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">평균 가격</p>
              <p className="text-xl font-bold">₩{Math.round(stats.averagePrice).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
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
              placeholder="슬롯명, 키워드, URL, 생성자로 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="available">모집중</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={(value) => {
              setFilterCategory(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                <SelectItem value="basic">기본</SelectItem>
                <SelectItem value="premium">프리미엄</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="special">특별</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterWorkType} onValueChange={(value) => {
              setFilterWorkType(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="작업 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 유형</SelectItem>
                <SelectItem value="translation">번역</SelectItem>
                <SelectItem value="design">디자인</SelectItem>
                <SelectItem value="development">개발</SelectItem>
                <SelectItem value="content">콘텐츠</SelectItem>
                <SelectItem value="marketing">마케팅</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>정렬</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setSortBy('created_at');
                  setSortOrder('desc');
                }}>
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy('created_at');
                  setSortOrder('asc');
                }}>
                  오래된순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy('price');
                  setSortOrder('desc');
                }}>
                  가격 높은순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy('price');
                  setSortOrder('asc');
                }}>
                  가격 낮은순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* 슬롯 테이블 */}
      <Card className="overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-gray-500">데이터를 불러오는 중...</span>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={selectedSlots.size === slots.length && slots.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">슬롯명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">키워드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업유형</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">가격</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">진행률</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">생성자</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">생성일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <BarChart3 className="w-12 h-12 text-gray-300 mb-2" />
                        <span>검색 결과가 없습니다</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  slots.map((slot, index) => {
                    const progress = calculateProgress(slot);
                    const remainingDays = calculateRemainingDays(slot);
                    
                    return (
                      <motion.tr
                        key={slot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* 체크박스 */}
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedSlots.has(slot.id)}
                            onCheckedChange={(checked) => handleSelectSlot(slot.id, checked as boolean)}
                          />
                        </td>

                        {/* ID */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-mono text-gray-600">{slot.id.slice(-6)}</span>
                        </td>

                        {/* 슬롯명 */}
                        <td className="px-4 py-3">
                          <div className="max-w-[200px]">
                            <p className="text-sm font-medium text-gray-900 truncate" title={slot.slot_name}>
                              {slot.slot_name}
                            </p>
                            {slot.description && (
                              <p className="text-xs text-gray-500 truncate" title={slot.description}>
                                {slot.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 키워드 (편집 가능) */}
                        <td className="px-4 py-3">
                          {editingField?.id === slot.id && editingField.field === 'keyword' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-sm w-32"
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
                              <span className="text-sm text-gray-900 max-w-[120px] truncate">
                                {slot.keyword || '-'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEdit(slot.id, 'keyword', slot.keyword || '')}
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
                                className="h-8 text-sm w-48"
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
                              {slot.url ? (
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
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEdit(slot.id, 'url', slot.url || '')}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>

                        {/* 카테고리 */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(slot.category)}
                          </Badge>
                        </td>

                        {/* 작업 유형 */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {getWorkTypeLabel(slot.work_type)}
                          </Badge>
                        </td>

                        {/* 상태 */}
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${getStatusColor(slot.status)}`}>
                            {getStatusLabel(slot.status)}
                          </Badge>
                        </td>

                        {/* 가격 */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ₩{slot.price.toLocaleString()}
                          </span>
                        </td>

                        {/* 진행률 */}
                        <td className="px-4 py-3 text-center">
                          <div className="w-16 mx-auto">
                            <div className="flex items-center text-xs text-gray-600 mb-1">
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {remainingDays > 0 && (
                              <div className={`text-xs mt-1 ${
                                remainingDays <= 3 ? 'text-red-600' : 
                                remainingDays <= 7 ? 'text-yellow-600' : 
                                'text-gray-500'
                              }`}>
                                {remainingDays}일 남음
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 생성자 */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {slot.creator?.full_name || '-'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {slot.creator?.email?.split('@')[0] || '-'}
                            </span>
                          </div>
                        </td>

                        {/* 생성일 */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-600">
                            {formatDate(slot.created_at)}
                          </span>
                        </td>

                        {/* 관리 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/slots/${slot.id}`)}
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/slots/${slot.id}/edit`)}
                              title="편집"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteSlotId(slot.id)}
                              title="삭제"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {totalSlots}개 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalSlots)}개 표시
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

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteSlotId} onOpenChange={() => setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>슬롯을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 슬롯과 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSlotMutation.isPending}
            >
              {deleteSlotMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}