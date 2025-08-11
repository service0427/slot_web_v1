import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { SlotService } from '@/services/slotService';
import type { UpdateSlotParams, SlotStatus } from '@/types/slot.types';
import { useAuth } from '@/hooks/useAuth';

export default function SlotEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState<UpdateSlotParams>({
    slot_name: '',
    description: '',
    category: 'basic',
    work_type: 'translation',
    price: 0,
    duration_days: 7,
    max_workers: 1,
    status: 'available',
  });

  // 슬롯 조회
  const { data: slot, isLoading, error } = useQuery({
    queryKey: ['slot', id],
    queryFn: () => SlotService.getSlotById(id!),
    enabled: !!id,
  });

  // 슬롯 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSlotParams) => SlotService.updateSlot(id!, data),
    onSuccess: () => {
      toast({
        title: '슬롯 수정 완료',
        description: '슬롯이 성공적으로 수정되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['slot', id] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: '수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 슬롯 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => SlotService.deleteSlot(id!),
    onSuccess: () => {
      toast({
        title: '슬롯 삭제 완료',
        description: '슬롯이 성공적으로 삭제되었습니다.',
      });
      navigate('/slots');
    },
    onError: (error: Error) => {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 슬롯 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (slot) {
      setFormData({
        slot_name: slot.slot_name,
        description: slot.description || '',
        category: slot.category,
        work_type: slot.work_type,
        price: slot.price,
        duration_days: slot.duration_days,
        max_workers: slot.max_workers,
        status: slot.status,
      });
    }
  }, [slot]);

  // 권한 체크
  const isOwner = slot?.creator?.id === user?.id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  // 폼 변경 감지
  const handleInputChange = (
    field: keyof UpdateSlotParams,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // 수정 저장
  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  // 상태 변경
  const handleStatusChange = (status: SlotStatus) => {
    updateMutation.mutate({ status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>슬롯을 불러올 수 없습니다.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <p>이 슬롯을 수정할 권한이 없습니다.</p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/slots/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            슬롯 상세로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  // 상태별 색상
  const getStatusColor = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/slots/${id}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">슬롯 수정</h1>
            <p className="text-gray-600 mt-1">{slot?.slot_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              변경사항 있음
            </Badge>
          )}
          <Badge className={getStatusColor(slot?.status || 'available')}>
            {slot?.status === 'available' ? '모집중' :
             slot?.status === 'pending' ? '대기중' :
             slot?.status === 'active' ? '진행중' :
             slot?.status === 'completed' ? '완료' : '취소됨'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 폼 */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="details">상세 설정</TabsTrigger>
              <TabsTrigger value="status">상태 관리</TabsTrigger>
            </TabsList>

            {/* 기본 정보 탭 */}
            <TabsContent value="basic">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="slot_name">슬롯 이름</Label>
                    <Input
                      id="slot_name"
                      value={formData.slot_name}
                      onChange={(e) => handleInputChange('slot_name', e.target.value)}
                      placeholder="슬롯 이름을 입력하세요"
                      disabled={slot?.status !== 'available'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="슬롯에 대한 상세 설명을 입력하세요"
                      rows={6}
                      disabled={slot?.status !== 'available'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                        disabled={slot?.status !== 'available'}
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="work_type">작업 유형</Label>
                      <Select
                        value={formData.work_type}
                        onValueChange={(value) => handleInputChange('work_type', value)}
                        disabled={slot?.status !== 'available'}
                      >
                        <SelectTrigger id="work_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="translation">번역</SelectItem>
                          <SelectItem value="design">디자인</SelectItem>
                          <SelectItem value="development">개발</SelectItem>
                          <SelectItem value="content">콘텐츠</SelectItem>
                          <SelectItem value="marketing">마케팅</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* 상세 설정 탭 */}
            <TabsContent value="details">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">상세 설정</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="price">가격 (원)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="pl-10"
                        disabled={slot?.status !== 'available'}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      포맷된 가격: ₩{(formData.price || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="duration_days">작업 기간 (일)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="duration_days"
                        type="number"
                        value={formData.duration_days}
                        onChange={(e) => handleInputChange('duration_days', parseInt(e.target.value) || 1)}
                        placeholder="7"
                        min={1}
                        className="pl-10"
                        disabled={slot?.status !== 'available'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max_workers">최대 작업자 수</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="max_workers"
                        type="number"
                        value={formData.max_workers}
                        onChange={(e) => handleInputChange('max_workers', parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min={1}
                        className="pl-10"
                        disabled={slot?.status !== 'available'}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* 상태 관리 탭 */}
            <TabsContent value="status">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">상태 관리</h3>
                <div className="space-y-4">
                  <div>
                    <Label>현재 상태</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(slot?.status || 'available')}>
                        {slot?.status === 'available' ? '모집중' :
                         slot?.status === 'pending' ? '대기중' :
                         slot?.status === 'active' ? '진행중' :
                         slot?.status === 'completed' ? '완료' : '취소됨'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(slot?.updated_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label>상태 변경</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      슬롯의 현재 상태에 따라 가능한 액션이 다릅니다.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {slot?.status === 'available' && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange('pending')}
                            disabled={updateMutation.isPending}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            대기 상태로 변경
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusChange('cancelled')}
                            disabled={updateMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            취소
                          </Button>
                        </>
                      )}
                      {slot?.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => handleStatusChange('active')}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            진행 시작
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusChange('available')}
                            disabled={updateMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            모집중으로 변경
                          </Button>
                        </>
                      )}
                      {slot?.status === 'active' && (
                        <Button
                          variant="default"
                          onClick={() => handleStatusChange('completed')}
                          disabled={updateMutation.isPending}
                          className="col-span-2"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          완료 처리
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 위험 구역 */}
                  <div className="border-t pt-4">
                    <Label className="text-red-600">위험 구역</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          슬롯 삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 슬롯과 관련된 모든 데이터가 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 저장 버튼 */}
          <Card className="p-4">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  변경사항 저장
                </>
              )}
            </Button>
          </Card>

          {/* 슬롯 정보 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">슬롯 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">생성일</span>
                <span>{new Date(slot?.created_at || '').toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수정일</span>
                <span>{new Date(slot?.updated_at || '').toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">생성자</span>
                <span>{slot?.creator?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">현재 작업자</span>
                <span>{slot?.workers?.length || 0}명</span>
              </div>
            </div>
          </Card>

          {/* 빠른 액션 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">빠른 액션</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/slots/${id}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                슬롯 상세 보기
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/slots')}
              >
                <Package className="w-4 h-4 mr-2" />
                슬롯 목록으로
              </Button>
            </div>
          </Card>

          {/* 도움말 */}
          <Card className="p-4 bg-blue-50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">수정 제한사항</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• 진행중인 슬롯은 기본 정보 수정 불가</li>
                  <li>• 완료된 슬롯은 상태 변경만 가능</li>
                  <li>• 삭제는 모집중 상태에서만 가능</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}