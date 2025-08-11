import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CashService } from '@/services/cashService';
import type { CashHistory, CashHistoryFilter } from '@/types/cash.types';
import { ArrowUpRight, ArrowDownRight, RotateCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface CashHistoryTableProps {
  userId: string;
  limit?: number;
}

export const CashHistoryTable: React.FC<CashHistoryTableProps> = ({
  userId,
  limit = 10
}) => {
  const [history, setHistory] = useState<CashHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'charge' | 'use' | 'refund'>('all');

  useEffect(() => {
    fetchHistory();
  }, [userId, page, filterType]);

  const fetchHistory = async () => {
    setLoading(true);
    const filter: CashHistoryFilter = {
      page,
      limit,
      filterType
    };

    const result = await CashService.getCashHistory(userId, filter);
    if (result.success && result.data) {
      setHistory(result.data.data);
      setTotalItems(result.data.totalItems);
    }
    setLoading(false);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'charge': '충전',
      'purchase': '구매',
      'refund': '환불',
      'withdrawal': '출금',
      'free': '무료지급',
      'work': '작업비용',
      'buy': '구매'
    };
    return labels[type] || type;
  };


  const getTransactionIcon = (type: string) => {
    if (['charge', 'free', 'refund'].includes(type)) {
      return ArrowDownRight;
    }
    return ArrowUpRight;
  };

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">캐시 사용 내역</h3>
            <p className="text-sm opacity-80">거래 내역을 확인하세요</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-4">
          {[
            { value: 'all', label: '전체', icon: Filter },
            { value: 'charge', label: '충전' },
            { value: 'use', label: '사용' },
            { value: 'refund', label: '환불' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setFilterType(filter.value as any); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === filter.value
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-500">거래 내역을 불러오는 중...</p>
            </div>
          </div>
        ) : history.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {history.map((item) => {
                const Icon = getTransactionIcon(item.transaction_type);
                const isIncome = ['charge', 'free', 'refund'].includes(item.transaction_type);
                
                return (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isIncome ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTransactionTypeLabel(item.transaction_type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.transaction_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.amount > 0 ? '+' : ''}{formatNumber(item.amount)}원
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-2 rounded-lg transition-all ${
                    page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    page === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">캐시 사용 내역이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">거래가 발생하면 여기에 표시됩니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};