import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// 레이아웃
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';

// 컴포넌트
import { PrivateRoute } from '@/components/PrivateRoute';

// 페이지 - 인증
import { LoginPage } from './pages/LoginPage';

// 페이지 - 사용자
import { DashboardPage } from './pages/DashboardPage';
import CashPage from './pages/CashPage';
import UserInquiryPage from './pages/UserInquiryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

// 페이지 - 슬롯
import SlotListPage from './pages/slots/SlotListPage';
import SlotDetailPage from './pages/slots/SlotDetailPage';
import SlotCreatePage from './pages/slots/SlotCreatePage';
import SlotEditPage from './pages/slots/SlotEditPage';

// 페이지 - 관리자
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CashManagementPage from './pages/admin/CashManagementPage';
import InquiryManagementPage from './pages/admin/InquiryManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminSlotManagementPage from './pages/admin/SlotManagementPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import AnnouncementManagementPage from './pages/admin/AnnouncementManagementPage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 인증 라우트 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 사용자 라우트 */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/cash" element={<CashPage />} />
            <Route path="/inquiries" element={<UserInquiryPage />} />
            <Route path="/slots" element={<SlotListPage />} />
            <Route path="/slots/create" element={<SlotCreatePage />} />
            <Route path="/slots/:id" element={<SlotDetailPage />} />
            <Route path="/slots/:id/edit" element={<SlotEditPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 관리자 라우트 */}
        <Route element={<PrivateRoute adminOnly={true} />}>
          <Route element={<AdminDashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/cash" element={<CashManagementPage />} />
            <Route path="/admin/slots" element={<AdminSlotManagementPage />} />
            <Route path="/admin/inquiries" element={<InquiryManagementPage />} />
            <Route path="/admin/announcements" element={<AnnouncementManagementPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>

        {/* 404 페이지 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;