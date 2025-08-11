import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  User,
  Briefcase,
  DollarSign,
  Clock,
  ChevronLeft,
  Save,
  UserPlus,
  Search,
  Check,
  X,
  AlertCircle,
  Users,
  Target,
  Link2,
  Image
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserOption {
  id: string;
  user_code: string;
  email: string;
  full_name: string;
  role: string;
  parent_user_id?: string;
  parent_name?: string;
  active_slots: number;
  total_balance: number;
}

// 더미 사용자 데이터
const mockUsers: UserOption[] = [
  {
    id: 'user1',
    user_code: 'USR001',
    email: 'kim@example.com',
    full_name: '김철수',
    role: 'user',
    parent_user_id: 'dist1',
    parent_name: '서울총판',
    active_slots: 2,
    total_balance: 500000
  },
  {
    id: 'user2',
    user_code: 'USR002',
    email: 'lee@example.com',
    full_name: '이영희',
    role: 'user',
    parent_user_id: 'dist1',
    parent_name: '서울총판',
    active_slots: 1,
    total_balance: 300000
  },
  {
    id: 'user3',
    user_code: 'USR003',
    email: 'park@example.com',
    full_name: '박민수',
    role: 'user',
    parent_user_id: 'dist2',
    parent_name: '부산총판',
    active_slots: 0,
    total_balance: 1000000
  },
  {
    id: 'dist1',
    user_code: 'DST001',
    email: 'seoul@distributor.com',
    full_name: '서울총판',
    role: 'distributor',
    active_slots: 5,
    total_balance: 5000000
  },
  {
    id: 'dist2',
    user_code: 'DST002',
    email: 'busan@distributor.com',
    full_name: '부산총판',
    role: 'distributor',
    active_slots: 3,
    total_balance: 3000000
  }
];

