import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  X,
  Zap,
} from 'lucide-react'
import type { AdminUserDetail } from '../../types/admin'

type UserDossierModalProps = {
  userId: number
  apiBaseUrl: string
  onClose: () => void
}

export function UserDossierModal({ userId, apiBaseUrl, onClose }: UserDossierModalProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    fetch(`${apiBaseUrl}/api/admin/users/${userId}/dossier`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Không thể tải thông tin hồ sơ người dùng.')
        }
        return (await response.json()) as AdminUserDetail
      })
      .then((data) => {
        if (isMounted) {
          setDetail(data)
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
  }, [userId, apiBaseUrl])

  function getRiskBadge(level?: string) {
    switch (level?.toUpperCase()) {
      case 'HIGH':
        return (
          <span className="admin-risk-badge high large">
            <span className="risk-dot" />
            <ShieldAlert size={14} /> Nguy cơ cao (High Risk)
          </span>
        )
      case 'MODERATE':
        return (
          <span className="admin-risk-badge moderate large">
            <span className="risk-dot" />
            <AlertTriangle size={14} /> Nguy cơ trung bình (Moderate Risk)
          </span>
        )
      case 'LOW':
        return (
          <span className="admin-risk-badge low large">
            <span className="risk-dot" />
            <CheckCircle2 size={14} /> Nguy cơ thấp (Low Risk)
          </span>
        )
      default:
        return (
          <span className="admin-risk-badge none large">
            <span className="risk-dot" />
            Chưa đủ dữ liệu phân loại
          </span>
        )
    }
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return 'Chưa cập nhật'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  function formatDateTime(dateTimeStr?: string | null) {
    if (!dateTimeStr) return 'Chưa cập nhật'
    try {
      const d = new Date(dateTimeStr)
      return d.toLocaleString('vi-VN')
    } catch {
      return dateTimeStr
    }
  }

  function getUnitForIndicator(key: string): string {
    const k = key.toLowerCase()
    if (k.includes('egfr')) return 'mL/min/1.73m²'
    if (k.includes('creatinine') || k === 'sc') return 'mg/dL'
    if (k.includes('uacr') || k.includes('albumin')) return 'mg/g'
    if (k.includes('bloodpressure') || k.includes('bp') || k.includes('systolic') || k.includes('diastolic')) return 'mmHg'
    if (k.includes('glucose') || k.includes('bgr') || k.includes('sugar')) return 'mg/dL'
    if (k.includes('urea') || k.includes('bu')) return 'mg/dL'
    if (k.includes('potassium') || k === 'pot') return 'mEq/L'
    if (k.includes('sodium') || k === 'sod') return 'mEq/L'
    if (k.includes('hemoglobin') || k === 'hemo') return 'g/dL'
    return ''
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <div className="modal-title-icon">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3>Hồ sơ Y khoa & Đánh giá Dự đoán Bệnh Thận</h3>
              <small>Mã định danh thành viên: #{userId} • Tích hợp phân tích KFRE & AI Logistic Regression</small>
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="admin-modal-body">
          {isLoading && (
            <div className="admin-loading-state">
              <div className="admin-spinner" />
              <p>Đang tải dữ liệu hồ sơ và tổng hợp phân tích sức khỏe...</p>
            </div>
          )}

          {error && (
            <div className="admin-error-state">
              <AlertTriangle size={24} />
              <p>{error}</p>
            </div>
          )}

          {detail && (
            <div className="admin-dossier-content">
              {/* Patient Identity Profile Card */}
              <div className="admin-dossier-card user-info-card">
                <div className="dossier-user-header">
                  <div className={`user-avatar-circle ${detail.role === 'ADMIN' ? 'admin' : ''}`}>
                    {detail.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-header-meta">
                    <h4>{detail.fullName}</h4>
                    <span className="user-email">
                      <Mail size={13} /> {detail.email}
                    </span>
                  </div>
                  <div className="user-role-badge">
                    {detail.role === 'ADMIN' ? (
                      <>
                        <ShieldCheck size={13} /> Quản trị viên
                      </>
                    ) : (
                      <>
                        <User size={13} /> Bệnh nhân / Người dùng
                      </>
                    )}
                  </div>
                </div>

                <div className="user-info-grid">
                  <div className="info-item">
                    <Phone size={15} />
                    <div>
                      <small>Số điện thoại</small>
                      <p>{detail.phoneNumber || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <Calendar size={15} />
                    <div>
                      <small>Ngày sinh</small>
                      <p>{formatDate(detail.dateOfBirth)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <User size={15} />
                    <div>
                      <small>Giới tính</small>
                      <p>{detail.gender || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <MapPin size={15} />
                    <div>
                      <small>Địa chỉ</small>
                      <p>{detail.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                {detail.healthNote && (
                  <div className="user-health-note">
                    <div className="health-note-title">
                      <FileCheck size={14} />
                      <span>Ghi chú tiền sử / bệnh nền từ người dùng:</span>
                    </div>
                    <p>{detail.healthNote}</p>
                  </div>
                )}
              </div>

              {/* Prediction & AI Risk Assessment Card */}
              <div className="admin-dossier-card risk-assessment-card">
                <div className="dossier-card-title">
                  <HeartPulse size={18} />
                  <h5>Đánh giá & Dự đoán Nguy cơ Bệnh Thận (AI & Machine Learning)</h5>
                </div>

                <div className="risk-overview-strip">
                  <div className="risk-score-box">
                    <div className="score-ring">
                      <span className="score-num">{detail.aggregateRiskScore ?? 0}</span>
                      <span className="score-total">/100</span>
                    </div>
                    <span className="score-desc">Điểm nguy cơ tổng hợp</span>
                  </div>

                  <div className="risk-status-box">
                    <div className="status-label">
                      <span>Phân nhóm nguy cơ:</span>
                      {getRiskBadge(detail.aggregateRiskLevel)}
                    </div>
                    <p className="status-summary">{detail.aggregateSummary}</p>
                  </div>
                </div>

                {/* Clinical indicators extracted grid */}
                {detail.latestClinicalIndicators && Object.keys(detail.latestClinicalIndicators).length > 0 && (
                  <div className="clinical-indicators-box">
                    <div className="indicators-box-header">
                      <Sparkles size={14} />
                      <h6>Các chỉ số lâm sàng bóc tách được từ hồ sơ:</h6>
                    </div>
                    <div className="indicator-chips-grid">
                      {Object.entries(detail.latestClinicalIndicators).map(([key, val]) => (
                        <div className="indicator-chip" key={key}>
                          <span className="ind-name">{key}</span>
                          <span className="ind-val">{val}</span>
                          {getUnitForIndicator(key) && (
                            <span className="ind-unit">{getUnitForIndicator(key)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical findings */}
                {detail.clinicalFindings && detail.clinicalFindings.length > 0 && (
                  <div className="findings-box">
                    <h6>
                      <Activity size={15} /> Nhận định y khoa & Bất thường phát hiện:
                    </h6>
                    <ul>
                      {detail.clinicalFindings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clinical recommendations */}
                {detail.recommendations && detail.recommendations.length > 0 && (
                  <div className="recommendations-box">
                    <h6>
                      <Zap size={15} /> Khuyến nghị theo dõi lâm sàng & Can thiệp:
                    </h6>
                    <ul>
                      {detail.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Uploaded Medical Records List */}
              <div className="admin-dossier-card medical-records-card">
                <div className="dossier-card-title">
                  <FileText size={18} />
                  <h5>Lịch sử Toàn bộ Hồ sơ khám đã nạp ({detail.medicalRecords.length})</h5>
                </div>

                {detail.medicalRecords.length === 0 ? (
                  <div className="no-records-box">
                    <FileText size={28} />
                    <p>Người dùng này chưa tải lên hồ sơ xét nghiệm nào.</p>
                  </div>
                ) : (
                  <div className="dossier-records-list">
                    {detail.medicalRecords.map((rec) => (
                      <div className="dossier-record-row" key={rec.id}>
                        <div className="record-icon">
                          <FileText size={18} />
                        </div>
                        <div className="record-meta">
                          <h6>{rec.originalFileName}</h6>
                          <div className="record-sub">
                            <span>Thời gian tải: {formatDateTime(rec.uploadedAt)}</span>
                            <span>Dung lượng: {(rec.fileSize / 1024).toFixed(1)} KB</span>
                            <span className="record-status-pill">{rec.status}</span>
                          </div>
                          {rec.riskSummary && (
                            <p className="record-risk-note">{rec.riskSummary}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
