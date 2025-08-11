import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CashService } from '@/services/cashService';
import type { UserBalance } from '@/types/cash.types';
import { DollarSign, Gift, Wallet, X } from 'lucide-react';

interface CashBalanceDisplayProps {
  userId: string;
  className?: string;
  showDetails?: boolean;
}

export const CashBalanceDisplay: React.FC<CashBalanceDisplayProps> = ({
  userId,
  className = '',
  showDetails = true
}) => {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const fetchBalance = async () => {
    setLoading(true);
    setError(false);
    const result = await CashService.getUserBalance(userId);
    if (result.success && result.data) {
      setBalance(result.data);
    } else {
      setError(true);
    }
    setLoading(false);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <h3 className="text-lg font-semibold mb-1">캐시 잔액</h3>
        <p className="text-sm opacity-80">실시간 잔액 현황</p>
      </div>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <svg className="animate-spin h-6 w-6 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-gray-500">잔액 조회 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-red-500">잔액 조회 실패</p>
          </div>
        ) : balance ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ₩{formatNumber(balance.total_balance)}
              </p>
              <p className="text-sm text-gray-500 mt-2">전체 잔액</p>
            </div>
            
            {showDetails && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    ₩{formatNumber(balance.paid_balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">유료 캐시</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    ₩{formatNumber(balance.free_balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">무료 캐시</p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">마지막 업데이트</span>
                <span className="text-gray-700 font-medium">방금 전</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <Wallet className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">잔액 정보가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};