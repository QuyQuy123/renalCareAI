import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity,
  BotMessageSquare,
  CheckCircle2,
  ChevronRight,
  FileText,
  HeartPulse,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserPlus,
  Utensils,
} from 'lucide-react'
import heroImage from './assets/renal-hero.png'
import './App.css'

type AuthMode = 'login' | 'register'

type UserSession = {
  id: number
  fullName: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
}

type ApiError = {
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const SESSION_KEY = 'renalcareai_user'

const careCards = [
  {
    icon: FileText,
    title: 'Đọc kết quả khám',
    text: 'Tổng hợp các chỉ số quan trọng như creatinine, eGFR, đường huyết, huyết áp và nước tiểu từ hồ sơ của bạn.',
  },
  {
    icon: HeartPulse,
    title: 'Ước tính nguy cơ',
    text: 'Phân loại mức độ cần lưu ý và giải thích các tín hiệu sức khỏe thận bằng ngôn ngữ dễ hiểu.',
  },
  {
    icon: Utensils,
    title: 'Gợi ý chăm sóc',
    text: 'Đề xuất món ăn, vận động, nhắc thuốc và thói quen hằng ngày theo hướng hỗ trợ an toàn.',
  },
]

const indicators = ['eGFR', 'Creatinine', 'Huyết áp', 'Đạm niệu']

async function requestAuth(path: string, payload: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(error.message ?? 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
  }

  return (await response.json()) as UserSession
}

function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const rawSession = localStorage.getItem(SESSION_KEY)
    if (!rawSession) {
      return null
    }

    try {
      return JSON.parse(rawSession) as UserSession
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  })
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const firstName = useMemo(() => user?.fullName.trim().split(/\s+/).at(-1), [user])

  function openAuth(mode: AuthMode) {
    setAuthMode(mode)
    setAuthError('')
    setAuthSuccess('')
    setIsAuthOpen(true)
  }

  function closeAuth() {
    setIsAuthOpen(false)
    setAuthError('')
    setAuthSuccess('')
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setIsSubmitting(true)

    try {
      const payload: Record<string, string> =
        authMode === 'register'
          ? { fullName: fullName.trim(), email: email.trim(), password }
          : { email: email.trim(), password }

      const session = await requestAuth(
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login',
        payload,
      )

      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      setAuthSuccess(authMode === 'register' ? 'Đăng ký thành công.' : 'Đăng nhập thành công.')
      setPassword('')
      setTimeout(closeAuth, 450)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Có lỗi xảy ra.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="home-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Trang chủ RenalCareAI">
          <span className="brand-mark">
            <HeartPulse size={24} strokeWidth={2.2} />
          </span>
          <span>RenalCareAI</span>
        </a>

        <nav className="main-nav" aria-label="Điều hướng chính">
          <a href="#risk">Đánh giá nguy cơ</a>
          <a href="#care">Chăm sóc thận</a>
          <a href="#records">Hồ sơ sức khỏe</a>
        </nav>

        <div className="auth-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-chip" title={user.email}>
                <span className="user-avatar">{firstName?.charAt(0).toUpperCase() ?? 'U'}</span>
                <span>{firstName ?? user.fullName}</span>
              </span>
              <button className="ghost-button" type="button" onClick={logout}>
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <button className="ghost-button" type="button" onClick={() => openAuth('login')}>
                <LogIn size={18} />
                Đăng nhập
              </button>
              <button className="primary-small-button" type="button" onClick={() => openAuth('register')}>
                <UserPlus size={18} />
                Đăng ký
              </button>
            </>
          )}
        </div>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={16} />
            Trợ lý chăm sóc thận cá nhân
          </p>
          <h1>Hiểu sớm sức khỏe thận, chăm sóc đúng cách mỗi ngày.</h1>
          <p className="hero-lede">
            RenalCareAI giúp bạn hỏi đáp về bệnh thận, tải hồ sơ khám sau khi
            đăng nhập, xem dấu hiệu nguy cơ và nhận gợi ý ăn uống, luyện tập,
            uống thuốc theo hướng hỗ trợ an toàn.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => (user ? undefined : openAuth('login'))}>
              {user ? 'Tải hồ sơ khám' : 'Đăng nhập để tải hồ sơ'}
              <ChevronRight size={18} />
            </button>
            <button className="secondary-button" type="button" onClick={() => setIsChatOpen(true)}>
              <MessageCircle size={18} />
              Hỏi đáp ngay
            </button>
          </div>

          <div className="trust-row" aria-label="Điểm nổi bật của hệ thống">
            <span>
              <ShieldCheck size={17} />
              Bảo vệ hồ sơ cá nhân
            </span>
            <span>
              <CheckCircle2 size={17} />
              Giải thích dễ hiểu
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <img src={heroImage} alt="Người dùng xem bảng sức khỏe thận trên máy tính bảng" />
          <div className="risk-widget" id="risk">
            <span className="widget-label">Theo dõi nguy cơ</span>
            <strong>Cần quan sát</strong>
            <div className="risk-meter" aria-hidden="true">
              <span></span>
            </div>
            <p>Kết quả mang tính tham khảo và nên được đối chiếu với bác sĩ.</p>
          </div>
        </div>
      </section>

      <section className="insight-strip" aria-label="Chỉ số sức khỏe thận">
        {indicators.map((item) => (
          <div className="indicator" key={item}>
            <Activity size={18} />
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="section-block" id="care">
        <div className="section-heading">
          <p className="eyebrow">Một hành trình rõ ràng</p>
          <h2>Từ hồ sơ khám đến kế hoạch chăm sóc cá nhân</h2>
        </div>

        <div className="care-grid">
          {careCards.map(({ icon: Icon, title, text }) => (
            <article className="care-card" key={title}>
              <div className="card-icon">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="records-panel" id="records">
        <div>
          <p className="eyebrow">Dành cho người đã đăng nhập</p>
          <h2>Tải lên hồ sơ khám để hệ thống hỗ trợ đánh giá.</h2>
          <p>
            Bạn có thể tải kết quả xét nghiệm, đơn thuốc hoặc tóm tắt khám.
            Hệ thống sẽ ưu tiên bảo mật dữ liệu và hiển thị các khuyến nghị theo
            từng nhóm như ăn uống, luyện tập, nhắc thuốc và tái khám.
          </p>
        </div>
        <button className="upload-card" type="button" onClick={() => (user ? undefined : openAuth('login'))}>
          <UploadCloud size={30} />
          <span>{user ? 'Sẵn sàng tải hồ sơ' : 'Đăng nhập để tải hồ sơ'}</span>
          <small>
            {user
              ? 'Chọn file PDF hoặc ảnh kết quả khám ở bước tiếp theo'
              : 'Tài khoản giúp bảo vệ dữ liệu sức khỏe của bạn'}
          </small>
        </button>
      </section>

      <footer className="site-footer">
        <span>RenalCareAI</span>
        <p>Thông tin trên hệ thống chỉ dùng để hỗ trợ tham khảo, không thay thế chẩn đoán y khoa.</p>
      </footer>

      <div className={`chat-panel ${isChatOpen ? 'open' : ''}`} aria-live="polite">
        <div className="chat-header">
          <span>
            <BotMessageSquare size={18} />
            RenalCare Assistant
          </span>
          <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Đóng chat">
            x
          </button>
        </div>
        <div className="chat-body">
          <p>Xin chào, bạn muốn hỏi về dấu hiệu bệnh thận, chỉ số xét nghiệm hay cách ăn uống?</p>
        </div>
        <form className="chat-input">
          <input aria-label="Nhập câu hỏi về sức khỏe thận" placeholder="Nhập câu hỏi..." />
          <button type="button">Gửi</button>
        </form>
      </div>

      <button
        className="chat-fab"
        type="button"
        aria-label="Mở hộp chat sức khỏe thận"
        onClick={() => setIsChatOpen((value) => !value)}
      >
        <MessageCircle size={26} />
      </button>

      {isAuthOpen && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={closeAuth}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="auth-modal-copy">
              <span className="auth-badge">
                <LockKeyhole size={16} />
                Bảo mật tài khoản
              </span>
              <h2 id="auth-title">{authMode === 'register' ? 'Tạo tài khoản RenalCareAI' : 'Đăng nhập RenalCareAI'}</h2>
              <p>
                Đăng nhập bằng email để lưu hồ sơ khám, theo dõi nguy cơ và nhận
                gợi ý chăm sóc phù hợp hơn.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Họ và tên
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh An"
                    required
                    maxLength={120}
                  />
                </label>
              )}

              <label>
                Email
                <span className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </span>
              </label>

              <label>
                Mật khẩu
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={authMode === 'register' ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'}
                  required
                  minLength={authMode === 'register' ? 8 : undefined}
                />
              </label>

              {authError && <p className="auth-message error">{authError}</p>}
              {authSuccess && <p className="auth-message success">{authSuccess}</p>}

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : authMode === 'register' ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              <button type="button" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>
                {authMode === 'register' ? 'Đăng nhập' : 'Đăng ký mới'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
