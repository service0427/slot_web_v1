import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { InquiryChatModal } from './InquiryChatModal';
import { inquiryMessageService } from '@/services/inquiryService';
import { Badge } from '@/components/ui/badge';

interface InquiryButtonProps {
  slotId?: string;
  inquiryId?: string;
  currentUser?: { id: string; email: string; full_name?: string; role?: string };
  initialTitle?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  showUnreadCount?: boolean;
}

export const InquiryButton: React.FC<InquiryButtonProps> = ({
  slotId,
  inquiryId,
  currentUser,
  initialTitle = '1:1 문의',
  buttonText = '1:1 문의',
  buttonVariant = 'outline',
  buttonSize = 'default',
  showUnreadCount = false
}) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    if (showUnreadCount && currentUser?.id) {
      const fetchUnreadCount = async () => {
        const { data } = await inquiryMessageService.getUnreadCount(currentUser.id);
        setUnreadCount(data || 0);
      };

      fetchUnreadCount();
      
      // 30초마다 업데이트
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [showUnreadCount, currentUser?.id]);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className="relative"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {buttonText}
        {showUnreadCount && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <InquiryChatModal
        open={open}
        onClose={() => {
          setOpen(false);
          // 모달 닫을 때 읽지 않은 메시지 수 다시 조회
          if (showUnreadCount && currentUser?.id) {
            inquiryMessageService.getUnreadCount(currentUser.id).then(({ data }) => {
              setUnreadCount(data || 0);
            });
          }
        }}
        inquiryId={inquiryId}
        slotId={slotId}
        currentUser={currentUser}
        initialTitle={initialTitle}
      />
    </>
  );
};