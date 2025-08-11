import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  MessageSquare,
  Grid3X3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  Users,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'cash', label: '캐시 관리', icon: Wallet, color: 'text-green-500' },
  { id: 'inquiries', label: '1:1 문의', icon: MessageSquare, color: 'text-purple-500', badge: 3 },
  { id: 'slots', label: '슬롯 관리', icon: Grid3X3, color: 'text-orange-500' },
  { id: 'announcements', label: '공지사항', icon: Megaphone, color: 'text-red-500' },
  { id: 'settings', label: '설정', icon: Settings, color: 'text-gray-500' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/slots')) return 'slots';
    if (path.startsWith('/cash')) return 'cash';
    if (path.startsWith('/inquiries')) return 'inquiries';
    if (path.startsWith('/announcements')) return 'announcements';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/',
      'slots': '/slots',
      'cash': '/cash',
      'inquiries': '/inquiries',
      'announcements': '/announcements',
      'settings': '/settings',
    };
    navigate(routes[page] || '/');
  };

  const activePage = getActivePage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg text-gray-800">슬롯 매니저</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 캐시 잔액 표시 */}
            <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">유료 캐시:</span>
                <span className="text-sm font-semibold">₩{Math.floor(user?.cash_balance || 0).toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">무료 캐시:</span>
                <span className="text-sm font-semibold">₩{Math.floor(user?.free_cash_balance || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* 검색 */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all w-48"
              />
            </div>

            {/* 알림 */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 프로필 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200"
                  >
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>로그아웃</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* 사이드바 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30"
          >
            <div className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("w-5 h-5", isActive ? "text-purple-600" : item.color)} />
                      <span className={cn("font-medium", isActive && "text-purple-700")}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 공지사항 카드 */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>공지사항</span>
                  </h3>
                  <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    NEW
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium">시스템 정기 점검 안내</p>
                    <p className="text-xs text-white/70 mt-1">
                      12월 15일 새벽 2시-4시 점검 예정
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-xs text-white/80">
                      캐시 충전 이벤트 진행중! 🎉
                    </p>
                  </div>
                </div>
                <button className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  전체 공지 보기
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠 */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-0"
      )}>
        {/* 페이지 헤더 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activePage)?.label || '대시보드'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>

            {/* 빠른 통계 */}
            {activePage === 'dashboard' && (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">이번 달 매출</p>
                    <p className="text-lg font-semibold text-gray-800">₩2,450,000</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">활성 사용자</p>
                    <p className="text-lg font-semibold text-gray-800">1,234</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};