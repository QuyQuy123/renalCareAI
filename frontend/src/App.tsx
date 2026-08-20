import { useState } from 'react'
import {
  Activity,
  BotMessageSquare,
  CheckCircle2,
  ChevronRight,
  FileText,
  HeartPulse,
  LogIn,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Utensils,
} from 'lucide-react'
import heroImage from './assets/renal-hero.png'
import './App.css'

const careCards = [
  {
    icon: FileText,
    title: 'Doc ket qua kham',
    text: 'Tong hop chi so creatinine, eGFR, duong huyet, huyet ap va nuoc tieu tu ho so cua ban.',
  },
  {
    icon: HeartPulse,
    title: 'Uoc tinh nguy co',
    text: 'Phan loai muc do can luu y va giai thich cac tin hieu suc khoe than bang ngon ngu de hieu.',
  },
  {
    icon: Utensils,
    title: 'Goi y cham soc',
    text: 'De xuat mon an, van dong, nhac thuoc va thoi quen hang ngay phu hop voi tinh trang ca nhan.',
  },
]

const indicators = ['eGFR', 'Creatinine', 'Huyet ap', 'Dam nieu']

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <main className="home-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="RenalCareAI homepage">
          <span className="brand-mark">
            <HeartPulse size={24} strokeWidth={2.2} />
          </span>
          <span>RenalCareAI</span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#risk">Danh gia nguy co</a>
          <a href="#care">Cham soc than</a>
          <a href="#records">Ho so suc khoe</a>
        </nav>

        <div className="auth-actions">
          {isLoggedIn ? (
            <button className="ghost-button" type="button" onClick={() => setIsLoggedIn(false)}>
              <LogOut size={18} />
              Log out
            </button>
          ) : (
            <button className="ghost-button" type="button" onClick={() => setIsLoggedIn(true)}>
              <LogIn size={18} />
              Login
            </button>
          )}
        </div>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={16} />
            Tro ly cham soc than ca nhan
          </p>
          <h1>Hieu som suc khoe than, cham soc dung cach moi ngay.</h1>
          <p className="hero-lede">
            RenalCareAI giup ban hoi dap ve benh than, tai ho so kham benh sau khi
            dang nhap, xem dau hieu nguy co va nhan goi y an uong, luyen tap,
            dung thuoc theo huong ho tro an toan.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#records">
              Tai ho so kham
              <ChevronRight size={18} />
            </a>
            <button className="secondary-button" type="button" onClick={() => setIsChatOpen(true)}>
              <MessageCircle size={18} />
              Hoi dap ngay
            </button>
          </div>

          <div className="trust-row" aria-label="System highlights">
            <span>
              <ShieldCheck size={17} />
              Rieng tu ho so
            </span>
            <span>
              <CheckCircle2 size={17} />
              Giai thich de hieu
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <img src={heroImage} alt="Nguoi dung xem bang suc khoe than tren may tinh bang" />
          <div className="risk-widget" id="risk">
            <span className="widget-label">Theo doi nguy co</span>
            <strong>Can quan sat</strong>
            <div className="risk-meter" aria-hidden="true">
              <span></span>
            </div>
            <p>Ket qua mang tinh tham khao va nen duoc doi chieu voi bac si.</p>
          </div>
        </div>
      </section>

      <section className="insight-strip" aria-label="Kidney health indicators">
        {indicators.map((item) => (
          <div className="indicator" key={item}>
            <Activity size={18} />
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="section-block" id="care">
        <div className="section-heading">
          <p className="eyebrow">Mot hanh trinh ro rang</p>
          <h2>Tu ho so kham den ke hoach cham soc ca nhan</h2>
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
          <p className="eyebrow">Danh cho nguoi da dang nhap</p>
          <h2>Tai len ho so kham de he thong ho tro danh gia.</h2>
          <p>
            Ban co the tai ket qua xet nghiem, don thuoc hoac tom tat kham. He
            thong se uu tien bao mat du lieu va hien thi cac khuyen nghi theo tung
            nhom nhu an uong, luyen tap, nhac thuoc va tai kham.
          </p>
        </div>
        <a className="upload-card" href={isLoggedIn ? '#upload-ready' : '#top'}>
          <UploadCloud size={30} />
          <span>{isLoggedIn ? 'San sang tai ho so' : 'Dang nhap de tai ho so'}</span>
          <small>{isLoggedIn ? 'Chon file PDF hoac anh ket qua kham' : 'Tai khoan giup bao ve du lieu suc khoe'}</small>
        </a>
      </section>

      <footer className="site-footer">
        <span>RenalCareAI</span>
        <p>Thong tin tren he thong chi dung de ho tro tham khao, khong thay the chan doan y khoa.</p>
      </footer>

      <div className={`chat-panel ${isChatOpen ? 'open' : ''}`} aria-live="polite">
        <div className="chat-header">
          <span>
            <BotMessageSquare size={18} />
            RenalCare Assistant
          </span>
          <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Close chat">
            x
          </button>
        </div>
        <div className="chat-body">
          <p>Xin chao, ban muon hoi ve dau hieu benh than, chi so xet nghiem hay cach an uong?</p>
        </div>
        <form className="chat-input">
          <input aria-label="Nhap cau hoi ve suc khoe than" placeholder="Nhap cau hoi..." />
          <button type="button">Gui</button>
        </form>
      </div>

      <button
        className="chat-fab"
        type="button"
        aria-label="Open kidney health chat"
        onClick={() => setIsChatOpen((value) => !value)}
      >
        <MessageCircle size={26} />
      </button>
    </main>
  )
}

export default App
