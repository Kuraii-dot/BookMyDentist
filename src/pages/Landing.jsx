import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import mascotImage from '../assets/MNB.png'
import footerBg from '../assets/Footer.png'
import searchMascot from '../assets/search.png'
import cloud1 from '../assets/cloud1.png'
import cloud2 from '../assets/Cloud2.png'
import cloud3 from '../assets/Cloud3.png'
import cloud4 from '../assets/Cloud4.png'
import dentalGif from '../assets/DentalGif.gif'

// ── Global animation + paper styles ─────────────────────────────────────────
const ANIM_STYLES = `
  @keyframes blurSlideUp {
    0%   { opacity: 0; filter: blur(12px); transform: translateY(28px); }
    100% { opacity: 1; filter: blur(0px);  transform: translateY(0px);  }
  }
  @keyframes blurFadeIn {
    0%   { opacity: 0; filter: blur(10px); }
    100% { opacity: 1; filter: blur(0px);  }
  }
  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.88); filter: blur(6px); }
    70%  { transform: scale(1.03); }
    100% { opacity: 1; transform: scale(1);    filter: blur(0px); }
  }
  .reveal-hidden { opacity: 0; }
  .reveal-blur-up   { animation: blurSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
  .reveal-blur-fade { animation: blurFadeIn  0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
  .reveal-pop       { animation: popIn       0.6s  cubic-bezier(0.22,1,0.36,1) forwards; }

  /* Paper grain overlay */
  .paper-grain::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.038;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  /* Warm card + nav overrides */
  .card {
    background: rgba(255,252,245,0.82) !important;
    border: 1px solid rgba(210,190,155,0.35) !important;
    box-shadow: 0 4px 24px rgba(139,109,56,0.08), 0 1px 0 rgba(255,255,255,0.9) inset !important;
    backdrop-filter: blur(16px) !important;
  }
  .glass-header {
    background: rgba(253,248,240,0.88) !important;
    border-bottom: 1px solid rgba(210,190,155,0.3) !important;
    backdrop-filter: blur(20px) !important;
  }
`

// ── useInView ────────────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect() }
    }, { threshold: 0.15, ...options })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

// ── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, variant = 'blur-up', delay = 0, className = '', style = {} }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={`reveal-hidden ${inView ? `reveal-${variant}` : ''} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  )
}

// ── Hero Illustration ────────────────────────────────────────────────────────
const HeroIllustration = () => (
  <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
    <defs>
      <style>{`
        @keyframes toothFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes sparkle1 { 0%,100%{opacity:0;transform:scale(0.4) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        @keyframes sparkle2 { 0%,100%{opacity:0;transform:scale(0.3) rotate(0deg)} 40%{opacity:1;transform:scale(0.9) rotate(-180deg)} }
        @keyframes sparkle3 { 0%,100%{opacity:0;transform:scale(0.5) rotate(0deg)} 60%{opacity:1;transform:scale(1.1) rotate(90deg)} }
        @keyframes shine { 0%,100%{opacity:0.25} 50%{opacity:0.7} }
        @keyframes bubbleUp1 { 0%{opacity:0;transform:translateY(0) scale(0.7)} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0;transform:translateY(-60px) scale(1)} }
        @keyframes bubbleUp2 { 0%{opacity:0;transform:translateY(0) scale(0.5)} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0;transform:translateY(-50px) scale(0.9)} }
        .tooth-group{animation:toothFloat 3.4s ease-in-out infinite;transform-origin:center}
        .sp1{animation:sparkle1 2.2s ease-in-out infinite;transform-origin:center;animation-delay:0s}
        .sp2{animation:sparkle2 2.8s ease-in-out infinite;transform-origin:center;animation-delay:0.7s}
        .sp3{animation:sparkle3 2.5s ease-in-out infinite;transform-origin:center;animation-delay:1.3s}
        .sp4{animation:sparkle2 2.1s ease-in-out infinite;transform-origin:center;animation-delay:0.4s}
        .shine{animation:shine 2.4s ease-in-out infinite}
        .bub1{animation:bubbleUp1 3.2s ease-in-out infinite;animation-delay:0.3s}
        .bub2{animation:bubbleUp2 3.8s ease-in-out infinite;animation-delay:1.6s}
        .bub3{animation:bubbleUp1 4.1s ease-in-out infinite;animation-delay:0.9s}
      `}</style>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="bgWash" cx="50%" cy="55%" r="50%">
        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.45"/>
        <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0f9ff"/>
        <stop offset="50%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#e0f2fe"/>
      </linearGradient>
      <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22"/>
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="170" cy="220" rx="150" ry="150" fill="url(#bgWash)"/>
    <ellipse cx="170" cy="358" rx="50" ry="11" fill="url(#shadowGrad)" opacity="0.18">
      <animate attributeName="rx" values="50;40;50" dur="3.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.18;0.10;0.18" dur="3.4s" repeatCount="indefinite"/>
    </ellipse>
    <g className="tooth-group">
      <path d="M170 60 C148 60 126 72 118 95 C110 118 112 148 108 170 C104 192 96 208 96 228 C96 258 108 278 124 278 C138 278 146 264 152 248 C157 234 162 222 170 222 C178 222 183 234 188 248 C194 264 202 278 216 278 C232 278 244 258 244 228 C244 208 236 192 232 170 C228 148 230 118 222 95 C214 72 192 60 170 60Z"
        fill="url(#toothGrad)" stroke="#bae6fd" strokeWidth="2.5" filter="url(#softGlow)"/>
      <path d="M148 80 C138 86 132 96 130 108 C128 120 130 134 128 146"
        stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.7" className="shine"/>
      <circle cx="152" cy="148" r="9" fill="#0369a1"/>
      <circle cx="188" cy="148" r="9" fill="#0369a1"/>
      <circle cx="155" cy="145" r="3.5" fill="white"/>
      <circle cx="191" cy="145" r="3.5" fill="white"/>
      <circle cx="156.5" cy="143.5" r="1.5" fill="#0369a1"/>
      <circle cx="192.5" cy="143.5" r="1.5" fill="#0369a1"/>
      <path d="M152 168 Q170 184 188 168" stroke="#0369a1" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="142" cy="163" rx="8" ry="5" fill="#fca5a5" opacity="0.5"/>
      <ellipse cx="198" cy="163" rx="8" ry="5" fill="#fca5a5" opacity="0.5"/>
      <path d="M148 270 C146 286 140 308 136 328 C134 338 138 346 144 346 C150 346 154 338 156 326 C158 314 158 298 160 282" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2"/>
      <path d="M170 274 C170 290 168 312 168 330 C168 340 172 346 178 346 C184 346 186 338 184 328 C182 316 180 296 180 278" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2"/>
      <path d="M192 270 C194 286 200 308 204 328 C206 338 202 346 196 346 C190 346 186 338 184 326 C182 314 180 298 180 282" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2"/>
    </g>
    <g className="sp1" style={{transformOrigin:'256px 88px'}}>
      <path d="M256 74 L259 85 L270 88 L259 91 L256 102 L253 91 L242 88 L253 85Z" fill="#fbbf24" filter="url(#glow)"/>
    </g>
    <g className="sp2" style={{transformOrigin:'82px 130px'}}>
      <path d="M82 120 L84.5 128 L92 130 L84.5 132 L82 140 L79.5 132 L72 130 L79.5 128Z" fill="#38bdf8" filter="url(#glow)"/>
    </g>
    <g className="sp3" style={{transformOrigin:'278px 190px'}}>
      <path d="M278 183 L280 188 L285 190 L280 192 L278 197 L276 192 L271 190 L276 188Z" fill="#a78bfa" filter="url(#glow)"/>
    </g>
    <g className="sp4" style={{transformOrigin:'62px 230px'}}>
      <path d="M62 224 L63.8 229 L69 230 L63.8 231 L62 236 L60.2 231 L55 230 L60.2 229Z" fill="#34d399" filter="url(#glow)"/>
    </g>
    <circle className="bub1" cx="130" cy="310" r="7" fill="#bae6fd" opacity="0.7"/>
    <circle className="bub2" cx="210" cy="300" r="5" fill="#7dd3fc" opacity="0.6"/>
    <circle className="bub3" cx="168" cy="320" r="4" fill="#e0f2fe" opacity="0.8"/>
    <g style={{animation:'toothFloat 4s ease-in-out infinite',animationDelay:'1s',transformOrigin:'288px 240px'}}>
      <rect x="252" y="222" width="88" height="36" rx="18" fill="white" opacity="0.92" style={{filter:'drop-shadow(0 4px 12px rgba(14,165,233,0.18))'}}/>
      <circle cx="274" cy="240" r="10" fill="#0ea5e9"/>
      <path d="M269 240 L273 244 L279 236" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="290" y="234" width="38" height="5" rx="2.5" fill="#0369a1" opacity="0.7"/>
      <rect x="290" y="242" width="28" height="4" rx="2" fill="#bae6fd" opacity="0.9"/>
    </g>
    <g style={{animation:'toothFloat 3.8s ease-in-out infinite',animationDelay:'0.4s',transformOrigin:'52px 168px'}}>
      <rect x="8" y="150" width="88" height="36" rx="18" fill="white" opacity="0.90" style={{filter:'drop-shadow(0 4px 12px rgba(251,191,36,0.18))'}}/>
      {[20,27,34,41,48].map((x,i) => <circle key={i} cx={x} cy="168" r="4" fill="#fbbf24"/>)}
      <rect x="58" y="163" width="28" height="5" rx="2.5" fill="#92400e" opacity="0.6"/>
      <rect x="58" y="170" width="22" height="4" rx="2" fill="#fcd34d" opacity="0.7"/>
    </g>
  </svg>
)

