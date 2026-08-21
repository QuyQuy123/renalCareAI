import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import {
  Activity,
  BotMessageSquare,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderOpen,
  HeartPulse,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  X,
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
  phoneNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  healthNote?: string | null
}

type ApiError = {
  message?: string
}

type ChatSource = {
  title: string
  url: string
  publisher?: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
}

type ProfileForm = {
  fullName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  address: string
  healthNote: string
}

type MedicalRecord = {
  id: number
  originalFileName: string
  contentType?: string | null
  fileSize: number
  status: 'UPLOADED' | 'PENDING_ANALYSIS' | 'ANALYZED' | 'FAILED'
  riskSummary?: string | null
  uploadedAt: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const SESSION_KEY = 'renalcareai_user'
const sectionRoutes: Record<string, string> = {
  '/risk': 'risk',
  '/care': 'care',
  '/records': 'records',
}

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

async function requestUserProfile(userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`)

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(error.message ?? 'Không thể tải thông tin cá nhân.')
  }

  return (await response.json()) as UserSession
}

function createChatId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createProfileForm(user: UserSession): ProfileForm {
  return {
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? '',
    dateOfBirth: user.dateOfBirth ?? '',
    gender: user.gender ?? '',
    address: user.address ?? '',
    healthNote: user.healthNote ?? '',
  }
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRecordsOpen, setIsRecordsOpen] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(() => (user ? createProfileForm(user) : null))
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [recordsError, setRecordsError] = useState('')
  const [recordsMessage, setRecordsMessage] = useState('')
  const [isRecordsLoading, setIsRecordsLoading] = useState(false)
  const [isRecordUploading, setIsRecordUploading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isChatStreaming, setIsChatStreaming] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào, mình là trợ lý RenalCareAI. Bạn có thể hỏi về dấu hiệu bệnh thận, chỉ số xét nghiệm, ăn uống, luyện tập hoặc cách chuẩn bị khi đi khám.',
    },
  ])

  const firstName = useMemo(() => user?.fullName.trim().split(/\s+/).at(-1), [user])
  const shouldShowSuggestions = chatMessages.length === 1 && !isChatLoading && !isChatStreaming

  useEffect(() => {
    function scrollToCurrentPath() {
      const sectionId = sectionRoutes[window.location.pathname]
      if (!sectionId) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    scrollToCurrentPath()
    window.addEventListener('popstate', scrollToCurrentPath)
    return () => window.removeEventListener('popstate', scrollToCurrentPath)
  }, [])

  function navigateToPath(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault()
    window.history.pushState({}, '', path)

    const sectionId = sectionRoutes[path]
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    setProfileForm(null)
    setIsUserMenuOpen(false)
    setIsProfileOpen(false)
    setIsRecordsOpen(false)
  }

  async function openProfile() {
    if (!user) {
      openAuth('login')
      return
    }
    setProfileForm(createProfileForm(user))
    setProfileMessage('')
    setProfileError('')
    setIsUserMenuOpen(false)
    setIsProfileOpen(true)

    try {
      const latestProfile = await requestUserProfile(user.id)
      localStorage.setItem(SESSION_KEY, JSON.stringify(latestProfile))
      setUser(latestProfile)
      setProfileForm(createProfileForm(latestProfile))
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Không thể tải thông tin cá nhân.')
    }
  }

  async function openRecords() {
    if (!user) {
      openAuth('login')
      return
    }
    setIsUserMenuOpen(false)
    setIsRecordsOpen(true)
    await loadMedicalRecords(user.id)
  }

  async function loadMedicalRecords(userId: number) {
    setRecordsError('')
    setRecordsMessage('')
    setIsRecordsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/medical-records`)
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiError
        throw new Error(error.message ?? 'Không thể tải danh sách hồ sơ khám.')
      }
      setMedicalRecords((await response.json()) as MedicalRecord[])
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'Không thể tải danh sách hồ sơ khám.')
    } finally {
      setIsRecordsLoading(false)
    }
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
      const profile = await requestUserProfile(session.id).catch(() => session)

      localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
      setUser(profile)
      setProfileForm(createProfileForm(profile))
      setAuthSuccess(authMode === 'register' ? 'Đăng ký thành công.' : 'Đăng nhập thành công.')
      setPassword('')
      setTimeout(closeAuth, 450)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Có lỗi xảy ra.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = chatInput.trim()
    if (!message || isChatLoading || isChatStreaming) {
      return
    }

    const userMessage: ChatMessage = {
      id: createChatId(),
      role: 'user',
      content: message,
    }
    const nextMessages = [...chatMessages, userMessage]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatError('')
    setIsChatLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: chatMessages
            .filter((item) => item.role === 'user' || item.role === 'assistant')
            .slice(-8)
            .map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { detail?: string; message?: string }
        throw new Error(error.message ?? error.detail ?? 'Chatbox chưa sẵn sàng. Vui lòng thử lại sau.')
      }

      const data = (await response.json()) as { answer: string; sources?: ChatSource[] }
      await revealAssistantAnswer(data.answer, data.sources)
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : 'Không thể kết nối trợ lý AI. Vui lòng kiểm tra RAG service.'
      setChatError(messageText)
    } finally {
      setIsChatLoading(false)
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !profileForm) {
      return
    }

    setProfileError('')
    setProfileMessage('')
    setIsProfileSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiError
        throw new Error(error.message ?? 'Không thể cập nhật thông tin cá nhân.')
      }

      const updatedUser = (await response.json()) as UserSession
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
      setUser(updatedUser)
      setProfileForm(createProfileForm(updatedUser))
      setProfileMessage('Đã cập nhật thông tin cá nhân.')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Không thể cập nhật thông tin cá nhân.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  async function handleRecordUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      openAuth('login')
      return
    }

    const form = event.currentTarget
    const fileInput = form.elements.namedItem('recordFile') as HTMLInputElement | null
    const file = fileInput?.files?.[0]
    if (!file) {
      setRecordsError('Vui lòng chọn file hồ sơ khám.')
      return
    }

    setRecordsError('')
    setRecordsMessage('')
    setIsRecordUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/medical-records`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiError
        throw new Error(error.message ?? 'Không thể tải hồ sơ khám.')
      }

      const record = (await response.json()) as MedicalRecord
      setMedicalRecords((current) => [record, ...current])
      setRecordsMessage('Đã tải hồ sơ khám. Hệ thống sẽ dùng hồ sơ này cho bước phân tích nguy cơ.')
      form.reset()
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'Không thể tải hồ sơ khám.')
    } finally {
      setIsRecordUploading(false)
    }
  }

  async function revealAssistantAnswer(answer: string, sources?: ChatSource[]) {
    const assistantId = createChatId()
    const characters = Array.from(answer)

    setIsChatLoading(false)
    setIsChatStreaming(true)
    setChatMessages((current) => [
      ...current,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
      },
    ])

    for (let index = 0; index < characters.length; index += 3) {
      const nextContent = characters.slice(0, index + 3).join('')
      setChatMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: nextContent } : item)),
      )
      await new Promise((resolve) => setTimeout(resolve, 14))
    }

    setChatMessages((current) =>
      current.map((item) =>
        item.id === assistantId
          ? {
              ...item,
              content: answer,
              sources,
            }
          : item,
      ),
    )
    setIsChatStreaming(false)
  }

  return (
    <main className="home-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Trang chủ RenalCareAI" onClick={(event) => navigateToPath(event, '/')}>
          <span className="brand-mark">
            <HeartPulse size={24} strokeWidth={2.2} />
          </span>
          <span>RenalCareAI</span>
        </a>

        <nav className="main-nav" aria-label="Điều hướng chính">
          <a href="/risk" onClick={(event) => navigateToPath(event, '/risk')}>Đánh giá nguy cơ</a>
          <a href="/care" onClick={(event) => navigateToPath(event, '/care')}>Chăm sóc thận</a>
          <a href="/records" onClick={(event) => navigateToPath(event, '/records')}>Hồ sơ sức khỏe</a>
        </nav>

        <div className="auth-actions">
          {user ? (
            <div className="user-menu">
              <button
                className="user-chip"
                type="button"
                title={user.email}
                onClick={() => setIsUserMenuOpen((value) => !value)}
              >
                <span className="user-avatar">{firstName?.charAt(0).toUpperCase() ?? 'U'}</span>
                <span>{firstName ?? user.fullName}</span>
                <ChevronRight size={15} className={isUserMenuOpen ? 'menu-chevron open' : 'menu-chevron'} />
              </button>
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <button type="button" onClick={openProfile}>
                    <Settings size={17} />
                    Thông tin cá nhân
                  </button>
                  <button type="button" onClick={openRecords}>
                    <FolderOpen size={17} />
                    Hồ sơ khám
                  </button>
                </div>
              )}
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
        <button className="upload-card" type="button" onClick={() => (user ? openRecords() : openAuth('login'))}>
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
          <div>
            <span>
              <BotMessageSquare size={18} />
              Trợ lý RenalCareAI
            </span>
            <small>Hỏi đáp sức khỏe thận có nguồn tham khảo</small>
          </div>
          <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Đóng chat">
            <X size={18} />
          </button>
        </div>

        <div className="chat-status-row">
          <span>
            <Stethoscope size={15} />
            Tham khảo y khoa
          </span>
          <span>RAG + OpenAI</span>
        </div>

        <div className="chat-body">
          {chatMessages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <p>{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="chat-sources" aria-label="Nguồn tham khảo">
                  {message.sources.slice(0, 3).map((source) => (
                    <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                      {source.publisher ?? source.title}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
          {isChatLoading && (
            <div className="chat-message assistant loading">
              <Loader2 size={18} className="spin" />
              <span>Đang tìm thông tin phù hợp...</span>
            </div>
          )}
        </div>

        {shouldShowSuggestions && (
          <div className="chat-suggestions" aria-label="Gợi ý câu hỏi">
            {['eGFR thấp có nghĩa là gì?', 'Ăn gì để hỗ trợ thận?', 'Khi nào nên đi khám?'].map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => setChatInput(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {chatError && <p className="chat-error">{chatError}</p>}

        <form className="chat-input" onSubmit={handleChatSubmit}>
          <input
            aria-label="Nhập câu hỏi về sức khỏe thận"
            placeholder="Nhập câu hỏi về sức khỏe thận..."
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
          />
          <button type="submit" disabled={isChatLoading || isChatStreaming || !chatInput.trim()} aria-label="Gửi câu hỏi">
            {isChatLoading || isChatStreaming ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
        <p className="chat-disclaimer">Thông tin chỉ để tham khảo, không thay thế chẩn đoán hoặc chỉ định của bác sĩ.</p>
      </div>

      <button
        className="chat-fab"
        type="button"
        aria-label="Mở hộp chat sức khỏe thận"
        onClick={() => setIsChatOpen((value) => !value)}
      >
        <MessageCircle size={26} />
      </button>

      {isProfileOpen && profileForm && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setIsProfileOpen(false)}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-modal-header">
              <div>
                <span className="auth-badge">
                  <Settings size={16} />
                  Tài khoản
                </span>
                <h2 id="profile-title">Thông tin cá nhân</h2>
                <p>Cập nhật thông tin để hệ thống hỗ trợ chăm sóc thận phù hợp hơn.</p>
              </div>
              <button type="button" onClick={() => setIsProfileOpen(false)} aria-label="Đóng thông tin cá nhân">
                <X size={18} />
              </button>
            </div>

            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <label>
                Họ và tên
                <input
                  value={profileForm.fullName}
                  onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                  required
                  maxLength={160}
                />
              </label>
              <label>
                Số điện thoại
                <input
                  value={profileForm.phoneNumber}
                  onChange={(event) => setProfileForm({ ...profileForm, phoneNumber: event.target.value })}
                  maxLength={30}
                  placeholder="Ví dụ: 0901234567"
                />
              </label>
              <label>
                Ngày sinh
                <input
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(event) => setProfileForm({ ...profileForm, dateOfBirth: event.target.value })}
                />
              </label>
              <label>
                Giới tính
                <select value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })}>
                  <option value="">Chưa chọn</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
              <label>
                Địa chỉ
                <input
                  value={profileForm.address}
                  onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })}
                  maxLength={255}
                />
              </label>
              <label className="profile-wide">
                Ghi chú sức khỏe
                <textarea
                  value={profileForm.healthNote}
                  onChange={(event) => setProfileForm({ ...profileForm, healthNote: event.target.value })}
                  maxLength={1000}
                  placeholder="Ví dụ: tiền sử tăng huyết áp, tiểu đường, thuốc đang dùng..."
                />
              </label>

              {profileError && <p className="auth-message error profile-wide">{profileError}</p>}
              {profileMessage && <p className="auth-message success profile-wide">{profileMessage}</p>}

              <button className="auth-submit profile-wide" type="submit" disabled={isProfileSaving}>
                <Save size={18} />
                {isProfileSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>
          </section>
        </div>
      )}

      {isRecordsOpen && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setIsRecordsOpen(false)}>
          <section className="account-modal records-modal" role="dialog" aria-modal="true" aria-labelledby="records-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-modal-header">
              <div>
                <span className="auth-badge">
                  <FolderOpen size={16} />
                  Hồ sơ sức khỏe
                </span>
                <h2 id="records-title">Hồ sơ khám</h2>
                <p>Lưu lại các lần tải hồ sơ khám để chuẩn bị cho bước phân tích nguy cơ bệnh thận.</p>
              </div>
              <button type="button" onClick={() => setIsRecordsOpen(false)} aria-label="Đóng hồ sơ khám">
                <X size={18} />
              </button>
            </div>

            <form className="record-upload-form" onSubmit={handleRecordUpload}>
              <label>
                Tải hồ sơ khám
                <input name="recordFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" />
              </label>
              <button className="auth-submit" type="submit" disabled={isRecordUploading}>
                <UploadCloud size={18} />
                {isRecordUploading ? 'Đang tải...' : 'Tải lên'}
              </button>
            </form>

            {recordsError && <p className="auth-message error">{recordsError}</p>}
            {recordsMessage && <p className="auth-message success">{recordsMessage}</p>}

            <div className="records-list">
              {isRecordsLoading ? (
                <div className="records-empty">
                  <Loader2 size={20} className="spin" />
                  Đang tải hồ sơ...
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="records-empty">Bạn chưa tải hồ sơ khám nào.</div>
              ) : (
                medicalRecords.map((record) => (
                  <article className="record-item" key={record.id}>
                    <div>
                      <strong>{record.originalFileName}</strong>
                      <span>{formatDateTime(record.uploadedAt)} · {formatFileSize(record.fileSize)}</span>
                      <p>{record.riskSummary ?? 'Đang chờ phân tích.'}</p>
                    </div>
                    <small>{record.status === 'PENDING_ANALYSIS' ? 'Chờ phân tích' : record.status}</small>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

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
