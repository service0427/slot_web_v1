import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit2, 
  Save, 
  X,
  Camera,
  Award,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Key,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'worker';
  created_at: string;
  stats: {
    total_slots: number;
    active_slots: number;
    completed_slots: number;
    total_revenue: number;
    average_rating: number;
    total_reviews: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '1',
    email: user?.email || 'user@example.com',
    full_name: user?.full_name || '홍길동',
    phone: '010-1234-5678',
    address: '서울특별시 강남구',
    bio: '안녕하세요! 열심히 활동하고 있는 사용자입니다.',
    avatar_url: '',
    role: (user?.role === 'admin' || user?.role === 'worker' ? user.role : 'user') as 'user' | 'admin' | 'worker',
    created_at: '2024-01-15',
    stats: {
      total_slots: 25,
      active_slots: 5,
      completed_slots: 18,
      total_revenue: 2500000,
      average_rating: 4.8,
      total_reviews: 42
    },
    badges: [
      {
        id: '1',
        name: '신규 가입',
        description: '슬롯 시스템에 처음 가입',
        icon: 'star',
        earned_at: '2024-01-15'
      },
      {
        id: '2',
        name: '첫 슬롯 생성',
        description: '첫 번째 슬롯을 성공적으로 생성',
        icon: 'award',
        earned_at: '2024-01-20'
      },
      {
        id: '3',
        name: '우수 판매자',
        description: '평점 4.5 이상 달성',
        icon: 'trophy',
        earned_at: '2024-03-10'
      }
    ]
  });

  const [editForm, setEditForm] = useState({
    full_name: profile.full_name,
    phone: profile.phone || '',
    address: profile.address || '',
    bio: profile.bio || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: false,
    slot_updates: true,
    marketing_emails: false,
    weekly_report: true
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      full_name: profile.full_name,
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      full_name: profile.full_name,
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || ''
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile({
        ...profile,
        ...editForm
      });
      
      setIsEditing(false);
      toast({
        title: "프로필 수정 완료",
        description: "프로필이 성공적으로 수정되었습니다.",
      });
    } catch (error) {
      toast({
        title: "수정 실패",
        description: "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      toast({
        title: "변경 실패",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSettingChange = async (setting: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: value
    });

    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "설정 변경 완료",
        description: "알림 설정이 변경되었습니다.",
      });
    } catch (error) {
      toast({
        title: "설정 변경 실패",
        description: "설정 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'worker':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'star':
        return Star;
      case 'award':
        return Award;
      case 'trophy':
        return TrendingUp;
      default:
        return Star;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 프로필 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 h-48 bg-gradient-to-r from-purple-500 to-pink-500" />
          
          <div className="relative p-6 pb-24">
            <div className="flex justify-between items-start mb-16">
              <div className="flex items-center space-x-6">
                {/* 프로필 이미지 */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white p-1">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow">
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* 기본 정보 */}
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                  <p className="text-purple-100 mb-2">{profile.email}</p>
                  <Badge className={`${getRoleBadgeColor(profile.role)} font-medium`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.role === 'admin' ? '관리자' : profile.role === 'worker' ? '작업자' : '일반 사용자'}
                  </Badge>
                </div>
              </div>

              {/* 편집 버튼 */}
              {!isEditing && (
                <Button 
                  variant="secondary"
                  onClick={handleEdit}
                  className="bg-white/90 hover:bg-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  프로필 편집
                </Button>
              )}
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{profile.stats.total_slots}</p>
                  <p className="text-xs text-gray-600 mt-1">전체 슬롯</p>
                </div>
              </Card>
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{profile.stats.active_slots}</p>
                  <p className="text-xs text-gray-600 mt-1">진행 중</p>
                </div>
              </Card>
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{profile.stats.completed_slots}</p>
                  <p className="text-xs text-gray-600 mt-1">완료</p>
                </div>
              </Card>
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">₩{(profile.stats.total_revenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-gray-600 mt-1">총 매출</p>
                </div>
              </Card>
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-1" />
                    <p className="text-2xl font-bold text-gray-800">{profile.stats.average_rating}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">평균 평점</p>
                </div>
              </Card>
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{profile.stats.total_reviews}</p>
                  <p className="text-xs text-gray-600 mt-1">리뷰 수</p>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="badges">배지</TabsTrigger>
          <TabsTrigger value="security">보안</TabsTrigger>
          <TabsTrigger value="notifications">알림</TabsTrigger>
        </TabsList>

        {/* 프로필 탭 */}
        <TabsContent value="profile">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">프로필 정보</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">이름</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="주소를 입력하세요"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">자기소개</Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="간단한 자기소개를 작성해주세요"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-medium">{profile.phone || '미등록'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-medium">{profile.address || '미등록'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">가입일</p>
                      <p className="font-medium">
                        {new Date(profile.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm text-gray-600 mb-2">자기소개</h3>
                    <p className="text-gray-800">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 배지 탭 */}
        <TabsContent value="badges">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">획득한 배지</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.badges.map((badge) => {
                const Icon = getBadgeIcon(badge.icon);
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{badge.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(badge.earned_at).toLocaleDateString('ko-KR')} 획득
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* 보안 탭 */}
        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">보안 설정</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">비밀번호 변경</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="current_password">현재 비밀번호</Label>
                    <div className="relative mt-1">
                      <Input
                        id="current_password"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="new_password">새 비밀번호</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm_password">새 비밀번호 확인</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={isLoading || !passwordForm.current_password || !passwordForm.new_password}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    비밀번호 변경
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">2단계 인증</h3>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-sm text-gray-600">보안 강화를 위한 2단계 인증</p>
                    <p className="text-xs text-gray-500 mt-1">SMS 또는 인증 앱을 통한 추가 보안</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    미설정
                  </Badge>
                </div>
                <Button variant="outline" className="mt-4">
                  <Shield className="w-4 h-4 mr-2" />
                  2단계 인증 설정
                </Button>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">로그인 기록</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Windows - Chrome</p>
                        <p className="text-xs text-gray-500">서울, 대한민국 • 192.168.1.1</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">현재 세션</p>
                      <p className="text-xs text-gray-400">방금 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Mobile - Safari</p>
                        <p className="text-xs text-gray-500">서울, 대한민국 • 192.168.1.2</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">2일 전</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 알림 탭 */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">알림 설정</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">이메일 알림</p>
                      <p className="text-sm text-gray-600">중요한 업데이트를 이메일로 받기</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_notifications}
                      onChange={(e) => handleNotificationSettingChange('email_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">푸시 알림</p>
                      <p className="text-sm text-gray-600">브라우저 푸시 알림 받기</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push_notifications}
                      onChange={(e) => handleNotificationSettingChange('push_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">슬롯 업데이트</p>
                      <p className="text-sm text-gray-600">내 슬롯 상태 변경 알림</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.slot_updates}
                      onChange={(e) => handleNotificationSettingChange('slot_updates', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">마케팅 이메일</p>
                      <p className="text-sm text-gray-600">프로모션 및 이벤트 소식 받기</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketing_emails}
                      onChange={(e) => handleNotificationSettingChange('marketing_emails', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">주간 리포트</p>
                      <p className="text-sm text-gray-600">매주 활동 요약 받기</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weekly_report}
                      onChange={(e) => handleNotificationSettingChange('weekly_report', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">알림 채널</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">이메일 주소</p>
                      <p className="text-xs text-gray-500">{profile.email}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      인증됨
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">휴대폰 번호</p>
                      <p className="text-xs text-gray-500">{profile.phone || '미등록'}</p>
                    </div>
                    {profile.phone ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        인증됨
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        등록하기
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}