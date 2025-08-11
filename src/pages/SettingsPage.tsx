import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Globe,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Settings {
  general: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    animations: boolean;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    email: {
      updates: boolean;
      marketing: boolean;
      security: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    showActivity: boolean;
    dataCollection: boolean;
  };
  billing: {
    paymentMethod?: {
      type: string;
      last4: string;
      expiryDate: string;
    };
    autoRecharge: boolean;
    rechargeAmount: number;
    rechargeThreshold: number;
  };
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    general: {
      language: 'ko',
      timezone: 'Asia/Seoul',
      dateFormat: 'YYYY-MM-DD',
      currency: 'KRW'
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      compactMode: false,
      animations: true
    },
    notifications: {
      desktop: true,
      sound: true,
      email: {
        updates: true,
        marketing: false,
        security: true
      }
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showActivity: true,
      dataCollection: true
    },
    billing: {
      paymentMethod: {
        type: 'card',
        last4: '4242',
        expiryDate: '12/25'
      },
      autoRecharge: false,
      rechargeAmount: 100000,
      rechargeThreshold: 10000
    }
  });

  const handleSettingChange = async (category: keyof Settings, setting: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    };
    setSettings(newSettings);

    // 실제로는 API 호출
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "설정 저장됨",
        description: "변경사항이 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API 호출하여 데이터 다운로드
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "데이터 내보내기 완료",
        description: "데이터가 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "데이터 내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "계정 삭제 요청",
        description: "계정 삭제 요청이 접수되었습니다. 30일 이내에 처리됩니다.",
      });
    } catch (error) {
      toast({
        title: "요청 실패",
        description: "계정 삭제 요청 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">설정</h1>
        <p className="text-sm text-gray-500 mt-1">앱 환경설정 및 개인화 옵션을 관리합니다</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="appearance">모양</TabsTrigger>
          <TabsTrigger value="notifications">알림</TabsTrigger>
          <TabsTrigger value="privacy">개인정보</TabsTrigger>
          <TabsTrigger value="billing">결제</TabsTrigger>
          <TabsTrigger value="advanced">고급</TabsTrigger>
        </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Globe className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">일반 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="language">언어</Label>
                  <Select 
                    value={settings.general.language}
                    onValueChange={(value) => handleSettingChange('general', 'language', value)}
                  >
                    <SelectTrigger id="language" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">시간대</Label>
                  <Select 
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger id="timezone" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Seoul">서울 (GMT+9)</SelectItem>
                      <SelectItem value="Asia/Tokyo">도쿄 (GMT+9)</SelectItem>
                      <SelectItem value="America/New_York">뉴욕 (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">런던 (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">날짜 형식</Label>
                  <Select 
                    value={settings.general.dateFormat}
                    onValueChange={(value) => handleSettingChange('general', 'dateFormat', value)}
                  >
                    <SelectTrigger id="dateFormat" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2024-12-10</SelectItem>
                      <SelectItem value="DD/MM/YYYY">10/12/2024</SelectItem>
                      <SelectItem value="MM/DD/YYYY">12/10/2024</SelectItem>
                      <SelectItem value="YYYY년 MM월 DD일">2024년 12월 10일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">통화</Label>
                  <Select 
                    value={settings.general.currency}
                    onValueChange={(value) => handleSettingChange('general', 'currency', value)}
                  >
                    <SelectTrigger id="currency" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">₩ 원화 (KRW)</SelectItem>
                      <SelectItem value="USD">$ 달러 (USD)</SelectItem>
                      <SelectItem value="EUR">€ 유로 (EUR)</SelectItem>
                      <SelectItem value="JPY">¥ 엔화 (JPY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 모양 설정 */}
        <TabsContent value="appearance">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Palette className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">모양 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label>테마</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleSettingChange('appearance', 'theme', theme)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.appearance.theme === theme
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        {theme === 'light' && <Sun className="w-6 h-6" />}
                        {theme === 'dark' && <Moon className="w-6 h-6" />}
                        {theme === 'system' && <Monitor className="w-6 h-6" />}
                        <span className="text-sm font-medium">
                          {theme === 'light' && '라이트'}
                          {theme === 'dark' && '다크'}
                          {theme === 'system' && '시스템'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="fontSize">글꼴 크기</Label>
                <Select 
                  value={settings.appearance.fontSize}
                  onValueChange={(value) => handleSettingChange('appearance', 'fontSize', value)}
                >
                  <SelectTrigger id="fontSize" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">작게</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="large">크게</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">컴팩트 모드</p>
                    <p className="text-sm text-gray-600">UI 요소 간격을 줄입니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance.compactMode}
                      onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">애니메이션</p>
                    <p className="text-sm text-gray-600">화면 전환 효과를 사용합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Bell className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">알림 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">데스크톱 알림</p>
                      <p className="text-sm text-gray-600">브라우저 알림을 표시합니다</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.desktop}
                      onChange={(e) => handleSettingChange('notifications', 'desktop', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {settings.notifications.sound ? <Volume2 className="w-5 h-5 text-gray-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                    <div>
                      <p className="font-medium">알림음</p>
                      <p className="text-sm text-gray-600">알림 시 소리를 재생합니다</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sound}
                      onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">이메일 알림</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">업데이트 알림</p>
                      <p className="text-sm text-gray-600">슬롯 상태 변경 시 이메일 알림</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email.updates}
                        onChange={(e) => handleSettingChange('notifications', 'email', {
                          ...settings.notifications.email,
                          updates: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">마케팅 이메일</p>
                      <p className="text-sm text-gray-600">프로모션 및 이벤트 소식</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email.marketing}
                        onChange={(e) => handleSettingChange('notifications', 'email', {
                          ...settings.notifications.email,
                          marketing: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">보안 알림</p>
                      <p className="text-sm text-gray-600">계정 보안 관련 알림</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email.security}
                        onChange={(e) => handleSettingChange('notifications', 'email', {
                          ...settings.notifications.email,
                          security: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 개인정보 설정 */}
        <TabsContent value="privacy">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Shield className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">개인정보 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="profileVisibility">프로필 공개 범위</Label>
                <Select 
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value) => handleSettingChange('privacy', 'profileVisibility', value)}
                >
                  <SelectTrigger id="profileVisibility" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">전체 공개</SelectItem>
                    <SelectItem value="friends">친구만</SelectItem>
                    <SelectItem value="private">비공개</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">이메일 공개</p>
                    <p className="text-sm text-gray-600">다른 사용자에게 이메일 주소를 표시합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">전화번호 공개</p>
                    <p className="text-sm text-gray-600">다른 사용자에게 전화번호를 표시합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={(e) => handleSettingChange('privacy', 'showPhone', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">활동 내역 공개</p>
                    <p className="text-sm text-gray-600">슬롯 활동 내역을 공개합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showActivity}
                      onChange={(e) => handleSettingChange('privacy', 'showActivity', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">데이터 수집</p>
                    <p className="text-sm text-gray-600">서비스 개선을 위한 사용 데이터 수집</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.dataCollection}
                      onChange={(e) => handleSettingChange('privacy', 'dataCollection', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 결제 설정 */}
        <TabsContent value="billing">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">결제 설정</h2>
            </div>
            
            <div className="space-y-6">
              {settings.billing.paymentMethod && (
                <div>
                  <h3 className="text-base font-medium mb-4">등록된 결제 수단</h3>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-6 h-6 text-gray-600" />
                        <div>
                          <p className="font-medium">•••• •••• •••• {settings.billing.paymentMethod.last4}</p>
                          <p className="text-sm text-gray-600">만료: {settings.billing.paymentMethod.expiryDate}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        변경
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">자동 충전</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">자동 충전 사용</p>
                      <p className="text-sm text-gray-600">잔액이 부족할 때 자동으로 충전합니다</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.billing.autoRecharge}
                        onChange={(e) => handleSettingChange('billing', 'autoRecharge', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {settings.billing.autoRecharge && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="rechargeAmount">충전 금액</Label>
                        <Select 
                          value={settings.billing.rechargeAmount.toString()}
                          onValueChange={(value) => handleSettingChange('billing', 'rechargeAmount', parseInt(value))}
                        >
                          <SelectTrigger id="rechargeAmount" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50000">₩50,000</SelectItem>
                            <SelectItem value="100000">₩100,000</SelectItem>
                            <SelectItem value="200000">₩200,000</SelectItem>
                            <SelectItem value="500000">₩500,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="rechargeThreshold">최소 잔액</Label>
                        <Select 
                          value={settings.billing.rechargeThreshold.toString()}
                          onValueChange={(value) => handleSettingChange('billing', 'rechargeThreshold', parseInt(value))}
                        >
                          <SelectTrigger id="rechargeThreshold" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5000">₩5,000</SelectItem>
                            <SelectItem value="10000">₩10,000</SelectItem>
                            <SelectItem value="20000">₩20,000</SelectItem>
                            <SelectItem value="50000">₩50,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 고급 설정 */}
        <TabsContent value="advanced">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">고급 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">주의</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      고급 설정을 변경하면 앱의 동작에 영향을 줄 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium mb-4">데이터 관리</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={handleExportData} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      내 데이터 내보내기
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      데이터 가져오기
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      캐시 삭제
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-base font-medium mb-4 text-red-600">위험 구역</h3>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    계정 삭제
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 계정 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 계정을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
              계정 삭제는 요청 후 30일 이내에 처리되며, 이 기간 동안 삭제를 취소할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              계정 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}