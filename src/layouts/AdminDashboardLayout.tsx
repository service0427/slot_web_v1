import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Grid3X3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Shield,
  DollarSign,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AdminDashboardLayoutProps {
  children?: React.ReactNode;
}

const adminMenuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'users', label: '사용자 관리', icon: Users, color: 'text-green-500', badge: 12 },
  { id: 'cash', label: '캐시 관리', icon: DollarSign, color: 'text-yellow-500' },
  { id: 'slots', label: '전체 슬롯', icon: Grid3X3, color: 'text-purple-500' },
  { id: 'inquiries', label: '문의 관리', icon: MessageSquare, color: 'text-indigo-500', badge: 5 },
  { id: 'announcements', label: '공지사항 관리', icon: Megaphone, color: 'text-red-500', superAdminOnly: true },
  { id: 'reports', label: '리포트', icon: BarChart3, color: 'text-orange-500' },
  { id: 'settings', label: '시스템 설정', icon: Settings, color: 'text-gray-500' },
];

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'dashboard';
    if (path.startsWith('/admin/users')) return 'users';
    if (path.startsWith('/admin/cash')) return 'cash';
    if (path.startsWith('/admin/slots')) return 'slots';
    if (path.startsWith('/admin/inquiries')) return 'inquiries';
    if (path.startsWith('/admin/announcements')) return 'announcements';
    if (path.startsWith('/admin/reports')) return 'reports';
    if (path.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/admin',
      'users': '/admin/users',
      'cash': '/admin/cash',
      'slots': '/admin/slots',
      'inquiries': '/admin/inquiries',
      'announcements': '/admin/announcements',
      'reports': '/admin/reports',
      'settings': '/admin/settings',
    };
    navigate(routes[page] || '/admin');
  };

  const activePage = getActivePage();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 네비게이션 - 관리자용 다크 테마 */}
      <nav className="bg-gray-900 shadow-lg border-b border-gray-800 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">관리자 콘솔</span>
                <span className="text-xs text-gray-400 block">Admin Dashboard</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 검색 */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="사용자, 슬롯, 문의 검색..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-80"
              />
            </div>

            {/* 알림 */}
            <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* 프로필 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">시스템 관리자</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700"
                  >
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
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

      {/* 사이드바 - 관리자용 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed left-0 top-16 bottom-0 w-64 bg-gray-900 border-r border-gray-800 z-30"
          >
            <div className="p-4 space-y-1">
              {adminMenuItems
                .filter(item => {
                  // 최고관리자만 공지사항 관리 메뉴 표시
                  if (item.superAdminOnly) {
                    return user?.role === 'super_admin';
                  }
                  return true;
                })
                .map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white border border-orange-500/50"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("w-5 h-5", isActive ? "text-orange-400" : item.color)} />
                      <span className={cn("font-medium", isActive && "text-white")}>
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

            {/* 시스템 상태 카드 */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">시스템 상태</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">정상</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">CPU 사용률</span>
                    <span className="font-bold">23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">메모리</span>
                    <span className="font-bold">4.2GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">활성 사용자</span>
                    <span className="font-bold">342명</span>
                  </div>
                </div>
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
        {/* 페이지 헤더 - 관리자용 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-orange-500" />
                <span>{adminMenuItems.find(item => item.id === activePage)?.label || '대시보드'}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                관리자 전용 페이지 • 마지막 로그인: {new Date().toLocaleString('ko-KR')}
              </p>
            </div>

            {/* 빠른 액션 */}
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>긴급 공지</span>
              </button>
              <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                시스템 로그
              </button>
            </div>
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