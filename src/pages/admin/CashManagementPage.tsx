import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Search,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
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
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { CashChargeRequest, CashHistory } from '@/types/cash.types';

export default function CashManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<CashChargeRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);

  // 충전 요청 목록 조회
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['cash-requests', currentPage, filterStatus],
    queryFn: () => cashAPI.getRequests({
      page: currentPage,
      limit: 10,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }),
    enabled: currentUser?.level && currentUser.level <= 3,
  });

  // 거래 내역 조회
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['cash-transactions', transactionPage, filterType],
    queryFn: () => cashAPI.getTransactions({
      page: transactionPage,
      limit: 10,
      type: filterType !== 'all' ? filterType : undefined,
    }),
  });

  // 통계 조회
  const { data: statistics } = useQuery({
    queryKey: ['cash-statistics'],
    queryFn: () => cashAPI.getStatistics(),
    enabled: currentUser?.level && currentUser.level <= 3,
  });

  // 요청 처리 mutation
  const processRequestMutation = useMutation({
    mutationFn: ({ id, status, rejection_reason }: { 
      id: string; 
      status: 'approved' | 'rejected';
      rejection_reason?: string;
    }) => cashAPI.processRequest(id, { status, rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
      queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
      toast({
        title: "성공",
        description: `충전 요청이 ${actionType === 'approve' ? '승인' : '거절'}되었습니다.`,
      });
      setShowProcessModal(false);
      setRejectionReason('');
    },
    onError: () => {
      toast({
        title: "오류",
        description: "요청 처리에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 충전 요청 필터링
  const filteredRequests = requestsData?.requests?.filter((request: any) => {
    const matchesSearch = request.account_holder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  // 통계 데이터
  const stats = {
    totalRevenue: statistics?.totalRevenue || 0,
    monthlyRevenue: statistics?.monthlyRevenue || 0,
    pendingRequests: statistics?.pendingRequests || 0,
    todayTransactions: statistics?.todayTransactions || 0,
    averageCharge: statistics?.averageCharge || 0,
    totalUsers: statistics?.totalUsers || 0,
  };

  // 요청 처리
  const handleProcessRequest = (request: CashChargeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowProcessModal(true);
  };

  const confirmProcessRequest = () => {
    if (selectedRequest) {
      processRequestMutation.mutate({
        id: selectedRequest.id,
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejection_reason: actionType === 'reject' ? rejectionReason : undefined,
      });
    }
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 거래 타입별 아이콘과 색상
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'charge':
        return { icon: ArrowDownRight, color: 'text-green-600' };
      case 'purchase':
      case 'buy':
        return { icon: ArrowUpRight, color: 'text-red-600' };
      case 'refund':
        return { icon: RefreshCw, color: 'text-blue-600' };
      case 'free':
        return { icon: CreditCard, color: 'text-purple-600' };
      default:
        return { icon: DollarSign, color: 'text-gray-600' };
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'charge': return '충전';
      case 'purchase': return '구매';
      case 'buy': return '구매';
      case 'refund': return '환불';
      case 'free': return '무료';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">캐시 관리</h1>
          <p className="text-gray-600 mt-1">충전 요청 및 거래 내역을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['cash-requests'] });
              queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
              queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 통계 카드 - 관리자만 표시 */}
      {currentUser?.level && currentUser.level <= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-xl font-bold">₩{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 매출</p>
                <p className="text-xl font-bold">₩{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">대기 중 요청</p>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 거래</p>
                <p className="text-2xl font-bold">{stats.todayTransactions}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 충전액</p>
                <p className="text-xl font-bold">₩{Math.round(stats.averageCharge).toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <User className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          {currentUser?.level && currentUser.level <= 3 && (
            <TabsTrigger value="requests">충전 요청</TabsTrigger>
          )}
          <TabsTrigger value="transactions">거래 내역</TabsTrigger>
          {currentUser?.level && currentUser.level <= 3 && (
            <>
              <TabsTrigger value="statistics">통계</TabsTrigger>
              <TabsTrigger value="settings">설정</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* 충전 요청 탭 - 관리자만 */}
        {currentUser?.level && currentUser.level <= 3 && (
          <TabsContent value="requests">
            <Card className="p-4 mb-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="입금자명, 요청 ID, 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="approved">승인됨</SelectItem>
                    <SelectItem value="rejected">거절됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        요청 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        충전 금액
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        무료 캐시
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        요청 시간
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requestsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          로딩 중...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          충전 요청이 없습니다
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request: any) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium">#{request.id.substring(0, 8)}</p>
                              <p className="text-xs text-gray-500">입금자: {request.account_holder}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium">{request.full_name}</p>
                              <p className="text-xs text-gray-500">{request.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold">₩{request.amount.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary">
                              {request.free_cash_percentage}%
                              {request.free_cash_percentage > 0 && (
                                <span className="ml-1">
                                  (+₩{(request.amount * request.free_cash_percentage / 100).toLocaleString()})
                                </span>
                              )}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status === 'pending' ? '대기중' :
                               request.status === 'approved' ? '승인됨' : '거절됨'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm">
                              <p>{new Date(request.requested_at).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(request.requested_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {request.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleProcessRequest(request, 'approve')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProcessRequest(request, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  거절
                                </Button>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {request.processed_at && (
                                  <p>{new Date(request.processed_at).toLocaleString()}</p>
                                )}
                                {request.processor_name && (
                                  <p className="text-xs">처리자: {request.processor_name}</p>
                                )}
                                {request.rejection_reason && (
                                  <p className="text-xs text-red-600">{request.rejection_reason}</p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {requestsData?.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    총 {requestsData.total}건 중 {((currentPage - 1) * 10) + 1}-
                    {Math.min(currentPage * 10, requestsData.total)}건 표시
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
                      disabled={currentPage === requestsData.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        )}

        {/* 거래 내역 탭 */}
        <TabsContent value="transactions">
          <Card className="p-4 mb-4">
            <div className="flex gap-4">
              <Input
                placeholder="사용자 이름, 설명으로 검색..."
                className="flex-1"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="거래 타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 타입</SelectItem>
                  <SelectItem value="charge">충전</SelectItem>
                  <SelectItem value="purchase">구매</SelectItem>
                  <SelectItem value="refund">환불</SelectItem>
                  <SelectItem value="free">무료지급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거래 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      잔액 타입
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거래 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        로딩 중...
                      </td>
                    </tr>
                  ) : !transactionsData?.transactions || transactionsData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        거래 내역이 없습니다
                      </td>
                    </tr>
                  ) : (
                    transactionsData.transactions.map((transaction: any) => {
                      const { icon: Icon, color } = getTransactionIcon(transaction.transaction_type);
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${color}`} />
                              <div>
                                <p className="text-sm font-medium">#{transaction.id.substring(0, 8)}</p>
                                <p className="text-xs text-gray-500">{transaction.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium">{transaction.full_name}</p>
                              <p className="text-xs text-gray-500">{transaction.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className={`text-sm font-semibold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}₩{Math.abs(transaction.amount).toLocaleString()}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary">
                              {transaction.balance_type === 'paid' ? '유료' :
                               transaction.balance_type === 'free' ? '무료' : '혼합'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm">
                              <p>{new Date(transaction.transaction_at).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.transaction_at).toLocaleTimeString()}
                              </p>
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
            {transactionsData?.totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  총 {transactionsData.total}건 중 {((transactionPage - 1) * 10) + 1}-
                  {Math.min(transactionPage * 10, transactionsData.total)}건 표시
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransactionPage(transactionPage - 1)}
                    disabled={transactionPage === 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransactionPage(transactionPage + 1)}
                    disabled={transactionPage === transactionsData.totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 통계 탭 - 관리자만 */}
        {currentUser?.level && currentUser.level <= 3 && (
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">매출 통계</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-gray-400" />
                  <p className="ml-2 text-gray-500">차트 영역</p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">충전 방법별 통계</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">무통장 입금</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">카드 결제</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">간편 결제</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">10%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* 설정 탭 - 관리자만 */}
        {currentUser?.level && currentUser.level <= 3 && (
          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">캐시 설정</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="min_amount">최소 충전 금액</Label>
                  <Input id="min_amount" type="number" defaultValue="10000" />
                </div>
                <div>
                  <Label htmlFor="bonus_rate">기본 보너스 비율 (%)</Label>
                  <Input id="bonus_rate" type="number" defaultValue="10" />
                </div>
                <div>
                  <Label htmlFor="vip_bonus">VIP 추가 보너스 (%)</Label>
                  <Input id="vip_bonus" type="number" defaultValue="5" />
                </div>
                <div>
                  <Label htmlFor="expiry">캐시 유효기간 (개월)</Label>
                  <Input id="expiry" type="number" defaultValue="12" />
                </div>
                <Button className="mt-4">설정 저장</Button>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* 처리 확인 모달 */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              충전 요청 {actionType === 'approve' ? '승인' : '거절'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedRequest && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">요청 ID</span>
                  <span className="text-sm font-medium">#{selectedRequest.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">입금자명</span>
                  <span className="text-sm font-medium">{selectedRequest.account_holder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">충전 금액</span>
                  <span className="text-sm font-medium">₩{selectedRequest.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">보너스 캐시</span>
                  <span className="text-sm font-medium">
                    {selectedRequest.free_cash_percentage}% 
                    (₩{(selectedRequest.amount * selectedRequest.free_cash_percentage / 100).toLocaleString()})
                  </span>
                </div>
                {actionType === 'reject' && (
                  <div className="mt-4">
                    <Label htmlFor="reason">거절 사유</Label>
                    <Textarea
                      id="reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="거절 사유를 입력하세요"
                      className="mt-2"
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessModal(false)}>
              취소
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmProcessRequest}
              disabled={actionType === 'reject' && !rejectionReason}
            >
              {actionType === 'approve' ? '승인' : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}