// ── Step Illustrations ───────────────────────────────────────────────────────
const IllustrationSearch = () => (
  <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs><style>{`
      @keyframes ilSearch{0%,100%{transform:translate(0,0) rotate(-8deg)}50%{transform:translate(3px,-3px) rotate(-8deg)}}
      .il-search{animation:ilSearch 2.5s ease-in-out infinite;transform-origin:70px 45px}
    `}</style></defs>
    <rect x="15" y="10" width="60" height="72" rx="10" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5"/>
    <rect x="21" y="20" width="48" height="36" rx="6" fill="white" opacity="0.8"/>
    <rect x="26" y="26" width="18" height="4" rx="2" fill="#bae6fd"/>
    <rect x="26" y="33" width="34" height="3" rx="1.5" fill="#e0f2fe"/>
    <rect x="26" y="38" width="26" height="3" rx="1.5" fill="#e0f2fe"/>
    <rect x="26" y="45" width="18" height="4" rx="2" fill="#bae6fd"/>
    <rect x="26" y="52" width="30" height="3" rx="1.5" fill="#e0f2fe"/>
    <g className="il-search">
      <circle cx="70" cy="45" r="16" fill="white" stroke="#38bdf8" strokeWidth="2.5"/>
      <circle cx="70" cy="45" r="10" fill="#e0f2fe"/>
      <line x1="82" y1="57" x2="93" y2="68" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round"/>
    </g>
    <path d="M67 38 C65 38 63 39.5 63 41.5 C63 43 63.3 44.5 63 46 C62.7 47.5 62 48.5 62 49.5 C62 51.5 62.8 52.5 64 52.5 C65 52.5 65.5 51.5 65.8 50.5 C66.1 49.5 66.5 48.8 67 48.8 C67.5 48.8 67.9 49.5 68.2 50.5 C68.5 51.5 69 52.5 70 52.5 C71.2 52.5 72 51.5 72 49.5 C72 48.5 71.3 47.5 71 46 C70.7 44.5 71 43 71 41.5 C71 39.5 69 38 67 38Z" fill="white" stroke="#7dd3fc" strokeWidth="1"/>
  </svg>
)

