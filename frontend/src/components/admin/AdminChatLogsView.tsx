import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import type { AdminChatLogItem, AdminChatLogPage } from '../../types/admin'

type AdminChatLogsViewProps = {
  apiBaseUrl: string
}

export function AdminChatLogsView({ apiBaseUrl }: AdminChatLogsViewProps) {
  const [data, setData] = useState<AdminChatLogPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AdminChatLogItem | null>(null)

  useEffect(() => {
    let isMounted = true

    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('size', '10')
    if (searchQuery.trim()) {
      params.set('keyword', searchQuery.trim())
    }

    fetch(`${apiBaseUrl}/api/admin/chat-logs?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Không thể tải danh sách lịch sử hội thoại chatbox.')
        }
        return (await res.json()) as AdminChatLogPage
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData)
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
  }, [apiBaseUrl, currentPage, searchQuery])

  function handleRefresh() {
    setIsLoading(true)
    setError('')
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('size', '10')
    if (searchQuery.trim()) {
      params.set('keyword', searchQuery.trim())
    }

    fetch(`${apiBaseUrl}/api/admin/chat-logs?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Không thể tải danh sách lịch sử hội thoại chatbox.')
        }
        return (await res.json()) as AdminChatLogPage
      })
      .then((resData) => {
        setData(resData)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.')
        setIsLoading(false)
      })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1)
  }

  function formatDateTime(timeStr?: string | null) {
    if (!timeStr) return '-'
    try {
      const d = new Date(timeStr)
      return d.toLocaleString('vi-VN', {
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

  function getRiskBadge(level?: string | null) {
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
            Tham vấn chung
          </span>
        )
    }
  }

  function parseSources(sourcesJson?: string | null) {
    if (!sourcesJson) return []
    try {
      const parsed = JSON.parse(sourcesJson) as Array<{ title?: string; url?: string; docName?: string }>
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const logs = data?.items ?? []
  const totalItems = data?.totalItems ?? 0
  const totalPages = data?.totalPages ?? 1
  const startIndex = (currentPage - 1) * 10
  const endIndex = Math.min(startIndex + 10, totalItems)

  return (
    <div className="admin-chat-logs-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="header-title-group">
          <div className="page-icon-tag purple">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2>Lịch sử Hội thoại & Phản hồi AI Chatbox</h2>
            <p>Tra cứu chi tiết toàn bộ các câu hỏi từ người dùng và câu trả lời tư vấn sức khỏe thận do AI RAG cung cấp.</p>
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
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-banner error">
          <AlertTriangle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="admin-toolbar-card">
        <form className="admin-search-wrap" onSubmit={handleSearchSubmit}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo nội dung câu hỏi, câu trả lời, tên hoặc email người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              aria-label="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <span className="card-badge">Tổng {totalItems} lượt trao đổi</span>
      </div>

      {/* Chat Logs List Card */}
      <div className="admin-card chat-logs-card">
        <div className="admin-card-header">
          <div className="card-header-title">
            <div className="card-icon-tag purple">
              <Bot size={18} />
            </div>
            <div>
              <h4>Danh sách Câu hỏi & Phản hồi ({totalItems})</h4>
              <small>Phân trang 10 phiên hội thoại / 1 trang</small>
            </div>
          </div>
          <span className="card-badge">
            Trang {currentPage} / {totalPages}
          </span>
        </div>

        {isLoading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Đang tải lịch sử hội thoại...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="no-result-box">
            <MessageSquare size={36} />
            <p>Chưa có dữ liệu hội thoại nào phù hợp.</p>
          </div>
        ) : (
          <div className="chat-conversations-list">
            {logs.map((log) => {
              const sources = parseSources(log.sourcesJson)
              return (
                <div
                  key={log.id}
                  className="chat-conversation-card"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Card Top Meta */}
                  <div className="conversation-card-header">
                    <div className="user-sender-meta">
                      <div className="sender-avatar">
                        {log.userId ? <User size={15} /> : <Bot size={15} />}
                      </div>
                      <div className="sender-text-stack">
                        <strong>{log.userName}</strong>
                        <span className="sender-email">
                          <Mail size={11} /> {log.userEmail}
                        </span>
                      </div>
                    </div>

                    <div className="conversation-header-right">
                      {getRiskBadge(log.riskAssessment)}
                      <span className="conversation-time">
                        <Clock size={12} /> {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt Bubble */}
                  <div className="conversation-question-box">
                    <div className="prompt-label">
                      <User size={14} />
                      <span>Câu hỏi của người dùng:</span>
                    </div>
                    <p className="question-text">{log.userMessage}</p>
                  </div>

                  {/* Assistant Answer Box */}
                  <div className="conversation-answer-box">
                    <div className="answer-label">
                      <Sparkles size={14} />
                      <span>Phản hồi từ RenalCareAI:</span>
                    </div>
                    <p className="answer-text">{log.assistantAnswer}</p>
                  </div>

                  {/* Sources Preview */}
                  {sources.length > 0 && (
                    <div className="conversation-sources-bar">
                      <BookOpen size={13} />
                      <span>Nguồn tài liệu trích xuất ({sources.length}):</span>
                      <div className="sources-chips">
                        {sources.map((s, idx) => (
                          <span key={idx} className="source-chip">
                            {s.title || s.docName || 'Y văn tham khảo'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="admin-pagination-footer">
            <div className="pagination-info">
              Hiển thị <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trên tổng số <strong>{totalItems}</strong> phiên hội thoại
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-nav-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
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
                    className={`pagination-page-btn ${pageNum === currentPage ? 'active' : ''}`}
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
                disabled={currentPage >= totalPages}
                title="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Dialogue Modal */}
      {selectedLog && (
        <div className="admin-modal-overlay" onClick={() => setSelectedLog(null)} role="dialog">
          <div className="admin-modal-container chat-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <div className="modal-title-icon">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3>Chi tiết Phiên Hội thoại AI #{selectedLog.id}</h3>
                  <small>Thời gian: {formatDateTime(selectedLog.createdAt)}</small>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedLog(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="chat-detail-header-card">
                <div className="sender-avatar large">
                  {selectedLog.userId ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div>
                  <h4>{selectedLog.userName}</h4>
                  <span className="user-email">{selectedLog.userEmail}</span>
                </div>
                <div className="modal-header-badge">
                  {getRiskBadge(selectedLog.riskAssessment)}
                </div>
              </div>

              <div className="chat-dialogue-flow">
                <div className="dialogue-bubble user-bubble">
                  <div className="bubble-header">
                    <User size={15} />
                    <strong>Câu hỏi của người dùng</strong>
                  </div>
                  <p className="bubble-body">{selectedLog.userMessage}</p>
                </div>

                <div className="dialogue-bubble assistant-bubble">
                  <div className="bubble-header">
                    <Sparkles size={15} />
                    <strong>Trợ lý AI RenalCareAI</strong>
                  </div>
                  <div className="bubble-body markdown-answer">
                    {selectedLog.assistantAnswer.split('\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {parseSources(selectedLog.sourcesJson).length > 0 && (
                    <div className="dialogue-sources-box">
                      <h6>Nguồn dữ liệu y khoa tham chiếu:</h6>
                      <ul>
                        {parseSources(selectedLog.sourcesJson).map((src, sIdx) => (
                          <li key={sIdx}>
                            <strong>{src.title || src.docName || 'Tài liệu KDIGO / Phác đồ'}</strong>
                            {src.url && (
                              <a href={src.url} target="_blank" rel="noreferrer">
                                [Xem nguồn]
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