export default function SlotAssignmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    assigned_user_id: '',
    slot_name: '',
    description: '',
    keyword: '',
    url: '',
    thumbnail: '',
    category: 'basic',
    work_type: 'marketing',
    price: '',
    start_date: '',
    end_date: '',
    work_days: '',
    max_workers: '1'
  });

  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  // 작업일수 자동 계산
  const calculateWorkDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays.toString();
  };

  // 날짜 변경 시 작업일수 자동 계산
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newData = { ...formData, [field]: value };
    
    if (newData.start_date && newData.end_date) {
      newData.work_days = calculateWorkDays(newData.start_date, newData.end_date);
    }
    
    setFormData(newData);
  };

  // 사용자 선택
  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    setFormData({ ...formData, assigned_user_id: user.id });
    setUserSearchTerm(user.full_name);
    setShowUserDropdown(false);
  };

  // 사용자 검색 필터
  const filteredUsers = mockUsers.filter(u => 
    u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.user_code.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // 권한에 따른 사용자 필터링
  const availableUsers = (() => {
    if (user?.role === 'super_admin') {
      return filteredUsers; // 모든 사용자 표시
    } else if (user?.role === 'distributor') {
      // 총판은 자신의 하위 사용자만
      return filteredUsers.filter(u => u.parent_user_id === user.id);
    }
    return [];
  })();

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "오류",
        description: "사용자를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "오류",
        description: "작업 시작일과 종료일을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  // 슬롯 할당 확정
  const confirmAssignment = async () => {
    setIsSubmitting(true);
    
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "성공",
        description: `${selectedUser?.full_name}님에게 슬롯이 할당되었습니다.`,
      });
      
      navigate('/admin/slots');
    } catch (error) {
      toast({
        title: "오류",
        description: "슬롯 할당에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/slots')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">슬롯 할당</h1>
          <p className="text-sm text-gray-500 mt-1">사용자에게 새로운 슬롯을 할당합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 사용자 선택 섹션 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">사용자 선택</h2>
            <Badge variant="destructive">필수</Badge>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="user">할당 대상 사용자</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="user"
                  placeholder="이름, 이메일, 사용자 코드로 검색..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="pl-10"
                />
              </div>
              
              {/* 사용자 드롭다운 */}
              {showUserDropdown && availableUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {availableUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.full_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.user_code}
                          </Badge>
                          {user.role === 'distributor' && (
                            <Badge className="text-xs bg-orange-100 text-orange-800">
                              총판
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {user.email}
                          {user.parent_name && (
                            <span className="ml-2">• 소속: {user.parent_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-500">활성 슬롯: {user.active_slots}개</div>
                        <div className="text-gray-500">잔액: ₩{user.total_balance.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 사용자 정보 */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">선택된 사용자</p>
                    <p className="text-lg font-semibold">{selectedUser.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{selectedUser.user_code}</Badge>
                    {selectedUser.parent_name && (
                      <p className="text-sm text-gray-500 mt-1">{selectedUser.parent_name}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* 작업 일정 섹션 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">작업 일정</h2>
            <Badge variant="destructive">필수</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_date">작업 시작일</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">작업 종료일</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                min={formData.start_date}
                required
              />
            </div>
            <div>
              <Label htmlFor="work_days">작업 일수</Label>
              <div className="relative">
                <Input
                  id="work_days"
                  type="number"
                  value={formData.work_days}
                  onChange={(e) => setFormData({ ...formData, work_days: e.target.value })}
                  placeholder="자동 계산됨"
                  className="pr-10"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">시작일과 종료일 선택 시 자동 계산</p>
            </div>
          </div>
        </Card>

        {/* 슬롯 기본 정보 섹션 (선택사항) */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">슬롯 정보</h2>
            <Badge variant="outline">선택사항</Badge>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            사용자가 직접 입력할 수 있는 정보입니다. 비워두셔도 됩니다.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slot_name">슬롯명</Label>
                <Input
                  id="slot_name"
                  placeholder="예: 겨울 패딩 마케팅"
                  value={formData.slot_name}
                  onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">베이직</SelectItem>
                    <SelectItem value="premium">프리미엄</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="special">스페셜</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="슬롯에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">
                  <Target className="w-4 h-4 inline mr-1" />
                  타겟 키워드
                </Label>
                <Input
                  id="keyword"
                  placeholder="예: 겨울 패딩"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="url">
                  <Link2 className="w-4 h-4 inline mr-1" />
                  상품/서비스 URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/product"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnail">
                <Image className="w-4 h-4 inline mr-1" />
                썸네일 URL
              </Label>
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* 가격 설정 섹션 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">가격 설정</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">슬롯 가격</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">사용자 잔액에서 차감됩니다</p>
            </div>
            <div>
              <Label htmlFor="work_type">작업 유형</Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => setFormData({ ...formData, work_type: value })}
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
            <div>
              <Label htmlFor="max_workers">최대 작업자 수</Label>
              <Input
                id="max_workers"
                type="number"
                min="1"
                value={formData.max_workers}
                onChange={(e) => setFormData({ ...formData, max_workers: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* 알림 메시지 */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">할당 시 알림</p>
              <p className="text-sm text-blue-700 mt-1">
                슬롯이 할당되면 사용자에게 알림이 발송되며, 사용자는 할당받은 슬롯의 상세 정보를 확인하고 수정할 수 있습니다.
              </p>
            </div>
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/slots')}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedUser}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="w-4 h-4 mr-2" />
            슬롯 할당하기
          </Button>
        </div>
      </form>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>슬롯 할당 확인</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p><strong>{selectedUser?.full_name}</strong>님에게 다음 슬롯을 할당하시겠습니까?</p>
                <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-1">
                  {formData.slot_name && (
                    <p className="text-sm"><span className="font-medium">슬롯명:</span> {formData.slot_name}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">작업 기간:</span> {formData.start_date} ~ {formData.end_date} ({formData.work_days}일)
                  </p>
                  {formData.price && (
                    <p className="text-sm">
                      <span className="font-medium">가격:</span> ₩{Number(formData.price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAssignment}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? '할당 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}