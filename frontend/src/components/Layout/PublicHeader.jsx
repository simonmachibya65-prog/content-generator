import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, ChevronRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Publish',   href: '/#publish' },
  { label: 'Create',    href: '/#create'  },
  { label: 'Community', href: '/#community' },
  { label: 'Insights',  href: '/#insights' },
  { label: 'Pricing',   href: '/#pricing'  },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const location = useLocation();

  const isLogin    = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <>
      <header
        className={`
          w-full fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-in-out
          ${scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm'
            : 'bg-transparent border-b border-transparent'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative">
                <div className="relative w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Zap size={18} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-bold text-stone-900 tracking-tight leading-none">
                  SpyRex
                </span>
                <span className="text-[9px] font-semibold text-green-600/70 tracking-[0.15em] uppercase leading-none mt-0.5">
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
                  className="nav-link-animated relative px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors duration-200 rounded-lg hover:bg-stone-100"
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
                  className="group px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-all duration-200 flex items-center gap-1.5"
                >
                  Login
                  <ChevronRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
              )}
              {!isRegister && (
                <Link
                  to="/register"
                  className="relative px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                >
                  Get Started Free
                </Link>
              )}
            </div>

            {/* ── Mobile Hamburger ──────────────────────── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative p-2 text-stone-600 hover:text-stone-900 transition-colors duration-200"
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
          <div className="bg-white/98 backdrop-blur-md border-t border-stone-200 px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }, i) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {label}
                <ChevronRight size={14} className="opacity-40" />
              </a>
            ))}

            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {!isLogin && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
                >
                  Login
                </Link>
              )}
              {!isRegister && (
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-bold text-white rounded-xl bg-green-600 active:scale-95"
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
