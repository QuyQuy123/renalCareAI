import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Users,
  X,
} from 'lucide-react'
import type { AdminUserListItem } from '../../types/admin'
import { UserDossierModal } from './UserDossierModal'

type AdminUserManagementProps = {
  apiBaseUrl: string
}

export function AdminUserManagement({ apiBaseUrl }: AdminUserManagementProps) {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch(`${apiBaseUrl}/api/admin/users`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Không thể tải danh sách người dùng.')
        }
        return (await response.json()) as AdminUserListItem[]
      })
      .then((data) => {
        if (isMounted) {
          setUsers(data)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [apiBaseUrl])

  function handleRefresh() {
    setIsLoading(true)
    setError('')
    fetch(`${apiBaseUrl}/api/admin/users`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Không thể tải danh sách người dùng.')
        }
        return (await response.json()) as AdminUserListItem[]
      })
      .then((data) => {
        setUsers(data)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.')
        setIsLoading(false)
      })
  }

  async function toggleUserStatus(userId: number, currentStatus: string) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    const confirmMessage = currentStatus === 'ACTIVE'
      ? 'Bạn có chắc chắn muốn khóa tài khoản người dùng này không?'
      : 'Bạn có chắc chắn muốn mở khóa cho người dùng này không?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái người dùng.')
      }
      setUsers((current) =>
        current.map((u) => (u.id === userId ? { ...u, status: nextStatus as 'ACTIVE' | 'LOCKED' } : u))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật.')
    }
  }

  function getRiskBadge(level?: string) {
    switch (level?.toUpperCase()) {
      case 'HIGH':
        return (
          <span className="admin-risk-badge high">
            <span className="risk-dot" />
            <ShieldAlert size={12} /> Nguy cơ cao
          </span>
        )
      case 'MODERATE':
        return (
          <span className="admin-risk-badge moderate">
            <span className="risk-dot" />
            <AlertTriangle size={12} /> Nguy cơ TB
          </span>
        )
      case 'LOW':
        return (
          <span className="admin-risk-badge low">
            <span className="risk-dot" />
            <CheckCircle2 size={12} /> Nguy cơ thấp
          </span>
        )
      default:
        return (
          <span className="admin-risk-badge none">
            <span className="risk-dot" />
            Chưa nạp hồ sơ
          </span>
        )
    }
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  // Filter users by search and risk level
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchQuery))

    const matchesRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && user.primaryRiskLevel === 'HIGH') ||
      (riskFilter === 'MODERATE' && user.primaryRiskLevel === 'MODERATE') ||
      (riskFilter === 'LOW' && user.primaryRiskLevel === 'LOW') ||
      (riskFilter === 'NONE' && (user.primaryRiskLevel === 'NONE' || !user.primaryRiskLevel))

    return matchesSearch && matchesRisk
  })

  const highCount = users.filter((u) => u.primaryRiskLevel === 'HIGH').length
  const modCount = users.filter((u) => u.primaryRiskLevel === 'MODERATE').length
  const lowCount = users.filter((u) => u.primaryRiskLevel === 'LOW').length
  const noneCount = users.filter((u) => u.primaryRiskLevel === 'NONE' || !u.primaryRiskLevel).length

  return (
    <div className="admin-users-page">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="header-title-group">
          <div className="page-icon-tag emerald">
            <Users size={20} />
          </div>
          <div>
            <h2>Quản lý Người dùng & Dự đoán Bệnh Thận</h2>
            <p>Tra cứu danh sách tài khoản, hồ sơ khám bệnh đã lưu trữ và xem chi tiết đánh giá nguy cơ AI/ML.</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>Làm mới danh sách</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-banner error">
          <AlertTriangle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="admin-toolbar-card">
        <div className="admin-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Quick Filter Segmented Buttons */}
        <div className="admin-filter-tabs">
          <button
            type="button"
            className={`filter-tab-pill ${riskFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRiskFilter('ALL')}
          >
            Tất cả <span className="tab-count">{users.length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill high ${riskFilter === 'HIGH' ? 'active' : ''}`}
            onClick={() => setRiskFilter('HIGH')}
          >
            Nguy cơ cao <span className="tab-count">{highCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill moderate ${riskFilter === 'MODERATE' ? 'active' : ''}`}
            onClick={() => setRiskFilter('MODERATE')}
          >
            Nguy cơ TB <span className="tab-count">{modCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill low ${riskFilter === 'LOW' ? 'active' : ''}`}
            onClick={() => setRiskFilter('LOW')}
          >
            Nguy cơ thấp <span className="tab-count">{lowCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill none ${riskFilter === 'NONE' ? 'active' : ''}`}
            onClick={() => setRiskFilter('NONE')}
          >
            Chưa có hồ sơ <span className="tab-count">{noneCount}</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="admin-card users-table-card">
        <div className="admin-card-header table-header-flex">
          <div className="card-header-title">
            <h4>Danh sách Tài khoản ({filteredUsers.length})</h4>
          </div>
          <span className="card-badge">
            Hiển thị {filteredUsers.length} / {users.length} người dùng
          </span>
        </div>

        <div className="users-table-wrapper">
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th className="id-th">ID</th>
                <th>Thành viên</th>
                <th>Thông tin liên hệ</th>
                <th>Ngày tạo</th>
                <th>Hồ sơ khám</th>
                <th>Đánh giá nguy cơ AI</th>
                <th>Trạng thái</th>
                <th className="actions-header">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    <div className="admin-loading-inline">
                      <div className="admin-spinner" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    <div className="no-result-box">
                      <Users size={32} />
                      <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="user-table-row">
                    <td className="id-cell">#{user.id}</td>
                    <td className="user-name-cell">
                      <div className="user-cell-flex">
                        <div className={`avatar-mini ${user.role === 'ADMIN' ? 'admin' : ''}`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-meta-stack">
                          <strong>{user.fullName}</strong>
                          {user.role === 'ADMIN' ? (
                            <span className="user-role-tag admin">
                              <ShieldCheck size={10} /> Quản trị
                            </span>
                          ) : (
                            <span className="user-role-tag customer">Khách hàng</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="contact-cell">
                      <div className="contact-line">
                        <Mail size={12} />
                        <span>{user.email}</span>
                      </div>
                      {user.phoneNumber && (
                        <div className="contact-line phone">
                          <Phone size={12} />
                          <span>{user.phoneNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(user.createdAt)}</td>
                    <td>
                      <span className="record-count-chip">
                        <FileText size={13} />
                        <strong>{user.medicalRecordCount}</strong> hồ sơ
                      </span>
                    </td>
                    <td>
                      <div className="risk-cell-wrap">
                        {getRiskBadge(user.primaryRiskLevel)}
                        {user.highestRiskScore !== null && user.highestRiskScore !== undefined && (
                          <div className="score-progress-micro">
                            <span className="score-label">Điểm: {user.highestRiskScore}/100</span>
                            <div className="micro-bar-track">
                              <div
                                className={`micro-bar-fill ${user.primaryRiskLevel.toLowerCase()}`}
                                style={{ width: `${Math.min(user.highestRiskScore, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${user.status.toLowerCase()}`}>
                        <span className="status-dot" />
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          className="btn-action view"
                          onClick={() => setSelectedUserId(user.id)}
                          title="Xem hồ sơ khám & kết quả dự đoán bệnh"
                        >
                          <Eye size={14} />
                          <span>Xem hồ sơ</span>
                          <ChevronRight size={13} />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            className={`btn-action lock ${user.status === 'ACTIVE' ? '' : 'unlock'}`}
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {user.status === 'ACTIVE' ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Dossier & Prediction Detail Modal */}
      {selectedUserId !== null && (
        <UserDossierModal
          userId={selectedUserId}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
