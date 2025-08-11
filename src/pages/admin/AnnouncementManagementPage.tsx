import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Calendar,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { announcementsAPI } from '@/services/api';
import type { 
  Announcement, 
  AnnouncementType, 
  AnnouncementPriority, 
  TargetAudience,
  CreateAnnouncementParams,
  UpdateAnnouncementParams 
} from '@/types/announcement.types';

export default function AnnouncementManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 폼 데이터
  const [formData, setFormData] = useState<CreateAnnouncementParams>({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    target_audience: 'all',
    is_pinned: false,
    expires_at: ''
  });

  // 권한 체크 - 최고관리자만 접근 가능
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
            <p className="text-gray-600">이 페이지는 최고 관리자만 접근할 수 있습니다.</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/admin/dashboard')}
            >
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 공지사항 목록 조회
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', currentPage, searchTerm, filterType, filterAudience, filterPriority],
    queryFn: () => announcementsAPI.getAnnouncements({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      type: filterType !== 'all' ? filterType : undefined,
      target_audience: filterAudience !== 'all' ? filterAudience : undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined
    })
  });

  // 공지사항 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementParams) => announcementsAPI.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "성공",
        description: "공지사항이 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.response?.data?.message || "공지사항 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  });

  // 공지사항 수정
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementParams }) => 
      announcementsAPI.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "성공",
        description: "공지사항이 수정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.response?.data?.message || "공지사항 수정에 실패했습니다.",
        variant: "destructive",
      });
    }
  });

  // 공지사항 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsAPI.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowDeleteDialog(false);
      setSelectedAnnouncement(null);
      toast({
        title: "성공",
        description: "공지사항이 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.response?.data?.message || "공지사항 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  });

  // 가시성/고정 토글
  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementParams }) => 
      announcementsAPI.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.response?.data?.message || "업데이트에 실패했습니다.",
        variant: "destructive",
      });
    }
  });

  const announcements = announcementsData?.announcements || [];
  const totalPages = announcementsData?.totalPages || 1;
  const stats = announcementsData?.stats;

  // 타입별 아이콘과 색상
  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: AnnouncementType) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeText = (type: AnnouncementType) => {
    switch (type) {
      case 'info': return '정보';
      case 'warning': return '경고';
      case 'success': return '성공';
      case 'error': return '오류';
      case 'general': return '일반';
      default: return type;
    }
  };

  const getPriorityText = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'normal': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const getAudienceText = (audience: TargetAudience) => {
    switch (audience) {
      case 'all': return '전체';
      case 'users': return '사용자';
      case 'distributors': return '총판';
      case 'admins': return '관리자';
      default: return audience;
    }
  };

  // 공지사항 생성/수정
  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "오류",
        description: "제목과 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAnnouncement) {
      // 수정
      updateMutation.mutate({ 
        id: selectedAnnouncement.id, 
        data: {
          ...formData,
          expires_at: formData.expires_at || undefined
        }
      });
    } else {
      // 생성
      createMutation.mutate({
        ...formData,
        expires_at: formData.expires_at || undefined
      });
    }
  };

  // 공지사항 삭제
  const handleDelete = () => {
    if (selectedAnnouncement) {
      deleteMutation.mutate(selectedAnnouncement.id);
    }
  };

  // 가시성 토글
  const toggleVisibility = (announcement: Announcement) => {
    toggleMutation.mutate({
      id: announcement.id,
      data: { is_visible: !announcement.is_visible }
    });
  };

  // 고정 토글
  const togglePin = (announcement: Announcement) => {
    toggleMutation.mutate({
      id: announcement.id,
      data: { is_pinned: !announcement.is_pinned }
    });
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'normal',
      target_audience: 'all',
      is_pinned: false,
      expires_at: ''
    });
    setSelectedAnnouncement(null);
  };

  // 편집 모드
  const startEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      is_pinned: announcement.is_pinned,
      expires_at: announcement.expires_at || ''
    });
    setShowCreateModal(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">공지사항 관리</h1>
          <p className="text-gray-500 mt-2">시스템 공지사항을 관리합니다</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 공지사항
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">전체 공지</p>
                <p className="text-2xl font-bold">{stats.total_announcements || 0}</p>
              </div>
              <Megaphone className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">활성 공지</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.visible_announcements || 0}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">고정 공지</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.pinned_announcements || 0}
                </p>
              </div>
              <Pin className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">긴급 공지</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.urgent_announcements || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="제목 또는 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 유형</SelectItem>
                <SelectItem value="info">정보</SelectItem>
                <SelectItem value="warning">경고</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="error">오류</SelectItem>
                <SelectItem value="general">일반</SelectItem>
              </SelectContent>
            </Select>
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
            <Select value={filterAudience} onValueChange={setFilterAudience}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="대상" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="users">사용자</SelectItem>
                <SelectItem value="distributors">총판</SelectItem>
                <SelectItem value="admins">관리자</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        <AnimatePresence>
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className={`p-4 ${!announcement.is_visible ? 'opacity-60' : ''}`}>
                <div className="space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {announcement.is_pinned && (
                        <Pin className="w-5 h-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTypeColor(announcement.type)}>
                            {getTypeIcon(announcement.type)}
                            <span className="ml-1">{getTypeText(announcement.type)}</span>
                          </Badge>
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {getPriorityText(announcement.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {getAudienceText(announcement.target_audience)}
                          </Badge>
                          {!announcement.is_visible && (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" />
                              숨김
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {announcement.author.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatTimeAgo(announcement.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {announcement.view_count}회
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(announcement)}
                        title={announcement.is_visible ? "숨기기" : "표시"}
                        disabled={toggleMutation.isPending}
                      >
                        {announcement.is_visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(announcement)}
                        title={announcement.is_pinned ? "고정 해제" : "고정"}
                        disabled={toggleMutation.isPending}
                      >
                        <Pin className={`w-4 h-4 ${announcement.is_pinned ? 'text-blue-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(announcement)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                      >
                        {expandedId === announcement.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 내용 */}
                  {expandedId === announcement.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pt-3 border-t"
                    >
                      <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                      {announcement.expires_at && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            만료일: {new Date(announcement.expires_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {announcements.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">공지사항이 없습니다.</p>
            </div>
          </Card>
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
      </div>

      {/* 생성/수정 모달 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAnnouncement ? '공지사항 수정' : '새 공지사항'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div>
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="공지사항 내용을 입력하세요"
                rows={8}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">유형</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as AnnouncementType })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">정보</SelectItem>
                    <SelectItem value="warning">경고</SelectItem>
                    <SelectItem value="success">성공</SelectItem>
                    <SelectItem value="error">오류</SelectItem>
                    <SelectItem value="general">일반</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">우선순위</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as AnnouncementPriority })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="normal">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">대상</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value as TargetAudience })}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="users">사용자</SelectItem>
                    <SelectItem value="distributors">총판</SelectItem>
                    <SelectItem value="admins">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expires">만료일 (선택)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="rounded"
                  />
                  <span>상단 고정</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {selectedAnnouncement ? '수정 중...' : '생성 중...'}
                </>
              ) : (
                selectedAnnouncement ? '수정' : '생성'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 공지사항이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}