const IllustrationCalendar = () => (
  <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs><style>{`
      @keyframes calBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      .cal-dot{animation:calBounce 1.8s ease-in-out infinite;transform-origin:center}
      .cal-dot:nth-child(2){animation-delay:0.2s}
      .cal-dot:nth-child(3){animation-delay:0.4s}
    `}</style></defs>
    <rect x="20" y="18" width="80" height="62" rx="10" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5"/>
    <rect x="20" y="18" width="80" height="22" rx="10" fill="#0ea5e9"/>
    <rect x="20" y="30" width="80" height="10" fill="#0ea5e9"/>
    <rect x="32" y="24" width="20" height="4" rx="2" fill="white" opacity="0.6"/>
    <rect x="38" y="12" width="6" height="14" rx="3" fill="#0369a1"/>
    <rect x="76" y="12" width="6" height="14" rx="3" fill="#0369a1"/>
    {[0,1,2,3,4,5,6].map(i=><rect key={i} x={28+(i%7)*10} y={48+Math.floor(i/7)*10} width="7" height="7" rx="2" fill={i===2?'#0ea5e9':i===5?'#bae6fd':'white'} opacity="0.8"/>)}
    {[7,8,9,10,11,12,13].map(i=><rect key={i} x={28+(i%7)*10} y={58+Math.floor((i-7)/7)*10} width="7" height="7" rx="2" fill={i===9?'#fbbf24':'white'} opacity="0.8"/>)}
    <g className="cal-dot"><circle cx="65" cy="55" r="4" fill="#34d399"/></g>
    <g className="cal-dot"><circle cx="78" cy="55" r="3" fill="#34d399" opacity="0.7"/></g>
    <g className="cal-dot"><circle cx="88" cy="55" r="2.5" fill="#34d399" opacity="0.5"/></g>
  </svg>
)

const IllustrationConfirm = () => (
  <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs><style>{`
      @keyframes checkDraw{0%{stroke-dashoffset:60}60%{stroke-dashoffset:0}100%{stroke-dashoffset:0}}
      @keyframes circlePop{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      .check-circle{animation:circlePop 2s ease-in-out infinite;transform-origin:60px 40px}
      .check-path{stroke-dasharray:60;stroke-dashoffset:60;animation:checkDraw 1.8s ease forwards 0.3s}
    `}</style></defs>
    <circle cx="60" cy="40" r="32" fill="#dcfce7" opacity="0.6"/>
    <circle className="check-circle" cx="60" cy="40" r="26" fill="white" stroke="#34d399" strokeWidth="2.5"/>
    <path className="check-path" d="M46 40 L56 50 L74 30" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {[[25,18,'#fbbf24'],[95,20,'#38bdf8'],[18,58,'#f472b6'],[100,55,'#a78bfa'],[30,72,'#34d399'],[90,70,'#fbbf24']].map(([x,y,c],i)=>(
      <circle key={i} cx={x} cy={y} r="3.5" fill={c} opacity="0.75" style={{animation:`calBounce ${1.5+i*0.2}s ease-in-out infinite`,animationDelay:`${i*0.15}s`}}/>
    ))}
    <rect x="38" y="72" width="44" height="13" rx="6.5" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1"/>
    <rect x="44" y="76" width="32" height="4" rx="2" fill="#7dd3fc" opacity="0.7"/>
  </svg>
)

// ── Icons ────────────────────────────────────────────────────────────────────
const ToothIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
  </svg>
)
const SearchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const StarIcon = ({ className = 'w-4 h-4', filled = false }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const ShieldCheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
)
const BuildingIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
)
const ClipboardIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)
const MapPinIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const ChevronRightIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <StarIcon key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} filled={s <= Math.round(rating)}/>
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-slate-400 font-medium">({count})</span>}
    </div>
  )
}

// ── Clinic Card ──────────────────────────────────────────────────────────────
function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  return (
    <div
      className="card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/clinic/${clinic.id}`)}
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-sky-100/60 to-cyan-100/50">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center"><ToothIcon className="w-14 h-14 text-sky-200"/></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"/>
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-11 h-11 rounded-xl border-2 border-white/90 shadow-lg overflow-hidden bg-white/90">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center"><ToothIcon className="w-6 h-6 text-sky-400"/></div>
            }
          </div>
        </div>
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm bg-white/85 backdrop-blur-sm">
            <StarIcon className="w-3 h-3 text-amber-400" filled/>
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
        {clinic.city && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPinIcon className="w-3 h-3 text-slate-400"/>
            <p className="text-slate-400 text-xs">{clinic.city}</p>
          </div>
        )}
        {clinic.review_count > 0 && <div className="mt-1.5"><StarRating rating={clinic.avg_rating} count={clinic.review_count}/></div>}
        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {clinic.services.slice(0,3).map(s => (
              <span key={s.id} className="badge badge-teal text-[0.65rem]">{s.name}</span>
            ))}
            {clinic.services.length > 3 && <span className="badge badge-gray text-[0.65rem]">+{clinic.services.length-3}</span>}
          </div>
        )}
        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s=>s.price||0)).toLocaleString()}</span></p>
        )}
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-center text-xs">Details</Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

// ── Background Scene ─────────────────────────────────────────────────────────
const BG_STYLES = `
  @keyframes dropdrift {
    0%   { transform: translateY(0px)   translateX(0px)  scale(1);    }
    30%  { transform: translateY(-18px) translateX(6px)  scale(1.04); }
    60%  { transform: translateY(-10px) translateX(12px) scale(0.97); }
    100% { transform: translateY(0px)   translateX(0px)  scale(1);    }
  }
  @keyframes swaydrift {
    0%,100% { transform: translateY(0px)  translateX(0px) rotate(var(--r,0deg)); }
    50%     { transform: translateY(-14px) translateX(7px) rotate(calc(var(--r,0deg) + 6deg)); }
  }
`

