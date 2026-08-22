import { useState } from 'react'
import {
  ArrowLeft,
  BotMessageSquare,
  Globe,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { AdminChatLogsView } from './AdminChatLogsView'
import { AdminDashboard } from './AdminDashboard'
import { AdminUserManagement } from './AdminUserManagement'

type AdminTab = 'dashboard' | 'chat' | 'users'

type AdminLayoutProps = {
  apiBaseUrl: string
  adminUser: {
    id: number
    fullName: string
    email: string
  }
  onExitAdmin: () => void
  onLogout: () => void
}

export function AdminLayout({ apiBaseUrl, adminUser, onExitAdmin, onLogout }: AdminLayoutProps) {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard')

  return (
    <div className="admin-portal-root">
      {/* Background ambient lighting */}
      <div className="admin-ambient-glow glow-top-left" />
      <div className="admin-ambient-glow glow-bottom-right" />

      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand-header">
          <div className="admin-brand-logo">
            <BotMessageSquare size={22} />
          </div>
          <div className="admin-brand-text">
            <div className="admin-brand-name">
              <h1>RenalCareAI</h1>
              <span className="admin-badge">Admin</span>
            </div>
            <span className="admin-brand-sub">Trung tâm Điều hành & Phân tích</span>
          </div>
        </div>

        <div className="admin-nav-section-title">CHỨC NĂNG QUẢN TRỊ</div>
        <nav className="admin-nav-menu" aria-label="Menu Quản trị">
          <button
            type="button"
            className={`admin-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="nav-item-icon-box">
              <LayoutDashboard size={18} />
            </div>
            <span className="nav-item-title">Tổng quan Hệ thống</span>
            {currentTab === 'dashboard' && <span className="active-pill" />}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${currentTab === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentTab('chat')}
          >
            <div className="nav-item-icon-box">
              <MessageSquare size={18} />
            </div>
            <span className="nav-item-title">Lịch sử Chatbox AI</span>
            {currentTab === 'chat' && <span className="active-pill" />}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${currentTab === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentTab('users')}
          >
            <div className="nav-item-icon-box">
              <Users size={18} />
            </div>
            <span className="nav-item-title">Quản lý Người dùng</span>
            {currentTab === 'users' && <span className="active-pill" />}
          </button>
        </nav>

        {/* Live status badge */}
        <div className="admin-sidebar-status">
          <div className="live-pulse-container">
            <span className="live-dot-ping" />
            <span className="live-dot" />
          </div>
          <div className="live-status-meta">
            <strong>Hệ thống Trực tuyến</strong>
            <small>RAG & ML v1.0 • 100% Hoạt động</small>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-avatar">
              <ShieldCheck size={18} />
            </div>
            <div className="admin-info">
              <strong>{adminUser.fullName}</strong>
              <small>{adminUser.email}</small>
            </div>
          </div>

          <div className="admin-footer-actions">
            <button
              type="button"
              className="admin-exit-btn"
              onClick={onExitAdmin}
              title="Quay lại giao diện người dùng"
            >
              <ArrowLeft size={15} />
              <span>Về trang chủ</span>
            </button>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="admin-main-viewport">
        <header className="admin-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Portal Quản trị</span>
              <span className="breadcrumb-divider">/</span>
              <strong className="breadcrumb-current">
                {currentTab === 'dashboard' && 'Tổng quan & Thống kê'}
                {currentTab === 'chat' && 'Lịch sử Hội thoại & Phản hồi Chatbox AI'}
                {currentTab === 'users' && 'Hồ sơ Người dùng & Dự đoán Bệnh'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-live-tag">
              <Radio size={14} className="live-icon" />
              <span>Dữ liệu thời gian thực</span>
            </div>
            <button type="button" className="topbar-switch-btn" onClick={onExitAdmin}>
              <Globe size={14} />
              <span>Giao diện Khách hàng</span>
            </button>
          </div>
        </header>

        <div className="admin-content-area">
          {currentTab === 'dashboard' && (
            <AdminDashboard
              apiBaseUrl={apiBaseUrl}
              onNavigateToChat={() => setCurrentTab('chat')}
            />
          )}
          {currentTab === 'chat' && <AdminChatLogsView apiBaseUrl={apiBaseUrl} />}
          {currentTab === 'users' && <AdminUserManagement apiBaseUrl={apiBaseUrl} />}
        </div>
      </main>
    </div>
  )
}
