import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, ChevronRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing'  },
  { label: 'About',    href: '#about'    },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const location = useLocation();

  const isLogin    = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  // Detect scroll to change header appearance
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <>
      <header
        className={`
          w-full fixed top-0 left-0 right-0 z-50
          transition-all duration-500 ease-in-out
          ${scrolled
            ? 'bg-[#0a0d14]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-b border-transparent'
          }
        `}
      >
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4aa]/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00d4aa] to-emerald-500 blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-[#00d4aa] to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm group-hover:scale-110 transition-transform duration-300">
                  <Zap size={18} className="text-[#0a0d14]" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-black text-white tracking-tight leading-none">
                  Publift
                </span>
                <span className="text-[9px] font-semibold text-[#00d4aa]/70 tracking-[0.15em] uppercase leading-none mt-0.5">
                  AI Platform
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav ───────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="nav-link-animated relative px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/[0.04]"
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* ── Desktop CTAs ──────────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              {!isLogin && (
                <Link
                  to="/login"
                  className="group px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all duration-200 flex items-center gap-1.5"
                >
                  Login
                  <ChevronRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
              )}
              {!isRegister && (
                <Link
                  to="/register"
                  className="btn-shimmer relative px-5 py-2.5 text-sm font-bold text-[#0a0d14] rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-glow-teal-sm hover:shadow-glow-teal"
                  style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 50%, #00d4aa 100%)', backgroundSize: '200% 200%' }}
                >
                  Get Started Free
                </Link>
              )}
            </div>

            {/* ── Mobile Hamburger ──────────────────────── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative p-2 text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className={`transition-all duration-300 ${mobileOpen ? 'rotate-90 opacity-0 absolute' : 'rotate-0 opacity-100'}`}>
                <Menu size={22} />
              </div>
              <div className={`transition-all duration-300 ${mobileOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
                <X size={22} />
              </div>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ───────────────────────────────── */}
        <div
          className={`
            md:hidden overflow-hidden transition-all duration-500 ease-in-out
            ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="bg-[#0a0d14]/98 backdrop-blur-xl border-t border-white/[0.06] px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }, i) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {label}
                <ChevronRight size={14} className="opacity-40" />
              </a>
            ))}

            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {!isLogin && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold text-gray-300 border border-white/10 rounded-xl hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200"
                >
                  Login
                </Link>
              )}
              {!isRegister && (
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-bold text-[#0a0d14] rounded-xl shadow-glow-teal-sm active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #00d4aa, #10b981)' }}
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so content starts below fixed header */}
      <div className="h-16" />
    </>
  );
}