function MirrorSVG({ size = 36, color = 'rgba(14,165,233,0.12)' }) {
  return (
    <svg width={size} height={size*2.8} viewBox="0 0 24 68" fill="none">
      <circle cx="12" cy="10" r="9" stroke={color} strokeWidth="1.8" fill={color} opacity="0.6"/>
      <circle cx="12" cy="10" r="5.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none"/>
      <rect x="10.5" y="19" width="3" height="32" rx="1.5" fill={color}/>
      <rect x="9" y="48" width="6" height="10" rx="3" fill={color} opacity="0.7"/>
    </svg>
  )
}
function ExplorerSVG({ size = 32, color = 'rgba(6,182,212,0.13)' }) {
  return (
    <svg width={size} height={size*3} viewBox="0 0 20 64" fill="none">
      <path d="M10 2 Q13 6 11 12 Q10 15 10 18" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="8.5" y="18" width="3" height="28" rx="1.5" fill={color}/>
      {[26,30,34,38].map(y => <rect key={y} x="7" y={y} width="6" height="1.5" rx="0.75" fill={color} opacity="0.8"/>)}
      <rect x="8" y="46" width="4" height="14" rx="2" fill={color} opacity="0.7"/>
    </svg>
  )
}
function FlossSVG({ size = 28, color = 'rgba(99,210,220,0.14)' }) {
  return (
    <svg width={size*2} height={size*1.4} viewBox="0 0 56 40" fill="none">
      <path d="M4 36 L4 20 Q4 4 20 4 L36 4 Q52 4 52 20 L52 24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M4 20 Q28 28 52 20" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 2"/>
      <rect x="48" y="24" width="7" height="18" rx="3.5" fill={color} opacity="0.8"/>
    </svg>
  )
}
function ToothbrushSVG({ size = 30, color = 'rgba(14,165,233,0.11)' }) {
  return (
    <svg width={size} height={size*3.5} viewBox="0 0 22 80" fill="none" style={{transform:'rotate(15deg)'}}>
      <rect x="4" y="2" width="14" height="22" rx="7" fill={color} opacity="0.8"/>
      {[7,10,13].map(x => [5,9,13].map(y => (
        <rect key={`${x}${y}`} x={x} y={y} width="1.5" height="4" rx="0.75" fill="rgba(255,255,255,0.5)"/>
      )))}
      <rect x="8" y="24" width="6" height="48" rx="3" fill={color}/>
      {[36,42,48,54].map(y => <rect key={y} x="6.5" y={y} width="9" height="2" rx="1" fill={color} opacity="0.6"/>)}
    </svg>
  )
}

const UTENSIL_CONFIGS = [
  { Type: MirrorSVG,     left:'10%', top:'30%', dur:'8.5s',  delay:'0.5s', rotate:'-12deg', size:28 },
  { Type: ExplorerSVG,   left:'25%', top:'78%', dur:'10.0s', delay:'1.2s', rotate:'20deg',  size:24 },
  { Type: FlossSVG,      left:'42%', top:'5%',  dur:'7.8s',  delay:'2.4s', rotate:'-5deg',  size:22 },
  { Type: ToothbrushSVG, left:'60%', top:'48%', dur:'9.3s',  delay:'0.8s', rotate:'8deg',   size:22 },
  { Type: MirrorSVG,     left:'75%', top:'82%', dur:'11.2s', delay:'1.6s', rotate:'30deg',  size:22 },
  { Type: ExplorerSVG,   left:'88%', top:'35%', dur:'8.0s',  delay:'3.2s', rotate:'-20deg', size:20 },
  { Type: FlossSVG,      left:'2%',  top:'68%', dur:'9.7s',  delay:'0.3s', rotate:'15deg',  size:20 },
  { Type: ToothbrushSVG, left:'50%', top:'88%', dur:'7.4s',  delay:'2.0s', rotate:'-10deg', size:18 },
]

