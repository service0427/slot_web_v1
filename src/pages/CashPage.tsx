import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CashBalanceDisplay } from '@/components/cash/CashBalanceDisplay';
import { CashHistoryTable } from '@/components/cash/CashHistoryTable';
import { CashChargeModal } from '@/components/cash/CashChargeModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CashPage() {
  const { user } = useAuth();
  const [showChargeModal, setShowChargeModal] = useState(false);

  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">캐시 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 잔액 표시 */}
        <div className="lg:col-span-1">
          <CashBalanceDisplay userId={user.id} />
          <Button
            onClick={() => setShowChargeModal(true)}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            캐시 충전하기
          </Button>
        </div>
        
        {/* 캐시 내역 */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">거래 내역</h2>
            <CashHistoryTable userId={user.id} />
          </Card>
        </div>
      </div>

      {/* 충전 모달 */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg">
            <CashChargeModal
              userId={user.id}
              onSuccess={() => {
                setShowChargeModal(false);
                // 잔액과 내역을 새로고침
                window.location.reload();
              }}
              onClose={() => setShowChargeModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}