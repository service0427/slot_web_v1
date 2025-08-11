import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  Phone,
  DollarSign,
  Shield,
  Edit,
  Eye,
  MoreVertical,
  UserPlus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  user_code: string;
  email: string;
  full_name: string;
  phone?: string;
  level: number;
  user_role: string;
  status: 'active' | 'inactive' | 'suspended';
  parent_id?: string;
  parent_name?: string;
  children_count?: number;
  slot_count?: number;
  active_slot_count?: number;
  cash_balance?: number;
  created_at: string;
  last_login_at?: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | 'activate'>('suspend');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 사용자 목록 조회
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage, filterLevel, filterStatus],
    queryFn: () => usersAPI.getUsers({
      page: currentPage,
      limit: 10,
      level: filterLevel !== 'all' ? filterLevel : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }),
  });

  // 사용자 수정
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "성공",
        description: "사용자 정보가 업데이트되었습니다.",
      });
      setShowActionModal(false);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 생성
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => usersAPI.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "성공",
        description: "사용자가 생성되었습니다.",
      });
      setShowUserModal(false);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "사용자 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (user: User, newStatus: string) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { status: newStatus }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createUserMutation.mutate({
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
      user_code: formData.get('user_code'),
      phone: formData.get('phone'),
    });
  };

  const filteredUsers = usersData?.users?.filter((user: User) => {
    if (searchTerm && !user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const stats = {
    totalUsers: usersData?.total || 0,
    activeUsers: filteredUsers.filter((u: User) => u.status === 'active').length,
    suspendedUsers: filteredUsers.filter((u: User) => u.status === 'suspended').length,
    totalRevenue: filteredUsers.reduce((sum: number, u: User) => sum + (u.cash_balance || 0), 0),
  };

  const getRoleBadge = (role: string, level: number) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      'admin': { label: '관리자', className: 'bg-red-100 text-red-700' },
      'distributor': { label: '총판', className: 'bg-purple-100 text-purple-700' },
      'agency': { label: '대행사', className: 'bg-blue-100 text-blue-700' },
      'user': { label: '사용자', className: 'bg-gray-100 text-gray-700' },
    };
    
    return roleMap[role] || { label: role, className: 'bg-gray-100 text-gray-700' };
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'active': { label: '활성', className: 'bg-green-100 text-green-700' },
      'inactive': { label: '비활성', className: 'bg-gray-100 text-gray-700' },
      'suspended': { label: '정지', className: 'bg-red-100 text-red-700' },
    };
    
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  const getLevelLabel = (level: number) => {
    const levelMap: Record<number, string> = {
      1: '최고관리자',
      2: '총판',
      3: '대행사',
      4: '일반사용자',
    };
    return levelMap[level] || '알 수 없음';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-gray-500 mt-1">전체 사용자를 관리하고 권한을 설정합니다</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowUserModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            사용자 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 사용자</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">활성 사용자</p>
              <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">정지된 사용자</p>
              <p className="text-2xl font-bold">{stats.suspendedUsers.toLocaleString()}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 캐시 잔액</p>
              <p className="text-2xl font-bold">₩{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="이름, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="등급 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 등급</SelectItem>
              <SelectItem value="1">최고관리자</SelectItem>
              <SelectItem value="2">총판</SelectItem>
              <SelectItem value="3">대행사</SelectItem>
              <SelectItem value="4">일반사용자</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
              <SelectItem value="suspended">정지</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 사용자 목록 테이블 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급/역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상위 계정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  하위/슬롯
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캐시 잔액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    사용자가 없습니다
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: User) => {
                  const roleBadge = getRoleBadge(user.user_role, user.level);
                  const statusBadge = getStatusBadge(user.status);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {user.full_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge className={roleBadge.className}>
                            {roleBadge.label}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Level {user.level}: {getLevelLabel(user.level)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.parent_name ? (
                          <div className="text-sm">
                            <div className="font-medium">{user.parent_name}</div>
                            <div className="text-xs text-gray-500">상위 계정</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div>하위: {user.children_count || 0}명</div>
                          <div className="text-xs text-gray-500">
                            슬롯: {user.slot_count || 0}개 (활성: {user.active_slot_count || 0})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          ₩{Math.floor(user.cash_balance || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType(user.status === 'active' ? 'suspend' : 'activate');
                              setShowActionModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {usersData?.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              총 {usersData.total}명 중 {((currentPage - 1) * 10) + 1}-
              {Math.min(currentPage * 10, usersData.total)}명 표시
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === usersData.totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 사용자 추가 모달 */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user_code">사용자 코드</Label>
                <Input
                  id="user_code"
                  name="user_code"
                  required
                  placeholder="USER001"
                />
              </div>
              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="최소 6자 이상"
                />
              </div>
              <div>
                <Label htmlFor="full_name">이름</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>
                취소
              </Button>
              <Button type="submit">추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 상태 변경 모달 */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'suspend' && '사용자 정지'}
              {actionType === 'activate' && '사용자 활성화'}
              {actionType === 'delete' && '사용자 삭제'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              {selectedUser?.full_name}({selectedUser?.email}) 사용자를{' '}
              {actionType === 'suspend' && '정지'}
              {actionType === 'activate' && '활성화'}
              {actionType === 'delete' && '삭제'}
              하시겠습니까?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              취소
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={() => {
                if (selectedUser) {
                  const newStatus = actionType === 'activate' ? 'active' : 
                                   actionType === 'suspend' ? 'suspended' : 
                                   'deleted';
                  handleStatusChange(selectedUser, newStatus);
                }
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}