function Starfield() {
  const starsRef = useRef([])
  const mousePos = useRef({ x: 0, y: 0 })
  const animationRef = useRef()
  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    baseOpacity: Math.random() * 0.4 + 0.5,
    depth: Math.random() * 0.8 + 0.2,
    twinkleDuration: Math.random() * 3 + 2,
    twinkleDelay: Math.random() * 5,
    color: Math.random() > 0.5 ? '#ffffff' : Math.random() > 0.5 ? 'hsl(200,100%,90%)' : 'hsl(45,100%,85%)'
  })), [])
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: (e.clientX - window.innerWidth/2) / (window.innerWidth/2),
        y: (e.clientY - window.innerHeight/2) / (window.innerHeight/2),
      }
    }
    const animate = () => {
      starsRef.current.forEach((star, i) => {
        if (star) {
          const d = stars[i].depth
          star.style.transform = `translate(${mousePos.current.x*d*30}px, ${mousePos.current.y*d*30}px)`
        }
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    window.addEventListener('mousemove', handleMouseMove)
    animationRef.current = requestAnimationFrame(animate)
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationRef.current) }
  }, [stars])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div key={star.id} ref={el => starsRef.current[i] = el} style={{
          position:'absolute', left:`${star.x}%`, top:`${star.y}%`,
          width:`${star.size}px`, height:`${star.size}px`, borderRadius:'50%',
          backgroundColor: star.color, opacity: star.baseOpacity,
          boxShadow:`0 0 ${star.size*4}px 2px ${star.color}, 0 0 ${star.size*8}px ${star.color}`,
          transition:'transform 0.12s ease-out', willChange:'transform',
          animation:`twinkle ${star.twinkleDuration}s ease-in-out infinite ${star.twinkleDelay}s`
        }}/>
      ))}
      <style>{`@keyframes twinkle{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  )
}

function BackgroundScene() {
  return (
    <>
      <style>{BG_STYLES}</style>
      <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Starfield/>
        {UTENSIL_CONFIGS.map((u, i) => (
          <div key={i} style={{position:'absolute',left:u.left,top:u.top,'--r':u.rotate,animation:`swaydrift ${u.dur} ease-in-out infinite`,animationDelay:u.delay}}>
            <u.Type size={u.size}/>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Browse Dropdown ──────────────────────────────────────────────────────────
function BrowseDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const COMMON = ['Cleaning','Braces','Whitening','Extraction','Implants','Checkup','Root Canal','Veneers']
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">
        Browse
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl shadow-xl z-50 overflow-hidden bg-white/95 backdrop-blur-xl border border-sky-100/60">
          <div className="p-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 mb-2">Browse by Service</p>
            <div className="grid grid-cols-2 gap-1">
              {COMMON.map(s => (
                <button key={s} onClick={() => { navigate(`/browse?service=${encodeURIComponent(s)}`); setOpen(false) }}
                  className="text-left text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 px-3 py-2 rounded-xl transition-all font-medium">
                  {s}
                </button>
              ))}
            </div>
            <div className="border-t border-sky-50 mt-2 pt-2">
              <button onClick={() => { navigate('/browse'); setOpen(false) }}
                className="w-full text-center text-sm font-semibold text-sky-600 hover:text-sky-700 py-2 rounded-xl hover:bg-sky-50 transition-all">
                View All Clinics →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Logo ─────────────────────────────────────────────────────────────────────
const LOGO = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
      <ToothIcon className="w-4 h-4 text-white"/>
    </div>
    <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
  </div>
)

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinics,       setClinics]       = useState([])
  const [filtered,      setFiltered]      = useState([])
  const [cities,        setCities]        = useState([])
  const [search,        setSearch]        = useState('')
  const [city,          setCity]          = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')
  const [loading,       setLoading]       = useState(true)
  const [stats,         setStats]         = useState({ clinics: 0, appointments: 0, avgRating: null })

  useEffect(() => {
    supabase.from('clinics')
      .select('*, services(id,name,price), reviews(rating)')
      .eq('is_active', true).eq('verification_status', 'approved')
      .then(({ data }) => {
        const enriched = (data||[]).map(c => ({
          ...c,
          avg_rating:   c.reviews?.length ? c.reviews.reduce((s,r)=>s+r.rating,0)/c.reviews.length : 0,
          review_count: c.reviews?.length || 0
        }))
        setClinics(enriched); setFiltered(enriched)
        setCities([...new Set(enriched.map(c=>c.city).filter(Boolean))])
        setLoading(false)
      })
    Promise.all([
      supabase.from('clinics').select('id', { count:'exact', head:true }).eq('is_active', true).eq('verification_status', 'approved'),
      supabase.from('appointments').select('id', { count:'exact', head:true }),
      supabase.from('reviews').select('rating'),
    ]).then(([clinicRes, apptRes, reviewRes]) => {
      const ratings = (reviewRes.data||[]).map(r => r.rating)
      const avg = ratings.length ? ratings.reduce((s,r)=>s+r,0)/ratings.length : null
      setStats({ clinics: clinicRes.count||0, appointments: apptRes.count||0, avgRating: avg })
    })
  }, [])

  useEffect(() => {
    let r = clinics
    if (search)         r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()) || c.services?.some(s=>s.name?.toLowerCase().includes(search.toLowerCase())))
    if (city !== 'all') r = r.filter(c => c.city === city)
    if (serviceFilter)  r = r.filter(c => c.services?.some(s=>s.name?.toLowerCase().includes(serviceFilter.toLowerCase())))
    setFiltered(r)
  }, [search, city, serviceFilter, clinics])

  const SERVICES = ['Cleaning','Braces','Whitening','Extraction','Implants','Checkup']

  return (
    <div className="min-h-screen paper-grain relative" style={{
      fontFamily:"'DM Sans', sans-serif",
      background:'linear-gradient(160deg, #e0f2fe 0%, #e0f2fe 20%, #ffffff 40%, #e0f2fe 60%, #e0f2fe 80%, #e0f2fe 100%)',
    }}>
      <style>{ANIM_STYLES}</style>
      <BackgroundScene/>

      {/* ── NAV ── */}
      <nav className="glass-header fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <LOGO/>
            <div className="hidden md:flex items-center">
              <BrowseDropdown/>
              <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">About</Link>
              <Link to="/contact" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">Contact</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate(profile?.role === 'clinic_owner' ? '/clinic' : '/dashboard')}
                className="btn btn-primary btn-md">Dashboard →</button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-md">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-8 z-[1]">
        <div className="pointer-events-none absolute top-10 left-1/4 w-80 h-80 rounded-full opacity-40 animate-float bg-[radial-gradient(circle,rgba(251,191,36,0.22)_0%,transparent_70%)]" style={{animationDelay:'0s'}}/>
        <div className="pointer-events-none absolute top-20 right-1/4 w-60 h-60 rounded-full opacity-30 animate-float bg-[radial-gradient(circle,rgba(180,140,80,0.18)_0%,transparent_70%)]" style={{animationDelay:'2s'}}/>
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-25 animate-float bg-[radial-gradient(circle,rgba(245,234,214,0.7)_0%,transparent_70%)]" style={{animationDelay:'1s'}}/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-[1]">
          <div>
            <Reveal variant="blur-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 bg-[rgba(251,191,36,0.15)] border border-[rgba(251,191,36,0.35)] text-amber-800 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"/>
                Trusted by patients across the Philippines
              </div>
            </Reveal>
            <Reveal variant="blur-up" delay={80}>
              <h1 className="font-display font-bold text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-5 tracking-[-0.02em]">
                Your Smile<br/>Deserves<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-cyan-500">
                  the Best Care
                </span>
              </h1>
            </Reveal>
            <Reveal variant="blur-up" delay={180}>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md mb-8">
                Book dental appointments instantly. Find top-rated clinics near you, check real-time availability, and never miss a visit.
              </p>
            </Reveal>
            <Reveal variant="blur-up" delay={270}>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">Book Appointment</Link>
                <Link to="/register?role=clinic" className="btn btn-secondary btn-lg">List Your Clinic <ChevronRightIcon className="w-4 h-4 inline ml-1"/></Link>
              </div>
            </Reveal>
            <Reveal variant="blur-fade" delay={400}>
              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-sky-100/50">
                <div className="flex -space-x-2">
                  {['#bae6fd','#7dd3fc','#38bdf8','#0ea5e9'].map((col,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center text-white text-xs font-bold"
                      style={{backgroundColor:col}}>{['J','M','A','R'][i]}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(s => <StarIcon key={s} className="w-3.5 h-3.5 text-amber-400" filled/>)}
                  </div>
                  <p className="text-xs text-slate-500">Rated by our early patients</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal variant="pop" delay={200}>
            <div className="relative flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="relative rounded-3xl overflow-visible flex items-center justify-center h-[520px] bg-gradient-to-br from-sky-200/55 via-cyan-100/45 to-amber-100/20 border border-white/85 backdrop-blur-xl shadow-[0_24px_64px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="w-[90%] h-[90%] relative z-[1]">
                    <img src={dentalGif} alt="Dental" className="w-full h-full object-contain animate-float"/>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-5 rounded-2xl px-4 py-3.5 animate-float bg-white/88 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_rgba(14,165,233,0.12)]" style={{animationDelay:'0.5s'}}>
                  <p className="text-xs text-slate-400">Happy patients</p>
                  <p className="font-display text-xl font-bold text-slate-900">{stats.appointments > 0 ? stats.appointments : '—'}</p>
                </div>

                <div className="absolute -top-3 -right-4 rounded-2xl px-3 py-2.5 flex items-center gap-2 animate-float bg-white/88 backdrop-blur-xl border border-white/90 shadow-[0_8px_24px_rgba(14,165,233,0.10)]" style={{animationDelay:'1.5s'}}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-100/80">
                    <ShieldCheckIcon className="w-4 h-4 text-sky-500"/>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Verified Clinics</p>
                    <p className="text-xs text-slate-400">Admin reviewed</p>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-8 rounded-2xl px-3 py-2 flex items-center gap-2 animate-float bg-white/82 backdrop-blur-md border border-amber-200/60 shadow-[0_4px_16px_rgba(251,191,36,0.15)]" style={{animationDelay:'0.8s'}}>
                  <StarIcon className="w-5 h-5 text-amber-400" filled/>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Top Rated</p>
                    <p className="text-xs text-slate-400">{stats.avgRating ? `${stats.avgRating.toFixed(1)} avg` : 'New platform'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SEARCH ── */}
      <section className="py-8 relative z-[1]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Reveal variant="blur-up">
            <div className="relative">

              {/* Mascot — static, above city dropdown */}
              <div className="absolute bottom-full right-0 w-[140px] z-10 pointer-events-none -mb-2">
                <img src={searchMascot} alt="" className="w-[140px] block" style={{mixBlendMode:'multiply'}}/>
              </div>

              {/* Paper card */}
              <div className="relative bg-[#fffef9] rounded-[20px] shadow-[0_2px_0_#e2d9c8,0_8px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] border border-[#ede8dc] overflow-hidden p-[26px_28px_24px]">

                {/* Ruled lines */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                  {Array.from({length:9}).map((_,i) => (
                    <div key={i} className="absolute left-0 right-0 h-px bg-sky-100/30" style={{top:`${50+i*26}px`}}/>
                  ))}
                  <div className="absolute top-0 bottom-0 left-[44px] w-px bg-red-200/30"/>
                </div>

                {/* Cloud corners */}
                <img src={cloud1} alt="" className="absolute -bottom-2.5 -left-1.5 w-[88px] opacity-50 pointer-events-none z-[1] mix-blend-multiply" style={{animation:'dropdrift 9s ease-in-out infinite',animationDelay:'0.5s'}}/>
                <img src={cloud3} alt="" className="absolute -bottom-1.5 -right-1 w-[80px] opacity-48 pointer-events-none z-[1] mix-blend-multiply" style={{animation:'dropdrift 11s ease-in-out infinite',animationDelay:'2.2s'}}/>

                {/* Content */}
                <div className="relative z-[2]">
                  <p className="text-[0.65rem] font-extrabold tracking-[0.1em] uppercase text-sky-500 mb-3">🔍 Find Your Dentist</p>

                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                      <input
                        type="text"
                        placeholder="Search clinics, services, or city..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input pl-10 h-11 bg-white/92 border-[1.5px] border-sky-200/70 shadow-[0_2px_8px_rgba(14,165,233,0.06)]"
                      />
                    </div>
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="input sm:w-36 h-11 bg-white/92 border-[1.5px] border-sky-200/70"
                    >
                      <option value="all">All Cities</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map(s => (
                      <button key={s} onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
                        className={`text-xs px-4 py-2 rounded-full font-semibold transition-all ${serviceFilter === s ? 'btn-primary btn text-white' : 'btn-secondary btn'}`}>
                        {s}
                      </button>
                    ))}
                    {(search || city !== 'all' || serviceFilter) && (
                      <button onClick={() => { setSearch(''); setCity('all'); setServiceFilter('') }}
                        className="text-xs px-4 py-2 rounded-full font-semibold bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 transition-all">
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-6 relative z-[1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal variant="blur-up">
            <div className="card p-5 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="flex justify-center mb-1"><BuildingIcon className="w-5 h-5 text-sky-400"/></div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-sky-600">{stats.clinics > 0 ? stats.clinics : '—'}</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Verified Clinics</p>
              </div>
              <div>
                <div className="flex justify-center mb-1"><ClipboardIcon className="w-5 h-5 text-cyan-400"/></div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-cyan-600">{stats.appointments > 0 ? stats.appointments : '—'}</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Appointments Booked</p>
              </div>
              <div>
                <div className="flex justify-center mb-1"><StarIcon className="w-5 h-5 text-amber-400" filled/></div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-amber-500">{stats.avgRating ? `${stats.avgRating.toFixed(1)}★` : '—'}</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Average Rating</p>
              </div>
            </div>
          </Reveal>
          {(stats.clinics < 3 || stats.appointments < 10) && (
            <p className="text-center text-slate-400 text-xs mt-3">We're just getting started — real numbers grow as clinics join and patients book.</p>
          )}
        </div>
      </section>

      {/* ── CLINICS GRID ── */}
      <section className="py-12 relative z-[1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal variant="blur-up">
            <div className="flex items-baseline justify-between mb-7">
              <div>
                <h2 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl tracking-[-0.02em]">
                  {search || city !== 'all' || serviceFilter ? 'Search Results' : 'Featured Clinics'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">{filtered.length} clinic{filtered.length !== 1 ? 's' : ''} available</p>
              </div>
            </div>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-36 bg-sky-100/30"/>
                  <div className="p-4 pt-7 space-y-2">
                    <div className="h-4 rounded-xl w-3/4 bg-sky-100/40"/>
                    <div className="h-3 rounded-xl w-1/2 bg-sky-100/30"/>
                    <div className="h-8 rounded-xl mt-3 bg-sky-100/25"/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="flex justify-center mb-4"><SearchIcon className="w-12 h-12 text-slate-200"/></div>
              <p className="text-slate-600 font-semibold text-lg">No clinics found</p>
              <p className="text-slate-400 text-sm mt-1 mb-5">Try different filters</p>
              <button onClick={() => { setSearch(''); setCity('all'); setServiceFilter('') }}
                className="btn btn-primary btn-md mx-auto">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((c, i) => (
                <Reveal key={c.id} variant="blur-up" delay={i * 60}>
                  <ClinicCard clinic={c}/>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 relative z-[1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Reveal variant="blur-up">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3">Simple Process</p>
            <h2 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-14 tracking-[-0.02em]">Book in 3 Easy Steps</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step:'01', Illustration: IllustrationSearch,   title:'Find a Clinic',   desc:'Search by location, service, or browse verified dental clinics near you.' },
              { step:'02', Illustration: IllustrationCalendar, title:'Pick a Schedule', desc:'Choose your preferred date and time from real-time availability.' },
              { step:'03', Illustration: IllustrationConfirm,  title:'Confirm & Go',    desc:'Get instant confirmation and reminders for your appointment.' },
            ].map((s, i) => (
              <Reveal key={s.step} variant="blur-up" delay={i * 100}>
                <div className="card p-7 text-left relative overflow-hidden flex flex-col h-full">
                  <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 bg-[radial-gradient(circle,rgba(14,165,233,0.4)_0%,transparent_70%)]"/>
                  <div className="text-xs font-black text-sky-300 mb-3 tracking-widest">{s.step}</div>
                  <div className="h-[90px] mb-4"><s.Illustration/></div>
                  <h3 className="font-display font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASCOT PAPER SECTION ── */}
      <section className="relative z-[1] py-20 pb-15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal variant="blur-up">
            <div className="relative bg-[#fffef9] rounded-[32px] shadow-[0_2px_0_#e2d9c8,0_8px_48px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] border border-[#ede8dc] overflow-visible p-[56px_48px]">

              {/* Ruled lines */}
              <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none z-0">
                {Array.from({length:22}).map((_,i) => (
                  <div key={i} className="absolute left-0 right-0 h-px bg-sky-100/35" style={{top:`${80+i*32}px`}}/>
                ))}
                <div className="absolute top-0 bottom-0 left-[72px] w-px bg-red-200/40"/>
              </div>

              {/* Corner fold */}
              <div className="absolute top-0 right-0 w-0 h-0 border-solid border-[0_48px_48px_0] border-[transparent_#ede8dc_transparent_transparent] rounded-tr-[32px]"/>
              <div className="absolute top-0 right-0 w-0 h-0 border-solid border-[0_46px_46px_0] border-[transparent_#f5f0e8_transparent_transparent] rounded-tr-[32px]"/>

              {/* Doodles */}
              <svg className="absolute opacity-[0.18] -rotate-[30deg]" style={{top:'18px',left:'90px'}} width="28" height="70" viewBox="0 0 22 70" fill="none">
                <rect x="4" y="2" width="14" height="18" rx="7" fill="#0ea5e9"/>
                {[7,10,13].map(x=>[5,9,13].map(y=><rect key={`${x}${y}`} x={x} y={y} width="1.5" height="3.5" rx="0.75" fill="white"/>))}
                <rect x="8" y="20" width="6" height="42" rx="3" fill="#0ea5e9"/>
                {[30,36,42,48].map(y=><rect key={y} x="6.5" y={y} width="9" height="2" rx="1" fill="#0ea5e9" opacity="0.6"/>)}
              </svg>
              <svg className="absolute opacity-[0.15] rotate-[20deg]" style={{bottom:'28px',right:'80px'}} width="22" height="58" viewBox="0 0 24 68" fill="none">
                <circle cx="12" cy="10" r="9" fill="#0ea5e9"/>
                <circle cx="12" cy="10" r="5.5" stroke="white" strokeWidth="1.5" fill="none"/>
                <rect x="10.5" y="19" width="3" height="32" rx="1.5" fill="#0ea5e9"/>
                <rect x="9" y="48" width="6" height="10" rx="3" fill="#0ea5e9"/>
              </svg>
              <svg className="absolute opacity-[0.13] rotate-[10deg]" style={{top:'24px',right:'90px'}} width="48" height="36" viewBox="0 0 56 40" fill="none">
                <path d="M4 36 L4 20 Q4 4 20 4 L36 4 Q52 4 52 20 L52 24" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M4 20 Q28 28 52 20" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
                <rect x="48" y="24" width="7" height="18" rx="3.5" fill="#0ea5e9"/>
              </svg>
              <svg className="absolute opacity-[0.14] -rotate-[15deg]" style={{bottom:'40px',left:'100px'}} width="18" height="54" viewBox="0 0 20 64" fill="none">
                <path d="M10 2 Q13 6 11 12 Q10 15 10 18" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
                <rect x="8.5" y="18" width="3" height="28" rx="1.5" fill="#0ea5e9"/>
                {[26,30,34,38].map(y=><rect key={y} x="7" y={y} width="6" height="1.5" rx="0.75" fill="#0ea5e9" opacity="0.8"/>)}
                <rect x="8" y="46" width="4" height="14" rx="2" fill="#0ea5e9"/>
              </svg>

              <div className="relative z-[1] grid gap-10 items-end" style={{gridTemplateColumns:'1fr auto'}}>
                <div className="pl-10">
                  <div className="inline-flex items-center gap-2 bg-sky-50/70 border border-dashed border-sky-200/35 rounded-lg px-3.5 py-1 text-[0.7rem] font-bold text-sky-700 tracking-[0.08em] uppercase mb-6">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Why BookMyDentist?
                  </div>
                  <h2 className="font-display font-black text-[clamp(28px,4vw,46px)] tracking-[-0.03em] leading-[1.05] text-slate-900 mb-3">
                    Your dental health,<br/><span className="text-sky-500">finally organized.</span>
                  </h2>
                  <p className="text-slate-500 text-base leading-[1.7] max-w-[460px] mb-9">
                    We connect patients with verified, affordable dental clinics — no phone tag, no guessing on prices, no surprises. Just pick, book, and show up.
                  </p>
                  <div className="flex flex-col gap-3.5 mb-10">
                    {[
                      'Real prices listed upfront — no hidden fees',
                      'Admin-verified clinics only',
                      'Book in under 2 minutes, anytime',
                      'SMS + email reminders so you never miss a visit',
                      'Leave honest reviews after your appointment',
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                          <rect x="1.5" y="1.5" width="17" height="17" rx="4" stroke="#0ea5e9" strokeWidth="1.8" fill="rgba(224,242,254,0.4)"/>
                          <path d="M5 10 L8.5 13.5 L15 7" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[0.95rem] text-slate-700 leading-[1.5] font-medium">{text}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/register"
                    className="inline-flex items-center gap-2 bg-sky-500 text-white px-7 py-3.5 rounded-[14px] font-bold text-[0.9rem] no-underline shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_28px_rgba(14,165,233,0.4)] hover:-translate-y-0.5 transition-all duration-150">
                    Book your first appointment
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>

                <div className="relative shrink-0 w-[clamp(220px,28vw,320px)] -mb-14">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full bg-[radial-gradient(ellipse,rgba(186,230,253,0.6)_0%,transparent_70%)] z-0"/>
                  <img src={mascotImage} alt="BookMyDentist mascot" className="w-full relative z-[1] mix-blend-multiply drop-shadow-[0_8px_32px_rgba(14,165,233,0.18)] animate-float" style={{animationDuration:'4s'}}/>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 relative z-[1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal variant="pop">
            <div className="card p-12 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute top-0 left-0 w-64 h-64 rounded-full opacity-40 bg-[radial-gradient(circle,rgba(186,230,253,0.8)_0%,transparent_70%)]"/>
              <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-30 bg-[radial-gradient(circle,rgba(251,191,36,0.4)_0%,transparent_70%)]"/>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 animate-float"><HeroIllustration/></div>
                <h2 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-4 tracking-[-0.02em]">
                  Ready to Book Your Visit?
                </h2>
                <p className="text-slate-500 mb-8 text-base">Join patients who found their trusted dentist on BookMyDentist.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to="/register" className="btn btn-primary btn-lg">Book Now — It's Free</Link>
                  <Link to="/register?role=clinic" className="btn btn-secondary btn-lg">List Your Clinic</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-[1]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-cover bg-[center_30%]" style={{backgroundImage:`url(${footerBg})`}}/>
          <div className="absolute top-0 left-0 right-0 h-[220px] z-[1] bg-gradient-to-b from-[#DFF1FD] via-[rgba(245,234,214,0.6)] to-transparent"/>
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-[rgba(30,15,40,0.42)] to-[rgba(30,15,40,0.80)]" style={{backgroundPosition:'20% 60%'}}/>

          <div className="relative z-[2] pt-[160px]">
            <Reveal variant="blur-up">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="footer-grid grid gap-10 pb-12">

                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.4)]">
                        <ToothIcon className="w-4 h-4 text-white"/>
                      </div>
                      <span className="font-display font-extrabold text-[1.1rem] text-white">BookMyDentist</span>
                    </div>
                    <p className="text-white/60 text-sm leading-[1.7] max-w-[260px] mb-6">
                      Connecting patients with verified, affordable dental clinics across the Philippines. Book in minutes, smile with confidence.
                    </p>
                    <p className="text-white/80 text-[0.8rem] font-semibold tracking-[0.05em] uppercase mb-2.5">Stay updated</p>
                    <p className="text-white/50 text-[0.8rem] mb-3">New clinics, dental tips, and platform news.</p>
                    <div className="flex gap-2">
                      <input type="email" placeholder="your@email.com" className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-white/20 bg-white/12 backdrop-blur-sm text-white text-[0.8rem] outline-none placeholder:text-white/40 font-[inherit]"/>
                      <button className="px-4 py-2.5 rounded-[10px] bg-sky-500 text-white font-bold text-[0.8rem] border-none cursor-pointer whitespace-nowrap">Subscribe</button>
                    </div>
                  </div>

                  {[
                    { title:'Product',   links:[['Browse Clinics','/browse'],['Book Appointment','/register'],['List Your Clinic','/register?role=clinic'],['How It Works','/#how-it-works']] },
                    { title:'Resources', links:[['Help Centre','/contact'],['FAQ','/contact'],['Contact Us','/contact'],['For Clinics','/register?role=clinic']] },
                    { title:'Company',   links:[['About Us','/about'],['Blog','/about'],['Careers','/contact']] },
                    { title:'Legal',     links:[['Privacy Policy','/contact'],['Terms of Service','/contact'],['Accessibility','/contact']] },
                  ].map(col => (
                    <div key={col.title}>
                      <p className="text-white font-bold text-[0.85rem] mb-4 tracking-[0.03em]">{col.title}</p>
                      {col.links.map(([label,to]) => (
                        <Link key={label} to={to}
                          className="block text-white/55 text-[0.875rem] no-underline mb-2.5 transition-colors hover:text-white">
                          {label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="py-6">
                  <p className="text-white/35 text-[0.75rem] leading-[1.7] max-w-[720px]">
                    BookMyDentist is a booking platform connecting patients and dental clinics. We do not own or operate any dental practice. We are not liable for the quality of care, disputes, or outcomes — see our{' '}
                    <Link to="/contact" className="text-white/55 underline">Terms of Service</Link>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 py-5 pb-10">
                  <p className="text-white/40 text-[0.8rem]">
                    © {new Date().getFullYear()} BookMyDentist. Dental bookings across the Philippines. All rights reserved.
                  </p>
                  <div className="flex gap-5 flex-wrap">
                    {[['✓','Verified Clinics'],['🔒','Secure Booking'],['❤️','Patient-First']].map(([icon,text]) => (
                      <div key={text} className="flex items-center gap-1.5 text-white/45 text-[0.75rem] font-semibold">
                        <span className="text-[0.9rem]">{icon}</span>{text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <style>{`
          .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; }
          @media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 560px) { .footer-grid { grid-template-columns: 1fr; } }
        `}</style>
      </footer>
    </div>
  )
}
