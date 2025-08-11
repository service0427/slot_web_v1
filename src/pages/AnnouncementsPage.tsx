import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Megaphone,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Pin,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  author: {
    name: string;
    role: string;
  };
  view_count: number;
  created_at: string;
  expires_at?: string;
}

// 더미 데이터
const mockAnnouncements: Announcement[] = [
  {
    id: 'ann1',
    title: '시스템 정기 점검 안내',
    content: '12월 15일 새벽 2시부터 4시까지 시스템 정기 점검이 예정되어 있습니다. 해당 시간 동안 서비스 이용이 제한될 수 있으니 양해 부탁드립니다.\n\n점검 내용:\n- 서버 보안 업데이트\n- 데이터베이스 최적화\n- 시스템 성능 개선\n\n점검 중에는 로그인 및 슬롯 관리 기능이 일시적으로 중단됩니다.',
    type: 'warning',
    priority: 'high',
    is_pinned: true,
    author: {
      name: '시스템 관리자',
      role: 'admin'
    },
    view_count: 342,
    created_at: '2024-12-08T10:00:00Z',
    expires_at: '2024-12-15T04:00:00Z'
  },
  {
    id: 'ann2',
    title: '신규 기능 업데이트 - 슬롯 순위 추적',
    content: '슬롯 순위 추적 기능이 추가되었습니다! 이제 실시간으로 키워드 순위 변동을 확인하실 수 있습니다.\n\n주요 기능:\n- 실시간 순위 모니터링\n- 순위 변동 그래프\n- 경쟁사 분석\n- 일일/주간/월간 리포트\n\n슬롯 관리 페이지에서 바로 확인하실 수 있습니다.',
    type: 'success',
    priority: 'normal',
    is_pinned: false,
    author: {
      name: '개발팀',
      role: 'admin'
    },
    view_count: 128,
    created_at: '2024-12-07T14:30:00Z'
  },
  {
    id: 'ann3',
    title: '12월 이벤트 안내',
    content: '12월 한 달간 신규 슬롯 생성 시 10% 할인 이벤트를 진행합니다!\n\n이벤트 기간: 2024.12.01 ~ 2024.12.31\n대상: 전체 사용자\n혜택: 슬롯 생성 비용 10% 할인\n\n자세한 내용은 고객센터로 문의해주세요.',
    type: 'info',
    priority: 'normal',
    is_pinned: false,
    author: {
      name: '마케팅팀',
      role: 'admin'
    },
    view_count: 256,
    created_at: '2024-12-01T09:00:00Z',
    expires_at: '2024-12-31T23:59:59Z'
  }
];

export default function AnnouncementsPage() {
  const [announcements] = useState<Announcement[]>(mockAnnouncements);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 필터링
  const filteredAnnouncements = announcements.filter(ann =>
    ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 고정 공지와 일반 공지 분리
  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.is_pinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.is_pinned);

  // 타입별 아이콘과 색상
  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const AnnouncementCard = ({ announcement, isPinned = false }: { announcement: Announcement; isPinned?: boolean }) => {
    const isExpanded = expandedId === announcement.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className={`overflow-hidden ${isPinned ? 'border-2 border-purple-300 bg-purple-50/50' : ''}`}>
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isPinned && (
                    <Pin className="w-4 h-4 text-purple-600" />
                  )}
                  <Badge className={getTypeColor(announcement.type)}>
                    {getTypeIcon(announcement.type)}
                    <span className="ml-1">{announcement.type}</span>
                  </Badge>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {announcement.title}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(announcement.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {announcement.view_count}회
                  </span>
                  <span>{announcement.author.name}</span>
                </div>

                {announcement.expires_at && new Date(announcement.expires_at) > new Date() && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      만료: {new Date(announcement.expires_at).toLocaleDateString('ko-KR')}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200"
              >
                <div className="p-4 bg-gray-50">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {announcement.content}
                    </p>
                  </div>
                  
                  {announcement.expires_at && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        이 공지는 {new Date(announcement.expires_at).toLocaleDateString('ko-KR')} {new Date(announcement.expires_at).toLocaleTimeString('ko-KR')}에 만료됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">공지사항</h1>
        <p className="text-sm text-gray-500 mt-1">시스템 공지사항 및 업데이트 소식</p>
      </div>

      {/* 검색 */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="공지사항 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* 고정 공지사항 */}
      {pinnedAnnouncements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Pin className="w-5 h-5 text-purple-600" />
            고정 공지사항
          </h2>
          {pinnedAnnouncements.map(announcement => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement} 
              isPinned={true}
            />
          ))}
        </div>
      )}

      {/* 일반 공지사항 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          전체 공지사항
        </h2>
        {regularAnnouncements.length > 0 ? (
          regularAnnouncements.map(announcement => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement}
            />
          ))
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">공지사항이 없습니다.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}