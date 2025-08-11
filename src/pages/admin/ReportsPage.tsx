import { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  ShoppingBag,
  Activity,
  PieChart,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Printer,
  Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  // 통계 데이터
  const overviewStats = {
    totalRevenue: {
      value: 45850000,
      change: 23.5,
      trend: 'up',
    },
    totalUsers: {
      value: 3456,
      change: 18.2,
      trend: 'up',
    },
    totalSlots: {
      value: 892,
      change: 12.8,
      trend: 'up',
    },
    avgTransactionValue: {
      value: 125000,
      change: -5.3,
      trend: 'down',
    },
  };

  // 카테고리별 매출 데이터
  const categoryRevenue = [
    { category: 'Basic', revenue: 12500000, percentage: 27.3, count: 356 },
    { category: 'Premium', revenue: 18200000, percentage: 39.7, count: 245 },
    { category: 'VIP', revenue: 15150000, percentage: 33.0, count: 98 },
  ];

  // 작업 타입별 통계
  const workTypeStats = [
    { type: '번역', count: 234, revenue: 8900000, avgPrice: 38000 },
    { type: '디자인', count: 189, revenue: 15600000, avgPrice: 82500 },
    { type: '개발', count: 156, revenue: 18200000, avgPrice: 116700 },
    { type: '콘텐츠', count: 198, revenue: 5400000, avgPrice: 27300 },
    { type: '마케팅', count: 115, revenue: 7750000, avgPrice: 67400 },
  ];

  // 기간별 성장률
  const growthData = [
    { period: '1월', revenue: 32500000, users: 2850, slots: 650 },
    { period: '2월', revenue: 35200000, users: 2920, slots: 690 },
    { period: '3월', revenue: 38900000, users: 3050, slots: 745 },
    { period: '4월', revenue: 41200000, users: 3180, slots: 802 },
    { period: '5월', revenue: 43600000, users: 3280, slots: 845 },
    { period: '6월', revenue: 45850000, users: 3456, slots: 892 },
  ];

  // 사용자 활동 통계
  const userActivityStats = {
    activeUsers: 1823,
    newUsers: 342,
    returningUsers: 2934,
    churnRate: 4.2,
    avgSessionDuration: '18분 32초',
    avgPurchaseFrequency: 2.8,
  };

  const getChangeIcon = (trend: string) => {
    return trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getChangeColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">통계 및 리포트</h1>
          <p className="text-gray-600 mt-1">비즈니스 인사이트와 성과를 분석합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            인쇄
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            이메일 전송
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 기간 선택 */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">기간 선택:</span>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="quarter">이번 분기</SelectItem>
              <SelectItem value="year">올해</SelectItem>
              <SelectItem value="custom">사용자 지정</SelectItem>
            </SelectContent>
          </Select>
          {selectedPeriod === 'custom' && (
            <DatePickerWithRange className="ml-4" />
          )}
        </div>
      </Card>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(overviewStats.totalRevenue.trend)}`}>
                {getChangeIcon(overviewStats.totalRevenue.trend)}
                {overviewStats.totalRevenue.change}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">총 매출</h3>
            <p className="text-2xl font-bold">₩{overviewStats.totalRevenue.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">전월 대비</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(overviewStats.totalUsers.trend)}`}>
                {getChangeIcon(overviewStats.totalUsers.trend)}
                {overviewStats.totalUsers.change}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">총 사용자</h3>
            <p className="text-2xl font-bold">{overviewStats.totalUsers.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">활성 사용자</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(overviewStats.totalSlots.trend)}`}>
                {getChangeIcon(overviewStats.totalSlots.trend)}
                {overviewStats.totalSlots.change}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">총 슬롯</h3>
            <p className="text-2xl font-bold">{overviewStats.totalSlots.value}</p>
            <p className="text-xs text-gray-500 mt-1">활성 슬롯</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(overviewStats.avgTransactionValue.trend)}`}>
                {getChangeIcon(overviewStats.avgTransactionValue.trend)}
                {Math.abs(overviewStats.avgTransactionValue.change)}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">평균 거래액</h3>
            <p className="text-2xl font-bold">₩{overviewStats.avgTransactionValue.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">거래당</p>
          </Card>
        </motion.div>
      </div>

      {/* 상세 리포트 탭 */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="revenue">매출 분석</TabsTrigger>
          <TabsTrigger value="users">사용자 분석</TabsTrigger>
          <TabsTrigger value="slots">슬롯 분석</TabsTrigger>
          <TabsTrigger value="trends">트렌드</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 카테고리별 매출 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-orange-500" />
                카테고리별 매출 분포
              </h3>
              <div className="space-y-4">
                {categoryRevenue.map((item, index) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold">₩{item.revenue.toLocaleString()}</span>
                        <Badge variant="secondary" className="ml-2">{item.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' : 'bg-orange-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.count}개 슬롯</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 작업 타입별 통계 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                작업 타입별 성과
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">타입</th>
                      <th className="text-right pb-2">건수</th>
                      <th className="text-right pb-2">매출</th>
                      <th className="text-right pb-2">평균가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workTypeStats.map((stat) => (
                      <tr key={stat.type} className="border-b">
                        <td className="py-2">{stat.type}</td>
                        <td className="text-right py-2">{stat.count}</td>
                        <td className="text-right py-2 font-semibold">
                          ₩{stat.revenue.toLocaleString()}
                        </td>
                        <td className="text-right py-2">
                          ₩{stat.avgPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 매출 분석 탭 */}
        <TabsContent value="revenue">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">월별 매출 추이</h3>
            <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">매출 차트 영역</p>
                <p className="text-sm text-gray-400 mt-1">Chart.js 또는 Recharts 연동 예정</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">최고 매출일</h4>
                <p className="text-lg font-semibold">6월 15일</p>
                <p className="text-sm text-gray-500">₩3,250,000</p>
              </Card>
              <Card className="p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">평균 일매출</h4>
                <p className="text-lg font-semibold">₩1,528,333</p>
                <p className="text-sm text-green-600">+12.5%</p>
              </Card>
              <Card className="p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-600 mb-1">매출 성장률</h4>
                <p className="text-lg font-semibold">23.5%</p>
                <p className="text-sm text-gray-500">전월 대비</p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* 사용자 분석 탭 */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">사용자 활동 지표</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">활성 사용자</span>
                  <span className="text-lg font-semibold">{userActivityStats.activeUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">신규 가입</span>
                  <span className="text-lg font-semibold text-green-600">+{userActivityStats.newUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">재방문 사용자</span>
                  <span className="text-lg font-semibold">{userActivityStats.returningUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">이탈률</span>
                  <span className="text-lg font-semibold text-red-600">{userActivityStats.churnRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">평균 세션 시간</span>
                  <span className="text-lg font-semibold">{userActivityStats.avgSessionDuration}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">평균 구매 빈도</span>
                  <span className="text-lg font-semibold">{userActivityStats.avgPurchaseFrequency}회/월</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">사용자 등급 분포</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">사용자 등급 차트</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 슬롯 분석 탭 */}
        <TabsContent value="slots">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">슬롯 성과 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-1">평균 완료 시간</h4>
                <p className="text-xl font-semibold">4.2일</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-1">완료율</h4>
                <p className="text-xl font-semibold text-green-600">87.5%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-1">평균 작업자 수</h4>
                <p className="text-xl font-semibold">2.3명</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-1">재구매율</h4>
                <p className="text-xl font-semibold text-blue-600">62.8%</p>
              </div>
            </div>
            
            <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">슬롯 타임라인 차트</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 트렌드 탭 */}
        <TabsContent value="trends">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">성장 트렌드</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3">기간</th>
                    <th className="text-right pb-3">매출</th>
                    <th className="text-right pb-3">사용자</th>
                    <th className="text-right pb-3">슬롯</th>
                    <th className="text-right pb-3">성장률</th>
                  </tr>
                </thead>
                <tbody>
                  {growthData.map((data, index) => (
                    <tr key={data.period} className="border-b">
                      <td className="py-3 font-medium">{data.period}</td>
                      <td className="text-right py-3">₩{data.revenue.toLocaleString()}</td>
                      <td className="text-right py-3">{data.users.toLocaleString()}</td>
                      <td className="text-right py-3">{data.slots}</td>
                      <td className="text-right py-3">
                        {index > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={
                              ((data.revenue - growthData[index - 1].revenue) / growthData[index - 1].revenue * 100) > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {index > 0
                              ? `${((data.revenue - growthData[index - 1].revenue) / growthData[index - 1].revenue * 100).toFixed(1)}%`
                              : '-'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}