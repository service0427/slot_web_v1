import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  Activity,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlotService } from '@/services/slotService';
import { CashService } from '@/services/cashService';
import { useAuth } from '@/hooks/useAuth';
import { slotsAPI, cashAPI, inquiriesAPI } from '@/services/api';
import type { Slot } from '@/types/slot.types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 사용자 잔액 조회
  const { data: balance } = useQuery({
    queryKey: ['userBalance'],
    queryFn: () => cashAPI.getBalance(),
    enabled: !!user,
  });

  // 내 슬롯 조회
  const { data: mySlots } = useQuery({
    queryKey: ['mySlots'],
    queryFn: () => slotsAPI.getSlots({ creator_id: user?.id, limit: 5 }),
    enabled: !!user,
  });

  // 참여 중인 슬롯 조회 (작업자로 참여)
  const { data: participatingSlots } = useQuery({
    queryKey: ['participatingSlots'],
    queryFn: () => slotsAPI.getSlots({ worker_id: user?.id, limit: 5 }),
    enabled: !!user,
  });

  // 최근 거래 내역
  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => cashAPI.getTransactions({ user_id: user?.id, limit: 5 }),
    enabled: !!user,
  });

  // 내 문의 개수
  const { data: myInquiries } = useQuery({
    queryKey: ['myInquiries'],
    queryFn: () => inquiriesAPI.getInquiries({ user_id: user?.id, status: 'open', limit: 1 }),
    enabled: !!user,
  });

  // 통계 데이터
  const stats = [
    {
      title: '내 캐시',
      value: balance?.user ? `₩${Math.floor(balance.user.cash_balance || 0).toLocaleString()}` : '₩0',
      change: balance?.user?.free_cash_balance ? `무료: ₩${Math.floor(balance.user.free_cash_balance).toLocaleString()}` : '무료: ₩0',
      trend: 'neutral' as 'up' | 'down' | 'neutral',
      icon: DollarSign,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `총 잔액`,
      onClick: () => navigate('/cash')
    },
    {
      title: '내 슬롯',
      value: mySlots?.total?.toString() || '0',
      change: `활성 ${mySlots?.slots?.filter((s: any) => s.status === 'active').length || 0}개`,
      trend: 'neutral' as 'up' | 'down' | 'neutral',
      icon: ShoppingBag,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: '전체 슬롯',
      onClick: () => navigate('/slots')
    },
    {
      title: '참여 중인 작업',
      value: participatingSlots?.total?.toString() || '0',
      change: '진행 중',
      trend: 'neutral' as 'up' | 'down' | 'neutral',
      icon: Package,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: '작업자로 참여',
      onClick: () => navigate('/slots')
    },
    {
      title: '미확인 문의',
      value: myInquiries?.total?.toString() || '0',
      change: '답변 대기중',
      trend: 'neutral' as 'up' | 'down' | 'neutral',
      icon: MessageSquare,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: '열린 문의',
      onClick: () => navigate('/support')
    }
  ];

  // 슬롯 상태별 색상
  const getStatusColor = (status: Slot['status']) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Slot['status']) => {
    switch (status) {
      case 'available':
      case 'active':
      case 'completed':
        return CheckCircle;
      case 'pending':
      case 'expired':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className="p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={stat.onClick}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 mr-1" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDown className="w-4 h-4 mr-1" />
                    ) : null}
                    {stat.change}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 내 슬롯 목록 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">내 슬롯</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/slots')}>
                전체 보기
              </Button>
            </div>
            
            {mySlots?.slots && mySlots.slots.length > 0 ? (
              <div className="space-y-3">
                {mySlots.slots.map((slot: any) => {
                  const StatusIcon = getStatusIcon(slot.status);
                  return (
                    <div 
                      key={slot.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/slots/${slot.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{slot.slot_name}</h3>
                        <Badge className={getStatusColor(slot.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {slot.status === 'available' ? '구매가능' : 
                           slot.status === 'active' ? '진행중' :
                           slot.status === 'completed' ? '완료' :
                           slot.status === 'pending' ? '대기중' :
                           slot.status === 'cancelled' ? '취소됨' : '만료'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>₩{Math.floor(slot.price || 0).toLocaleString()}</span>
                        <span>{slot.duration_days}일 • 최대 {slot.max_workers}명</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">생성한 슬롯이 없습니다</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigate('/slots/create')}
                >
                  새 슬롯 만들기
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* 최근 거래 내역 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">최근 거래</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/cash/history')}>
                전체 보기
              </Button>
            </div>
            
            {recentTransactions?.transactions && recentTransactions.transactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.transaction_type === 'charge' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                        transaction.transaction_type === 'purchase' || transaction.transaction_type === 'buy' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                        transaction.transaction_type === 'refund' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        transaction.transaction_type === 'free' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gray-400'
                      }`}>
                        <span className="text-white text-xs font-medium">
                          {transaction.transaction_type === 'charge' ? '₩' :
                           transaction.transaction_type === 'purchase' || transaction.transaction_type === 'buy' ? 'S' :
                           transaction.transaction_type === 'refund' ? '↑' :
                           transaction.transaction_type === 'free' ? '★' : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{transaction.description || '거래'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at || transaction.transaction_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}₩{Math.abs(transaction.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">거래 내역이 없습니다</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* 빠른 액션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">빠른 실행</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/cash')}
            >
              <DollarSign className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">캐시 충전</p>
            </button>
            <button 
              className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/slots/create')}
            >
              <ShoppingBag className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">새 슬롯</p>
            </button>
            <button 
              className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/slots')}
            >
              <Activity className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">슬롯 목록</p>
            </button>
            <button 
              className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/support')}
            >
              <MessageSquare className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">문의하기</p>
            </button>
          </div>
        </Card>
      </motion.div>

      {/* 참여 중인 슬롯 */}
      {participatingSlots?.slots && participatingSlots.slots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">참여 중인 슬롯</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/slots')}>
                전체 보기
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participatingSlots.slots.map((slot: any) => (
                <div 
                  key={slot.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/slots/${slot.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{slot.slot_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        생성자: {slot.creator?.full_name || '미상'}
                      </p>
                    </div>
                    <Badge variant="secondary">작업자</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{slot.work_type}</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {slot.duration_days}일 남음
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};