import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../lib/toast';
import { validators } from '../lib/validation';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { Zap, TrendingUp, Users, Globe, Mail, ArrowRight, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FEATURES = [
  { icon: Zap,         label: 'AI Content Generation', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Globe,       label: '6 Social Platforms',    color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  { icon: TrendingUp,  label: 'Auto-Publish & Grow',   color: 'text-green-400',  bg: 'bg-green-400/10'  },
  { icon: Users,       label: 'Team Collaboration',    color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const PLATFORMS = [
  { icon: '🎵', label: 'TikTok' },
  { icon: '▶️', label: 'YouTube' },
  { icon: '𝕏',  label: 'X' },
  { icon: '📸', label: 'Instagram' },
  { icon: '📘', label: 'Facebook' },
  { icon: '💼', label: 'LinkedIn' },
];

const STATS = [
  { value: '50K+',  label: 'Accounts' },
  { value: '2M+',   label: 'Posts' },
  { value: '98%',   label: 'Uptime' },
];

export default function Login() {
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [errors,   setErrors]     = useState({});
  const [touched,  setTouched]    = useState({});
  const [loading,  setLoading]    = useState(false);
  const [mounted,  setMounted]    = useState(false);
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Stagger mount animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_auth_failed')   showToast.error('Google authentication failed');
    if (error === 'authentication_failed') showToast.error('Authentication failed. Try again.');
  }, [searchParams]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = null;
    if (name === 'email')    error = validators.email(value);
    if (name === 'password') error = validators.required(value, 'Password');
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError    = validators.email(formData.email);
    const passwordError = validators.required(formData.password, 'Password');
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      showToast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* ══ LEFT — Branding Panel ══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0d1021 0%, #0f1117 60%, #0d1a14 100%)' }}>

        {/* Decorative animated orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20 animate-blob"
             style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDuration: '10s' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[350px] h-[350px] rounded-full opacity-15 animate-blob"
             style={{ background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)', animationDuration: '14s', animationDelay: '-4s' }} />

        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
               backgroundSize: '32px 32px',
             }} />

        {/* Stats row */}
        <div className={`relative flex gap-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
             style={{ transitionDelay: '0.1s' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative space-y-8">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6">
              <Star size={12} className="text-[#00d4aa]" fill="#00d4aa" />
              <span className="text-xs font-semibold text-[#00d4aa]">Trusted by 50,000+ creators</span>
            </div>

            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Create once.<br />
              <span className="relative inline-block">
                <span className="gradient-text">Publish everywhere.</span>
                {/* Underline glow */}
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(90deg, #00d4aa, #6366f1)' }} />
              </span>
              <br />
              Grow intelligently.
            </h1>
            <p className="text-slate-400 text-lg mt-5 leading-relaxed max-w-md">
              AI-powered social media management that works 24/7.
              Set it up in 5 minutes and let automation do the rest.
            </p>
          </div>

          {/* Feature pills */}
          <div className={`grid grid-cols-2 gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.35s' }}>
            {FEATURES.map(({ icon: Icon, label, color, bg }) => (
              <div key={label}
                   className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group cursor-default"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={15} className={color} />
                </div>
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className={`flex items-center gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.45s' }}>
            <div className="flex -space-x-2.5">
              {['🧑‍💻','👩‍🎨','👨‍💼','👩‍💻','🧑‍🎤'].map((emoji, i) => (
                <div key={i}
                     className="w-9 h-9 rounded-full border-2 border-[#0f1117] flex items-center justify-center text-sm"
                     style={{ background: `hsl(${200 + i * 30}, 50%, 25%)` }}>
                  {emoji}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className="text-yellow-400" fill="#facc15" />
                ))}
              </div>
              <p className="text-xs text-slate-500">Loved by <span className="text-white font-semibold">50,000+</span> creators</p>
            </div>
          </div>
        </div>

        {/* Platform icons */}
        <div className={`relative flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
             style={{ transitionDelay: '0.55s' }}>
          {PLATFORMS.map(({ icon, label }, i) => (
            <div
              key={label}
              title={label}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-default hover:scale-110 hover:-translate-y-1 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                animation: `float ${3 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT — Login Form ════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 relative"
           style={{ background: '#0a0d14' }}>

        {/* Subtle radial glow behind form */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />

        <div className={`relative w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.15s' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center animate-fade-in-up">
            <Link to="/home" className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00d4aa] to-emerald-500 blur-md opacity-40" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm">
                  <Zap size={20} className="text-[#0a0d14]" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Publift</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mt-2 text-sm">Sign in to your dashboard to continue</p>
          </div>

          {/* Google Button */}
          <button
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            className="group w-full flex items-center justify-center gap-3 rounded-xl py-3.5 font-semibold text-sm text-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-white/20"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            <ArrowRight size={15} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ml-auto" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-medium text-gray-600">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder="you@example.com"
              required
              icon={Mail}
            />

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <button type="button" className="text-xs text-[#00d4aa] font-medium hover:text-emerald-400 transition-colors">
                  Forgot password?
                </button>
              </div>
              <FormInput
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full relative py-3.5 rounded-xl text-sm font-bold text-[#0a0d14] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-glow-teal-sm hover:shadow-glow-teal overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 50%, #00d4aa 100%)', backgroundSize: '200% 200%' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00d4aa] font-semibold hover:text-emerald-400 transition-colors">
              Create one free →
            </Link>
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {['🔒 Secure', '⚡ Free plan', '🚀 No setup'].map((item) => (
              <span key={item} className="text-xs text-gray-600 font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
