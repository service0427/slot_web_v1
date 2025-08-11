import { useAuth } from '@/hooks/useAuth';
import { InquiryButton } from '@/components/inquiry/InquiryButton';
import { InquiryListPage } from '@/components/inquiry/InquiryListPage';
import { Card } from '@/components/ui/card';

export default function UserInquiryPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">문의하기</h1>
        <InquiryButton
          currentUser={user}
          showUnreadCount={true}
          buttonText="새 문의 작성"
          buttonVariant="default"
        />
      </div>

      <Card className="p-6">
        <InquiryListPage currentUser={user} />
      </Card>
    </div>
  );
}