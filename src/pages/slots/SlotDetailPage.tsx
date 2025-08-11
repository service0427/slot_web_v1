import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Users, Clock, Calendar, 
  FileText, Download, Upload, MessageSquare, Shield,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SlotService } from '@/services/slotService';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { SlotCategory, WorkType, SlotStatus } from '@/types/slot.types';

export default function SlotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // 현재 사용자 정보 (실제로는 context나 store에서 가져옴)
  const currentUser = {
    id: 'user1',
    role: 'user', // 'admin'으로 변경하면 관리자 기능 표시
  };

  // 슬롯 상세 조회
  const { data: slot, isLoading } = useQuery({
    queryKey: ['slot', id],
    queryFn: () => SlotService.getSlotById(id!),
    enabled: !!id,
  });

  // 슬롯 구매
  const purchaseMutation = useMutation({
    mutationFn: () => SlotService.purchaseSlot({ slot_id: id!, payment_method: 'cash' }),
    onSuccess: () => {
      alert('슬롯이 구매되었습니다.');
      setShowPurchaseModal(false);
    },
  });

  // 슬롯 삭제
  const deleteMutation = useMutation({
    mutationFn: () => SlotService.deleteSlot(id!),
    onSuccess: () => {
      navigate('/slots');
    },
  });

  // 카테고리별 색상
  const getCategoryColor = (category: SlotCategory) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      vip: 'bg-purple-100 text-purple-800',
      special: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category];
  };

  // 상태별 색상 및 아이콘
  const getStatusInfo = (status: SlotStatus) => {
    const info = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: '구매 가능' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: '대기중' },
      active: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: '진행중' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: '완료' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: '취소됨' },
      expired: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: '만료' },
    };
    return info[status];
  };

  // 작업 타입 한글 변환
  const getWorkTypeLabel = (type: WorkType) => {
    const labels = {
      translation: '번역',
      design: '디자인',
      development: '개발',
      content: '콘텐츠',
      marketing: '마케팅',
      other: '기타',
    };
    return labels[type];
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">로딩 중...</div>;
  }

  if (!slot) {
    return <div className="container mx-auto p-6">슬롯을 찾을 수 없습니다.</div>;
  }

  const isOwner = slot.creator?.id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const statusInfo = getStatusInfo(slot.status);

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/slots')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-3xl font-bold">{slot.slot_name}</h1>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/slots/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
          </div>
        )}
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={statusInfo.color}>
                  <statusInfo.icon className="w-4 h-4 mr-1" />
                  {statusInfo.label}
                </Badge>
                <Badge className={getCategoryColor(slot.category)}>
                  {slot.category}
                </Badge>
                <Badge variant="outline">
                  {getWorkTypeLabel(slot.work_type)}
                </Badge>
              </div>
              {isAdmin && (
                <Badge variant="secondary">
                  <Shield className="w-4 h-4 mr-1" />
                  관리자
                </Badge>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">설명</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {slot.description || '설명이 없습니다.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">작업 기간</p>
                <p className="font-semibold flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {slot.duration_days}일
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">최대 인원</p>
                <p className="font-semibold flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {slot.max_workers}명
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">생성일</p>
                <p className="font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(slot.created_at).toLocaleDateString()}
                </p>
              </div>
              {slot.expires_at && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">만료일</p>
                  <p className="font-semibold text-red-600">
                    {new Date(slot.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 가격 및 구매 */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">가격 정보</h3>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-blue-600">
                ₩{slot.price.toLocaleString()}
              </p>
            </div>
            
            {slot.status === 'available' && !isOwner && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowPurchaseModal(true)}
              >
                구매하기
              </Button>
            )}
            
            {isOwner && (
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>내가 생성한 슬롯입니다</p>
              </div>
            )}

            {slot.creator && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-2">생성자</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {slot.creator.full_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{slot.creator.full_name}</p>
                    <p className="text-sm text-gray-500">{slot.creator.email}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="workers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workers">작업자 ({slot.workers?.length || 0})</TabsTrigger>
          <TabsTrigger value="files">파일 ({slot.files?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">활동 내역</TabsTrigger>
          <TabsTrigger value="inquiries">문의</TabsTrigger>
        </TabsList>

        {/* 작업자 탭 */}
        <TabsContent value="workers">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">작업자 목록</h3>
              {canEdit && (
                <Button onClick={() => setShowWorkerModal(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  작업자 추가
                </Button>
              )}
            </div>
            
            {slot.workers && slot.workers.length > 0 ? (
              <div className="space-y-3">
                {slot.workers.map((worker) => (
                  <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {worker.user?.full_name[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold">{worker.user?.full_name}</p>
                        <p className="text-sm text-gray-500">{worker.user?.email}</p>
                      </div>
                      <Badge variant={worker.role === 'owner' ? 'default' : 'secondary'}>
                        {worker.role === 'owner' ? '소유자' : worker.role === 'worker' ? '작업자' : '열람자'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        참여일: {new Date(worker.joined_at).toLocaleDateString()}
                      </span>
                      {canEdit && worker.role !== 'owner' && (
                        <Button variant="ghost" size="sm">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">작업자가 없습니다.</p>
            )}
          </Card>
        </TabsContent>

        {/* 파일 탭 */}
        <TabsContent value="files">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">파일 목록</h3>
              <Button onClick={() => setShowFileUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                파일 업로드
              </Button>
            </div>
            
            {slot.files && slot.files.length > 0 ? (
              <div className="space-y-3">
                {slot.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-semibold">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {file.description || '설명 없음'} • {(file.file_size / 1024 / 1024).toFixed(2)}MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">업로드된 파일이 없습니다.</p>
            )}
          </Card>
        </TabsContent>

        {/* 활동 내역 탭 */}
        <TabsContent value="history">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">활동 내역</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-semibold">슬롯이 생성되었습니다</p>
                  <p className="text-sm text-gray-500">
                    {slot.creator?.full_name} • {new Date(slot.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {slot.status === 'active' && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-semibold">슬롯이 활성화되었습니다</p>
                    <p className="text-sm text-gray-500">
                      시스템 • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 문의 탭 */}
        <TabsContent value="inquiries">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">관련 문의</h3>
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                새 문의
              </Button>
            </div>
            <p className="text-center text-gray-500 py-8">관련 문의가 없습니다.</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 구매 확인 모달 */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>슬롯 구매 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">다음 슬롯을 구매하시겠습니까?</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{slot.slot_name}</p>
              <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
              <p className="text-2xl font-bold text-blue-600 mt-3">
                ₩{slot.price.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>
              취소
            </Button>
            <Button onClick={() => purchaseMutation.mutate()}>
              구매하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>슬롯 삭제 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>정말로 이 슬롯을 삭제하시겠습니까?</p>
            <p className="text-sm text-red-600 mt-2">
              이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 삭제됩니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 파일 업로드 모달 */}
      <Dialog open={showFileUploadModal} onOpenChange={setShowFileUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>파일 업로드</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" className="mb-4" />
            <Textarea placeholder="파일 설명 (선택사항)" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileUploadModal(false)}>
              취소
            </Button>
            <Button>업로드</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 작업자 추가 모달 */}
      <Dialog open={showWorkerModal} onOpenChange={setShowWorkerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업자 추가</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="사용자 이메일" className="mb-4" />
            <select className="w-full p-2 border rounded-md">
              <option value="worker">작업자</option>
              <option value="viewer">열람자</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkerModal(false)}>
              취소
            </Button>
            <Button>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}