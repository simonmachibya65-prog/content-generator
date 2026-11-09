import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features',  href: '#features' },
  { label: 'Pricing',   href: '#pricing' },
  { label: 'About',     href: '#about' },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isLogin    = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  return (
    <header className="w-full sticky top-0 z-50 border-b border-dark-border bg-dark-base/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm group-hover:scale-105 transition-transform">
              <Zap size={18} className="text-dark-base" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Publift</span>
          </Link>

          {/* ── Desktop Nav Links ─────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-dark-hover transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ── Desktop CTA Buttons ───────────── */}
          <div className="hidden md:flex items-center gap-3">
            {!isLogin && (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-dark-hover rounded-xl transition-colors"
              >
                Login
              </Link>
            )}
            {!isRegister && (
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-accent-primary to-emerald-500 text-dark-base rounded-xl hover:opacity-90 transition-opacity shadow-glow-teal-sm"
              >
                Get Started Free
              </Link>
            )}
          </div>

          {/* ── Mobile Hamburger ─────────────── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-base animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-hover rounded-xl transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-3 border-t border-dark-border flex flex-col gap-2">
              {!isLogin && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-2.5 text-sm font-semibold text-gray-300 border border-dark-border rounded-xl hover:bg-dark-hover transition-colors"
                >
                  Login
                </Link>
              )}
              {!isRegister && (
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-accent-primary to-emerald-500 text-dark-base rounded-xl hover:opacity-90 transition-opacity"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
