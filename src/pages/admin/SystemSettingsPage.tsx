import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Server,
  Database,
  Shield,
  DollarSign,
  Users,
  Mail,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  Download,
  Loader2,
  Activity,
  HardDrive,
  Cpu,
  Clock,
  Ban,
  FileText,
  TrendingUp
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

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  server: {
    environment: string;
    timezone: string;
    language: string;
    debugMode: boolean;
    logLevel: string;
  };
  database: {
    type: string;
    host: string;
    port: number;
    name: string;
    backupSchedule: string;
    lastBackup: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    require2FA: boolean;
    allowedIPs: string[];
  };
  payment: {
    currency: string;
    minCharge: number;
    maxCharge: number;
    freePercent: number;
    paymentMethods: string[];
    bankAccount: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    cdnUrl: string;
  };
  limits: {
    maxSlotPrice: number;
    minSlotPrice: number;
    maxSlotDuration: number;
    maxWorkerPerSlot: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
}

interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  activeUsers: number;
  totalRequests: number;
}

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [systemStatus] = useState<SystemStatus>({
    cpu: 45,
    memory: 62,
    disk: 73,
    uptime: '15일 3시간 42분',
    activeUsers: 234,
    totalRequests: 125430
  });

  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: '슬롯 시스템',
      siteUrl: 'https://slot-system.com',
      supportEmail: 'support@slot-system.com',
      maintenanceMode: false,
      maintenanceMessage: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.'
    },
    server: {
      environment: 'production',
      timezone: 'Asia/Seoul',
      language: 'ko',
      debugMode: false,
      logLevel: 'info'
    },
    database: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      name: 'slot_system_db',
      backupSchedule: 'daily',
      lastBackup: '2024-12-10 03:00:00'
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      require2FA: false,
      allowedIPs: []
    },
    payment: {
      currency: 'KRW',
      minCharge: 10000,
      maxCharge: 5000000,
      freePercent: 10,
      paymentMethods: ['card', 'transfer', 'virtual'],
      bankAccount: '국민은행 123-456-789012'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@slot-system.com',
      smtpSecure: true,
      fromEmail: 'noreply@slot-system.com',
      fromName: '슬롯 시스템'
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 3600,
      compressionEnabled: true,
      cdnEnabled: true,
      cdnUrl: 'https://cdn.slot-system.com'
    },
    limits: {
      maxSlotPrice: 10000000,
      minSlotPrice: 1000,
      maxSlotDuration: 365,
      maxWorkerPerSlot: 100,
      maxFileSize: 104857600, // 100MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'png', 'zip']
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "설정 저장 완료",
        description: "시스템 설정이 성공적으로 저장되었습니다.",
      });
      
      // 일부 설정은 서버 재시작 필요
      if (activeTab === 'server' || activeTab === 'database') {
        setShowRestartDialog(true);
      }
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({
        title: "서버 재시작 완료",
        description: "서버가 성공적으로 재시작되었습니다.",
      });
    } catch (error) {
      toast({
        title: "재시작 실패",
        description: "서버 재시작 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowRestartDialog(false);
    }
  };

  const getStatusColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">시스템 설정</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 전체 설정을 관리합니다</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          설정 저장
        </Button>
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-gray-400" />
            <span className={`text-sm font-bold ${getStatusColor(systemStatus.cpu)}`}>
              {systemStatus.cpu}%
            </span>
          </div>
          <p className="text-xs text-gray-500">CPU 사용률</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStatusBg(systemStatus.cpu)} transition-all duration-300`}
              style={{ width: `${systemStatus.cpu}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-gray-400" />
            <span className={`text-sm font-bold ${getStatusColor(systemStatus.memory)}`}>
              {systemStatus.memory}%
            </span>
          </div>
          <p className="text-xs text-gray-500">메모리 사용률</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStatusBg(systemStatus.memory)} transition-all duration-300`}
              style={{ width: `${systemStatus.memory}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-gray-400" />
            <span className={`text-sm font-bold ${getStatusColor(systemStatus.disk)}`}>
              {systemStatus.disk}%
            </span>
          </div>
          <p className="text-xs text-gray-500">디스크 사용률</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStatusBg(systemStatus.disk)} transition-all duration-300`}
              style={{ width: `${systemStatus.disk}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500">가동 시간</p>
          <p className="text-sm font-semibold mt-1">{systemStatus.uptime}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500">활성 사용자</p>
          <p className="text-sm font-semibold mt-1">{systemStatus.activeUsers}명</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <Badge variant="secondary">{Math.floor(systemStatus.totalRequests / 1000)}K</Badge>
          </div>
          <p className="text-xs text-gray-500">총 요청 수</p>
          <p className="text-sm font-semibold mt-1">{systemStatus.totalRequests.toLocaleString()}</p>
        </Card>
      </div>

      {/* 설정 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="server">서버</TabsTrigger>
          <TabsTrigger value="database">데이터베이스</TabsTrigger>
          <TabsTrigger value="security">보안</TabsTrigger>
          <TabsTrigger value="payment">결제</TabsTrigger>
          <TabsTrigger value="email">이메일</TabsTrigger>
          <TabsTrigger value="performance">성능</TabsTrigger>
          <TabsTrigger value="limits">제한</TabsTrigger>
        </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">일반 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">사이트 이름</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="siteUrl">사이트 URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteUrl: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="supportEmail">지원 이메일</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, supportEmail: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">유지보수 모드</p>
                    <p className="text-sm text-gray-600">사이트를 일시적으로 차단합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.general.maintenanceMode}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, maintenanceMode: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                {settings.general.maintenanceMode && (
                  <div>
                    <Label htmlFor="maintenanceMessage">유지보수 메시지</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.general.maintenanceMessage}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, maintenanceMessage: e.target.value }
                      })}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 서버 설정 */}
        <TabsContent value="server">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Server className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">서버 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="environment">환경</Label>
                  <Select 
                    value={settings.server.environment}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      server: { ...settings.server, environment: value }
                    })}
                  >
                    <SelectTrigger id="environment" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">개발</SelectItem>
                      <SelectItem value="staging">스테이징</SelectItem>
                      <SelectItem value="production">프로덕션</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">시간대</Label>
                  <Select 
                    value={settings.server.timezone}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      server: { ...settings.server, timezone: value }
                    })}
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
                  <Label htmlFor="language">기본 언어</Label>
                  <Select 
                    value={settings.server.language}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      server: { ...settings.server, language: value }
                    })}
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
                  <Label htmlFor="logLevel">로그 레벨</Label>
                  <Select 
                    value={settings.server.logLevel}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      server: { ...settings.server, logLevel: value }
                    })}
                  >
                    <SelectTrigger id="logLevel" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">디버그 모드</p>
                  <p className="text-sm text-gray-600">개발용 상세 로그를 활성화합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.server.debugMode}
                    onChange={(e) => setSettings({
                      ...settings,
                      server: { ...settings.server, debugMode: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {settings.server.debugMode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">주의</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        디버그 모드는 성능에 영향을 줄 수 있으며, 민감한 정보가 로그에 노출될 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 데이터베이스 설정 */}
        <TabsContent value="database">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Database className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">데이터베이스 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dbType">데이터베이스 유형</Label>
                  <Select 
                    value={settings.database.type}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      database: { ...settings.database, type: value }
                    })}
                  >
                    <SelectTrigger id="dbType" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="mariadb">MariaDB</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dbHost">호스트</Label>
                  <Input
                    id="dbHost"
                    value={settings.database.host}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, host: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dbPort">포트</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    value={settings.database.port}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, port: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dbName">데이터베이스명</Label>
                  <Input
                    id="dbName"
                    value={settings.database.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      database: { ...settings.database, name: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-base font-medium mb-4">백업 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupSchedule">백업 주기</Label>
                    <Select 
                      value={settings.database.backupSchedule}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        database: { ...settings.database, backupSchedule: value }
                      })}
                    >
                      <SelectTrigger id="backupSchedule" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">매 시간</SelectItem>
                        <SelectItem value="daily">매일</SelectItem>
                        <SelectItem value="weekly">매주</SelectItem>
                        <SelectItem value="monthly">매월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>마지막 백업</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">{settings.database.lastBackup}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    백업 다운로드
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    즉시 백업
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 보안 설정 */}
        <TabsContent value="security">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Shield className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">보안 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">세션 타임아웃 (초)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">최대 로그인 시도</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">2단계 인증 필수</p>
                  <p className="text-sm text-gray-600">모든 사용자에게 2FA를 강제합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.require2FA}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, require2FA: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-base font-medium mb-4">IP 제한</h3>
                <div className="space-y-2">
                  {settings.security.allowedIPs.length === 0 ? (
                    <p className="text-sm text-gray-500">모든 IP 허용</p>
                  ) : (
                    settings.security.allowedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button variant="ghost" size="sm">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button variant="outline" size="sm">
                    <Ban className="w-4 h-4 mr-2" />
                    IP 추가
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 결제 설정 */}
        <TabsContent value="payment">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">결제 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">통화</Label>
                  <Select 
                    value={settings.payment.currency}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, currency: value }
                    })}
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

                <div>
                  <Label htmlFor="freePercent">무료 캐시 비율 (%)</Label>
                  <Input
                    id="freePercent"
                    type="number"
                    value={settings.payment.freePercent}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, freePercent: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="minCharge">최소 충전 금액</Label>
                  <Input
                    id="minCharge"
                    type="number"
                    value={settings.payment.minCharge}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, minCharge: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxCharge">최대 충전 금액</Label>
                  <Input
                    id="maxCharge"
                    type="number"
                    value={settings.payment.maxCharge}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, maxCharge: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bankAccount">입금 계좌</Label>
                  <Input
                    id="bankAccount"
                    value={settings.payment.bankAccount}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, bankAccount: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-base font-medium mb-4">결제 수단</h3>
                <div className="space-y-2">
                  {['card', 'transfer', 'virtual', 'paypal'].map((method) => (
                    <label key={method} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.payment.paymentMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({
                              ...settings,
                              payment: {
                                ...settings.payment,
                                paymentMethods: [...settings.payment.paymentMethods, method]
                              }
                            });
                          } else {
                            setSettings({
                              ...settings,
                              payment: {
                                ...settings.payment,
                                paymentMethods: settings.payment.paymentMethods.filter(m => m !== method)
                              }
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {method === 'card' && '신용/체크카드'}
                        {method === 'transfer' && '계좌이체'}
                        {method === 'virtual' && '가상계좌'}
                        {method === 'paypal' && 'PayPal'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 이메일 설정 */}
        <TabsContent value="email">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Mail className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">이메일 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP 호스트</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPort">SMTP 포트</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpUser">SMTP 사용자</Label>
                  <Input
                    id="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpUser: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPassword">SMTP 비밀번호</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fromEmail">발신 이메일</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, fromEmail: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fromName">발신자명</Label>
                  <Input
                    id="fromName"
                    value={settings.email.fromName}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, fromName: e.target.value }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">보안 연결 (TLS/SSL)</p>
                  <p className="text-sm text-gray-600">SMTP 연결 시 암호화 사용</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.smtpSecure}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpSecure: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                테스트 이메일 발송
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 성능 설정 */}
        <TabsContent value="performance">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Zap className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">성능 설정</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">캐시 활성화</p>
                    <p className="text-sm text-gray-600">데이터 캐싱으로 성능을 향상시킵니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.cacheEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: { ...settings.performance, cacheEnabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {settings.performance.cacheEnabled && (
                  <div>
                    <Label htmlFor="cacheTTL">캐시 TTL (초)</Label>
                    <Input
                      id="cacheTTL"
                      type="number"
                      value={settings.performance.cacheTTL}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: { ...settings.performance, cacheTTL: parseInt(e.target.value) }
                      })}
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">압축 활성화</p>
                    <p className="text-sm text-gray-600">응답 데이터를 압축하여 전송합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.compressionEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: { ...settings.performance, compressionEnabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">CDN 사용</p>
                    <p className="text-sm text-gray-600">정적 자원을 CDN을 통해 제공합니다</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.cdnEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: { ...settings.performance, cdnEnabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {settings.performance.cdnEnabled && (
                  <div>
                    <Label htmlFor="cdnUrl">CDN URL</Label>
                    <Input
                      id="cdnUrl"
                      value={settings.performance.cdnUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        performance: { ...settings.performance, cdnUrl: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  캐시 초기화
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 제한 설정 */}
        <TabsContent value="limits">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold">제한 설정</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minSlotPrice">최소 슬롯 가격</Label>
                  <Input
                    id="minSlotPrice"
                    type="number"
                    value={settings.limits.minSlotPrice}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, minSlotPrice: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxSlotPrice">최대 슬롯 가격</Label>
                  <Input
                    id="maxSlotPrice"
                    type="number"
                    value={settings.limits.maxSlotPrice}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxSlotPrice: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxSlotDuration">최대 슬롯 기간 (일)</Label>
                  <Input
                    id="maxSlotDuration"
                    type="number"
                    value={settings.limits.maxSlotDuration}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxSlotDuration: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxWorkerPerSlot">슬롯당 최대 작업자</Label>
                  <Input
                    id="maxWorkerPerSlot"
                    type="number"
                    value={settings.limits.maxWorkerPerSlot}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxWorkerPerSlot: parseInt(e.target.value) }
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxFileSize">최대 파일 크기 (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.limits.maxFileSize / 1048576}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxFileSize: parseInt(e.target.value) * 1048576 }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-base font-medium mb-4">허용 파일 형식</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.limits.allowedFileTypes.map((type, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      .{type}
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          limits: {
                            ...settings.limits,
                            allowedFileTypes: settings.limits.allowedFileTypes.filter((_, i) => i !== index)
                          }
                        })}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm">
                    + 추가
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 서버 재시작 다이얼로그 */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>서버 재시작이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>
              변경한 설정을 적용하려면 서버를 재시작해야 합니다. 
              재시작 중에는 일시적으로 서비스를 사용할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>나중에</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestart}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              지금 재시작
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}