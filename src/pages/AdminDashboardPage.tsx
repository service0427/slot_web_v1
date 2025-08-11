import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  DollarSign,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Shield,
  Activity,
  Settings,
  FileText,
  UserCog,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlotService } from '@/services/slotService';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // 통계 데이터 조회 (실제로는 API 호출)
  const { data: slotStats } = useQuery({
    queryKey: ['adminSlotStats'],
    queryFn: () => SlotService.getSlotStats(),
  });

  // 관리자 통계 데이터
  const adminStats = [
    {
      title: '총 매출',
      value: '₩12,450,000',
      change: '+23.5%',
      trend: 'up' as const,
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '이번 달',
      onClick: () => navigate('/admin/revenue')
    },
    {
      title: '활성 사용자',
      value: '1,234',
      change: '+18.2%',
      trend: 'up' as const,
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '현재 접속: 342명',
      onClick: () => navigate('/admin/users')
    },
    {
      title: '총 슬롯',
      value: slotStats?.total_slots.toString() || '156',
      change: '+5.3%',
      trend: 'up' as const,
      icon: ShoppingBag,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `활성: ${slotStats?.active_slots || 89}개`,
      onClick: () => navigate('/admin/slots')
    },
    {
      title: '미처리 문의',
      value: '12',
      change: '-15.2%',
      trend: 'down' as const,
      icon: MessageSquare,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '평균 응답: 2.5시간',
      onClick: () => navigate('/admin/inquiries')
    }
  ];

  // 시스템 알림
  const systemAlerts = [
    { id: 1, type: 'critical', message: '서버 CPU 사용률이 85%를 초과했습니다', time: '5분 전', icon: AlertTriangle },
    { id: 2, type: 'warning', message: '캐시 충전 API 응답 지연 (평균 2.3초)', time: '15분 전', icon: Clock },
    { id: 3, type: 'success', message: '백업이 성공적으로 완료되었습니다', time: '1시간 전', icon: CheckCircle },
    { id: 4, type: 'info', message: '새로운 사용자 12명이 가입했습니다', time: '2시간 전', icon: Users },
  ];

  // 상위 사용자
  const topUsers = [
    { id: 1, name: '김철수', email: 'kim@example.com', totalSpent: '₩2,340,000', slots: 15, status: 'vip', growth: '+12%' },
    { id: 2, name: '이영희', email: 'lee@example.com', totalSpent: '₩1,850,000', slots: 12, status: 'vip', growth: '+8%' },
    { id: 3, name: '박민수', email: 'park@example.com', totalSpent: '₩980,000', slots: 8, status: 'active', growth: '+15%' },
    { id: 4, name: '최지우', email: 'choi@example.com', totalSpent: '₩650,000', slots: 5, status: 'active', growth: '-3%' },
    { id: 5, name: '정다은', email: 'jung@example.com', totalSpent: '₩450,000', slots: 3, status: 'new', growth: '+25%' }
  ];

  // 최근 활동
  const recentActivities = [
    { id: 1, user: '김철수', action: '새 슬롯 생성', type: 'slot', amount: '₩150,000', time: '2분 전' },
    { id: 2, user: '이영희', action: '캐시 충전', type: 'cash', amount: '₩500,000', time: '5분 전' },
    { id: 3, user: '박민수', action: '슬롯 구매', type: 'purchase', amount: '₩80,000', time: '10분 전' },
    { id: 4, user: '최지우', action: '문의 등록', type: 'inquiry', amount: '-', time: '15분 전' },
    { id: 5, user: '정다은', action: '슬롯 완료', type: 'complete', amount: '₩200,000', time: '20분 전' },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'success':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'info':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 관리자 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600 mt-1">시스템 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className="p-6 hover:shadow-lg transition-shadow duration-300 border-2 hover:border-orange-200 cursor-pointer"
                onClick={stat.onClick}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시스템 모니터링 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <Tabs defaultValue="alerts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="alerts">시스템 알림</TabsTrigger>
                <TabsTrigger value="activities">실시간 활동</TabsTrigger>
                <TabsTrigger value="performance">성능 지표</TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="mt-4">
                <div className="space-y-3">
                  {systemAlerts.map((alert) => {
                    const Icon = alert.icon;
                    return (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs mt-1 opacity-70">{alert.time}</p>
                          </div>
                          {alert.type === 'critical' && (
                            <Badge variant="destructive" className="ml-2">긴급</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'slot' ? 'bg-purple-100 text-purple-600' :
                          activity.type === 'cash' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'purchase' ? 'bg-green-100 text-green-600' :
                          activity.type === 'inquiry' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'slot' ? <ShoppingBag className="w-4 h-4" /> :
                           activity.type === 'cash' ? <DollarSign className="w-4 h-4" /> :
                           activity.type === 'purchase' ? <Zap className="w-4 h-4" /> :
                           activity.type === 'inquiry' ? <MessageSquare className="w-4 h-4" /> :
                           <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-gray-500">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{activity.amount}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">서버 상태</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">정상</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">API 응답시간</span>
                    </div>
                    <span className="text-sm font-semibold">125ms</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">보안 상태</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">안전</Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* 빠른 액션 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-500" />
              빠른 관리
            </h2>
            
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/users')}
              >
                <UserCog className="w-4 h-4 mr-2" />
                사용자 관리
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/slots')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                슬롯 관리
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/cash')}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                캐시 관리
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/inquiries')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                문의 관리
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/reports')}
              >
                <FileText className="w-4 h-4 mr-2" />
                리포트 생성
              </Button>
            </div>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">시스템 상태</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">CPU 사용률</span>
                  <span className="font-semibold text-orange-600">78%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">메모리 사용률</span>
                  <span className="font-semibold text-green-600">45%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">디스크 사용률</span>
                  <span className="font-semibold text-green-600">62%</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 상위 사용자 테이블 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  상위 사용자 TOP 5
                </h2>
                <p className="text-sm text-gray-300 mt-1">이번 달 기준</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/admin/users?sort=revenue')}
              >
                전체 보기
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 결제액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등급
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성장률
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                        'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{user.totalSpent}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-700">{user.slots}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={
                        user.status === 'vip' ? 'bg-purple-100 text-purple-800' :
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {user.status === 'vip' ? 'VIP' :
                         user.status === 'active' ? '활성' : '신규'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        user.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.growth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};