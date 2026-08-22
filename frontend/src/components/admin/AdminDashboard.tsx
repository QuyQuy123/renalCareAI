import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  Globe,
  HeartPulse,
  MessageSquare,
  RefreshCw,
  Server,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { AdminDashboardStats } from '../../types/admin'

type AdminDashboardProps = {
  apiBaseUrl: string
}

export function AdminDashboard({ apiBaseUrl }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    let isMounted = true

    fetch(`${apiBaseUrl}/api/admin/dashboard/stats`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thống kê tổng quan.')
        }
        return (await response.json()) as AdminDashboardStats
      })
      .then((data) => {
        if (isMounted) {
          setStats(data)
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
    fetch(`${apiBaseUrl}/api/admin/dashboard/stats`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thống kê tổng quan.')
        }
        return (await response.json()) as AdminDashboardStats
      })
      .then((data) => {
        setStats(data)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.')
        setIsLoading(false)
      })
  }

  function formatTimeAgo(timeStr: string) {
    try {
      const date = new Date(timeStr)
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return timeStr
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
            Chưa có hồ sơ
          </span>
        )
    }
  }

  const highRiskCount = stats?.riskDistribution?.HIGH ?? 0
  const moderateRiskCount = stats?.riskDistribution?.MODERATE ?? 0
  const lowRiskCount = stats?.riskDistribution?.LOW ?? 0
  const noRiskCount = stats?.riskDistribution?.NONE ?? 0
  const totalEvaluated = highRiskCount + moderateRiskCount + lowRiskCount + noRiskCount || 1

  const allActivities = stats?.recentActivities ?? []
  const totalActivities = allActivities.length
  const totalPages = Math.ceil(totalActivities / ITEMS_PER_PAGE) || 1
  const validPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalActivities)
  const paginatedActivities = allActivities.slice(startIndex, endIndex)

  return (
    <div className="admin-dashboard-page">
      {/* Top Banner Header */}
      <div className="admin-page-header">
        <div className="header-title-group">
          <div className="page-icon-tag">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2>Trung tâm Báo cáo & Thống kê</h2>
            <p>Giám sát lưu lượng truy cập, tương tác AI RAG, số lượng hồ sơ y khoa và tình trạng bệnh nhân toàn hệ thống.</p>
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
            <span>Làm mới số liệu</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-banner error">
          <AlertTriangle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* 4 Core KPI Stat Cards with Gradient Glowing Accents */}
      <div className="admin-kpi-grid">
        {/* KPI 1: Unique Visitors */}
        <div className="admin-kpi-card visitor-kpi">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap visitor-icon">
              <Users size={22} />
            </div>
            <div className="kpi-trend-badge positive">
              <ArrowUpRight size={13} />
              <span>Định danh</span>
            </div>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Số người truy cập (Unique)</span>
            <h3 className="kpi-value">
              {isLoading ? <div className="skeleton-num" /> : (stats?.uniqueVisitors ?? 0).toLocaleString()}
            </h3>
            <div className="kpi-footer-meta">
              <span className="kpi-subtext">Khách truy cập duy nhất theo thiết bị</span>
            </div>
          </div>
          <div className="kpi-card-glow visitor" />
        </div>

        {/* KPI 2: Total Pageviews */}
        <div className="admin-kpi-card pageview-kpi">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap pageview-icon">
              <Globe size={22} />
            </div>
            <div className="kpi-trend-badge positive">
              <Zap size={12} />
              <span>Lưu lượng</span>
            </div>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Số lượt truy cập vào web</span>
            <h3 className="kpi-value">
              {isLoading ? <div className="skeleton-num" /> : (stats?.totalPageviews ?? 0).toLocaleString()}
            </h3>
            <div className="kpi-footer-meta">
              <span className="kpi-subtext">Tổng số lượt xem & tải trang web</span>
            </div>
          </div>
          <div className="kpi-card-glow pageview" />
        </div>

        {/* KPI 3: AI Chat Responses */}
        <div className="admin-kpi-card chat-kpi">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap chat-icon">
              <MessageSquare size={22} />
            </div>
            <div className="kpi-trend-badge ai">
              <Sparkles size={12} />
              <span>RAG + ML</span>
            </div>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Số phản hồi của Chatbox</span>
            <h3 className="kpi-value">
              {isLoading ? <div className="skeleton-num" /> : (stats?.totalChatResponses ?? 0).toLocaleString()}
            </h3>
            <div className="kpi-footer-meta">
              <span className="kpi-subtext">Câu hỏi & dự đoán sức khỏe thận AI</span>
            </div>
          </div>
          <div className="kpi-card-glow chat" />
        </div>

        {/* KPI 4: Medical Records Uploaded */}
        <div className="admin-kpi-card record-kpi">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap record-icon">
              <FileText size={22} />
            </div>
            <div className="kpi-trend-badge info">
              <HeartPulse size={12} />
              <span>OCR & Phân tích</span>
            </div>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Số hồ sơ khám được upload</span>
            <h3 className="kpi-value">
              {isLoading ? <div className="skeleton-num" /> : (stats?.totalMedicalRecords ?? 0).toLocaleString()}
            </h3>
            <div className="kpi-footer-meta">
              <span className="kpi-subtext">Tệp PDF & Ảnh xét nghiệm y khoa</span>
            </div>
          </div>
          <div className="kpi-card-glow record" />
        </div>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="admin-sections-grid">
        {/* Risk Distribution Breakdown Card */}
        <div className="admin-card risk-distribution-card">
          <div className="admin-card-header">
            <div className="card-header-title">
              <div className="card-icon-tag teal">
                <HeartPulse size={18} />
              </div>
              <div>
                <h4>Phân bổ Nguy cơ Bệnh Thận (Risk Stratification)</h4>
                <small>Thống kê theo kết quả mô hình Machine Learning & KFRE</small>
              </div>
            </div>
            <span className="card-badge">Tổng {stats?.totalUsers ?? 0} thành viên</span>
          </div>

          {/* Segmented bar visual */}
          <div className="segmented-risk-bar">
            <div
              className="segment high"
              style={{ width: `${(highRiskCount / totalEvaluated) * 100}%` }}
              title={`Nguy cơ cao: ${highRiskCount} người`}
            />
            <div
              className="segment moderate"
              style={{ width: `${(moderateRiskCount / totalEvaluated) * 100}%` }}
              title={`Nguy cơ TB: ${moderateRiskCount} người`}
            />
            <div
              className="segment low"
              style={{ width: `${(lowRiskCount / totalEvaluated) * 100}%` }}
              title={`Nguy cơ thấp: ${lowRiskCount} người`}
            />
            <div
              className="segment none"
              style={{ width: `${(noRiskCount / totalEvaluated) * 100}%` }}
              title={`Chưa nạp: ${noRiskCount} người`}
            />
          </div>

          <div className="risk-bars-container">
            <div className="risk-bar-item high-item">
              <div className="risk-bar-labels">
                <span className="risk-name high">
                  <span className="risk-square high" />
                  Nguy cơ cao (High Risk)
                </span>
                <span className="risk-count">
                  <strong>{highRiskCount}</strong> người ({Math.round((highRiskCount / totalEvaluated) * 100)}%)
                </span>
              </div>
              <div className="risk-progress-track">
                <div
                  className="risk-progress-fill high"
                  style={{ width: `${(highRiskCount / totalEvaluated) * 100}%` }}
                />
              </div>
            </div>

            <div className="risk-bar-item moderate-item">
              <div className="risk-bar-labels">
                <span className="risk-name moderate">
                  <span className="risk-square moderate" />
                  Nguy cơ trung bình (Moderate)
                </span>
                <span className="risk-count">
                  <strong>{moderateRiskCount}</strong> người ({Math.round((moderateRiskCount / totalEvaluated) * 100)}%)
                </span>
              </div>
              <div className="risk-progress-track">
                <div
                  className="risk-progress-fill moderate"
                  style={{ width: `${(moderateRiskCount / totalEvaluated) * 100}%` }}
                />
              </div>
            </div>

            <div className="risk-bar-item low-item">
              <div className="risk-bar-labels">
                <span className="risk-name low">
                  <span className="risk-square low" />
                  Nguy cơ thấp (Low Risk)
                </span>
                <span className="risk-count">
                  <strong>{lowRiskCount}</strong> người ({Math.round((lowRiskCount / totalEvaluated) * 100)}%)
                </span>
              </div>
              <div className="risk-progress-track">
                <div
                  className="risk-progress-fill low"
                  style={{ width: `${(lowRiskCount / totalEvaluated) * 100}%` }}
                />
              </div>
            </div>

            <div className="risk-bar-item none-item">
              <div className="risk-bar-labels">
                <span className="risk-name none">
                  <span className="risk-square none" />
                  Chưa nạp hồ sơ khám
                </span>
                <span className="risk-count">
                  <strong>{noRiskCount}</strong> người ({Math.round((noRiskCount / totalEvaluated) * 100)}%)
                </span>
              </div>
              <div className="risk-progress-track">
                <div
                  className="risk-progress-fill none"
                  style={{ width: `${(noRiskCount / totalEvaluated) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="risk-card-footer">
            <Sparkles size={15} />
            <span>Mô hình Logistic Regression (UCI CKD 24 features) liên tục tính toán xác suất bệnh khi người dùng chat hoặc upload kết quả xét nghiệm.</span>
          </div>
        </div>

        {/* Quick System Status Card */}
        <div className="admin-card system-summary-card">
          <div className="admin-card-header">
            <div className="card-header-title">
              <div className="card-icon-tag blue">
                <Activity size={18} />
              </div>
              <div>
                <h4>Hạ tầng & Hệ sinh thái AI</h4>
                <small>Tình trạng các tiến trình kết nối</small>
              </div>
            </div>
          </div>

          <div className="system-status-list">
            <div className="status-row-item">
              <div className="status-item-icon">
                <Server size={17} />
              </div>
              <div className="status-info">
                <strong>Spring Boot Backend</strong>
                <small>Quản trị User, Hồ sơ khám, Security & Proxy</small>
              </div>
              <div className="status-pill-badge online">
                <span className="pulse-dot" />
                Hoạt động
              </div>
            </div>

            <div className="status-row-item">
              <div className="status-item-icon">
                <Cpu size={17} />
              </div>
              <div className="status-info">
                <strong>FastAPI RAG & ML Service</strong>
                <small>Cổng 8001 • OpenAI Embeddings & Clinical Parser</small>
              </div>
              <div className="status-pill-badge online">
                <span className="pulse-dot" />
                Hoạt động
              </div>
            </div>

            <div className="status-row-item">
              <div className="status-item-icon">
                <Sparkles size={17} />
              </div>
              <div className="status-info">
                <strong>CKD Machine Learning Pipeline</strong>
                <small>Scikit-learn • Độ chính xác 100% (UCI dataset)</small>
              </div>
              <div className="status-pill-badge active">
                <span className="pulse-dot active" />
                Sẵn sàng
              </div>
            </div>

            <div className="status-row-item">
              <div className="status-item-icon">
                <Database size={17} />
              </div>
              <div className="status-info">
                <strong>Database & Analytics Tracker</strong>
                <small>{stats?.totalUsers ?? 0} người dùng • {stats?.uniqueVisitors ?? 0} Unique Visitors</small>
              </div>
              <div className="status-pill-badge online">
                <span className="pulse-dot" />
                Đồng bộ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table with 10-item Pagination */}
      <div className="admin-card recent-activities-card">
        <div className="admin-card-header">
          <div className="card-header-title">
            <div className="card-icon-tag purple">
              <UserCheck size={18} />
            </div>
            <div>
              <h4>Hoạt động Hệ thống Gần đây</h4>
              <small>Nhật ký sự kiện đăng ký và tải lên hồ sơ xét nghiệm (10 dòng/trang)</small>
            </div>
          </div>
          <span className="card-badge">{totalActivities} sự kiện</span>
        </div>

        <div className="activities-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Loại sự kiện</th>
                <th>Mô tả hoạt động</th>
                <th>Tài khoản</th>
                <th>Đánh giá rủi ro</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {totalActivities === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">Chưa ghi nhận hoạt động nào trong hệ thống.</td>
                </tr>
              ) : (
                paginatedActivities.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <span className={`event-type-badge ${act.type}`}>
                        {act.type === 'USER_REGISTERED' ? (
                          <>
                            <UserCheck size={13} /> Đăng ký mới
                          </>
                        ) : (
                          <>
                            <FileText size={13} /> Tải hồ sơ
                          </>
                        )}
                      </span>
                    </td>
                    <td className="activity-desc-cell">
                      <strong>{act.title}</strong>
                      <p>{act.description}</p>
                    </td>
                    <td className="user-email-cell">
                      <span className="email-chip">{act.userEmail}</span>
                    </td>
                    <td>{getRiskBadge(act.riskLevel)}</td>
                    <td className="time-cell">{formatTimeAgo(act.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalActivities > 0 && (
          <div className="admin-pagination-footer">
            <div className="pagination-info">
              Hiển thị <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trên tổng số <strong>{totalActivities}</strong> hoạt động
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-nav-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                title="Trang trước"
              >
                <ChevronLeft size={16} />
                <span>Trước</span>
              </button>

              <div className="pagination-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`pagination-page-btn ${pageNum === validPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pagination-nav-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                title="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
