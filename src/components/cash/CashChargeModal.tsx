import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CashService } from '@/services/cashService';
import type { CashChargeRequest, CashSetting } from '@/types/cash.types';
import { X, Plus, CheckCircle, XCircle, Clock, Wallet, Gift, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CashChargeModalProps {
  userId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const CashChargeModal: React.FC<CashChargeModalProps> = ({
  userId,
  onSuccess,
  onClose
}) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<CashChargeRequest[]>([]);
  // 보너스 없음
  const bonusAmount = 0;

  // 최근 충전 요청 불러오기
  useEffect(() => {
    fetchRecentRequests();
  }, [userId]);

  const fetchRecentRequests = async () => {
    const result = await CashService.getChargeRequestHistory(userId, 5);
    if (result.success && result.data) {
      setRecentRequests(result.data);
    }
  };


  // 충전 요청
  const handleCharge = async () => {
    setError(null);

    if (!amount || parseInt(amount) <= 0) {
      setError('충전할 금액을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const result = await CashService.createChargeRequest(userId, {
        amount: parseInt(amount)
      });

      if (result.success) {
        alert(result.message);
        setAmount('');
        fetchRecentRequests();
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError('충전 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatKoreanAmount = (value: string): string => {
    if (!value) return '';
    const num = parseInt(value);
    if (num === 0) return '0원';

    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const rest = num % 10000;

    let result = '';
    if (eok > 0) result += `${formatNumber(eok)}억 `;
    if (man > 0) result += `${formatNumber(man)}만 `;
    if (rest > 0) result += formatNumber(rest);

    return result.trim() + '원';
  };

  const presetAmounts = [
    { value: 10000, label: '1만원' },
    { value: 50000, label: '5만원' },
    { value: 100000, label: '10만원' },
    { value: 300000, label: '30만원' },
    { value: 500000, label: '50만원' },
    { value: 1000000, label: '100만원' },
  ];

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">캐시 충전</h3>
              <p className="text-sm text-white/80">간편하게 캐시를 충전하세요</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <CardContent className="p-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center space-x-2"
            >
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 금액 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">충전 금액</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg">₩</span>
            </div>
            <input
              type="text"
              value={amount ? formatNumber(parseInt(amount)) : ''}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="block w-full pl-8 pr-3 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {amount && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-indigo-600 mt-2 font-medium"
            >
              {formatKoreanAmount(amount)}
            </motion.div>
          )}

        </div>

        {/* 금액 버튼 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">빠른 선택</p>
          <div className="grid grid-cols-3 gap-3">
            {presetAmounts.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setAmount(preset.value.toString())}
                className="relative p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <span className="block text-lg font-bold text-gray-800 group-hover:text-indigo-600">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 최근 충전 내역 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">최근 충전 내역</h3>
          {recentRequests.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.map((request) => {
                const statusInfo = {
                  approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: '승인' },
                  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: '거절' },
                  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: '대기중' }
                }[request.status] || { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: '대기중' };
                
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{formatNumber(request.amount)}원</p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.requested_at).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">충전 내역이 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">첫 충전을 시작해보세요!</p>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleCharge}
            disabled={loading || !amount || parseInt(amount) <= 0}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all transform ${
              loading || !amount || parseInt(amount) <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>처리 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>충전하기</span>
              </div>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};